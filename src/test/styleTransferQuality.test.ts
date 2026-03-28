import { describe, expect, it } from 'vitest';

import { ensurePromptStyleTransferThemeCompliance } from '../lib/style-transfer/compliance';
import { evaluateStyleTransferThemeQuality } from '../lib/style-transfer/quality';
import {
  createCustomStyleTransferThemeRecord,
  styleTransferModelOutputSchema,
} from '../lib/style-transfer/schema';

function createThemeRecord() {
  const prompt = 'sunny editorial interface';
  const payload = styleTransferModelOutputSchema.parse({
    styleName: 'Sunny Editorial',
    palette: {
      background: { light: '#fff7db', dark: '#141413' },
      backgroundAlt: { light: '#fff0bf', dark: '#191816' },
      surface: { light: '#fffbea', dark: '#1b1a18' },
      surfaceStrong: { light: '#f6e8b4', dark: '#22211d' },
      surfaceTint: { light: '#fff1b7', dark: '#2a2618' },
      surfacePaper: { light: '#fffdf3', dark: '#171613' },
      text: { light: '#2d2418', dark: '#f4ebd4' },
      muted: { light: '#d0b77d', dark: '#8f7f53' },
      accent: { light: '#c98100', dark: '#ffb347' },
      accentStrong: { light: '#9f5e00', dark: '#ffd089' },
      focus: { light: '#8c4b00', dark: '#ffd089' },
    },
    fonts: {
      sans: 'neo-grotesk',
      serif: 'editorial',
    },
    density: 'balanced',
    surfaceStyle: 'paper',
    buttonStyle: 'soft',
    pattern: 'none',
    motion: 'calm',
  });

  return createCustomStyleTransferThemeRecord(prompt, payload);
}

describe('style transfer theme quality', () => {
  it('scores weak raw support text lower than the rebuilt compliant theme', () => {
    const theme = createThemeRecord();
    const rawQuality = evaluateStyleTransferThemeQuality(theme);
    const rebuilt = ensurePromptStyleTransferThemeCompliance(theme);
    const rebuiltQuality = evaluateStyleTransferThemeQuality(
      rebuilt.theme,
      rebuilt.analysis,
    );

    expect(rawQuality.passes).toBe(false);
    expect(rebuilt.passesRequiredPairings).toBe(true);
    expect(rebuiltQuality.score).toBeGreaterThan(rawQuality.score);
    expect(rebuiltQuality.metrics.mutedReadability).toBeGreaterThan(
      rawQuality.metrics.mutedReadability,
    );
  });
});
