import { useMemo, useState, type CSSProperties } from 'react';

import {
  formatStyleTransferColorRoleLabel,
  resolvePaletteForMode,
  type ResolvedStyleTransferPalette,
} from '../../lib/style-transfer/palette';
import type { StyleTransferThemeRecord } from '../../lib/style-transfer/schema';
import {
  themeVoronoiSlabModel,
  themeVoronoiSlabTokenOrder,
} from '../../lib/style-transfer/themeVoronoiSlab';

type ThemeVoronoiSlabProps = {
  effectiveMode: 'dark' | 'light';
  palette: StyleTransferThemeRecord['palette'];
};

export default function ThemeVoronoiSlab({
  effectiveMode,
  palette,
}: ThemeVoronoiSlabProps) {
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);
  const resolvedPalette = useMemo<ResolvedStyleTransferPalette>(
    () => resolvePaletteForMode(palette, effectiveMode),
    [effectiveMode, palette],
  );

  return (
    <section className="style-transfer__theme-slab-preview">
      <div className="style-transfer__theme-slab-layout">
        <ul className="style-transfer__theme-slab-list">
          {themeVoronoiSlabTokenOrder.map((token) => {
            const isActive = hoveredToken === token;

            return (
              <li
                key={token}
                className={`style-transfer__theme-slab-list-item${
                  isActive
                    ? ' style-transfer__theme-slab-list-item--active'
                    : ''
                }`}
                onMouseEnter={() => {
                  setHoveredToken(token);
                }}
                onMouseLeave={() => {
                  setHoveredToken((current) =>
                    current === token ? null : current,
                  );
                }}
              >
                <span
                  className="style-transfer__theme-slab-swatch"
                  aria-hidden="true"
                  style={{ backgroundColor: resolvedPalette[token] }}
                />
                <span className="style-transfer__theme-slab-list-copy">
                  <span className="style-transfer__theme-slab-token">
                    {formatStyleTransferColorRoleLabel(token)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="style-transfer__theme-slab-stage" aria-hidden="true">
          <div
            className="style-transfer__theme-slab-shell"
            style={
              {
                '--theme-slab-height': `${themeVoronoiSlabModel.height}`,
                '--theme-slab-radius': `${themeVoronoiSlabModel.silhouetteRadius}px`,
                '--theme-slab-width': `${themeVoronoiSlabModel.width}`,
              } as CSSProperties
            }
          >
            <span className="style-transfer__theme-slab-base" />
            {themeVoronoiSlabModel.cells.map((cell, index) => {
              const isActive = hoveredToken === cell.token;

              return (
                <div
                  key={cell.key}
                  className={`style-transfer__theme-slab-panel${
                    isActive ? ' style-transfer__theme-slab-panel--active' : ''
                  }`}
                  style={
                    {
                      '--theme-slab-color': resolvedPalette[cell.token],
                      '--theme-slab-clip': cell.clipPath,
                      '--theme-slab-depth-index': `${index}`,
                    } as CSSProperties
                  }
                  onMouseEnter={() => {
                    setHoveredToken(cell.token);
                  }}
                  onMouseLeave={() => {
                    setHoveredToken((current) =>
                      current === cell.token ? null : current,
                    );
                  }}
                >
                  <span className="style-transfer__theme-slab-panel-sheen" />
                </div>
              );
            })}
            <svg
              className="style-transfer__theme-slab-seams"
              viewBox={`0 0 ${themeVoronoiSlabModel.width} ${themeVoronoiSlabModel.height}`}
              preserveAspectRatio="none"
            >
              {themeVoronoiSlabModel.cells.map((cell) => (
                <path key={`${cell.key}-seam`} d={cell.path} />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
