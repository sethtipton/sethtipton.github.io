import presetCatalog from './preset-catalog.json';
import { createDefaultStyleTransferArtworkPreview } from './artwork';
import { ensurePresetStyleTransferThemeCompliance } from './compliance';
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
const styleTransferPresetMetaById = new Map(
  styleTransferPresetCatalogEntries.map((entry) => [entry.id, entry.meta]),
);

export const styleTransferPresetThemes = styleTransferPresetCatalogEntries.map(
  ({ meta, ...theme }) => {
    void meta;

    const parsedTheme = styleTransferThemeRecordSchema.parse({
      ...theme,
      radiusProfile:
        theme.radiusProfile ?? resolveStyleTransferRadiusProfile(theme),
    }) as StyleTransferThemeRecord;

    return ensurePresetStyleTransferThemeCompliance(parsedTheme).theme;
  },
);

export const styleTransferPresetApplications = Object.fromEntries(
  styleTransferPresetThemes.map((theme) => [
    theme.id,
    deriveStyleTransferApplication(theme),
  ]),
) satisfies Record<string, StyleTransferApplication>;

export const styleTransferPresetSummaries = styleTransferPresetThemes.map(
  (theme) => ({
    artwork: createDefaultStyleTransferArtworkPreview(theme, {
      preferredFamily: styleTransferPresetMetaById.get(theme.id)?.artworkFamily,
      source: 'preset',
    }),
    id: theme.id,
    name: theme.name,
    prompt: theme.prompt,
  }),
);
