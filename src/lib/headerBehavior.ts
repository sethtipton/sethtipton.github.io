import { getHeaderNavState } from './headerLayout';

const SITE_HEADER_SIGNATURE_COLLISION_CLASS =
  'site-header--signature-nav-colliding';
const SITE_HEADER_STACK_FALLBACK_QUERY = '(max-width: 36.99875rem)';
const SITE_HEADER_RESPONSIVE_GRID_QUERY = '(max-width: 47.99875rem)';
const STYLE_TRANSFER_CHANGE_EVENT = 'site-style-transfer:change';

type HeaderWindow = typeof window & {
  __siteHeaderStateBound?: boolean;
  __siteHeaderStateCleanup?: () => void;
};

function measureNaturalHeaderWidth(
  headerInner: HTMLElement,
  currentShellWidth: number | null,
) {
  const sandbox = document.createElement('div');
  const clone = headerInner.cloneNode(true) as HTMLElement;
  const clonePrimary = clone.querySelector<HTMLElement>(
    '.site-header__primary',
  );
  const cloneStyleTransfer = clone.querySelector<HTMLElement>(
    '.site-header__style-transfer',
  );
  const cloneShell =
    cloneStyleTransfer?.querySelector<HTMLElement>('.style-transfer') ?? null;
  const clonePanel =
    cloneStyleTransfer?.querySelector<HTMLElement>('.style-transfer__panel') ??
    null;
  const cloneLinks = clone.querySelector<HTMLElement>('.site-header__links');

  sandbox.setAttribute('aria-hidden', 'true');
  sandbox.style.position = 'absolute';
  sandbox.style.top = '0';
  sandbox.style.left = '-9999px';
  sandbox.style.visibility = 'hidden';
  sandbox.style.pointerEvents = 'none';
  sandbox.style.width = 'max-content';
  sandbox.style.maxWidth = 'none';
  sandbox.style.contain = 'layout';

  clone.style.display = 'flex';
  clone.style.width = 'max-content';
  clone.style.maxWidth = 'none';
  clone.style.flexDirection = 'row';
  clone.style.flexWrap = 'nowrap';
  clone.style.justifyContent = 'flex-start';
  clone.style.alignItems = 'center';

  clonePrimary?.style.setProperty('margin-inline-start', 'auto');
  cloneLinks?.style.setProperty('flex-wrap', 'nowrap');
  cloneLinks?.style.setProperty('flex-direction', 'row');
  cloneStyleTransfer?.style.setProperty('flex', '0 0 auto');
  cloneStyleTransfer?.style.setProperty('width', 'max-content');

  if (currentShellWidth && currentShellWidth > 0) {
    cloneStyleTransfer?.style.setProperty('width', `${currentShellWidth}px`);
    cloneShell?.style.setProperty('width', `${currentShellWidth}px`);
    cloneShell?.style.setProperty('min-width', `${currentShellWidth}px`);
    cloneShell?.style.setProperty('max-width', `${currentShellWidth}px`);
  } else {
    cloneShell?.style.setProperty('width', 'max-content');
    cloneShell?.style.setProperty('max-width', 'none');
  }

  clonePanel?.style.setProperty('display', 'none');

  sandbox.append(clone);
  document.body.append(sandbox);

  const width = Math.ceil(clone.getBoundingClientRect().width);

  sandbox.remove();

  return width;
}

