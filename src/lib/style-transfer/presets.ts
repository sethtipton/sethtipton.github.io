import presetCatalog from './preset-catalog.json';
import { createDefaultStyleTransferArtworkPreview } from './artwork';
import {
  deriveStyleTransferApplication,
  type StyleTransferApplication,
} from './deriveTheme';
import { styleTransferPresetCatalogSchema } from './presetSchema';
import {
  resolveStyleTransferRadiusProfile,
  styleTransferThemeRecordSchema,
  type StyleTransferThemeRecord,
} from './schema';

const styleTransferPresetCatalogEntries =
  styleTransferPresetCatalogSchema.parse(presetCatalog);

export const styleTransferPresetThemes = styleTransferPresetCatalogEntries.map(
  ({ meta, ...theme }) => {
    void meta;

    return styleTransferThemeRecordSchema.parse({
      ...theme,
      radiusProfile:
        theme.radiusProfile ?? resolveStyleTransferRadiusProfile(theme),
    }) as StyleTransferThemeRecord;
  },
);

export const styleTransferPresetApplications = Object.fromEntries(
  styleTransferPresetThemes.map((theme) => [
    theme.id,
    deriveStyleTransferApplication(theme),
  ]),
) satisfies Record<string, StyleTransferApplication>;

export const styleTransferPresetSummaries =
  styleTransferPresetCatalogEntries.map(({ meta, ...theme }) => ({
    artwork: createDefaultStyleTransferArtworkPreview(theme, {
      preferredFamily: meta?.artworkFamily,
      source: 'preset',
    }),
    id: theme.id,
    name: theme.name,
    prompt: theme.prompt,
  }));
