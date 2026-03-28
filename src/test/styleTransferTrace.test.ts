import { describe, expect, it } from 'vitest';

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
  createRestoredPromptStyleTransferTrace,
} from '../lib/style-transfer/trace';

describe('style transfer traces', () => {
  it('creates a prompt trace from the active remix session data', () => {
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
        sans: 'neo-grotesk',
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
      responseArtwork: {
        sectionBackground: artwork.spec,
      },
      responseTheme: payload,
      themeRecord,
    });

    expect(trace.source).toBe('prompt');
    expect(trace.themeId).toBe('glacial-editorial');
    expect(trace.stages.map((stage) => stage.id)).toEqual([
      'prompt',
      'response',
      'validation',
      'derivation',
      'application',
      'artwork',
      'accessibility',
    ]);
    expect(trace.stages.find((stage) => stage.id === 'response')?.status).toBe(
      'complete',
    );
    expect(
      trace.stages.find((stage) => stage.id === 'application')?.status,
    ).toBe('applied');
    expect(
      trace.stages
        .find((stage) => stage.id === 'validation')
        ?.facts.find((fact) => fact.label === 'Readability gate')?.value,
    ).toBe('Passed');
  });

  it('creates a synthetic preset trace with the same stage order', () => {
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

    expect(trace.source).toBe('preset');
    expect(trace.stages.map((stage) => stage.id)).toEqual([
      'prompt',
      'response',
      'validation',
      'derivation',
      'application',
      'artwork',
      'accessibility',
    ]);
    expect(trace.stages[0]?.status).toBe('synthetic');
    expect(trace.stages[1]?.status).toBe('synthetic');
    expect(trace.stages[4]?.status).toBe('applied');
  });

  it('creates a restored prompt trace from generated theme history', () => {
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
        sans: 'neo-grotesk',
        serif: 'editorial',
      },
      density: 'airy',
      surfaceStyle: 'glass',
      buttonStyle: 'outline',
      pattern: 'grid',
      motion: 'calm',
    });
    const prompt = 'glacial editorial with cobalt accents';
    const themeRecord = createCustomStyleTransferThemeRecord(prompt, payload);
    const application = deriveStyleTransferApplication(themeRecord);
    const artwork = createDefaultStyleTransferArtworkPreview(themeRecord, {
      source: 'fallback',
    });
    const accessibility = analyzeStyleTransferThemeAccessibility(themeRecord);
    const trace = createRestoredPromptStyleTransferTrace({
      accessibility,
      application,
      artwork,
      generatedTheme: {
        id: themeRecord.id,
        name: themeRecord.name,
        prompt,
      },
    });

    expect(trace.source).toBe('prompt');
    expect(trace.themeId).toBe('glacial-editorial');
    expect(trace.stages.map((stage) => stage.id)).toEqual([
      'prompt',
      'response',
      'validation',
      'derivation',
      'application',
      'artwork',
      'accessibility',
    ]);
    expect(trace.stages.find((stage) => stage.id === 'response')?.status).toBe(
      'synthetic',
    );
    expect(
      trace.stages.find((stage) => stage.id === 'validation')?.status,
    ).toBe('synthetic');
    expect(
      trace.stages
        .find((stage) => stage.id === 'response')
        ?.facts.find((fact) => fact.label === 'Response payload')?.value,
    ).toBe('Not persisted');
  });
});

describe('style transfer accessibility analysis', () => {
  it('returns contrast pairings and motion notes', () => {
    const theme = styleTransferPresetThemes.find(
      (preset) => preset.id === 'toasted-marshmallow',
    );

    expect(theme).toBeTruthy();

    const analysis = analyzeStyleTransferThemeAccessibility(theme!);

    expect(analysis.pairings.map((pairing) => pairing.id)).toEqual([
      'text-on-background',
      'text-on-surface',
      'text-on-surface-strong',
      'text-on-surface-tint',
      'muted-on-background',
      'muted-on-surface',
      'muted-on-background-alt',
      'muted-on-surface-strong',
      'muted-on-surface-tint',
      'accent-strong-on-background',
      'accent-strong-on-surface',
      'focus-on-background',
      'focus-on-surface',
      'accent-on-background',
    ]);
    expect(analysis.notes.some((note) => note.includes('motion tokens'))).toBe(
      false,
    );
  });
});
