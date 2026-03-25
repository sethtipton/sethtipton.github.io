import {
  Component,
  Suspense,
  lazy,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import type {
  ThemeGlobeInput,
  ThemeGlobeRenderVariant,
} from '../../lib/style-transfer/themeGlobe';
import { isStyleTransferDebugEnabled } from '../../lib/style-transfer/debug';
import { recordStyleTransferDiagnostic } from '../../lib/style-transfer/diagnostics';

const ThemeGlobe = lazy(() => import('./ThemeGlobe'));

const themeGlobeFallbackMessage =
  'Theme globe unavailable in this dev session. Reload after the dev server finishes re-optimizing dependencies.';

type ThemeGlobeSurfaceProps = ThemeGlobeInput & {
  cameraPositionZ?: number;
  dpr?: number | [number, number];
  fallbackAppearance?: 'dot' | 'empty';
  fallbackMessage?: ReactNode;
  showOutlines?: boolean;
  variant?: ThemeGlobeRenderVariant;
};

type ThemeGlobeFallbackProps = {
  appearance?: 'dot' | 'empty';
  message?: ReactNode;
  variant?: ThemeGlobeRenderVariant;
};

type ThemeGlobeErrorBoundaryProps = {
  children: ReactNode;
  fallbackAppearance?: 'dot' | 'empty';
  fallbackMessage?: ReactNode;
  variant?: ThemeGlobeRenderVariant;
};

type ThemeGlobeErrorBoundaryState = {
  hasError: boolean;
};

function logDebugError(message: string, ...args: unknown[]) {
  if (!isStyleTransferDebugEnabled()) {
    return;
  }

  console.error(`[style-transfer] ${message}`, ...args);
}

export function ThemeGlobeFallback({
  appearance = 'dot',
  message,
  variant = 'filled',
}: ThemeGlobeFallbackProps) {
  return (
    <div
      className={`style-transfer__theme-globe style-transfer__theme-globe--${variant} style-transfer__theme-globe--loading`}
    >
      <div className="style-transfer__theme-globe-shell">
        <div
          className="style-transfer__theme-globe-viewport"
          aria-hidden="true"
        >
          <div className="style-transfer__theme-globe-fallback">
            {appearance === 'dot' ? (
              <span className="style-transfer__theme-globe-fallback-dot" />
            ) : null}
          </div>
        </div>
        {message ? (
          <p className="style-transfer__theme-globe-fallback-message">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

class ThemeGlobeErrorBoundary extends Component<
  ThemeGlobeErrorBoundaryProps,
  ThemeGlobeErrorBoundaryState
> {
  override state: ThemeGlobeErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  override componentDidCatch(error: unknown) {
    logDebugError('theme globe failed to load', error);
    recordStyleTransferDiagnostic({
      detail: error,
      level: 'warning',
      message: 'Theme globe failed to load.',
      source: 'theme-globe',
    });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <ThemeGlobeFallback
          appearance={this.props.fallbackAppearance}
          message={this.props.fallbackMessage ?? themeGlobeFallbackMessage}
          variant={this.props.variant}
        />
      );
    }

    return this.props.children;
  }
}

function subscribeToMount() {
  return () => {};
}

function getClientMountState() {
  return true;
}

function getServerMountState() {
  return false;
}

export default function ThemeGlobeSurface({
  fallbackAppearance = 'dot',
  fallbackMessage,
  variant = 'filled',
  ...globeProps
}: ThemeGlobeSurfaceProps) {
  const hasMounted = useSyncExternalStore(
    subscribeToMount,
    getClientMountState,
    getServerMountState,
  );

  if (!hasMounted) {
    return (
      <ThemeGlobeFallback
        appearance={fallbackAppearance}
        message={fallbackMessage}
        variant={variant}
      />
    );
  }

  return (
    <ThemeGlobeErrorBoundary
      fallbackAppearance={fallbackAppearance}
      fallbackMessage={fallbackMessage}
      variant={variant}
    >
      <Suspense
        fallback={
          <ThemeGlobeFallback
            appearance={fallbackAppearance}
            variant={variant}
          />
        }
      >
        <ThemeGlobe
          {...globeProps}
          fallbackAppearance={fallbackAppearance}
          variant={variant}
        />
      </Suspense>
    </ThemeGlobeErrorBoundary>
  );
}
