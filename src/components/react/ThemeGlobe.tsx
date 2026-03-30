import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  createThemeGlobeModel,
  type ThemeGlobeInput,
  type ThemeGlobeCellModel,
  type ThemeGlobeRenderVariant,
} from '../../lib/style-transfer/themeGlobe';
import type { StyleTransferThemeColorRole } from '../../lib/style-transfer/schema';

type ThemeGlobeProps = ThemeGlobeInput & {
  activityState?: ThemeGlobeActivityState;
  cameraPositionZ?: number;
  dpr?: number | [number, number];
  fallbackAppearance?: 'dot' | 'empty';
  showOutlines?: boolean;
  variant?: ThemeGlobeRenderVariant;
};

export type ThemeGlobeActivityState =
  | 'idle'
  | 'generating'
  | 'success'
  | 'error';

type ThemeGlobeSceneProps = {
  activeToken: StyleTransferThemeColorRole | null;
  activityState: ThemeGlobeActivityState;
  effectiveMode: ThemeGlobeInput['effectiveMode'];
  model: ReturnType<typeof createThemeGlobeModel>;
  reducedMotion: boolean;
  onInspect: (token: StyleTransferThemeColorRole | null) => void;
  showOutlines: boolean;
  variant: ThemeGlobeRenderVariant;
};

type ThemeGlobeCellProps = {
  active: boolean;
  activityState: ThemeGlobeActivityState;
  cell: ThemeGlobeCellModel;
  effectiveMode: ThemeGlobeInput['effectiveMode'];
  onInspect: (token: StyleTransferThemeColorRole | null) => void;
  sequenceIndex: number;
  sequenceTotal: number;
  showOutlines: boolean;
  variant: ThemeGlobeRenderVariant;
};

function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);

    return () => {
      mediaQuery.removeEventListener('change', syncPreference);
    };
  }, []);

  return prefersReducedMotion;
}

function useWebglAvailability() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    if (navigator.userAgent.toLowerCase().includes('jsdom')) {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');
      const context =
        canvas.getContext('webgl2', {
          alpha: true,
          antialias: true,
        }) ??
        canvas.getContext('webgl', {
          alpha: true,
          antialias: true,
        });

      return Boolean(context);
    } catch {
      return false;
    }
  }, []);
}

function getSequencePulse(
  elapsedSeconds: number,
  sequenceIndex: number,
  sequenceTotal: number,
) {
  const normalizedIndex = sequenceIndex / Math.max(sequenceTotal, 1);
  const phase = (elapsedSeconds * 0.9 - normalizedIndex * 0.82) % 1;
  const wrappedPhase = phase < 0 ? phase + 1 : phase;

  if (wrappedPhase > 0.5) {
    return 0;
  }

  return Math.sin((wrappedPhase / 0.5) * Math.PI);
}

function getSettlingPulse(elapsedSeconds: number, durationSeconds: number) {
  if (elapsedSeconds <= 0 || elapsedSeconds >= durationSeconds) {
    return 0;
  }

  const progress = elapsedSeconds / durationSeconds;
  return Math.sin(progress * Math.PI) * (1 - progress * 0.35);
}

function getTimestampMs() {
  return typeof performance !== 'undefined' ? performance.now() : 0;
}

