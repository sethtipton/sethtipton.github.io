export function getHeaderNavState({
  availableHeaderWidth,
  currentCompressed,
  isResponsiveStackFallback,
  isResponsiveGridLayout,
  naturalHeaderWidth,
}: {
  availableHeaderWidth: number;
  currentCompressed: boolean;
  isResponsiveStackFallback: boolean;
  isResponsiveGridLayout: boolean;
  naturalHeaderWidth: number;
}) {
  if (
    isResponsiveStackFallback ||
    isResponsiveGridLayout ||
    availableHeaderWidth <= 0 ||
    naturalHeaderWidth <= 0
  ) {
    return {
      signatureNavColliding: false,
    };
  }

  // Keep a little extra space before exiting the compressed layout so
  // subpixel changes and animated launcher width do not make the header flap.
  const exitBuffer = 24;
  const shouldCompress = currentCompressed
    ? naturalHeaderWidth > availableHeaderWidth - exitBuffer
    : naturalHeaderWidth > availableHeaderWidth;

  return {
    signatureNavColliding: shouldCompress,
  };
}
