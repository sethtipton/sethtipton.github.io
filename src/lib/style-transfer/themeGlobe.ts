import * as THREE from 'three';
import { geoVoronoi } from 'd3-geo-voronoi';

import {
  formatStyleTransferColorRoleLabel,
  type ResolvedStyleTransferPalette,
} from './palette';
import type { StoredStyleTransferApplication } from './controller';
import type { StyleTransferArtworkPreview } from './artwork';
import type { StyleTransferThemeColorRole } from './schema';
import {
  getStyleTransferMotionProfile,
  type StyleTransferMotionLevel,
} from './motion';

type ThemeGlobeSource = 'default' | 'preset' | 'prompt';

type ThemeGlobeDatasetHints = Partial<
  Pick<
    StoredStyleTransferApplication['dataset'],
    | 'styleButton'
    | 'styleDensity'
    | 'styleMotion'
    | 'stylePattern'
    | 'styleSurface'
  >
>;

export type ThemeGlobeInput = {
  artworkFamily?: StyleTransferArtworkPreview['spec']['family'] | null;
  colors: ResolvedStyleTransferPalette;
  dataset: ThemeGlobeDatasetHints;
  effectiveMode: 'dark' | 'light';
  source: ThemeGlobeSource;
  themeId: string;
  themeName: string;
};

export type ThemeGlobeRenderVariant = 'filled' | 'stroke';

export type ThemeGlobeMaterialSettings = {
  emissiveIntensity: number;
  metalness: number;
  opacity: number;
  roughness: number;
};

export type ThemeGlobeCellModel = {
  centroid: [number, number, number];
  color: string;
  indices: Uint16Array<ArrayBufferLike>;
  label: string;
  material: ThemeGlobeMaterialSettings;
  normals: Float32Array<ArrayBufferLike>;
  positions: Float32Array<ArrayBufferLike>;
  token: StyleTransferThemeColorRole;
  value: string;
};

export type ThemeGlobeModel = {
  cells: ThemeGlobeCellModel[];
  rotationSpeed: number;
};

type ThemeGlobeShapeProfile = {
  axisScale: {
    x: number;
    y: number;
    z: number;
  };
  baseRadius: number;
  bulge: number;
  emissiveBoost: number;
  facetStrength: number;
  gap: number;
  metalness: number;
  panelLift: number;
  roughness: number;
  rotationSpeed: number;
  seamDepth: number;
  waveFrequency: number;
};

type VoronoiFeature = {
  geometry?: {
    coordinates?: number[][][];
  };
};

