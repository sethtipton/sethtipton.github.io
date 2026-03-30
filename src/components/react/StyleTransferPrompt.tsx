import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
} from 'react';

import ActiveThemeGlobe from './ActiveThemeGlobe';
import StyleTransferTraceInspector from './StyleTransferTraceInspector';
import { analyzeStyleTransferThemeAccessibility } from '../../lib/style-transfer/accessibility';
import { evaluateStyleTransferThemeCompliance } from '../../lib/style-transfer/compliance';
import {
  DEFAULT_STYLE_TRANSFER_CONTROLLER_STATE,
  STYLE_TRANSFER_PANEL_OPEN_DATASET_KEY,
  applyGeneratedStyleTransferTheme,
  applyStyleTransferApplication,
  applyStyleTransferPreset,
  getStyleTransferController,
  getStyleTransferControllerState,
  getStyleTransferGeneratedSummaries,
  getStyleTransferPresetSummaries,
  resetStyleTransferController,
  resolveActiveStyleTransferArtwork,
  setStyleTransferMode,
  subscribeToStyleTransferChanges,
  type StyleTransferPresetSummary,
  type StyleTransferGeneratedSummary,
  type StyleTransferControllerState,
} from '../../lib/style-transfer/controller';
import {
  createFallbackArtworkSlotFromIntent,
  createFallbackStyleTransferArtworkSpec,
  createStyleTransferArtworkIntent,
  pickPrimaryArtworkSlot,
  styleTransferArtworkSlotsSchema,
  type StyleTransferArtworkPreview as StyleTransferArtworkPreviewData,
} from '../../lib/style-transfer/artwork';
import {
  styleTransferPresetApplications,
  styleTransferPresetThemes,
} from '../../lib/style-transfer/presets';
import type { StyleTransferThemeRecord } from '../../lib/style-transfer/schema';
import {
  createPaletteFromStoredApplication,
  defaultCanvasPalette,
} from '../../lib/style-transfer/palette';
import { getRuntimeStyleTransferMotionProfile } from '../../lib/style-transfer/motion';
import { getStyleTransferSupportStatus } from '../../lib/style-transfer/support';
import {
  createPresetStyleTransferTrace,
  createPromptStyleTransferTrace,
  createRestoredPromptStyleTransferTrace,
  type StyleTransferTrace,
} from '../../lib/style-transfer/trace';
import { isStyleTransferDebugEnabled } from '../../lib/style-transfer/debug';
import { recordStyleTransferDiagnostic } from '../../lib/style-transfer/diagnostics';

type ApiResponse = {
  theme?: unknown;
  artwork?: unknown;
  error?: string;
  issues?: unknown;
};

const apiUrl = import.meta.env.PUBLIC_STYLE_TRANSFER_API_URL?.trim() ?? '';
const minimumApiPromptLength = 6;
type FormSubmitHandler = NonNullable<ComponentProps<'form'>['onSubmit']>;

function logDebug(message: string, ...args: unknown[]) {
  if (!isStyleTransferDebugEnabled()) {
    return;
  }

  console.info(`[style-transfer] ${message}`, ...args);
}

function logDebugError(message: string, ...args: unknown[]) {
  if (!isStyleTransferDebugEnabled()) {
    return;
  }

  console.error(`[style-transfer] ${message}`, ...args);
}

function formatValidationIssues(issues: unknown) {
  const genericMessage =
    "That remix didn't quite land. Try a different prompt.";

  if (!issues || typeof issues !== 'object') {
    return genericMessage;
  }

  const fieldErrors = 'fieldErrors' in issues ? issues.fieldErrors : null;

  if (!fieldErrors || typeof fieldErrors !== 'object') {
    return genericMessage;
  }

  const messages = Object.values(fieldErrors)
    .flatMap((value) => (Array.isArray(value) ? value : []))
    .filter((value): value is string => typeof value === 'string');

  return messages[0] ? genericMessage : genericMessage;
}

function normalizePromptForApi(prompt: string) {
  const trimmedPrompt = prompt.trim();

  if (trimmedPrompt.length >= minimumApiPromptLength) {
    return trimmedPrompt;
  }

  return `${trimmedPrompt} theme`;
}

function countActionableComplianceAdjustments(
  adjustments: Array<{ kind: string }>,
) {
  return adjustments.filter((adjustment) => adjustment.kind !== 'derivation')
    .length;
}

function createRetryPrompt(
  apiPrompt: string,
  issues: string[],
  needsSupportRecovery: boolean,
) {
  const guidance = [
    'Refine this into a polished site UI theme.',
    'Keep support text readable in light and dark modes.',
    'Keep muted text neutral and readable across background, surface, elevated, and tinted surfaces.',
    'Keep dark surfaces clearly separated.',
    'Use accent warmth in the accent and tinted surfaces, not in support text.',
    needsSupportRecovery
      ? 'Do not let secondary text dip below readable contrast on supporting surfaces.'
      : null,
    ...issues.slice(0, 2),
  ].filter(Boolean);
  let nextPrompt = apiPrompt.trim();
  let remainingLength = Math.max(0, 400 - nextPrompt.length);

  for (const segment of guidance) {
    if (typeof segment !== 'string') {
      continue;
    }

    const normalizedSegment = segment.trim();

    if (!normalizedSegment) {
      continue;
    }

    const separator = nextPrompt ? '. ' : '';
    const nextLength = separator.length + normalizedSegment.length;

    if (nextLength > remainingLength) {
      break;
    }

    nextPrompt = `${nextPrompt}${separator}${normalizedSegment}`;
    remainingLength -= nextLength;
  }

  return nextPrompt || apiPrompt.trim();
}

function pickPreferredPromptAttempt<
  T extends {
    complianceResult: {
      adjustments: Array<{ kind: string }>;
    };
    quality: {
      score: number;
    };
  },
>(bestAttempt: T | null, nextAttempt: T) {
  if (!bestAttempt) {
    return nextAttempt;
  }

  if (nextAttempt.quality.score !== bestAttempt.quality.score) {
    return nextAttempt.quality.score > bestAttempt.quality.score
      ? nextAttempt
      : bestAttempt;
  }

  const nextActionableAdjustments = countActionableComplianceAdjustments(
    nextAttempt.complianceResult.adjustments,
  );
  const bestActionableAdjustments = countActionableComplianceAdjustments(
    bestAttempt.complianceResult.adjustments,
  );

  if (nextActionableAdjustments !== bestActionableAdjustments) {
    return nextActionableAdjustments < bestActionableAdjustments
      ? nextAttempt
      : bestAttempt;
  }

  return nextAttempt.complianceResult.adjustments.length <
    bestAttempt.complianceResult.adjustments.length
    ? nextAttempt
    : bestAttempt;
}

