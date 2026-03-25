import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearStoredStyleTransferDiagnostics,
  getStoredStyleTransferDiagnostics,
  initializeStyleTransferDiagnostics,
  recordStyleTransferDiagnostic,
  STYLE_TRANSFER_DIAGNOSTIC_EVENT,
} from '../lib/style-transfer/diagnostics';

describe('style transfer diagnostics', () => {
  beforeEach(() => {
    clearStoredStyleTransferDiagnostics();
    delete window.__siteStyleTransferDiagnostics;
    vi.restoreAllMocks();
  });

  it('records diagnostics without writing them to the console', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const consoleWarn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const events: CustomEvent[] = [];

    window.addEventListener(STYLE_TRANSFER_DIAGNOSTIC_EVENT, (event) => {
      events.push((event as CustomEvent).detail);
    });

    initializeStyleTransferDiagnostics();

    recordStyleTransferDiagnostic({
      detail: new Error('boom'),
      level: 'error',
      message: 'Theme remix failed.',
      source: 'prompt-submit',
    });

    expect(window.__siteStyleTransferDiagnostics?.getEntries()).toHaveLength(1);
    expect(getStoredStyleTransferDiagnostics()).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('can clear stored diagnostics', () => {
    recordStyleTransferDiagnostic({
      level: 'warning',
      message: 'Theme globe failed to load.',
      source: 'theme-globe',
    });

    clearStoredStyleTransferDiagnostics();

    expect(getStoredStyleTransferDiagnostics()).toEqual([]);
  });
});
