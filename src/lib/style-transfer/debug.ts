const STYLE_TRANSFER_DEBUG_QUERY_PARAM = 'style-transfer-debug';

function isEnabledValue(value: string | null) {
  return (
    value !== null &&
    (value === '' ||
      value.toLowerCase() === '1' ||
      value.toLowerCase() === 'true' ||
      value.toLowerCase() === 'on')
  );
}

export function isStyleTransferDebugEnabled() {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return false;
  }

  return isEnabledValue(
    new URL(window.location.href).searchParams.get(
      STYLE_TRANSFER_DEBUG_QUERY_PARAM,
    ),
  );
}