const globeModelCache = new Map<string, ThemeGlobeModel>();
export const themeGlobeTokenOrder = [
  'text',
  'accentStrong',
  'focus',
  'muted',
  'background',
  'accent',
] as const satisfies readonly StyleTransferThemeColorRole[];
const tokenOrder = themeGlobeTokenOrder;
const goldenAngle = Math.PI * (3 - Math.sqrt(5));

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: string) {
  let state = hashString(seed) || 1;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function lonLatToVector(lon: number, lat: number) {
  const lonRadians = degreesToRadians(lon);
  const latRadians = degreesToRadians(lat);
  const cosLat = Math.cos(latRadians);

  return new THREE.Vector3(
    Math.cos(lonRadians) * cosLat,
    Math.sin(latRadians),
    Math.sin(lonRadians) * cosLat,
  );
}

function vectorToLonLat(vector: THREE.Vector3): [number, number] {
  const normalized = vector.clone().normalize();

  return [
    radiansToDegrees(Math.atan2(normalized.z, normalized.x)),
    radiansToDegrees(Math.asin(clamp(normalized.y, -1, 1))),
  ];
}

function createBaseSeed(tokenIndex: number, tokenCount: number) {
  if (tokenCount === 6) {
    const fixedSeeds = [
      new THREE.Vector3(0, 0.92, 0.18),
      new THREE.Vector3(0.88, 0.24, 0.34),
      new THREE.Vector3(0.42, -0.28, 0.86),
      new THREE.Vector3(-0.82, 0.18, 0.54),
      new THREE.Vector3(-0.28, -0.88, 0.36),
      new THREE.Vector3(0.54, -0.22, -0.82),
    ];

    return fixedSeeds[tokenIndex]!.clone().normalize();
  }

  const y = 1 - ((tokenIndex + 0.5) / tokenCount) * 2;
  const radius = Math.sqrt(1 - y * y);
  const theta = goldenAngle * tokenIndex;

  return new THREE.Vector3(
    Math.cos(theta) * radius,
    y,
    Math.sin(theta) * radius,
  );
}

function createThemeGlobeCacheKey(input: ThemeGlobeInput) {
  return [
    input.themeId,
    input.source,
    input.effectiveMode,
    input.artworkFamily ?? 'none',
    input.dataset.styleSurface ?? 'surface',
    input.dataset.styleDensity ?? 'balanced',
    input.dataset.stylePattern ?? 'none',
    input.dataset.styleMotion ?? 'calm',
    input.dataset.styleButton ?? 'soft',
    ...tokenOrder.map((token) => input.colors[token]),
  ].join('|');
}

function createShapeProfile(input: ThemeGlobeInput): ThemeGlobeShapeProfile {
  const random = createRandom(createThemeGlobeCacheKey(input));
  const surfaceStyle = input.dataset.styleSurface ?? 'flat';
  const density = input.dataset.styleDensity ?? 'balanced';
  const motion = (input.dataset.styleMotion ??
    'calm') as StyleTransferMotionLevel;
  const buttonStyle = input.dataset.styleButton ?? 'soft';
  const pattern = input.dataset.stylePattern ?? 'none';

  const axisScale = {
    x: 1 + (random() - 0.5) * 0.06,
    y: 1 + (random() - 0.5) * 0.08,
    z: 1 + (random() - 0.5) * 0.06,
  };

  const baseRadius =
    1.02 +
    (density === 'airy' ? 0.03 : density === 'compact' ? -0.02 : 0) +
    (surfaceStyle === 'glow' ? 0.015 : 0);

  const bulge =
    0.02 +
    (density === 'airy' ? 0.018 : density === 'compact' ? -0.005 : 0.006) +
    (surfaceStyle === 'glass' ? 0.01 : 0) +
    (surfaceStyle === 'paper' ? -0.004 : 0) +
    (input.source === 'prompt' ? 0.008 : 0);

  const gap =
    0.06 +
    (buttonStyle === 'hard-edge' ? 0.016 : 0) +
    (buttonStyle === 'pill' ? -0.008 : 0) +
    (density === 'compact' ? 0.01 : density === 'airy' ? -0.006 : 0);

  const panelLift =
    0.035 +
    (surfaceStyle === 'glow' ? 0.018 : 0) +
    (surfaceStyle === 'glass' ? 0.012 : 0) +
    (buttonStyle === 'pill' ? 0.01 : 0);

  const seamDepth =
    0.018 +
    (surfaceStyle === 'paper' ? 0.01 : 0.004) +
    (buttonStyle === 'hard-edge' ? 0.012 : 0);

  const facetStrength =
    0.008 +
    (buttonStyle === 'hard-edge' ? 0.016 : 0) +
    (pattern === 'grid' || pattern === 'scanlines' ? 0.012 : 0);

  const roughness =
    surfaceStyle === 'glass'
      ? 0.34
      : surfaceStyle === 'glow'
        ? 0.42
        : surfaceStyle === 'paper'
          ? 0.82
          : 0.62;

  const metalness =
    surfaceStyle === 'glass'
      ? 0.28
      : surfaceStyle === 'glow'
        ? 0.18
        : surfaceStyle === 'flat'
          ? 0.08
          : 0.03;

  const emissiveBoost =
    surfaceStyle === 'glow'
      ? 0.22
      : input.artworkFamily === 'radial-burst' ||
          input.artworkFamily === 'offset-rings'
        ? 0.12
        : 0.05;

  const rotationSpeed =
    getStyleTransferMotionProfile(motion).globeRotationSpeed;

  const waveFrequency =
    pattern === 'scanlines'
      ? 3.6
      : pattern === 'grid'
        ? 3.2
        : pattern === 'noise'
          ? 4.4
          : 2.6;

  axisScale.x +=
    input.artworkFamily === 'layered-wave'
      ? 0.03
      : input.artworkFamily === 'offset-rings'
        ? -0.02
        : 0;
  axisScale.y +=
    input.artworkFamily === 'soft-blob'
      ? 0.04
      : input.artworkFamily === 'angled-panel'
        ? -0.02
        : 0;
  axisScale.z +=
    input.artworkFamily === 'folded-ribbon'
      ? 0.03
      : input.artworkFamily === 'paper-cut'
        ? -0.015
        : 0;

  return {
    axisScale,
    baseRadius,
    bulge,
    emissiveBoost,
    facetStrength,
    gap: clamp(gap, 0.035, 0.085),
    metalness,
    panelLift: clamp(panelLift, 0.024, 0.08),
    roughness,
    rotationSpeed,
    seamDepth: clamp(seamDepth, 0.012, 0.04),
    waveFrequency,
  };
}

function createSeedPoints(input: ThemeGlobeInput) {
  const globalRandom = createRandom(`${input.themeId}|seed-rotation`);
  const yaw = (globalRandom() - 0.5) * 0.7;
  const pitch = (globalRandom() - 0.5) * 0.4;
  const roll = (globalRandom() - 0.5) * 0.25;
  const rotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(pitch, yaw, roll),
  );

  return tokenOrder.map((token, index) => {
    const tokenRandom = createRandom(
      `${input.themeId}|${input.source}|${token}|${input.artworkFamily ?? 'none'}`,
    );
    const jitter = new THREE.Vector3(
      (tokenRandom() - 0.5) * 0.18,
      (tokenRandom() - 0.5) * 0.18,
      (tokenRandom() - 0.5) * 0.18,
    );
    const baseVector = createBaseSeed(index, tokenOrder.length)
      .applyQuaternion(rotation)
      .add(jitter)
      .normalize();
    const lonLat = vectorToLonLat(baseVector);

    return {
      coordinates: lonLat,
      index,
      token,
    };
  });
}