function getTraceCacheKey(source: 'preset' | 'prompt', id: string) {
  return `${source}:${id}`;
}

function createAccessibilityFromStoredApplication(
  application: NonNullable<StyleTransferGeneratedSummary['application']>,
) {
  const palette = createPaletteFromStoredApplication(application);

  if (!palette) {
    return null;
  }

  return analyzeStyleTransferThemeAccessibility({
    motion:
      application.dataset.styleMotion === 'off' ||
      application.dataset.styleMotion === 'snappy'
        ? application.dataset.styleMotion
        : 'calm',
    palette,
  });
}

type ThemeExplorerItem = {
  id: string;
  name: string;
  palette: StyleTransferThemeRecord['palette'];
  prompt: string | null;
  type: 'default' | 'generated' | 'preset';
};

const loadingNoticeCopy = 'Making the remix';
const maximumPromptLength = 400;
const maximumPromptRetries = 2;
const promptTooLongMessage = `Keep prompts under ${maximumPromptLength} characters.`;
const remixUnavailableMessage =
  'Theme remix is unavailable right now. Please try again later.';
const remixNetworkErrorMessage =
  "Couldn't reach theme remix right now. Try again in a moment.";
const remixUnexpectedResponseMessage =
  'Theme remix returned something unexpected. Please try again in a moment.';
const remixBusyMessage =
  'Theme remix is busy right now. Please wait a moment and try again.';
const remixRejectedMessage =
  'That remix could not be created. Try a different prompt.';
const remixApplyFailureMessage =
  'That remix could not be applied cleanly. Please try again.';

type StyleTransferPromptProps = {
  autoOpenOnMount?: boolean;
  initialOpen?: boolean;
};

function getThemeExplorerTypeLabel(type: ThemeExplorerItem['type']) {
  if (type === 'default') {
    return 'Default';
  }

  if (type === 'generated') {
    return 'Generated';
  }

  return 'Preset';
}

function getLauncherThemeLabel(source: StyleTransferControllerState['source']) {
  if (source === 'default') {
    return 'Default theme';
  }

  if (source === 'preset') {
    return 'Preset theme';
  }

  return 'Generated theme';
}

type TraceVisibilityState = 'hidden' | 'entering' | 'visible' | 'exiting';

function getTraceEnterDurationMs(trace: StyleTransferTrace | null) {
  if (!trace || typeof document === 'undefined') {
    return 0;
  }

  const motion = getRuntimeStyleTransferMotionProfile(document.documentElement);

  return (
    motion.durations.itemEnter +
    Math.max(0, trace.stages.length - 1) * motion.stagger.sm
  );
}

function getTraceExitDurationMs(trace: StyleTransferTrace | null) {
  if (!trace || typeof document === 'undefined') {
    return 0;
  }

  const motion = getRuntimeStyleTransferMotionProfile(document.documentElement);

  return (
    motion.durations.exit +
    Math.max(0, trace.stages.length - 1) * motion.stagger.sm
  );
}

