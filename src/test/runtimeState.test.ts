import { describe, expect, it } from 'vitest';

import { resolveStyleTransferSyncTarget } from '../lib/style-transfer/runtimeState';
import type { StoredStyleTransferApplication } from '../lib/style-transfer/controller';
import { styleTransferPresetApplications } from '../lib/style-transfer/presets';

const presetApplication =
  styleTransferPresetApplications['toasted-marshmallow'];

const customApplication: StoredStyleTransferApplication = {
  ...presetApplication,
  id: 'custom-theme',
  name: 'Custom Theme',
  prompt: 'custom theme prompt',
  source: 'prompt',
};

describe('resolveStyleTransferSyncTarget', () => {
  it('prefers the URL preset over stored state', () => {
    expect(
      resolveStyleTransferSyncTarget({
        currentStyleApplication: presetApplication,
        storedPresetId: 'toasted-marshmallow',
        urlPresetId: 'chromatic-minimal',
      }),
    ).toEqual({
      type: 'preset',
      presetId: 'chromatic-minimal',
    });
  });

  it('prefers the stored preset before current runtime state', () => {
    expect(
      resolveStyleTransferSyncTarget({
        currentStyleApplication: presetApplication,
        storedPresetId: 'toasted-marshmallow',
        urlPresetId: null,
      }),
    ).toEqual({
      type: 'preset',
      presetId: 'toasted-marshmallow',
    });
  });

  it('returns the current runtime state when there is no URL or stored preset', () => {
    expect(
      resolveStyleTransferSyncTarget({
        currentStyleApplication: customApplication,
        storedPresetId: null,
        urlPresetId: null,
      }),
    ).toEqual({
      type: 'current',
      application: customApplication,
    });
  });

  it('ignores stale stored custom state when nothing is currently active', () => {
    expect(
      resolveStyleTransferSyncTarget({
        currentStyleApplication: null,
        storedPresetId: null,
        urlPresetId: null,
      }),
    ).toEqual({
      type: 'default',
    });
  });

  it('returns the default target when nothing is active', () => {
    expect(
      resolveStyleTransferSyncTarget({
        currentStyleApplication: null,
        storedPresetId: null,
        urlPresetId: null,
      }),
    ).toEqual({
      type: 'default',
    });
  });
});
