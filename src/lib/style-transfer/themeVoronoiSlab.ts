import { Delaunay } from 'd3-delaunay';

import { formatStyleTransferColorRoleLabel } from './palette';
import type { StyleTransferThemeColorRole } from './schema';

type ThemeVoronoiSlabCell = {
  centroid: [number, number];
  clipPath: string;
  key: string;
  label: string;
  path: string;
  token: StyleTransferThemeColorRole;
};

export type ThemeVoronoiSlabModel = {
  cells: ThemeVoronoiSlabCell[];
  height: number;
  silhouetteRadius: number;
  width: number;
};

const slabWidth = 110;
const slabHeight = 80;
const slabSilhouetteRadius = 16;
const slabSeeds: ReadonlyArray<readonly [number, number]> = [
  [17, 17],
  [49, 12],
  [80, 18],
  [24, 46],
  [55, 41],
  [83, 53],
] as const;

// These indices map the fixed seed layout into the current on-screen reading
// order after the slab shell transform is applied.
const slabDisplayOrder = [2, 5, 1, 4, 0, 3] as const;

export const themeVoronoiSlabTokenOrder = [
  'text',
  'background',
  'accent',
  'accentStrong',
  'focus',
  'muted',
] as const satisfies readonly StyleTransferThemeColorRole[];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizePolygon(
  polygon: Array<[number, number]> | null | undefined,
): Array<[number, number]> {
  if (!polygon || polygon.length < 4) {
    return [];
  }

  const trimmed = polygon.slice(0, -1);
  const normalized = trimmed.map(([x, y]) => [
    clamp(x, 0, slabWidth),
    clamp(y, 0, slabHeight),
  ]) as Array<[number, number]>;

  return normalized.filter(
    (point, index) =>
      index === 0 ||
      point[0] !== normalized[index - 1]?.[0] ||
      point[1] !== normalized[index - 1]?.[1],
  );
}

function createClipPath(points: Array<[number, number]>) {
  return `polygon(${points
    .map(
      ([x, y]) =>
        `${((x / slabWidth) * 100).toFixed(2)}% ${((y / slabHeight) * 100).toFixed(2)}%`,
    )
    .join(', ')})`;
}

function createSvgPath(points: Array<[number, number]>) {
  if (points.length === 0) {
    return '';
  }

  return `${points
    .map(
      ([x, y], index) =>
        `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(' ')} Z`;
}

function createCentroid(points: Array<[number, number]>): [number, number] {
  const centroid = points.reduce(
    (next, [x, y]) => {
      next[0] += x;
      next[1] += y;
      return next;
    },
    [0, 0] as [number, number],
  );

  return [
    centroid[0] / Math.max(points.length, 1),
    centroid[1] / Math.max(points.length, 1),
  ];
}

const delaunay = Delaunay.from(slabSeeds);
const voronoi = delaunay.voronoi([0, 0, slabWidth, slabHeight]);

export const themeVoronoiSlabModel: ThemeVoronoiSlabModel = {
  cells: themeVoronoiSlabTokenOrder.map((token, index) => {
    const cellIndex = slabDisplayOrder[index] ?? index;
    const polygon = normalizePolygon(
      voronoi.cellPolygon(cellIndex) as Array<[number, number]> | null,
    );

    return {
      centroid: createCentroid(polygon),
      clipPath: createClipPath(polygon),
      key: `${token}-${cellIndex}`,
      label: formatStyleTransferColorRoleLabel(token),
      path: createSvgPath(polygon),
      token,
    };
  }),
  height: slabHeight,
  silhouetteRadius: slabSilhouetteRadius,
  width: slabWidth,
};
