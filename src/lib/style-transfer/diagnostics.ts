export const STYLE_TRANSFER_DIAGNOSTIC_EVENT = 'site-style-transfer:diagnostic';

const diagnosticsStorageKey = 'site-style-transfer-diagnostics-v1';
const maxDiagnosticEntries = 15;

export type StyleTransferDiagnosticLevel = 'error' | 'warning';

export type StyleTransferDiagnosticEntry = {
  context: string | null;
  level: StyleTransferDiagnosticLevel;
  message: string;
  source: string;
  timestamp: string;
};

type StyleTransferDiagnosticsApi = {
  clear: () => void;
  getEntries: () => StyleTransferDiagnosticEntry[];
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function normalizeDiagnosticEntries(
  value: unknown,
): StyleTransferDiagnosticEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is StyleTransferDiagnosticEntry => {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    const candidate = entry as Record<string, unknown>;

    return (
      (candidate.level === 'error' || candidate.level === 'warning') &&
      typeof candidate.message === 'string' &&
      typeof candidate.source === 'string' &&
      typeof candidate.timestamp === 'string' &&
      (candidate.context === null || typeof candidate.context === 'string')
    );
  });
}

function serializeDiagnosticContext(detail: unknown) {
  if (typeof detail === 'undefined') {
    return null;
  }

  if (detail instanceof Error) {
    return `${detail.name}: ${detail.message}`;
  }

  if (typeof detail === 'string') {
    return detail;
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

export function getStoredStyleTransferDiagnostics() {
  if (!isBrowser()) {
    return [];
  }

  try {
    const rawValue = window.sessionStorage.getItem(diagnosticsStorageKey);

    if (!rawValue) {
      return [];
    }

    return normalizeDiagnosticEntries(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

function setStoredStyleTransferDiagnostics(
  entries: StyleTransferDiagnosticEntry[],
) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      diagnosticsStorageKey,
      JSON.stringify(entries),
    );
  } catch {
    // Ignore storage failures.
  }
}

export function clearStoredStyleTransferDiagnostics() {
  if (!isBrowser()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(diagnosticsStorageKey);
  } catch {
    // Ignore storage failures.
  }
}

export function initializeStyleTransferDiagnostics() {
  if (!isBrowser() || window.__siteStyleTransferDiagnostics) {
    return;
  }

  window.__siteStyleTransferDiagnostics = {
    clear: clearStoredStyleTransferDiagnostics,
    getEntries: getStoredStyleTransferDiagnostics,
  } satisfies StyleTransferDiagnosticsApi;
}

export function recordStyleTransferDiagnostic({
  detail,
  level,
  message,
  source,
}: {
  detail?: unknown;
  level: StyleTransferDiagnosticLevel;
  message: string;
  source: string;
}) {
  const entry: StyleTransferDiagnosticEntry = {
    context: serializeDiagnosticContext(detail),
    level,
    message,
    source,
    timestamp: new Date().toISOString(),
  };

  if (!isBrowser()) {
    return entry;
  }

  initializeStyleTransferDiagnostics();

  const nextEntries = [...getStoredStyleTransferDiagnostics(), entry].slice(
    -maxDiagnosticEntries,
  );

  setStoredStyleTransferDiagnostics(nextEntries);

  window.dispatchEvent(
    new CustomEvent(STYLE_TRANSFER_DIAGNOSTIC_EVENT, {
      detail: entry,
    }),
  );

  return entry;
}