function ThemeGlobeCell({
  active,
  activityState,
  cell,
  effectiveMode,
  onInspect,
  sequenceIndex,
  sequenceTotal,
  showOutlines,
  variant,
}: ThemeGlobeCellProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const fillMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const outlineMaterialRefs = useRef<Array<THREE.LineBasicMaterial | null>>([]);
  const phaseStartRef = useRef<number | null>(null);
  const strokeLoopScales = variant === 'stroke' ? [1, 1.014, 0.986] : [1];
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry();

    nextGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(cell.positions, 3),
    );
    nextGeometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(cell.normals, 3),
    );
    nextGeometry.setIndex(new THREE.BufferAttribute(cell.indices, 1));

    return nextGeometry;
  }, [cell]);

  const outlineGeometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry();
    const ringPositions = cell.positions.slice(3);

    nextGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(ringPositions, 3),
    );

    return nextGeometry;
  }, [cell]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      outlineGeometry.dispose();
    };
  }, [outlineGeometry]);

  const baseColor = useMemo(() => new THREE.Color(cell.color), [cell.color]);
  const activeColor = useMemo(
    () => new THREE.Color(cell.color).lerp(new THREE.Color('#ffffff'), 0.18),
    [cell.color],
  );
  const emissiveColor = useMemo(
    () => new THREE.Color(cell.color).lerp(new THREE.Color('#ffffff'), 0.24),
    [cell.color],
  );
  const loadingColor = useMemo(
    () => new THREE.Color(cell.color).lerp(new THREE.Color('#ffffff'), 0.38),
    [cell.color],
  );
  const successColor = useMemo(
    () => new THREE.Color(cell.color).lerp(new THREE.Color('#ffffff'), 0.28),
    [cell.color],
  );
  const errorColor = useMemo(
    () =>
      new THREE.Color(cell.color).lerp(
        new THREE.Color(effectiveMode === 'dark' ? '#5c6570' : '#8a7d74'),
        0.62,
      ),
    [cell.color, effectiveMode],
  );
  const filledOutlineColor = useMemo(
    () => new THREE.Color(effectiveMode === 'dark' ? '#f4f8fc' : '#0f1720'),
    [effectiveMode],
  );
  const strokeOpacity = useMemo(() => {
    if (effectiveMode === 'dark') {
      return active
        ? { primary: 0.84, secondary: 0.28 }
        : { primary: 0.56, secondary: 0.14 };
    }

    return active
      ? { primary: 0.96, secondary: 0.36 }
      : { primary: 0.76, secondary: 0.22 };
  }, [active, effectiveMode]);

  useEffect(() => {
    phaseStartRef.current = getTimestampMs();
  }, [activityState]);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const now = getTimestampMs();
    if (phaseStartRef.current === null) {
      phaseStartRef.current = now;
    }
    const phaseElapsedSeconds = (now - phaseStartRef.current) / 1000;
    const fillMaterial = fillMaterialRef.current;
    const outlineMaterials = outlineMaterialRefs.current.filter(
      (material): material is THREE.LineBasicMaterial => material !== null,
    );

    let pulse = 0;
    let targetScale = active ? 1.018 : 1;
    let targetOpacity = active ? 1 : cell.material.opacity;
    let targetEmissiveIntensity = active
      ? cell.material.emissiveIntensity
      : cell.material.emissiveIntensity * 0.45;
    let targetMetalness = active
      ? Math.min(cell.material.metalness + 0.08, 0.5)
      : cell.material.metalness;
    let targetRoughness = active
      ? Math.max(cell.material.roughness - 0.08, 0.18)
      : cell.material.roughness;
    let targetColor = active ? activeColor : baseColor;
    let targetOutlineOpacity =
      variant === 'stroke'
        ? active
          ? strokeOpacity.primary
          : strokeOpacity.secondary
        : active
          ? 0.34
          : 0.2;

    if (activityState === 'generating') {
      pulse = getSequencePulse(
        phaseElapsedSeconds,
        sequenceIndex,
        sequenceTotal,
      );
      targetScale += pulse * 0.055;
      targetOpacity = Math.min(1, cell.material.opacity + pulse * 0.18);
      targetEmissiveIntensity =
        cell.material.emissiveIntensity * (0.7 + pulse * 2.1);
      targetMetalness = Math.min(cell.material.metalness + pulse * 0.14, 0.56);
      targetRoughness = Math.max(cell.material.roughness - pulse * 0.16, 0.14);
      targetColor = pulse > 0.06 ? loadingColor : targetColor;
      targetOutlineOpacity =
        variant === 'stroke'
          ? strokeOpacity.secondary + pulse * 0.6
          : 0.2 + pulse * 0.42;
    } else if (activityState === 'success') {
      pulse = getSettlingPulse(phaseElapsedSeconds, 0.42);
      targetScale += pulse * 0.08;
      targetOpacity = Math.min(1, cell.material.opacity + pulse * 0.12);
      targetEmissiveIntensity =
        cell.material.emissiveIntensity * (0.75 + pulse * 1.35);
      targetMetalness = Math.min(cell.material.metalness + pulse * 0.1, 0.54);
      targetRoughness = Math.max(cell.material.roughness - pulse * 0.08, 0.16);
      targetColor = pulse > 0.03 ? successColor : targetColor;
      targetOutlineOpacity =
        variant === 'stroke'
          ? strokeOpacity.secondary + pulse * 0.38
          : 0.2 + pulse * 0.24;
    } else if (activityState === 'error') {
      pulse = getSettlingPulse(phaseElapsedSeconds, 0.34);
      targetScale -= pulse * 0.03;
      targetOpacity = Math.max(0.74, cell.material.opacity - pulse * 0.08);
      targetEmissiveIntensity =
        cell.material.emissiveIntensity * Math.max(0.18, 0.45 - pulse * 0.2);
      targetMetalness = Math.max(0, cell.material.metalness - pulse * 0.04);
      targetRoughness = Math.min(1, cell.material.roughness + pulse * 0.12);
      targetColor = errorColor;
      targetOutlineOpacity =
        variant === 'stroke'
          ? Math.max(0.08, strokeOpacity.secondary - pulse * 0.12)
          : Math.max(0.08, 0.16 - pulse * 0.08);
    }

    groupRef.current.scale.x = THREE.MathUtils.damp(
      groupRef.current.scale.x,
      targetScale,
      10,
      delta,
    );
    groupRef.current.scale.y = THREE.MathUtils.damp(
      groupRef.current.scale.y,
      targetScale,
      10,
      delta,
    );
    groupRef.current.scale.z = THREE.MathUtils.damp(
      groupRef.current.scale.z,
      targetScale,
      10,
      delta,
    );

    if (fillMaterial) {
      fillMaterial.color.lerp(targetColor, 1 - Math.exp(-8 * delta));
      fillMaterial.emissiveIntensity = THREE.MathUtils.damp(
        fillMaterial.emissiveIntensity,
        targetEmissiveIntensity,
        8,
        delta,
      );
      fillMaterial.metalness = THREE.MathUtils.damp(
        fillMaterial.metalness,
        targetMetalness,
        8,
        delta,
      );
      fillMaterial.opacity = THREE.MathUtils.damp(
        fillMaterial.opacity,
        targetOpacity,
        10,
        delta,
      );
      fillMaterial.roughness = THREE.MathUtils.damp(
        fillMaterial.roughness,
        targetRoughness,
        8,
        delta,
      );
    }

    outlineMaterials.forEach((material) => {
      material.opacity = THREE.MathUtils.damp(
        material.opacity,
        targetOutlineOpacity,
        10,
        delta,
      );
      material.color.lerp(
        variant === 'filled' ? filledOutlineColor : targetColor,
        1 - Math.exp(-8 * delta),
      );
    });
  });

  return (
    <group
      ref={groupRef}
      onPointerOut={(event) => {
        event.stopPropagation();
        onInspect(null);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        onInspect(cell.token);
      }}
    >
      {variant === 'filled' ? (
        <group>
          <mesh geometry={geometry}>
            <meshStandardMaterial
              ref={fillMaterialRef}
              color={active ? activeColor : baseColor}
              emissive={emissiveColor}
              emissiveIntensity={
                active
                  ? cell.material.emissiveIntensity
                  : cell.material.emissiveIntensity * 0.45
              }
              metalness={
                active
                  ? Math.min(cell.material.metalness + 0.08, 0.5)
                  : cell.material.metalness
              }
              opacity={active ? 1 : cell.material.opacity}
              roughness={
                active
                  ? Math.max(cell.material.roughness - 0.08, 0.18)
                  : cell.material.roughness
              }
              transparent
            />
          </mesh>
          {showOutlines ? (
            <lineLoop geometry={outlineGeometry}>
              <lineBasicMaterial
                ref={(material) => {
                  outlineMaterialRefs.current[0] = material;
                }}
                color={filledOutlineColor}
                opacity={active ? 0.34 : 0.2}
                transparent
              />
            </lineLoop>
          ) : null}
        </group>
      ) : null}

      {variant === 'stroke' ? (
        <group>
          {strokeLoopScales.map((scale, index) => (
            <lineLoop
              geometry={outlineGeometry}
              key={`${cell.token}-stroke-${scale}`}
              scale={[scale, scale, scale]}
            >
              <lineBasicMaterial
                ref={(material) => {
                  outlineMaterialRefs.current[index] = material;
                }}
                color={active ? activeColor : baseColor}
                opacity={
                  index === 0 ? strokeOpacity.primary : strokeOpacity.secondary
                }
                transparent
              />
            </lineLoop>
          ))}
        </group>
      ) : null}
    </group>
  );
}