function createDeformedVector(
  baseVector: THREE.Vector3,
  profile: ThemeGlobeShapeProfile,
  tokenSeed: number,
  vertexSeed: number,
) {
  const shaped = new THREE.Vector3(
    baseVector.x * profile.axisScale.x,
    baseVector.y * profile.axisScale.y,
    baseVector.z * profile.axisScale.z,
  ).normalize();

  const wave =
    Math.sin((shaped.x + tokenSeed) * profile.waveFrequency) * 0.5 +
    Math.cos((shaped.y - vertexSeed) * (profile.waveFrequency - 0.4)) * 0.35 +
    Math.sin((shaped.z + tokenSeed * 0.5) * (profile.waveFrequency + 0.25)) *
      0.15;

  const localFacet = (vertexSeed - 0.5) * profile.facetStrength;
  const radialOffset = profile.bulge * wave + localFacet;

  return shaped.multiplyScalar(profile.baseRadius + radialOffset);
}

function normalizePolygonRing(ring: number[][] | undefined) {
  if (!ring || ring.length < 4) {
    return [];
  }

  const normalized = ring.slice(0, -1);
  return normalized.filter(
    (point, index) =>
      index === 0 ||
      point[0] !== normalized[index - 1]?.[0] ||
      point[1] !== normalized[index - 1]?.[1],
  );
}

function computeCentroid(vectors: THREE.Vector3[]) {
  const centroid = vectors.reduce(
    (accumulator, vector) => accumulator.add(vector),
    new THREE.Vector3(),
  );

  return centroid.normalize();
}

function ensureClockwiseOrientation(
  vectors: THREE.Vector3[],
  centroid: THREE.Vector3,
) {
  if (vectors.length < 3) {
    return vectors;
  }

  const first = vectors[0];
  const second = vectors[1];
  const third = vectors[2];
  const normal = new THREE.Vector3()
    .subVectors(second, first)
    .cross(new THREE.Vector3().subVectors(third, first));

  if (normal.dot(centroid) < 0) {
    return [...vectors].reverse();
  }

  return vectors;
}

