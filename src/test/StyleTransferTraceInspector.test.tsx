import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import StyleTransferTraceInspector from '../components/react/StyleTransferTraceInspector';
import { analyzeStyleTransferThemeAccessibility } from '../lib/style-transfer/accessibility';
import { createDefaultStyleTransferArtworkPreview } from '../lib/style-transfer/artwork';
import {
  ensurePromptStyleTransferThemeCompliance,
  evaluateStyleTransferThemeCompliance,
} from '../lib/style-transfer/compliance';
import { deriveStyleTransferApplication } from '../lib/style-transfer/deriveTheme';
import {
  styleTransferPresetApplications,
  styleTransferPresetSummaries,
  styleTransferPresetThemes,
} from '../lib/style-transfer/presets';
import {
  createCustomStyleTransferThemeRecord,
  styleTransferModelOutputSchema,
} from '../lib/style-transfer/schema';
import {
  createPresetStyleTransferTrace,
  createPromptStyleTransferTrace,
} from '../lib/style-transfer/trace';

function openTracePanel() {
  const summary = screen
    .getByText(/How this .* shapes the site/i)
    .closest('summary') as HTMLElement | null;

  expect(summary).toBeTruthy();
  fireEvent.click(summary!);
}

function createPromptTraceFixture() {
  const payload = styleTransferModelOutputSchema.parse({
    styleName: 'Glacial Editorial',
    palette: {
      background: { light: '#f8fbff', dark: '#0d1520' },
      backgroundAlt: { light: '#edf3fb', dark: '#132030' },
      surface: { light: '#ffffff', dark: '#15202b' },
      surfaceStrong: { light: '#dfe8f2', dark: '#1c2b3a' },
      surfaceTint: { light: '#eef6ff', dark: '#223344' },
      surfacePaper: { light: '#fcfeff', dark: '#101923' },
      text: { light: '#132131', dark: '#e7f1fb' },
      muted: { light: '#5b6f84', dark: '#9bb0c6' },
      accent: { light: '#2563eb', dark: '#60a5fa' },
      accentStrong: { light: '#1d4ed8', dark: '#93c5fd' },
      focus: { light: '#0ea5e9', dark: '#fde68a' },
    },
    fonts: {
      sans: 'default',
      serif: 'editorial',
    },
    density: 'airy',
    surfaceStyle: 'glass',
    buttonStyle: 'outline',
    pattern: 'grid',
    motion: 'calm',
  });
  const prompt = 'glacial editorial with cobalt accents';
  const initialThemeRecord = createCustomStyleTransferThemeRecord(
    prompt,
    payload,
  );
  const compliance =
    ensurePromptStyleTransferThemeCompliance(initialThemeRecord);
  const themeRecord = compliance.theme!;
  const application = deriveStyleTransferApplication(themeRecord);
  const artwork = createDefaultStyleTransferArtworkPreview(themeRecord, {
    source: 'fallback',
  });
  const trace = createPromptStyleTransferTrace({
    accessibility: compliance.analysis,
    apiPrompt: prompt,
    application,
    artwork,
    compliance,
    prompt,
    resultNote:
      'Remix "Glacial Editorial" created with dark mode adjusted for readability.',
    responseArtwork: {
      sectionBackground: artwork.spec,
    },
    responseTheme: payload,
    themeRecord,
  });

  return {
    artwork,
    palette: themeRecord.palette,
    trace,
  };
}

function createPresetTraceFixture() {
  const theme = styleTransferPresetThemes.find(
    (preset) => preset.id === 'toasted-marshmallow',
  );
  const presetSummary = styleTransferPresetSummaries.find(
    (preset) => preset.id === 'toasted-marshmallow',
  );

  expect(theme).toBeTruthy();
  expect(presetSummary).toBeTruthy();

  const trace = createPresetStyleTransferTrace({
    accessibility: analyzeStyleTransferThemeAccessibility(theme!),
    application: styleTransferPresetApplications['toasted-marshmallow'],
    artwork: presetSummary!.artwork,
    compliance: evaluateStyleTransferThemeCompliance(theme!),
    theme: theme!,
  });

  return {
    artwork: presetSummary!.artwork,
    palette: theme!.palette,
    trace,
  };
}

describe('StyleTransferTraceInspector', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query === '(prefers-reduced-motion: reduce)' ? false : false,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a receipt-led preset view without the old nested debug disclosures', () => {
    const fixture = createPresetTraceFixture();

    render(
      <StyleTransferTraceInspector
        artwork={fixture.artwork}
        effectiveMode="light"
        palette={fixture.palette}
        trace={fixture.trace}
      />,
    );

    openTracePanel();

    expect(screen.getByText('Surface style')).toBeInTheDocument();
    expect(screen.getByText('Background art')).toBeInTheDocument();
    expect(screen.getByText('Offset Paper Windows')).toBeInTheDocument();

    expect(
      screen.queryByText(/View structured details/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Show artwork preview/i)).not.toBeInTheDocument();

    expect(
      screen.getAllByText(
        (_, element) =>
          element?.textContent?.includes('Text on background') ?? false,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        (_, element) =>
          element?.textContent?.includes('Focus on surface') ?? false,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(/Muted text on surface/i),
    ).not.toBeInTheDocument();
  });

  it('surfaces the generated remix note as the starting point for generated themes', () => {
    const fixture = createPromptTraceFixture();

    render(
      <StyleTransferTraceInspector
        artwork={fixture.artwork}
        effectiveMode="dark"
        palette={fixture.palette}
        trace={fixture.trace}
      />,
    );

    openTracePanel();

    expect(screen.getByText('Starting point')).toBeInTheDocument();
    expect(
      screen.getByText(
        /^Remix "Glacial Editorial" created with dark mode adjusted for readability\.$/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/^glacial editorial with cobalt accents$/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Each generated theme applies 61 theme variables that shape the palette/i,
      ),
    ).toBeInTheDocument();
  });

  it('pulses the closed trace toggle icon when the active theme changes', () => {
    const presetFixture = createPresetTraceFixture();
    const promptFixture = createPromptTraceFixture();

    const { rerender } = render(
      <StyleTransferTraceInspector
        artwork={presetFixture.artwork}
        effectiveMode="light"
        palette={presetFixture.palette}
        trace={presetFixture.trace}
      />,
    );

    const summary = screen
      .getByText(/How this .* shapes the site/i)
      .closest('summary');

    expect(summary).toHaveAttribute('data-pulse', 'false');

    rerender(
      <StyleTransferTraceInspector
        artwork={promptFixture.artwork}
        effectiveMode="dark"
        palette={promptFixture.palette}
        trace={promptFixture.trace}
      />,
    );

    expect(summary).toHaveAttribute('data-pulse', 'true');
  });

  it('does not pulse the closed trace toggle icon when reduced motion is preferred', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );

    const presetFixture = createPresetTraceFixture();
    const promptFixture = createPromptTraceFixture();

    const { rerender } = render(
      <StyleTransferTraceInspector
        artwork={presetFixture.artwork}
        effectiveMode="light"
        palette={presetFixture.palette}
        trace={presetFixture.trace}
      />,
    );

    const summary = screen
      .getByText(/How this .* shapes the site/i)
      .closest('summary');

    rerender(
      <StyleTransferTraceInspector
        artwork={promptFixture.artwork}
        effectiveMode="dark"
        palette={promptFixture.palette}
        trace={promptFixture.trace}
      />,
    );

    expect(summary).toHaveAttribute('data-pulse', 'false');
  });
});