function ThemeGlobeScene({
  activeToken,
  activityState,
  effectiveMode,
  model,
  reducedMotion,
  onInspect,
  showOutlines,
  variant,
}: ThemeGlobeSceneProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const currentSpeedRef = useRef(model.rotationSpeed);
  const wobbleTimeRef = useRef(0);
  const activityPhaseStartRef = useRef<number | null>(null);

  useEffect(() => {
    activityPhaseStartRef.current = getTimestampMs();
  }, [activityState]);

  useFrame((_, delta) => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    const isPaused = reducedMotion;

    if (isPaused) {
      currentSpeedRef.current = 0;
      return;
    }

    const now = getTimestampMs();
    if (activityPhaseStartRef.current === null) {
      activityPhaseStartRef.current = now;
    }
    const phaseElapsedSeconds = (now - activityPhaseStartRef.current) / 1000;
    const baseRotationSpeed =
      variant === 'stroke' ? model.rotationSpeed * 0.42 : model.rotationSpeed;
    let targetRotationSpeed = baseRotationSpeed;
    let extraScale = 0;
    let targetPositionX = 0;
    let wobbleAmplitude = variant === 'stroke' ? 0.6 : 1;

    if (activityState === 'generating') {
      targetRotationSpeed = baseRotationSpeed * 1.75;
      wobbleAmplitude *= 1.42;
    } else if (activityState === 'success') {
      targetRotationSpeed = baseRotationSpeed * 0.45;
      extraScale = getSettlingPulse(phaseElapsedSeconds, 0.42) * 0.075;
    } else if (activityState === 'error') {
      const decay = Math.exp(-phaseElapsedSeconds * 7.5);
      targetRotationSpeed = baseRotationSpeed * 0.08 * decay;
      targetPositionX = Math.sin(phaseElapsedSeconds * 44) * 0.04 * decay;
      wobbleAmplitude *= 0.34;
    }

    currentSpeedRef.current = THREE.MathUtils.damp(
      currentSpeedRef.current,
      targetRotationSpeed,
      4,
      delta,
    );

    wobbleTimeRef.current += delta;
    group.rotation.y += currentSpeedRef.current * delta;

    const targetX =
      Math.sin(wobbleTimeRef.current * 0.24) * 0.08 * wobbleAmplitude;
    const targetZ =
      Math.cos(wobbleTimeRef.current * 0.18) * 0.04 * wobbleAmplitude;

    group.rotation.x = THREE.MathUtils.damp(
      group.rotation.x,
      targetX,
      6,
      delta,
    );
    group.rotation.z = THREE.MathUtils.damp(
      group.rotation.z,
      targetZ,
      6,
      delta,
    );

    const targetScale = 1 + extraScale;

    group.scale.x = THREE.MathUtils.damp(group.scale.x, targetScale, 9, delta);
    group.scale.y = THREE.MathUtils.damp(group.scale.y, targetScale, 9, delta);
    group.scale.z = THREE.MathUtils.damp(group.scale.z, targetScale, 9, delta);
    group.position.x = THREE.MathUtils.damp(
      group.position.x,
      targetPositionX,
      16,
      delta,
    );
  });

  return (
    <>
      <ambientLight intensity={1.12} />
      <directionalLight intensity={1.25} position={[3.2, 2.6, 4.4]} />
      <directionalLight intensity={0.68} position={[-3, -2, 2.4]} />
      <group ref={groupRef}>
        {model.cells.map((cell, index) => (
          <ThemeGlobeCell
            active={activeToken === cell.token}
            activityState={activityState}
            cell={cell}
            effectiveMode={effectiveMode}
            key={cell.token}
            onInspect={onInspect}
            sequenceIndex={index}
            sequenceTotal={model.cells.length}
            showOutlines={showOutlines}
            variant={variant}
          />
        ))}
      </group>
    </>
  );
}

