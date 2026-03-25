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
    'That remix did not fit the site cleanly. Try a different prompt.';

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
  const [themeSliderIndex, setThemeSliderIndex] = useState(0);
  const [hasStartedRemixing, setHasStartedRemixing] = useState(false);
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

    setError(null);
    if (controllerState.mode !== mode) {
      setHasStartedRemixing(true);
    }
    setNotice(null);
    setStyleTransferMode(mode);
    syncControllerState();
  };

  const handleGeneratedTheme = (themeId: string) => {
    if (!isStyleTransferSupported) {
      return;
    }

    setError(null);
    setHasStartedRemixing(true);
    const selectedTheme = generatedSummaries.find(
      (theme) => theme.id === themeId,
    );
    setNotice(selectedTheme ? `Applied "${selectedTheme.name}".` : null);
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
    if (isThemeSliderDraggingRef.current) {
      return;
    }

    setThemeSliderIndex(currentThemeIndex);
  }, [currentThemeIndex]);

  const handleThemeSelect = (nextIndex: number) => {
    const selectedTheme = allThemes[nextIndex];

    if (!selectedTheme || nextIndex === currentThemeIndex) {
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
    logDebug('submit start', {
      endpoint: apiUrl,
      normalizedPrompt: apiPrompt,
      prompt: trimmedPrompt,
    });

    try {
      const artworkIntent = createStyleTransferArtworkIntent(trimmedPrompt);
      const requestBody = {
        artworkIntent,
        prompt: apiPrompt,
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
          message: 'Theme remix request failed before a response was received.',
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

      const [
        { deriveStyleTransferApplication },
        { ensurePromptStyleTransferThemeCompliance },
        {
          createCustomStyleTransferThemeRecord,
          styleTransferModelOutputSchema,
        },
      ] = await Promise.all([
        import('../../lib/style-transfer/deriveTheme'),
        import('../../lib/style-transfer/compliance'),
        import('../../lib/style-transfer/schema'),
      ]);

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

      logDebug('derived application object', application);

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

      const nextTrace = createPromptStyleTransferTrace({
        accessibility:
          complianceResult?.analysis ??
          analyzeStyleTransferThemeAccessibility(themeRecord),
        apiPrompt,
        application,
        artwork: previewArtwork,
        compliance: complianceResult,
        prompt: trimmedPrompt,
        responseArtwork: payload.artwork ?? null,
        responseTheme: themePayloadResult.data,
        themeRecord,
      });

      try {
        applyStyleTransferApplication(application, {
          artwork: previewArtwork,
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
        getTraceCacheKey('prompt', themeRecord.id),
        nextTrace,
      );
      setActiveTrace(nextTrace);
      syncControllerState();
      logDebug('theme applied', {
        id: themeRecord.id,
        name: themeRecord.name,
      });
      setNotice(
        complianceResult?.status === 'normalized'
          ? `Applied "${themeRecord.name}" with dark mode adjusted for readability.`
          : complianceResult?.status === 'repaired'
            ? `Applied "${themeRecord.name}" with readability repairs.`
            : `Applied "${themeRecord.name}".`,
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
                {showIntro ? (
                  <>
                    <p className="style-transfer__copy">
                      Pick a theme, or type a vibe and see where it goes.
                    </p>
                  </>
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

                <div
                  className={`style-transfer__panel-trace${
                    activeTrace ? ' style-transfer__panel-trace--visible' : ''
                  }`}
                  hidden={!activeTrace}
                >
                  <StyleTransferTraceInspector
                    artwork={artworkPreview}
                    trace={activeTrace}
                  />
                </div>
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