function createCellModel(
  feature: VoronoiFeature,
  index: number,
  input: ThemeGlobeInput,
  profile: ThemeGlobeShapeProfile,
) {
  const token = tokenOrder[index];
  const ring = normalizePolygonRing(feature.geometry?.coordinates?.[0]);

  if (ring.length < 3) {
    return null;
  }

  const tokenRandom = createRandom(`${input.themeId}|cell|${token}`);
  const tokenSeed = tokenRandom();
  const boundaryVectors = ring.map(([lon, lat], vertexIndex) =>
    createDeformedVector(
      lonLatToVector(lon, lat),
      profile,
      tokenSeed,
      vertexIndex / Math.max(ring.length - 1, 1),
    ),
  );

  const centroid = computeCentroid(boundaryVectors);
  const orientedVectors = ensureClockwiseOrientation(boundaryVectors, centroid);
  const centerVector = centroid
    .clone()
    .multiplyScalar(profile.baseRadius + profile.panelLift + tokenSeed * 0.012);

  const ringVectors = orientedVectors.map((vector) => {
    const shrunk = centroid
      .clone()
      .multiplyScalar(profile.gap)
      .add(vector.clone().multiplyScalar(1 - profile.gap))
      .normalize();

    const seamRadius =
      profile.baseRadius -
      profile.seamDepth +
      tokenSeed * profile.facetStrength;

    return shrunk.multiplyScalar(seamRadius);
  });

  const positions = new Float32Array((ringVectors.length + 1) * 3);
  positions[0] = centerVector.x;
  positions[1] = centerVector.y;
  positions[2] = centerVector.z;

  ringVectors.forEach((vector, vectorIndex) => {
    const offset = (vectorIndex + 1) * 3;
    positions[offset] = vector.x;
    positions[offset + 1] = vector.y;
    positions[offset + 2] = vector.z;
  });

  const indices = new Uint16Array(ringVectors.length * 3);

  for (let edgeIndex = 0; edgeIndex < ringVectors.length; edgeIndex += 1) {
    const offset = edgeIndex * 3;
    indices[offset] = 0;
    indices[offset + 1] = edgeIndex + 1;
    indices[offset + 2] =
      edgeIndex === ringVectors.length - 1 ? 1 : edgeIndex + 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  const normals = (
    geometry.getAttribute('normal') as THREE.BufferAttribute
  ).array.slice() as Float32Array;
  geometry.dispose();

  return {
    centroid: [centerVector.x, centerVector.y, centerVector.z] as [
      number,
      number,
      number,
    ],
    color: input.colors[token],
    indices,
    label: formatStyleTransferColorRoleLabel(token),
    material: {
      emissiveIntensity:
        profile.emissiveBoost + tokenSeed * 0.05 + (index % 3 === 0 ? 0.03 : 0),
      metalness: clamp(
        profile.metalness + (tokenSeed - 0.5) * 0.08,
        0.02,
        0.45,
      ),
      opacity: clamp(0.96 + tokenSeed * 0.03, 0.94, 1),
      //opacity: clamp(0.88 + tokenSeed * 0.04, 0.84, 92),
      roughness: clamp(profile.roughness + (0.5 - tokenSeed) * 0.1, 0.2, 0.92),
    },
    normals,
    positions,
    token,
    value: input.colors[token],
  } satisfies ThemeGlobeCellModel;
}

export function createThemeGlobeModel(input: ThemeGlobeInput): ThemeGlobeModel {
  const cacheKey = createThemeGlobeCacheKey(input);
  const cachedModel = globeModelCache.get(cacheKey);

  if (cachedModel) {
    return cachedModel;
  }

  const shapeProfile = createShapeProfile(input);
  const seedPoints = createSeedPoints(input);
  const voronoi = geoVoronoi(seedPoints.map((seed) => seed.coordinates));
  const polygons = voronoi.polygons().features as VoronoiFeature[];

  const cells = polygons.reduce<ThemeGlobeCellModel[]>(
    (nextCells, feature, index) => {
      const cell = createCellModel(feature, index, input, shapeProfile);

      if (cell) {
        nextCells.push(cell);
      }

      return nextCells;
    },
    [],
  );

  const model = {
    cells,
    rotationSpeed: shapeProfile.rotationSpeed,
  } satisfies ThemeGlobeModel;

  globeModelCache.set(cacheKey, model);
  return model;
}
