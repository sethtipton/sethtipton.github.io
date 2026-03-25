import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  styleTransferPresetCatalogEntrySchema,
  styleTransferPresetCatalogSchema,
} from '../src/lib/style-transfer/presetSchema.ts';

const rootDir = process.cwd();
const defaultCatalogPath = path.join(
  rootDir,
  'src/lib/style-transfer/preset-catalog.json',
);
const defaultPreviewBaseUrl = 'http://127.0.0.1:4321';

function hexToRgb(value) {
  const normalized = value.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function channelToLinear(channel) {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

function contrastRatio(first, second) {
  const firstLum = luminance(first);
  const secondLum = luminance(second);
  const lighter = Math.max(firstLum, secondLum);
  const darker = Math.min(firstLum, secondLum);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbDistance(first, second) {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function presetDistance(first, second) {
  const pairs = [
    [first.palette.background.light, second.palette.background.light],
    [first.palette.background.dark, second.palette.background.dark],
    [first.palette.surface.light, second.palette.surface.light],
    [first.palette.surface.dark, second.palette.surface.dark],
    [first.palette.accent.light, second.palette.accent.light],
    [first.palette.accent.dark, second.palette.accent.dark],
  ];

  return (
    pairs.reduce(
      (total, [left, right]) => total + rgbDistance(left, right),
      0,
    ) / pairs.length
  );
}

function analyzePreset(preset) {
  const textOnBackgroundLight = contrastRatio(
    preset.palette.text.light,
    preset.palette.background.light,
  );
  const textOnBackgroundDark = contrastRatio(
    preset.palette.text.dark,
    preset.palette.background.dark,
  );
  const textOnSurfaceLight = contrastRatio(
    preset.palette.text.light,
    preset.palette.surface.light,
  );
  const textOnSurfaceDark = contrastRatio(
    preset.palette.text.dark,
    preset.palette.surface.dark,
  );
  const accentOnBackgroundLight = contrastRatio(
    preset.palette.accent.light,
    preset.palette.background.light,
  );
  const accentOnBackgroundDark = contrastRatio(
    preset.palette.accent.dark,
    preset.palette.background.dark,
  );

  const warnings = [];

  if (textOnBackgroundLight < 4.5) {
    warnings.push(
      `Light text/background contrast is ${textOnBackgroundLight.toFixed(2)}.`,
    );
  }

  if (textOnBackgroundDark < 4.5) {
    warnings.push(
      `Dark text/background contrast is ${textOnBackgroundDark.toFixed(2)}.`,
    );
  }

  if (textOnSurfaceLight < 4.5) {
    warnings.push(
      `Light text/surface contrast is ${textOnSurfaceLight.toFixed(2)}.`,
    );
  }

  if (textOnSurfaceDark < 4.5) {
    warnings.push(
      `Dark text/surface contrast is ${textOnSurfaceDark.toFixed(2)}.`,
    );
  }

  if (accentOnBackgroundLight < 2) {
    warnings.push(
      `Light accent/background separation is low at ${accentOnBackgroundLight.toFixed(2)}.`,
    );
  }

  if (accentOnBackgroundDark < 2) {
    warnings.push(
      `Dark accent/background separation is low at ${accentOnBackgroundDark.toFixed(2)}.`,
    );
  }

  return {
    accentOnBackgroundDark,
    accentOnBackgroundLight,
    textOnBackgroundDark,
    textOnBackgroundLight,
    textOnSurfaceDark,
    textOnSurfaceLight,
    warnings,
  };
}

function printPresetSummary(preset, previewBaseUrl) {
  const combo = `${preset.density} / ${preset.surfaceStyle} / ${preset.buttonStyle} / ${preset.radiusProfile}`;
  const motion = `${preset.pattern} / ${preset.motion}`;
  const fonts = `${preset.fonts.sans} / ${preset.fonts.serif}`;
  const previewUrl = `${previewBaseUrl}/?style=${preset.id}`;

  console.log(`${preset.name}`);
  console.log(`  id: ${preset.id}`);
  console.log(`  category: ${preset.meta?.category ?? 'n/a'}`);
  console.log(`  fonts: ${fonts}`);
  console.log(`  combo: ${combo}`);
  console.log(`  pattern/motion: ${motion}`);
  console.log(`  preview: ${previewUrl}`);
}

function printWarnings(label, warnings) {
  if (!warnings.length) {
    return;
  }

  console.log(`\nWarnings for ${label}:`);
  warnings.forEach((warning) => {
    console.log(`- ${warning}`);
  });
}

async function loadJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function loadCatalog(filePath = defaultCatalogPath) {
  const json = await loadJson(filePath);
  return styleTransferPresetCatalogSchema.parse(json);
}

function analyzeCatalog(presets) {
  const warnings = [];
  const comboCounts = new Map();
  const fontPairCounts = new Map();
  const categoryCounts = new Map();

  presets.forEach((preset) => {
    const comboKey = `${preset.density}/${preset.surfaceStyle}/${preset.buttonStyle}`;
    comboCounts.set(comboKey, (comboCounts.get(comboKey) ?? 0) + 1);

    const fontPairKey = `${preset.fonts.sans}/${preset.fonts.serif}`;
    fontPairCounts.set(fontPairKey, (fontPairCounts.get(fontPairKey) ?? 0) + 1);

    const categoryKey = preset.meta?.category ?? 'uncategorized';
    categoryCounts.set(categoryKey, (categoryCounts.get(categoryKey) ?? 0) + 1);
  });

  for (const [comboKey, count] of comboCounts) {
    if (count >= 3) {
      warnings.push(
        `${count} presets share density/surface/button combo "${comboKey}".`,
      );
    }
  }

  for (const [fontPairKey, count] of fontPairCounts) {
    if (count >= 4) {
      warnings.push(`${count} presets share font pair "${fontPairKey}".`);
    }
  }

  for (let index = 0; index < presets.length; index += 1) {
    for (let cursor = index + 1; cursor < presets.length; cursor += 1) {
      const left = presets[index];
      const right = presets[cursor];
      const distance = presetDistance(left, right);
      const sameCombo =
        left.density === right.density &&
        left.surfaceStyle === right.surfaceStyle &&
        left.buttonStyle === right.buttonStyle;

      if (sameCombo && distance < 78) {
        warnings.push(
          `${left.name} and ${right.name} are visually close (${distance.toFixed(1)}) while sharing the same density/surface/button combo.`,
        );
      }
    }
  }

  return {
    categoryCounts,
    comboCounts,
    fontPairCounts,
    warnings,
  };
}

function printCatalogSummary(presets, previewBaseUrl) {
  presets.forEach((preset) => {
    printPresetSummary(preset, previewBaseUrl);
    const analysis = analyzePreset(preset);
    console.log(
      `  contrast: text/bg ${analysis.textOnBackgroundLight.toFixed(2)} / ${analysis.textOnBackgroundDark.toFixed(2)}, text/surface ${analysis.textOnSurfaceLight.toFixed(2)} / ${analysis.textOnSurfaceDark.toFixed(2)}`,
    );
    printWarnings(preset.name, analysis.warnings);
    console.log('');
  });

  const catalogAnalysis = analyzeCatalog(presets);

  console.log('Catalog distribution:');
  console.log(
    `- categories: ${Array.from(catalogAnalysis.categoryCounts.entries())
      .map(([key, count]) => `${key}=${count}`)
      .join(', ')}`,
  );
  console.log(
    `- density/surface/button combos: ${Array.from(
      catalogAnalysis.comboCounts.entries(),
    )
      .map(([key, count]) => `${key}=${count}`)
      .join(', ')}`,
  );

  printWarnings('catalog', catalogAnalysis.warnings);
}

async function run() {
  const command = process.argv[2] ?? 'summary';
  const argument = process.argv[3];

  if (command === 'summary') {
    const presets = await loadCatalog();
    printCatalogSummary(presets, defaultPreviewBaseUrl);
    return;
  }

  if (command === 'validate') {
    const presets = await loadCatalog();
    const catalogAnalysis = analyzeCatalog(presets);
    const presetWarnings = presets.flatMap((preset) =>
      analyzePreset(preset).warnings.map(
        (warning) => `${preset.name}: ${warning}`,
      ),
    );
    const warnings = [...presetWarnings, ...catalogAnalysis.warnings];

    console.log(
      `Validated ${presets.length} presets from ${defaultCatalogPath}`,
    );
    if (warnings.length) {
      console.log('\nNon-blocking warnings:');
      warnings.forEach((warning) => {
        console.log(`- ${warning}`);
      });
    } else {
      console.log('No warnings.');
    }
    return;
  }

  if (command === 'candidate') {
    if (!argument) {
      console.error(
        'Usage: node ./scripts/style-transfer-presets.mjs candidate ./path/to/preset.json',
      );
      process.exit(1);
    }

    const candidatePath = path.resolve(rootDir, argument);
    const existingCatalog = await loadCatalog();
    const candidate = styleTransferPresetCatalogEntrySchema.parse(
      await loadJson(candidatePath),
    );
    const duplicates = existingCatalog.filter(
      (preset) => preset.id === candidate.id || preset.name === candidate.name,
    );
    const analysis = analyzePreset(candidate);
    const similarityWarnings = existingCatalog
      .map((preset) => ({
        distance: presetDistance(candidate, preset),
        name: preset.name,
      }))
      .filter((entry) => entry.distance < 78)
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 3)
      .map(
        (entry) =>
          `Candidate is close to ${entry.name} with palette distance ${entry.distance.toFixed(1)}.`,
      );

    printPresetSummary(candidate, defaultPreviewBaseUrl);
    printWarnings(candidate.name, analysis.warnings);

    if (duplicates.length) {
      console.log('\nBlocking issues:');
      duplicates.forEach((preset) => {
        console.log(
          `- Candidate collides with existing preset "${preset.name}" (${preset.id}).`,
        );
      });
    }

    printWarnings('candidate similarity', similarityWarnings);
    return;
  }

  console.error(
    'Unknown command. Use one of: summary, validate, candidate <file>',
  );
  process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