export function initializeSiteHeaderState() {
  const headerWindow = window as HeaderWindow;

  headerWindow.__siteHeaderStateCleanup?.();

  const header = document.querySelector<HTMLElement>('[data-site-header]');

  if (!header) {
    return;
  }

  const root = document.documentElement;
  const headerInner = header.querySelector<HTMLElement>('.site-header__inner');
  const headerPrimary = header.querySelector<HTMLElement>(
    '.site-header__primary',
  );
  const headerLinks = header.querySelector<HTMLElement>('.site-header__links');
  const headerStyleTransfer = header.querySelector<HTMLElement>(
    '.site-header__style-transfer',
  );
  const styleTransferShell =
    headerStyleTransfer?.querySelector<HTMLElement>('.style-transfer') ?? null;
  const styleTransferLauncherMeasure =
    headerStyleTransfer?.querySelector<HTMLElement>(
      '.style-transfer__launcher--measure',
    ) ?? null;
  const brand = header.querySelector<HTMLElement>('.site-brand');
  let frame = 0;

  const syncHeaderState = () => {
    if (frame) {
      cancelAnimationFrame(frame);
    }

    frame = requestAnimationFrame(() => {
      frame = 0;

      const openStyleTransferPanel = header.querySelector<HTMLElement>(
        '.style-transfer__panel[data-open="true"]',
      );
      const openPanelStyle = openStyleTransferPanel
        ? window.getComputedStyle(openStyleTransferPanel)
        : null;
      const isPanelInHeaderFlow =
        openPanelStyle != null &&
        openPanelStyle.position !== 'absolute' &&
        openPanelStyle.position !== 'fixed';
      const measuredHeaderHeight = Math.ceil(
        header.getBoundingClientRect().height,
      );
      const measuredPanelHeight =
        openStyleTransferPanel && isPanelInHeaderFlow
          ? Math.ceil(openStyleTransferPanel.getBoundingClientRect().height)
          : 0;

      root.style.setProperty(
        '--site-header-height',
        `${measuredHeaderHeight}px`,
      );
      root.style.setProperty(
        '--site-header-shell-height',
        `${Math.max(0, measuredHeaderHeight - measuredPanelHeight)}px`,
      );

      if (!headerInner || !headerPrimary) {
        header.classList.remove(SITE_HEADER_SIGNATURE_COLLISION_CLASS);
        return;
      }

      const currentCompressed = header.classList.contains(
        SITE_HEADER_SIGNATURE_COLLISION_CLASS,
      );
      const isResponsiveStackFallback = window.matchMedia(
        SITE_HEADER_STACK_FALLBACK_QUERY,
      ).matches;
      const isResponsiveGridLayout = window.matchMedia(
        SITE_HEADER_RESPONSIVE_GRID_QUERY,
      ).matches;
      const availableHeaderWidth = Math.ceil(
        headerInner.getBoundingClientRect().width,
      );
      const currentShellWidth = styleTransferShell
        ? Math.ceil(styleTransferShell.getBoundingClientRect().width)
        : null;
      const naturalHeaderWidth =
        headerLinks && styleTransferLauncherMeasure
          ? measureNaturalHeaderWidth(headerInner, currentShellWidth)
          : 0;
      const { signatureNavColliding } = getHeaderNavState({
        availableHeaderWidth,
        currentCompressed,
        isResponsiveStackFallback,
        isResponsiveGridLayout,
        naturalHeaderWidth,
      });

      header.classList.toggle(
        SITE_HEADER_SIGNATURE_COLLISION_CLASS,
        signatureNavColliding,
      );
    });
  };

  syncHeaderState();

  const resizeObserver =
    typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
          syncHeaderState();
        })
      : null;

  [
    header,
    headerInner,
    headerPrimary,
    headerLinks,
    headerStyleTransfer,
    styleTransferShell,
    styleTransferLauncherMeasure,
    brand,
  ].forEach((node) => {
    if (node) {
      resizeObserver?.observe(node);
    }
  });

  window.addEventListener('load', syncHeaderState, {
    once: true,
  });
  window.addEventListener('resize', syncHeaderState);
  window.addEventListener(STYLE_TRANSFER_CHANGE_EVENT, syncHeaderState);
  header.addEventListener('transitionend', syncHeaderState);

  document.fonts?.ready
    .then(() => {
      syncHeaderState();
    })
    .catch(() => {
      // Ignore font loading failures and keep the latest measured state.
    });

  headerWindow.__siteHeaderStateCleanup = () => {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    resizeObserver?.disconnect();
    window.removeEventListener('resize', syncHeaderState);
    window.removeEventListener(STYLE_TRANSFER_CHANGE_EVENT, syncHeaderState);
    header.removeEventListener('transitionend', syncHeaderState);
  };

  if (!headerWindow.__siteHeaderStateBound) {
    document.addEventListener('astro:page-load', initializeSiteHeaderState);
    headerWindow.__siteHeaderStateBound = true;
  }
}
