import { describe, expect, it } from 'vitest';

import { getHeaderNavState } from '../lib/headerLayout';

describe('getHeaderNavState', () => {
  it('compresses the header when the natural nav width exceeds available space', () => {
    const state = getHeaderNavState({
      availableHeaderWidth: 520,
      currentCompressed: false,
      isResponsiveStackFallback: false,
      isResponsiveGridLayout: false,
      naturalHeaderWidth: 560,
    });

    expect(state).toEqual({
      signatureNavColliding: true,
    });
  });

  it('stays compressed until there is extra room beyond the exit buffer', () => {
    const state = getHeaderNavState({
      availableHeaderWidth: 520,
      currentCompressed: true,
      isResponsiveStackFallback: false,
      isResponsiveGridLayout: false,
      naturalHeaderWidth: 505,
    });

    expect(state).toEqual({
      signatureNavColliding: true,
    });
  });

  it('releases the compressed layout once there is enough free space', () => {
    const state = getHeaderNavState({
      availableHeaderWidth: 520,
      currentCompressed: true,
      isResponsiveStackFallback: false,
      isResponsiveGridLayout: false,
      naturalHeaderWidth: 494,
    });

    expect(state).toEqual({
      signatureNavColliding: false,
    });
  });

  it('disables the pressure state in responsive fallback layouts', () => {
    const state = getHeaderNavState({
      availableHeaderWidth: 320,
      currentCompressed: true,
      isResponsiveStackFallback: false,
      isResponsiveGridLayout: true,
      naturalHeaderWidth: 560,
    });

    expect(state).toEqual({
      signatureNavColliding: false,
    });
  });

  it('disables the pressure state in the real stacked fallback range', () => {
    const state = getHeaderNavState({
      availableHeaderWidth: 320,
      currentCompressed: true,
      isResponsiveStackFallback: true,
      isResponsiveGridLayout: false,
      naturalHeaderWidth: 560,
    });

    expect(state).toEqual({
      signatureNavColliding: false,
    });
  });
});
