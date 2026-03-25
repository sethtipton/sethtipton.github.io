import { z } from 'zod';

import { styleTransferArtworkFamilyOptions } from './artwork';
import { evaluateStyleTransferThemeCompliance } from './compliance';
import { styleTransferThemeRecordSchema } from './schema';

export const styleTransferPresetCategoryOptions = [
  'surface',
  'graphic',
  'future',
  'editorial',
  'system',
  'atmospheric',
  'neutral',
] as const;

export const styleTransferPresetMetaSchema = z.object({
  artworkFamily: z.enum(styleTransferArtworkFamilyOptions).optional(),
  category: z.enum(styleTransferPresetCategoryOptions),
  tags: z.array(z.string().trim().min(2).max(24)).min(2).max(8),
  notes: z.string().trim().min(8).max(180).optional(),
});

export const styleTransferPresetCatalogEntrySchema =
  styleTransferThemeRecordSchema.extend({
    meta: styleTransferPresetMetaSchema.optional(),
  });

export const styleTransferPresetCatalogSchema = z
  .array(styleTransferPresetCatalogEntrySchema)
  .superRefine((themes, ctx) => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    themes.forEach((theme, index) => {
      if (seenIds.has(theme.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate preset id "${theme.id}".`,
          path: [index, 'id'],
        });
      } else {
        seenIds.add(theme.id);
      }

      if (seenNames.has(theme.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate preset name "${theme.name}".`,
          path: [index, 'name'],
        });
      } else {
        seenNames.add(theme.name);
      }

      const compliance = evaluateStyleTransferThemeCompliance(theme);

      compliance.failingCorePairings.forEach((pairing) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${pairing.label} must meet ${pairing.target}:1 in both modes for preset themes.`,
          path: [index, 'palette', pairing.foregroundRole],
        });
      });
    });
  });

export type StyleTransferPresetCatalogEntry = z.infer<
  typeof styleTransferPresetCatalogEntrySchema
>;
