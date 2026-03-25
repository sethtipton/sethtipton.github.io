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
  cameraPositionZ?: number;
  dpr?: number | [number, number];
  fallbackAppearance?: 'dot' | 'empty';
  showOutlines?: boolean;
  variant?: ThemeGlobeRenderVariant;
};

type ThemeGlobeSceneProps = {
  activeToken: StyleTransferThemeColorRole | null;
  effectiveMode: ThemeGlobeInput['effectiveMode'];
  model: ReturnType<typeof createThemeGlobeModel>;
  reducedMotion: boolean;
  onInspect: (token: StyleTransferThemeColorRole | null) => void;
  showOutlines: boolean;
  variant: ThemeGlobeRenderVariant;
};

type ThemeGlobeCellProps = {
  active: boolean;
  cell: ThemeGlobeCellModel;
  effectiveMode: ThemeGlobeInput['effectiveMode'];
  onInspect: (token: StyleTransferThemeColorRole | null) => void;
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

function ThemeGlobeCell({
  active,
  cell,
  effectiveMode,
  onInspect,
  showOutlines,
  variant,
}: ThemeGlobeCellProps) {
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

  return (
    <group
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

    const rotationSpeed =
      variant === 'stroke' ? model.rotationSpeed * 0.42 : model.rotationSpeed;

    currentSpeedRef.current = THREE.MathUtils.damp(
      currentSpeedRef.current,
      rotationSpeed,
      4,
      delta,
    );

    wobbleTimeRef.current += delta;
    group.rotation.y += currentSpeedRef.current * delta;

    const wobbleAmplitude = variant === 'stroke' ? 0.6 : 1;
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
  });

  return (
    <>
      <ambientLight intensity={1.12} />
      <directionalLight intensity={1.25} position={[3.2, 2.6, 4.4]} />
      <directionalLight intensity={0.68} position={[-3, -2, 2.4]} />
      <group ref={groupRef}>
        {model.cells.map((cell) => (
          <ThemeGlobeCell
            active={activeToken === cell.token}
            cell={cell}
            effectiveMode={effectiveMode}
            key={cell.token}
            onInspect={onInspect}
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