const MemoizedThemeGlobeScene = memo(ThemeGlobeScene);

export default function ThemeGlobe({
  activityState = 'idle',
  artworkFamily = null,
  cameraPositionZ = 3.35,
  colors,
  dataset,
  dpr = [1, 1.75],
  effectiveMode,
  fallbackAppearance = 'dot',
  source,
  showOutlines = false,
  themeId,
  themeName,
  variant = 'filled',
}: ThemeGlobeProps) {
  const reducedMotion = useReducedMotionPreference();
  const canRenderWebgl = useWebglAvailability();
  const [inspectedToken, setInspectedToken] =
    useState<StyleTransferThemeColorRole | null>(null);

  const globeModel = useMemo(
    () =>
      createThemeGlobeModel({
        artworkFamily,
        colors,
        dataset,
        effectiveMode,
        source,
        themeId,
        themeName,
      }),
    [artworkFamily, colors, dataset, effectiveMode, source, themeId, themeName],
  );

  const handleInspect = (token: StyleTransferThemeColorRole | null) => {
    setInspectedToken((current) => (current === token ? current : token));
  };

  return (
    <div
      className={`style-transfer__theme-globe style-transfer__theme-globe--${variant}`}
    >
      <div className="style-transfer__theme-globe-shell">
        <div
          className="style-transfer__theme-globe-viewport"
          aria-hidden="true"
        >
          {canRenderWebgl ? (
            <Canvas
              camera={{ fov: 32, position: [0, 0, cameraPositionZ] }}
              dpr={dpr}
              gl={{
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance',
              }}
            >
              <MemoizedThemeGlobeScene
                activeToken={inspectedToken}
                activityState={activityState}
                effectiveMode={effectiveMode}
                model={globeModel}
                onInspect={handleInspect}
                reducedMotion={reducedMotion}
                showOutlines={showOutlines}
                variant={variant}
              />
            </Canvas>
          ) : (
            <div className="style-transfer__theme-globe-fallback">
              {fallbackAppearance === 'dot' ? (
                <span className="style-transfer__theme-globe-fallback-dot" />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
