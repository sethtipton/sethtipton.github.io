import { describe, expect, it } from 'vitest';

import {
  themeVoronoiSlabModel,
  themeVoronoiSlabTokenOrder,
} from '../lib/style-transfer/themeVoronoiSlab';

describe('theme Voronoi slab model', () => {
  it('creates one deterministic planar Voronoi cell per theme token', () => {
    expect(themeVoronoiSlabModel.cells).toHaveLength(6);
    expect(themeVoronoiSlabModel.cells.map((cell) => cell.token)).toEqual(
      themeVoronoiSlabTokenOrder,
    );
    expect(
      themeVoronoiSlabModel.cells.every((cell) => cell.path.length > 0),
    ).toBe(true);
    expect(
      themeVoronoiSlabModel.cells.every((cell) =>
        cell.clipPath.startsWith('polygon('),
      ),
    ).toBe(true);
  });
});