export default function StyleTransferPrompt({
  autoOpenOnMount = false,
  initialOpen = false,
}: StyleTransferPromptProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const launcherMeasureRef = useRef<HTMLButtonElement | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const traceCacheRef = useRef<Map<string, StyleTransferTrace>>(new Map());
  const isThemeSliderDraggingRef = useRef(false);
  const introDismissTimeoutRef = useRef<number | null>(null);
  const traceVisibilityTimeoutRef = useRef<number | null>(null);
  const renderedTraceRef = useRef<StyleTransferTrace | null>(null);
  const traceVisibilityStateRef = useRef<TraceVisibilityState>('hidden');
  const panelId = useId();
  const panelHeadingId = useId();
  const promptCharacterCountId = useId();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isShellExpanded, setIsShellExpanded] = useState(initialOpen);
  const [shellWidth, setShellWidth] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [presetSummaries, setPresetSummaries] = useState<
    StyleTransferPresetSummary[]
  >([]);
  const [generatedSummaries, setGeneratedSummaries] = useState<
    StyleTransferGeneratedSummary[]
  >([]);
  const [artworkPreview, setArtworkPreview] =
    useState<StyleTransferArtworkPreviewData | null>(null);
  const [controllerState, setControllerState] =
    useState<StyleTransferControllerState>(
      DEFAULT_STYLE_TRANSFER_CONTROLLER_STATE,
    );
  const [activeTrace, setActiveTrace] = useState<StyleTransferTrace | null>(
    null,
  );
  const [renderedTrace, setRenderedTrace] = useState<StyleTransferTrace | null>(
    null,
  );
  const [traceVisibilityState, setTraceVisibilityState] =
    useState<TraceVisibilityState>('hidden');
  const [themeSliderIndex, setThemeSliderIndex] = useState(0);
  const [hasStartedRemixing, setHasStartedRemixing] = useState(false);
  const [introState, setIntroState] = useState<'hidden' | 'visible' | 'hiding'>(
    'hidden',
  );
  const [isStyleTransferSupported, setIsStyleTransferSupported] =
    useState(true);
  const [styleTransferUnavailableMessage, setStyleTransferUnavailableMessage] =
    useState<string | null>(null);
  const resolveTraceForState = useCallback(
    (
      nextState: StyleTransferControllerState,
      nextPresets: StyleTransferPresetSummary[],
      nextGenerated: StyleTransferGeneratedSummary[],
      activeArtwork: ReturnType<typeof resolveActiveStyleTransferArtwork>,
    ) => {
      if (nextState.source === 'prompt' && nextState.id) {
        const cachedTrace = traceCacheRef.current.get(
          getTraceCacheKey('prompt', nextState.id),
        );

        if (cachedTrace) {
          return cachedTrace;
        }

        const generatedTheme = nextGenerated.find(
          (entry) => entry.id === nextState.id,
        );
        const restoredApplication = generatedTheme?.application;

        if (!generatedTheme || !restoredApplication) {
          return null;
        }

        const accessibility =
          createAccessibilityFromStoredApplication(restoredApplication);

        if (!accessibility) {
          return null;
        }

        return createRestoredPromptStyleTransferTrace({
          accessibility,
          application: restoredApplication,
          artwork: activeArtwork.artwork ?? generatedTheme.artwork,
          generatedTheme,
        });
      }

      if (nextState.source !== 'preset' || !nextState.presetId) {
        return null;
      }

      const presetTheme = styleTransferPresetThemes.find(
        (theme) => theme.id === nextState.presetId,
      );
      const presetApplication =
        styleTransferPresetApplications[nextState.presetId];
      const presetArtwork =
        activeArtwork.artwork ??
        nextPresets.find((preset) => preset.id === nextState.presetId)
          ?.artwork ??
        null;

      if (!presetTheme || !presetApplication) {
        return null;
      }

      const presetCompliance =
        evaluateStyleTransferThemeCompliance(presetTheme);

      return createPresetStyleTransferTrace({
        accessibility: presetCompliance.analysis,
        application: presetApplication,
        artwork: presetArtwork,
        compliance: presetCompliance,
        theme: presetTheme,
      });
    },
    [],
  );

  const syncControllerState = useCallback(() => {
    const next = getStyleTransferControllerState();
    const nextPresets = getStyleTransferPresetSummaries();
    const nextGenerated = getStyleTransferGeneratedSummaries();
    const activeArtwork = resolveActiveStyleTransferArtwork();

    logDebug('sync controller state', next);
    setControllerState(next);
    setPresetSummaries(nextPresets);
    setGeneratedSummaries(nextGenerated);
    setArtworkPreview(activeArtwork.artwork);
    setActiveTrace(
      resolveTraceForState(next, nextPresets, nextGenerated, activeArtwork),
    );

    if (next.source === 'prompt' && next.prompt) {
      setPrompt(next.prompt);
    }
  }, [resolveTraceForState]);

  const getCollapsedLauncherWidth = useCallback(() => {
    return (
      launcherMeasureRef.current?.getBoundingClientRect().width ??
      launcherRef.current?.getBoundingClientRect().width ??
      shellRef.current?.getBoundingClientRect().width ??
      null
    );
  }, []);

  const getExpandedShellWidth = useCallback(() => {
    if (typeof document === 'undefined') {
      return getCollapsedLauncherWidth();
    }

    const widthProbe = document.createElement('div');
    widthProbe.style.position = 'absolute';
    widthProbe.style.visibility = 'hidden';
    widthProbe.style.pointerEvents = 'none';
    widthProbe.style.inlineSize = 'var(--style-transfer-panel-width)';
    document.body.append(widthProbe);

    const expandedWidth = widthProbe.getBoundingClientRect().width;
    widthProbe.remove();

    return expandedWidth || getCollapsedLauncherWidth();
  }, [getCollapsedLauncherWidth]);

  const closePanel = useCallback(
    ({ returnFocus = false }: { returnFocus?: boolean } = {}) => {
      setIsOpen(false);
      setIsShellExpanded(false);
      // Let the collapsed launcher size itself naturally after close instead of
      // freezing the shell at an expanded measured width.
      setShellWidth(null);

      if (returnFocus) {
        requestAnimationFrame(() => {
          launcherRef.current?.focus();
        });
      }
    },
    [],
  );
  useEffect(() => {
    const supportStatus = getStyleTransferSupportStatus();

    setIsStyleTransferSupported(supportStatus.supported);
    setStyleTransferUnavailableMessage(supportStatus.message);
  }, []);

  useEffect(() => {
    logDebug('resolved PUBLIC_STYLE_TRANSFER_API_URL', apiUrl || '(missing)');

    syncControllerState();
    return subscribeToStyleTransferChanges(
      syncControllerState as EventListener,
    );
  }, [syncControllerState]);

  const openPanel = useCallback(() => {
    const collapsedWidth = getCollapsedLauncherWidth();
    const expandedWidth = getExpandedShellWidth();

    if (collapsedWidth) {
      setShellWidth(collapsedWidth);
    }

    if (typeof window === 'undefined') {
      setIsShellExpanded(true);
      setShellWidth(expandedWidth);
      setIsOpen(true);
      return;
    }

    window.requestAnimationFrame(() => {
      setIsShellExpanded(true);
      setShellWidth(expandedWidth);
      setIsOpen(true);
    });
  }, [getCollapsedLauncherWidth, getExpandedShellWidth]);

  useEffect(() => {
    if (!autoOpenOnMount) {
      return;
    }

    openPanel();
  }, [autoOpenOnMount, openPanel]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setShellWidth(null);
  }, [controllerState.name, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      closePanel({
        returnFocus: true,
      });
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closePanel, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const syncExpandedShellWidth = () => {
      const expandedWidth = getExpandedShellWidth();

      if (!expandedWidth) {
        return;
      }

      setShellWidth((currentWidth) =>
        currentWidth === expandedWidth ? currentWidth : expandedWidth,
      );
    };

    let frame = 0;
    const handleResize = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncExpandedShellWidth();
      });
    };

    syncExpandedShellWidth();
    window.addEventListener('resize', handleResize);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      window.removeEventListener('resize', handleResize);
    };
  }, [getExpandedShellWidth, isOpen]);

  useEffect(() => {
    const root = document.documentElement;

    if (isOpen) {
      root.dataset[STYLE_TRANSFER_PANEL_OPEN_DATASET_KEY] = 'true';
    } else {
      delete root.dataset[STYLE_TRANSFER_PANEL_OPEN_DATASET_KEY];
    }

    return () => {
      delete root.dataset[STYLE_TRANSFER_PANEL_OPEN_DATASET_KEY];
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (traceVisibilityTimeoutRef.current !== null) {
        window.clearTimeout(traceVisibilityTimeoutRef.current);
        traceVisibilityTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (traceVisibilityTimeoutRef.current !== null) {
      window.clearTimeout(traceVisibilityTimeoutRef.current);
      traceVisibilityTimeoutRef.current = null;
    }

    const previousRenderedTrace = renderedTraceRef.current;
    const previousTraceVisibilityState = traceVisibilityStateRef.current;

    if (activeTrace) {
      const shouldAnimateIn =
        previousTraceVisibilityState === 'hidden' ||
        previousTraceVisibilityState === 'exiting' ||
        !previousRenderedTrace;

      setRenderedTrace(activeTrace);
      renderedTraceRef.current = activeTrace;

      if (!shouldAnimateIn) {
        setTraceVisibilityState('visible');
        traceVisibilityStateRef.current = 'visible';
        return;
      }

      setTraceVisibilityState('entering');
      traceVisibilityStateRef.current = 'entering';

      traceVisibilityTimeoutRef.current = window.setTimeout(() => {
        setTraceVisibilityState('visible');
        traceVisibilityStateRef.current = 'visible';
        traceVisibilityTimeoutRef.current = null;
      }, getTraceEnterDurationMs(activeTrace));

      return;
    }

    if (!previousRenderedTrace || previousTraceVisibilityState === 'hidden') {
      setTraceVisibilityState('hidden');
      traceVisibilityStateRef.current = 'hidden';
      return;
    }

    setTraceVisibilityState('exiting');
    traceVisibilityStateRef.current = 'exiting';
    traceVisibilityTimeoutRef.current = window.setTimeout(() => {
      setRenderedTrace(null);
      renderedTraceRef.current = null;
      setTraceVisibilityState('hidden');
      traceVisibilityStateRef.current = 'hidden';
      traceVisibilityTimeoutRef.current = null;
    }, getTraceExitDurationMs(previousRenderedTrace));
  }, [activeTrace]);

  const handlePreset = (presetId: string) => {
    if (!isStyleTransferSupported) {
      return;
    }

    setError(null);
    setHasStartedRemixing(true);
    if (controllerState.presetId === presetId) {
      setNotice(null);
      resetStyleTransferController();
      syncControllerState();
      return;
    }

    setNotice(null);
    applyStyleTransferPreset(presetId);
    syncControllerState();
  };

  const handleMode = (mode: StyleTransferControllerState['mode']) => {
    if (!isStyleTransferSupported) {
      return;
    }

    if (controllerState.mode !== mode) {
      setHasStartedRemixing(true);
    }
    setStyleTransferMode(mode);
    syncControllerState();
  };

  const handleGeneratedTheme = (themeId: string) => {
    if (!isStyleTransferSupported) {
      return;
    }

    setError(null);
    setHasStartedRemixing(true);
    setNotice(null);
    applyGeneratedStyleTransferTheme(themeId);
    syncControllerState();
  };

  const handleReset = () => {
    if (!isStyleTransferSupported) {
      return;
    }

    setError(null);
    setHasStartedRemixing(true);
    setNotice(null);
    resetStyleTransferController();
    syncControllerState();
  };

  const allThemes = useMemo<ThemeExplorerItem[]>(() => {
    const presetThemeMap = new Map(
      styleTransferPresetThemes.map((theme) => [theme.id, theme.palette]),
    );
    const presetThemes = presetSummaries.map((preset) => ({
      id: preset.id,
      name: preset.name,
      palette: presetThemeMap.get(preset.id) ?? defaultCanvasPalette,
      prompt: preset.prompt,
      type: 'preset' as const,
    }));
    // Oldest-first makes the generated segment feel like a chronological remix trail.
    const generatedThemes = generatedSummaries
      .slice()
      .reverse()
      .map((theme) => {
        const palette = theme.application
          ? createPaletteFromStoredApplication(theme.application)
          : null;

        return {
          id: theme.id,
          name: theme.name,
          palette: palette ?? defaultCanvasPalette,
          prompt: theme.prompt,
          type: 'generated' as const,
        };
      });

    return [
      {
        id: 'default',
        name: 'Original Canvas',
        palette: defaultCanvasPalette,
        prompt: null,
        type: 'default',
      },
      ...presetThemes,
      ...generatedThemes,
    ];
  }, [generatedSummaries, presetSummaries]);

  const currentThemeIndex = useMemo(() => {
    if (controllerState.source === 'default') {
      return 0;
    }

    if (controllerState.source === 'preset' && controllerState.presetId) {
      const presetIndex = allThemes.findIndex(
        (theme) =>
          theme.type === 'preset' && theme.id === controllerState.presetId,
      );

      return presetIndex >= 0 ? presetIndex : 0;
    }

    if (controllerState.source === 'prompt' && controllerState.id) {
      const generatedIndex = allThemes.findIndex(
        (theme) =>
          theme.type === 'generated' && theme.id === controllerState.id,
      );

      return generatedIndex >= 0 ? generatedIndex : 0;
    }

    return 0;
  }, [allThemes, controllerState]);
  const renderedThemeTickCount = allThemes.length + (isGenerating ? 1 : 0);
  const isLoadingNotice = isGenerating && notice?.includes(loadingNoticeCopy);
  const showNotice = Boolean(isLoadingNotice || notice);
  const unavailableNotice = !isStyleTransferSupported
    ? styleTransferUnavailableMessage
    : apiUrl
      ? null
      : remixUnavailableMessage;
  const showIntro =
    !activeTrace && !hasStartedRemixing && isStyleTransferSupported;
  const promptLength = prompt.length;
  const isPromptOverLimit = promptLength > maximumPromptLength;

  useEffect(() => {
    if (introDismissTimeoutRef.current !== null) {
      window.clearTimeout(introDismissTimeoutRef.current);
      introDismissTimeoutRef.current = null;
    }

    if (showIntro) {
      setIntroState('visible');
      return;
    }

    setIntroState((currentState) => {
      if (currentState === 'hidden') {
        return currentState;
      }

      return 'hiding';
    });

    const motion = getRuntimeStyleTransferMotionProfile(
      document.documentElement,
    );
    introDismissTimeoutRef.current = window.setTimeout(() => {
      setIntroState('hidden');
      introDismissTimeoutRef.current = null;
    }, motion.durations.exit + motion.durations.fast);

    return () => {
      if (introDismissTimeoutRef.current !== null) {
        window.clearTimeout(introDismissTimeoutRef.current);
        introDismissTimeoutRef.current = null;
      }
    };
  }, [showIntro]);

  useEffect(() => {
    if (isThemeSliderDraggingRef.current) {
      return;
    }

    setThemeSliderIndex(currentThemeIndex);
  }, [currentThemeIndex]);

  const handleThemeSelect = (nextIndex: number) => {
    const selectedTheme = allThemes[nextIndex];

    if (!selectedTheme) {
      return;
    }

    setNotice(null);

    if (nextIndex === currentThemeIndex) {
      return;
    }

    if (selectedTheme.type === 'default') {
      handleReset();
      return;
    }

    if (selectedTheme.type === 'preset') {
      handlePreset(selectedTheme.id);
      return;
    }

    handleGeneratedTheme(selectedTheme.id);
  };

  const commitThemeSliderSelection = (nextIndex: number) => {
    isThemeSliderDraggingRef.current = false;
    setThemeSliderIndex(nextIndex);
    handleThemeSelect(nextIndex);
  };

  const activeThemeExplorerItem =
    allThemes[themeSliderIndex] ?? allThemes[0] ?? null;
  const themeSliderProgress =
    allThemes.length > 1
      ? (themeSliderIndex / (allThemes.length - 1)) * 100
      : 0;
  const themeSliderValueText = activeThemeExplorerItem
    ? `${activeThemeExplorerItem.name} (${getThemeExplorerTypeLabel(
        activeThemeExplorerItem.type,
      )}) - position ${themeSliderIndex + 1} of ${allThemes.length}`
    : 'Original Canvas (Default) - position 1 of 1';
  const activeThemeStyleVars = activeThemeExplorerItem
    ? ({
        '--theme-explorer-accent-dark':
          activeThemeExplorerItem.palette.accent.dark,
        '--theme-explorer-accent-light':
          activeThemeExplorerItem.palette.accent.light,
        '--theme-explorer-focus-dark':
          activeThemeExplorerItem.palette.focus.dark,
        '--theme-explorer-focus-light':
          activeThemeExplorerItem.palette.focus.light,
        '--theme-explorer-surface-dark':
          activeThemeExplorerItem.palette.surface.dark,
        '--theme-explorer-surface-light':
          activeThemeExplorerItem.palette.surface.light,
        '--theme-explorer-surface-tint-dark':
          activeThemeExplorerItem.palette.surfaceTint.dark,
        '--theme-explorer-surface-tint-light':
          activeThemeExplorerItem.palette.surfaceTint.light,
      } as CSSProperties)
    : undefined;
  const activeThemeTickVars = activeThemeExplorerItem
    ? ({
        '--theme-tick-accent-dark': activeThemeExplorerItem.palette.accent.dark,
        '--theme-tick-accent-light':
          activeThemeExplorerItem.palette.accent.light,
        '--theme-tick-focus-dark': activeThemeExplorerItem.palette.focus.dark,
        '--theme-tick-focus-light': activeThemeExplorerItem.palette.focus.light,
        '--theme-tick-surface-dark':
          activeThemeExplorerItem.palette.surface.dark,
        '--theme-tick-surface-light':
          activeThemeExplorerItem.palette.surface.light,
      } as CSSProperties)
    : undefined;
  const themeExplorerRailStyle = {
    ...activeThemeStyleVars,
    '--theme-explorer-progress-scale': `${themeSliderProgress / 100}`,
  } as CSSProperties;
  const launcherThemeLabel = getLauncherThemeLabel(controllerState.source);

  const handlePromptKeyDown: NonNullable<
    ComponentProps<'textarea'>['onKeyDown']
  > = (event) => {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.nativeEvent.isComposing ||
      isGenerating ||
      !apiUrl ||
      !event.currentTarget.value.trim() ||
      event.currentTarget.value.length > maximumPromptLength
    ) {
      return;
    }

    event.preventDefault();
    const form = event.currentTarget.form;

    if (!form) {
      return;
    }

    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
      return;
    }

    if (submitButtonRef.current && !submitButtonRef.current.disabled) {
      submitButtonRef.current.click();
      return;
    }

    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
  };

  const handleSubmit: FormSubmitHandler = async (event) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    if (prompt.length > maximumPromptLength) {
      setError(promptTooLongMessage);
      setNotice(null);
      return;
    }

    if (!apiUrl) {
      setError(remixUnavailableMessage);
      setNotice(null);
      logDebugError('submit blocked: missing PUBLIC_STYLE_TRANSFER_API_URL');
      recordStyleTransferDiagnostic({
        level: 'error',
        message:
          'Theme remix submission was blocked because the API URL is missing.',
        source: 'prompt-submit',
      });
      return;
    }

    if (!getStyleTransferController()) {
      setError(remixUnavailableMessage);
      setNotice(null);
      logDebugError('submit blocked: style transfer controller unavailable');
      recordStyleTransferDiagnostic({
        level: 'error',
        message:
          'Theme remix submission was blocked because the style transfer controller is unavailable.',
        source: 'prompt-submit',
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setNotice(`${loadingNoticeCopy}…`);
    const apiPrompt = normalizePromptForApi(trimmedPrompt);
    const artworkIntent = createStyleTransferArtworkIntent(trimmedPrompt);
    logDebug('submit start', {
      endpoint: apiUrl,
      normalizedPrompt: apiPrompt,
      prompt: trimmedPrompt,
    });

    try {
      const [
        { deriveStyleTransferApplication },
        { ensurePromptStyleTransferThemeCompliance },
        {
          createCustomStyleTransferThemeRecord,
          styleTransferModelOutputSchema,
        },
        { evaluateStyleTransferThemeQuality },
      ] = await Promise.all([
        import('../../lib/style-transfer/deriveTheme'),
        import('../../lib/style-transfer/compliance'),
        import('../../lib/style-transfer/schema'),
        import('../../lib/style-transfer/quality'),
      ]);

      const requestThemeAttempt = async (attemptPrompt: string) => {
        const requestBody = {
          artworkIntent,
          prompt: attemptPrompt,
        };
        logDebug('request payload', requestBody);

        let response: Response;

        try {
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
        } catch (fetchError) {
          logDebugError('fetch failure', fetchError);
          recordStyleTransferDiagnostic({
            detail: fetchError,
            level: 'error',
            message:
              'Theme remix request failed before a response was received.',
            source: 'prompt-fetch',
          });
          throw new Error(remixNetworkErrorMessage);
        }

        logDebug('response status', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
        });

        const responseText = await response.text();
        let payload: ApiResponse | null = null;

        if (responseText) {
          try {
            payload = JSON.parse(responseText) as ApiResponse;
          } catch (parseError) {
            logDebugError('invalid JSON response', {
              parseError,
              responseText,
            });
            recordStyleTransferDiagnostic({
              detail: {
                parseError,
                responseText,
              },
              level: 'error',
              message: 'Theme remix returned invalid JSON.',
              source: 'prompt-response',
            });
            throw new Error(remixUnexpectedResponseMessage);
          }
        }

        logDebug('raw API response', payload);

        if (!response.ok) {
          const message =
            response.status >= 500
              ? remixUnavailableMessage
              : response.status === 429
                ? remixBusyMessage
                : response.status === 400 &&
                    typeof payload?.error === 'string' &&
                    payload.error.trim()
                  ? payload.error.trim()
                  : remixRejectedMessage;
          logDebugError('non-200 response', {
            payload,
            status: response.status,
          });
          recordStyleTransferDiagnostic({
            detail: {
              payload,
              status: response.status,
            },
            level: response.status >= 500 ? 'error' : 'warning',
            message: 'Theme remix returned a non-success response.',
            source: 'prompt-response',
          });
          throw new Error(message);
        }

        if (!payload?.theme) {
          logDebugError('missing theme in API payload', payload);
          recordStyleTransferDiagnostic({
            detail: payload,
            level: 'error',
            message: 'Theme remix response did not include a theme payload.',
            source: 'prompt-response',
          });
          throw new Error(remixUnexpectedResponseMessage);
        }

        return payload;
      };

      const materializeThemeAttempt = async (
        attemptPrompt: string,
        payload: ApiResponse,
      ) => {
        const themePayloadResult = styleTransferModelOutputSchema.safeParse(
          payload.theme,
        );

        if (!themePayloadResult.success) {
          const flattenedIssues = themePayloadResult.error.flatten();
          logDebugError('zod parse failed', flattenedIssues);
          recordStyleTransferDiagnostic({
            detail: flattenedIssues,
            level: 'warning',
            message: 'Theme remix response failed local validation.',
            source: 'prompt-validation',
          });
          throw new Error(formatValidationIssues(flattenedIssues));
        }

        logDebug('theme', themePayloadResult.data);

        let themeRecord: StyleTransferThemeRecord;
        let application;
        let complianceResult;

        try {
          themeRecord = createCustomStyleTransferThemeRecord(
            trimmedPrompt,
            themePayloadResult.data,
          );
          complianceResult =
            ensurePromptStyleTransferThemeCompliance(themeRecord);
          themeRecord = complianceResult.theme;
          application = deriveStyleTransferApplication(themeRecord);
        } catch (deriveError) {
          logDebugError('derive/apply preparation failed', deriveError);
          recordStyleTransferDiagnostic({
            detail: deriveError,
            level: 'error',
            message:
              'Theme remix could not be converted into a local application.',
            source: 'prompt-derive',
          });
          throw new Error(formatValidationIssues(null));
        }

        const quality = evaluateStyleTransferThemeQuality(
          themeRecord,
          complianceResult.analysis,
        );

        logDebug('derived application object', {
          application,
          quality,
        });

        const artworkSlotsResult = styleTransferArtworkSlotsSchema.safeParse(
          payload.artwork ?? {},
        );
        let previewArtwork: StyleTransferArtworkPreviewData | null = null;

        if (!artworkSlotsResult.success) {
          const flattenedIssues = artworkSlotsResult.error.flatten();
          logDebugError('artwork validation failed', flattenedIssues);
          recordStyleTransferDiagnostic({
            detail: flattenedIssues,
            level: 'warning',
            message:
              'Theme remix artwork payload failed validation and fell back locally.',
            source: 'prompt-artwork',
          });
        } else {
          const previewSlot = pickPrimaryArtworkSlot(artworkSlotsResult.data);

          if (previewSlot) {
            previewArtwork = {
              slotKey: previewSlot.slotKey,
              source: 'api',
              spec: previewSlot.spec,
            };
            logDebug('artwork', previewArtwork);
          }
        }

        if (!previewArtwork) {
          const fallbackSpec = createFallbackStyleTransferArtworkSpec({
            intent: artworkIntent,
            prompt: trimmedPrompt,
            theme: themeRecord,
          });
          const fallbackSlot = createFallbackArtworkSlotFromIntent(
            artworkIntent,
            fallbackSpec,
          );

          previewArtwork = {
            slotKey: fallbackSlot.slotKey,
            source: 'fallback',
            spec: fallbackSlot.spec,
          };

          logDebug('artwork fallback', previewArtwork);
        }

        return {
          apiPrompt: attemptPrompt,
          application,
          complianceResult,
          payload,
          previewArtwork,
          quality,
          themePayloadResult,
          themeRecord,
        };
      };

      let attempt = await materializeThemeAttempt(
        apiPrompt,
        await requestThemeAttempt(apiPrompt),
      );
      const attempts = [attempt];
      let usedRetry = false;

      for (
        let retryIndex = 0;
        retryIndex < maximumPromptRetries;
        retryIndex += 1
      ) {
        const needsRetry =
          !attempt.complianceResult.passesRequiredPairings ||
          !attempt.quality.passes ||
          countActionableComplianceAdjustments(
            attempt.complianceResult.adjustments,
          ) >= 4;

        if (!needsRetry) {
          break;
        }

        const retryPrompt = createRetryPrompt(
          attempt.apiPrompt,
          [...attempt.quality.notes, ...attempt.complianceResult.notes],
          !attempt.complianceResult.passesSupportPairings,
        );

        if (retryPrompt === attempt.apiPrompt) {
          break;
        }

        logDebug('retrying prompt theme generation', {
          quality: attempt.quality,
          retryPrompt,
          retryIndex: retryIndex + 1,
        });
        recordStyleTransferDiagnostic({
          detail: {
            quality: attempt.quality,
            retryPrompt,
            retryIndex: retryIndex + 1,
          },
          level: 'warning',
          message:
            'Theme remix triggered another pass to improve readability and surface quality.',
          source: 'prompt-retry',
        });

        attempt = await materializeThemeAttempt(
          retryPrompt,
          await requestThemeAttempt(retryPrompt),
        );
        attempts.push(attempt);
        usedRetry = true;
      }

      const bestAttempt = attempts.reduce<(typeof attempts)[number] | null>(
        (best, nextAttempt) => {
          if (!nextAttempt.complianceResult.passesRequiredPairings) {
            return best;
          }

          return pickPreferredPromptAttempt(best, nextAttempt);
        },
        null,
      );

      if (!bestAttempt) {
        throw new Error(
          attempt.complianceResult.failureMessage ?? remixRejectedMessage,
        );
      }

      const appliedBelowQualityThreshold = !bestAttempt.quality.passes;

      if (appliedBelowQualityThreshold) {
        recordStyleTransferDiagnostic({
          detail: {
            prompt: trimmedPrompt,
            quality: bestAttempt.quality,
            selectedTheme: bestAttempt.themeRecord.name,
          },
          level: 'warning',
          message:
            'Theme remix applied a best-effort palette after retries kept the quality score below the preferred threshold.',
          source: 'prompt-quality',
        });
      }

      const nextTrace = createPromptStyleTransferTrace({
        accessibility:
          bestAttempt.complianceResult.analysis ??
          analyzeStyleTransferThemeAccessibility(bestAttempt.themeRecord),
        apiPrompt: bestAttempt.apiPrompt,
        application: bestAttempt.application,
        artwork: bestAttempt.previewArtwork,
        compliance: bestAttempt.complianceResult,
        prompt: trimmedPrompt,
        responseArtwork: bestAttempt.payload.artwork ?? null,
        responseTheme: bestAttempt.themePayloadResult.data,
        themeRecord: bestAttempt.themeRecord,
      });

      try {
        applyStyleTransferApplication(bestAttempt.application, {
          artwork: bestAttempt.previewArtwork,
        });
      } catch (applyError) {
        logDebugError('controller apply failed', applyError);
        recordStyleTransferDiagnostic({
          detail: applyError,
          level: 'error',
          message: 'Theme remix failed while applying the generated theme.',
          source: 'prompt-apply',
        });
        throw new Error(remixApplyFailureMessage);
      }

      traceCacheRef.current.set(
        getTraceCacheKey('prompt', bestAttempt.themeRecord.id),
        nextTrace,
      );
      setActiveTrace(nextTrace);
      syncControllerState();
      logDebug('theme applied', {
        id: bestAttempt.themeRecord.id,
        name: bestAttempt.themeRecord.name,
      });
      setNotice(
        appliedBelowQualityThreshold
          ? `Applied "${bestAttempt.themeRecord.name}" after some local tuning. It passes, though the palette still leans soft.`
          : bestAttempt.complianceResult.status === 'normalized'
            ? `Applied "${bestAttempt.themeRecord.name}" with dark mode adjusted for readability.`
            : bestAttempt.complianceResult.status === 'repaired'
              ? `Applied "${bestAttempt.themeRecord.name}" with readability repairs.`
              : usedRetry
                ? `Applied "${bestAttempt.themeRecord.name}" after another pass for readability.`
                : `Applied "${bestAttempt.themeRecord.name}".`,
      );
    } catch (caughtError) {
      logDebugError('submit failed', caughtError);
      recordStyleTransferDiagnostic({
        detail: caughtError,
        level: 'error',
        message: 'Theme remix submission failed.',
        source: 'prompt-submit',
      });
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Style remix failed.',
      );
      setNotice(null);
    } finally {
      setHasStartedRemixing(true);
      setIsGenerating(false);
      setIsOpen(true);
    }
  };

  const modeChips = (
    <div
      className="style-transfer__preset-grid style-transfer__preset-grid--mode"
      role="list"
      aria-label="Theme mode"
    >
      {(['auto', 'light', 'dark'] as const).map((mode) => (
        <button
          key={mode}
          className="style-transfer__chip"
          type="button"
          aria-pressed={controllerState.mode === mode}
          disabled={!isStyleTransferSupported}
          onClick={() => {
            handleMode(mode);
          }}
        >
          {mode === 'auto'
            ? 'Auto'
            : mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <div
      ref={shellRef}
      className="style-transfer"
      data-expanded={isShellExpanded ? 'true' : 'false'}
      data-open={isOpen ? 'true' : 'false'}
      style={
        shellWidth
          ? ({
              '--style-transfer-shell-width': `${shellWidth}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <button
        ref={launcherMeasureRef}
        className="style-transfer__launcher style-transfer__launcher--measure"
        type="button"
        aria-hidden="true"
        tabIndex={-1}
      >
        <span className="style-transfer__launcher-globe" aria-hidden="true" />
        <span className="style-transfer__launcher-label">
          {launcherThemeLabel}
        </span>
        <span className="style-transfer__launcher-value">
          {controllerState.name}
        </span>
        {isOpen ? (
          <span className="style-transfer__launcher-close" aria-hidden="true">
            <svg viewBox="0 0 12 12" focusable="false">
              <path d="M2 2 10 10" />
              <path d="M10 2 2 10" />
            </svg>
          </span>
        ) : null}
      </button>
      <button
        ref={launcherRef}
        className="style-transfer__launcher"
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${
          isOpen ? 'Hide' : 'Show'
        } theme explorer. ${launcherThemeLabel}: ${controllerState.name}`}
        onClick={() => {
          if (isOpen) {
            closePanel();
            return;
          }

          openPanel();
        }}
      >
        <span className="style-transfer__launcher-globe" aria-hidden="true">
          <ActiveThemeGlobe />
        </span>
        <span className="style-transfer__launcher-label">
          {launcherThemeLabel}
        </span>
        <span className="style-transfer__launcher-value">
          {controllerState.name}
        </span>
        {isOpen ? (
          <span className="style-transfer__launcher-close" aria-hidden="true">
            <svg viewBox="0 0 12 12" focusable="false">
              <path d="M2 2 10 10" />
              <path d="M10 2 2 10" />
            </svg>
          </span>
        ) : null}
      </button>

      <section
        id={panelId}
        className={`style-transfer__panel surface-card${
          activeTrace ? ' style-transfer__panel--split' : ''
        }`}
        aria-labelledby={panelHeadingId}
        aria-hidden={!isOpen}
        data-open={isOpen ? 'true' : 'false'}
      >
        <div
          className="style-transfer__panel-scroll"
          aria-labelledby={panelHeadingId}
        >
          <h2 id={panelHeadingId} className="style-transfer__sr-only">
            Theme explorer
          </h2>
          <div
            className={`style-transfer__panel-layout${
              activeTrace ? ' style-transfer__panel-layout--split' : ''
            }`}
          >
            <div className="style-transfer__rail-section">
              <div className="style-transfer__theme-explorer">
                {introState !== 'hidden' ? (
                  <p
                    className={`style-transfer__copy style-transfer__copy--intro${
                      introState === 'hiding'
                        ? ' style-transfer__copy--intro-hiding'
                        : ''
                    }`}
                  >
                    Pick a theme, or type a vibe and see where it goes.
                  </p>
                ) : null}
                {/* {activeThemeExplorerItem ? (
                  <div
                    className="style-transfer__theme-preview"
                    style={activeThemePreviewStyle}
                  >
                    <div className="style-transfer__theme-preview-header">
                      <div className="style-transfer__theme-preview-globe">
                        <ThemeGlobeSurface {...activeThemeGlobe} />
                      </div>
                      <div className="style-transfer__theme-preview-copy">
                        <span className="style-transfer__theme-preview-name">
                          {`${getThemeExplorerTypeLabel(
                            activeThemeExplorerItem.type,
                          )} theme: ${activeThemeExplorerItem.name}`}
                        </span>
                        <span className="style-transfer__theme-preview-mode">
                          {`Mode: ${getModeLabel(controllerState.mode)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null} */}
                <div className="style-transfer__theme-explorer-scroll">
                  <div className="style-transfer__theme-explorer-canvas">
                    <div
                      className="style-transfer__theme-explorer-slider"
                      style={themeExplorerRailStyle}
                    >
                      <div
                        className="style-transfer__theme-explorer-track"
                        aria-hidden="true"
                      >
                        <span className="style-transfer__theme-explorer-progress" />
                      </div>

                      <input
                        className="style-transfer__theme-explorer-input"
                        type="range"
                        min={0}
                        max={Math.max(allThemes.length - 1, 0)}
                        step={1}
                        value={themeSliderIndex}
                        aria-label="Explore and switch themes"
                        aria-valuetext={themeSliderValueText}
                        disabled={!isStyleTransferSupported}
                        onBlur={(event) => {
                          if (!isThemeSliderDraggingRef.current) {
                            return;
                          }

                          commitThemeSliderSelection(
                            Number(event.currentTarget.value),
                          );
                        }}
                        onChange={(event) => {
                          const nextIndex = Number(event.currentTarget.value);

                          setThemeSliderIndex(nextIndex);

                          if (!isThemeSliderDraggingRef.current) {
                            handleThemeSelect(nextIndex);
                          }
                        }}
                        onKeyUp={(event) => {
                          if (
                            ![
                              'ArrowLeft',
                              'ArrowRight',
                              'ArrowUp',
                              'ArrowDown',
                              'Home',
                              'End',
                              'PageUp',
                              'PageDown',
                            ].includes(event.key)
                          ) {
                            return;
                          }

                          commitThemeSliderSelection(
                            Number(event.currentTarget.value),
                          );
                        }}
                        onPointerCancel={(event) => {
                          commitThemeSliderSelection(
                            Number(event.currentTarget.value),
                          );
                        }}
                        onPointerDown={() => {
                          isThemeSliderDraggingRef.current = true;
                        }}
                        onPointerUp={(event) => {
                          commitThemeSliderSelection(
                            Number(event.currentTarget.value),
                          );
                        }}
                      />
                    </div>

                    <div
                      className="style-transfer__theme-explorer-ticks"
                      style={{
                        gridTemplateColumns: `repeat(${renderedThemeTickCount}, minmax(0, 1fr))`,
                      }}
                    >
                      {allThemes.map((theme, index) => {
                        const isApplied = currentThemeIndex === index;
                        const isActive = themeSliderIndex === index;
                        const tickStyle = {
                          '--theme-tick-accent-dark': theme.palette.accent.dark,
                          '--theme-tick-accent-light':
                            theme.palette.accent.light,
                          '--theme-tick-focus-dark': theme.palette.focus.dark,
                          '--theme-tick-focus-light': theme.palette.focus.light,
                          '--theme-tick-surface-dark':
                            theme.palette.surface.dark,
                          '--theme-tick-surface-light':
                            theme.palette.surface.light,
                        } as CSSProperties;

                        return (
                          <button
                            key={`${theme.type}:${theme.id}`}
                            className={`style-transfer__theme-tick${
                              isApplied
                                ? ' style-transfer__theme-tick--applied'
                                : ''
                            }${
                              isActive
                                ? ' style-transfer__theme-tick--active'
                                : ''
                            }`}
                            type="button"
                            aria-label={`${theme.name} (${getThemeExplorerTypeLabel(
                              theme.type,
                            )}) - position ${index + 1} of ${allThemes.length}`}
                            aria-pressed={isApplied}
                            disabled={!isStyleTransferSupported}
                            style={tickStyle}
                            title={theme.prompt ?? theme.name}
                            onClick={() => {
                              setThemeSliderIndex(index);
                              handleThemeSelect(index);
                            }}
                          >
                            <span
                              className="style-transfer__theme-tick-marker"
                              aria-hidden="true"
                            />
                            <span className="style-transfer__sr-only">
                              {theme.name}
                            </span>
                          </button>
                        );
                      })}
                      {isGenerating ? (
                        <div
                          className="style-transfer__theme-tick style-transfer__theme-tick--placeholder"
                          aria-hidden="true"
                          style={activeThemeTickVars}
                        >
                          <span className="style-transfer__theme-tick-marker style-transfer__theme-tick-marker--placeholder" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Temporary preview swatches removed.
                <div
                  className="style-transfer__theme-preview-swatches"
                  aria-hidden="true"
                >
                  <div className="style-transfer__theme-preview-swatch-group">
                    <span className="style-transfer__theme-preview-swatch style-transfer__theme-preview-swatch--light" />
                    <span className="style-transfer__theme-preview-swatch style-transfer__theme-preview-swatch--dark" />
                    <span className="style-transfer__theme-preview-swatch-label">
                      Surface
                    </span>
                  </div>

                  <div className="style-transfer__theme-preview-swatch-group">
                    <span className="style-transfer__theme-preview-swatch style-transfer__theme-preview-swatch--accent-light" />
                    <span className="style-transfer__theme-preview-swatch style-transfer__theme-preview-swatch--accent-dark" />
                    <span className="style-transfer__theme-preview-swatch-label">
                      Accent
                    </span>
                  </div>
                </div>
                */}

                <div className="style-transfer__panel-main">
                  <form
                    className="style-transfer__form"
                    onSubmit={handleSubmit}
                  >
                    <label
                      className="style-transfer__label"
                      htmlFor="style-transfer-prompt"
                    >
                      Give the portfolio this vibe:
                    </label>

                    <div className="style-transfer-prompt-wrapper">
                      <textarea
                        id="style-transfer-prompt"
                        className="style-transfer__input"
                        rows={2}
                        placeholder="Creative and artsy, with off-white, terracotta, dusty pink, and deep green."
                        value={prompt}
                        disabled={
                          !isStyleTransferSupported || !apiUrl || isGenerating
                        }
                        aria-describedby={promptCharacterCountId}
                        aria-invalid={isPromptOverLimit}
                        onChange={(event) => {
                          const nextPrompt = event.currentTarget.value;

                          setPrompt(nextPrompt);

                          if (
                            error === promptTooLongMessage &&
                            nextPrompt.length <= maximumPromptLength
                          ) {
                            setError(null);
                          }
                        }}
                        onKeyDown={handlePromptKeyDown}
                      />
                      <p
                        id={promptCharacterCountId}
                        className={`style-transfer__character-count${
                          isPromptOverLimit
                            ? ' style-transfer__character-count--over-limit'
                            : ''
                        }`}
                      >
                        {promptLength} / {maximumPromptLength}
                      </p>
                    </div>

                    {unavailableNotice ? (
                      <p className="style-transfer__notice" aria-live="polite">
                        {unavailableNotice}
                      </p>
                    ) : showNotice ? (
                      <p
                        className={`style-transfer__notice${
                          isLoadingNotice
                            ? ' style-transfer__notice--loading'
                            : ''
                        }`}
                        aria-live="polite"
                      >
                        {isLoadingNotice ? (
                          <>
                            {loadingNoticeCopy}
                            <span
                              className="style-transfer__loading-ellipsis"
                              aria-hidden="true"
                            >
                              <span>.</span>
                              <span>.</span>
                              <span>.</span>
                            </span>
                          </>
                        ) : (
                          notice
                        )}
                      </p>
                    ) : null}

                    <div className="style-transfer__button-row">
                      <button
                        ref={submitButtonRef}
                        className="button-link"
                        type="submit"
                        disabled={
                          !isStyleTransferSupported ||
                          !apiUrl ||
                          isGenerating ||
                          !prompt.trim() ||
                          isPromptOverLimit
                        }
                      >
                        {isGenerating ? 'Generating…' : 'Generate remix'}
                      </button>
                    </div>
                  </form>

                  {error ? (
                    <p className="style-transfer__error" aria-live="polite">
                      {error}
                    </p>
                  ) : null}
                </div>

                <div
                  id="style-transfer-preset-rail"
                  className="style-transfer__preset-rail"
                >
                  <div className="style-transfer__rail-section">
                    <p className="style-transfer__rail-label">Mode</p>
                    {modeChips}
                  </div>
                </div>

                {renderedTrace ? (
                  <div
                    className="style-transfer__panel-trace"
                    data-trace-visibility={traceVisibilityState}
                    aria-hidden={traceVisibilityState === 'exiting'}
                  >
                    <StyleTransferTraceInspector
                      artwork={artworkPreview}
                      trace={renderedTrace}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/*
            <div className="style-transfer__rail-section">
              <p className="style-transfer__rail-label">Default themes</p>
              {presetChips}
            </div>
            */}
          </div>
        </div>
      </section>
    </div>
  );
}
