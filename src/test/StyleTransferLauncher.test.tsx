import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import StyleTransferLauncher from '../components/react/StyleTransferLauncher';

const controllerMocks = vi.hoisted(() => ({
  getStyleTransferControllerState: vi.fn(),
  subscribeToStyleTransferChanges: vi.fn(),
}));

vi.mock('../lib/style-transfer/controller', async () => {
  const actual = await vi.importActual('../lib/style-transfer/controller');

  return {
    ...actual,
    getStyleTransferControllerState:
      controllerMocks.getStyleTransferControllerState,
    subscribeToStyleTransferChanges:
      controllerMocks.subscribeToStyleTransferChanges,
  };
});

describe('StyleTransferLauncher', () => {
  beforeEach(() => {
    controllerMocks.getStyleTransferControllerState.mockReturnValue({
      id: null,
      mode: 'auto',
      name: 'Original Canvas',
      presetId: null,
      prompt: null,
      source: 'default',
    });
    controllerMocks.subscribeToStyleTransferChanges.mockImplementation(
      () => () => {},
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the prompt panel closed until the launcher is activated', async () => {
    render(<StyleTransferLauncher />);

    expect(
      screen.queryByRole('region', { name: /theme explorer/i }),
    ).not.toBeInTheDocument();

    const launcher = screen.getByRole('button', {
      name: /default theme/i,
    });

    expect(launcher).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(launcher);

    expect(
      await screen.findByRole(
        'region',
        { name: /theme explorer/i },
        {
          timeout: 3000,
        },
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByLabelText(/remix the theme/i, undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument();
  });

  it('shows the source-aware launcher label', () => {
    controllerMocks.getStyleTransferControllerState.mockReturnValue({
      id: 'toasted-marshmallow',
      mode: 'auto',
      name: 'Toasted Marshmallow',
      presetId: 'toasted-marshmallow',
      prompt:
        'Toasted Marshmallow — stone, sand, paper, and bronze-leaning restraint.',
      source: 'preset',
    });

    const { unmount } = render(<StyleTransferLauncher />);

    expect(
      screen.getByRole('button', { name: /preset theme/i }),
    ).toBeInTheDocument();

    unmount();

    controllerMocks.getStyleTransferControllerState.mockReturnValue({
      id: 'glacial-editorial',
      mode: 'auto',
      name: 'Glacial Editorial',
      presetId: null,
      prompt: 'glacial editorial with cobalt accents',
      source: 'prompt',
    });

    render(<StyleTransferLauncher />);

    expect(
      screen.getByRole('button', { name: /generated theme/i }),
    ).toBeInTheDocument();
  });
});
