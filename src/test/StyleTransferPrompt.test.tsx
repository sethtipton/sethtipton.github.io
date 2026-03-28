import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import StyleTransferPrompt from '../components/react/StyleTransferPrompt';
import { createDefaultStyleTransferArtworkPreview } from '../lib/style-transfer/artwork';
import type {
  ResolvedStyleTransferArtworkState,
  StyleTransferControllerState,
} from '../lib/style-transfer/controller';
import { deriveStyleTransferApplication } from '../lib/style-transfer/deriveTheme';
import { styleTransferPresetSummaries } from '../lib/style-transfer/presets';
import {
  createCustomStyleTransferThemeRecord,
  styleTransferModelOutputSchema,
} from '../lib/style-transfer/schema';

const launcherThemeLabelPattern = /(default|preset|generated) theme/i;

function createPassingPromptThemePayload() {
  return styleTransferModelOutputSchema.parse({
    styleName: 'Y2K Futurism',
    palette: {
      background: { light: '#f4f6ff', dark: '#0d1023' },
      backgroundAlt: { light: '#f7f9ff', dark: '#11152e' },
      surface: { light: '#fcfdff', dark: '#171c3d' },
      surfaceStrong: { light: '#fcfdff', dark: '#5d6077' },
      surfaceTint: { light: '#d5daff', dark: '#343c6c' },
      surfacePaper: { light: '#f6f8ff', dark: '#11152d' },
      text: { light: '#1f2440', dark: '#f6f7ff' },
      muted: { light: '#1f2440', dark: '#f6f7ff' },
      accent: { light: '#5b6dff', dark: '#8ea2ff' },
      accentStrong: { light: '#ff4fd8', dark: '#ff98ea' },
      focus: { light: '#2563eb', dark: '#fde68a' },
    },
    fonts: {
      sans: 'neo-grotesk',
      serif: 'editorial',
    },
    density: 'balanced',
    surfaceStyle: 'glow',
    buttonStyle: 'pill',
    pattern: 'grid',
    motion: 'snappy',
  });
}

const controllerMocks = vi.hoisted(() => ({
  applyGeneratedStyleTransferTheme: vi.fn(),
  applyStyleTransferApplication: vi.fn(),
  applyStyleTransferPreset: vi.fn(),
  getStyleTransferController: vi.fn(),
  getStyleTransferControllerState: vi.fn(),
  getStyleTransferGeneratedSummaries: vi.fn(),
  getStyleTransferPresetSummaries: vi.fn(),
  resetStyleTransferController: vi.fn(),
  resolveActiveStyleTransferArtwork: vi.fn(),
  setStyleTransferMode: vi.fn(),
  subscribeToStyleTransferChanges: vi.fn(),
}));

vi.mock('../lib/style-transfer/controller', () => ({
  DEFAULT_STYLE_TRANSFER_CONTROLLER_STATE: {
    id: null,
    mode: 'auto',
    name: 'Original Canvas',
    presetId: null,
    prompt: null,
    source: 'default',
  },
  STYLE_TRANSFER_PANEL_OPEN_DATASET_KEY: 'styleTransferPanelOpen',
  STYLE_TRANSFER_EVENT: 'site-style-transfer:change',
  ...controllerMocks,
}));

function createGeneratedThemeSummary() {
  const prompt = 'glacial editorial with cobalt accents';
  const payload = createPassingPromptThemePayload();
  const theme = createCustomStyleTransferThemeRecord(prompt, payload);

  return {
    application: deriveStyleTransferApplication(theme),
    artwork: createDefaultStyleTransferArtworkPreview(theme, {
      source: 'fallback',
    }),
    id: theme.id,
    name: theme.name,
    prompt,
  };
}

async function openPromptPanel(
  launcher = screen.getByRole('button', { name: launcherThemeLabelPattern }),
) {
  fireEvent.click(launcher);
  await screen.findByRole('region', { name: /theme explorer/i });

  return launcher;
}

describe('StyleTransferPrompt', () => {
  beforeEach(() => {
    controllerMocks.getStyleTransferController.mockReturnValue({
      applyApplication: vi.fn(),
    });
    controllerMocks.getStyleTransferControllerState.mockReturnValue({
      id: null,
      mode: 'auto',
      name: 'Original Canvas',
      presetId: null,
      prompt: null,
      source: 'default',
    });
    controllerMocks.getStyleTransferPresetSummaries.mockReturnValue([]);
    controllerMocks.getStyleTransferGeneratedSummaries.mockReturnValue([]);
    controllerMocks.resolveActiveStyleTransferArtwork.mockReturnValue({
      artwork: null,
      key: null,
    });
    controllerMocks.subscribeToStyleTransferChanges.mockImplementation(
      () => () => {},
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens as an inline disclosure', async () => {
    render(<StyleTransferPrompt />);

    await openPromptPanel();

    await waitFor(() => {
      expect(
        screen.getByLabelText(/give the portfolio this vibe/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('region', { name: /theme explorer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pick a theme, or type a vibe and see where it goes/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/enter a prompt to create a custom theme/i)).toBe(
      null,
    );

    fireEvent.change(screen.getByLabelText(/give the portfolio this vibe/i), {
      target: {
        value: 'Make it cinematic and moody.',
      },
    });

    expect(
      screen.getByText(/pick a theme, or type a vibe and see where it goes/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/enter a prompt to create a custom theme/i),
    ).not.toBeInTheDocument();
  });

  it('hides the intro copy after remix interaction, even after returning to default', async () => {
    controllerMocks.getStyleTransferPresetSummaries.mockReturnValue(
      styleTransferPresetSummaries,
    );

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    await waitFor(() => {
      expect(
        screen.getByText(/pick a theme, or type a vibe and see where it goes/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(
          `${styleTransferPresetSummaries[0]?.name} \\(Preset\\)`,
          'i',
        ),
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByText(
          /pick a theme, or type a vibe and see where it goes/i,
        ),
      ).not.toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /Original Canvas \(Default\)/i,
      }),
    );

    expect(
      screen.queryByText(/pick a theme, or type a vibe and see where it goes/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/enter a prompt to create a custom theme/i),
    ).not.toBeInTheDocument();
  });

  it('preserves the prompt text when switching back to the default theme', async () => {
    controllerMocks.getStyleTransferPresetSummaries.mockReturnValue(
      styleTransferPresetSummaries,
    );

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    const textarea = await screen.findByLabelText(
      /give the portfolio this vibe/i,
    );

    fireEvent.change(textarea, {
      target: {
        value: 'A clean, modern website with soft colors and generous spacing.',
      },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(
          `${styleTransferPresetSummaries[0]?.name} \\(Preset\\)`,
          'i',
        ),
      }),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /Original Canvas \(Default\)/i,
      }),
    );

    expect(textarea).toHaveValue(
      'A clean, modern website with soft colors and generous spacing.',
    );
  });

  it('closes on Escape and returns focus to the launcher', async () => {
    render(<StyleTransferPrompt />);

    const launcher = screen.getByRole('button', {
      name: /default theme/i,
    });
    await openPromptPanel(launcher);

    await waitFor(() => {
      expect(
        screen.getByLabelText(/give the portfolio this vibe/i),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(launcher).toHaveFocus();
    });
  });

  it('toggles the panel open and closed from the launcher button', async () => {
    render(<StyleTransferPrompt />);

    const launcher = screen.getByRole('button', {
      name: /default theme/i,
    });

    expect(launcher).toHaveAttribute('aria-expanded', 'false');

    await openPromptPanel(launcher);

    expect(launcher).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(launcher);

    await waitFor(() => {
      expect(launcher).toHaveAttribute('aria-expanded', 'false');
    });

    expect(
      screen.queryByRole('region', { name: /theme explorer/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the inline close glyph only while the launcher is open', async () => {
    render(<StyleTransferPrompt />);

    const launcher = screen.getByRole('button', {
      name: /default theme/i,
    });

    expect(
      launcher.querySelector('.style-transfer__launcher-close'),
    ).toBeNull();

    await openPromptPanel(launcher);

    expect(
      launcher.querySelector('.style-transfer__launcher-close'),
    ).toBeInTheDocument();

    fireEvent.click(launcher);

    await waitFor(() => {
      expect(
        launcher.querySelector('.style-transfer__launcher-close'),
      ).toBeNull();
    });
  });

  it('clears the explicit shell width after closing so the launcher returns to its natural width', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const rect = {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          bottom: 40,
          height: 40,
          toJSON: () => ({}),
        };

        if (this.classList.contains('style-transfer__launcher--measure')) {
          const root = this.closest('.style-transfer');
          const width =
            root?.getAttribute('data-expanded') === 'true' ? 345 : 269;

          return {
            ...rect,
            right: width,
            width,
          } as DOMRect;
        }

        if (this.style.inlineSize === 'var(--style-transfer-panel-width)') {
          return {
            ...rect,
            right: 345,
            width: 345,
          } as DOMRect;
        }

        return {
          ...rect,
          right: 0,
          width: 0,
        } as DOMRect;
      });

    try {
      render(<StyleTransferPrompt />);

      const shell = document.querySelector(
        '.style-transfer',
      ) as HTMLElement | null;
      const launcher = screen.getByRole('button', {
        name: /default theme/i,
      });

      expect(shell).toBeTruthy();
      expect(
        shell?.style.getPropertyValue('--style-transfer-shell-width'),
      ).toBe('');

      await openPromptPanel(launcher);

      await waitFor(() => {
        expect(
          shell?.style.getPropertyValue('--style-transfer-shell-width'),
        ).toBe('345px');
      });

      fireEvent.click(launcher);

      await waitFor(() => {
        expect(launcher).toHaveAttribute('aria-expanded', 'false');
        expect(
          shell?.style.getPropertyValue('--style-transfer-shell-width'),
        ).toBe('');
      });
    } finally {
      requestAnimationFrameSpy.mockRestore();
      getBoundingClientRectSpy.mockRestore();
    }
  });

  it('recalculates the explicit shell width while open when the viewport changes', async () => {
    let expandedWidth = 345;
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const rect = {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          bottom: 40,
          height: 40,
          toJSON: () => ({}),
        };

        if (this.classList.contains('style-transfer__launcher--measure')) {
          const root = this.closest('.style-transfer');
          const width =
            root?.getAttribute('data-expanded') === 'true' ? 345 : 269;

          return {
            ...rect,
            right: width,
            width,
          } as DOMRect;
        }

        if (this.style.inlineSize === 'var(--style-transfer-panel-width)') {
          return {
            ...rect,
            right: expandedWidth,
            width: expandedWidth,
          } as DOMRect;
        }

        return {
          ...rect,
          right: 0,
          width: 0,
        } as DOMRect;
      });

    try {
      render(<StyleTransferPrompt />);

      const shell = document.querySelector(
        '.style-transfer',
      ) as HTMLElement | null;
      const launcher = screen.getByRole('button', {
        name: /default theme/i,
      });

      await openPromptPanel(launcher);

      await waitFor(() => {
        expect(
          shell?.style.getPropertyValue('--style-transfer-shell-width'),
        ).toBe('345px');
      });

      expandedWidth = 280;
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(
          shell?.style.getPropertyValue('--style-transfer-shell-width'),
        ).toBe('280px');
      });
    } finally {
      requestAnimationFrameSpy.mockRestore();
      getBoundingClientRectSpy.mockRestore();
    }
  });

  it('shows the launcher label for default, preset, and generated themes', () => {
    controllerMocks.getStyleTransferControllerState.mockReturnValue({
      id: null,
      mode: 'auto',
      name: 'Original Canvas',
      presetId: null,
      prompt: null,
      source: 'default',
    });

    const { unmount } = render(<StyleTransferPrompt />);

    expect(
      screen.getByRole('button', { name: /default theme/i }),
    ).toBeInTheDocument();

    unmount();

    controllerMocks.getStyleTransferControllerState.mockReturnValue({
      id: 'toasted-marshmallow',
      mode: 'auto',
      name: 'Toasted Marshmallow',
      presetId: 'toasted-marshmallow',
      prompt:
        'Toasted Marshmallow — stone, sand, paper, and bronze-leaning restraint.',
      source: 'preset',
    });

    const presetArtwork = styleTransferPresetSummaries.find(
      (entry) => entry.id === 'toasted-marshmallow',
    )?.artwork;

    controllerMocks.resolveActiveStyleTransferArtwork.mockReturnValue({
      artwork: presetArtwork ?? null,
      key: presetArtwork ? 'preset:toasted-marshmallow' : null,
    });

    const presetRender = render(<StyleTransferPrompt />);

    expect(
      screen.getByRole('button', { name: /preset theme/i }),
    ).toBeInTheDocument();

    presetRender.unmount();

    const generatedTheme = createGeneratedThemeSummary();

    controllerMocks.getStyleTransferControllerState.mockReturnValue({
      id: generatedTheme.id,
      mode: 'auto',
      name: generatedTheme.name,
      presetId: null,
      prompt: generatedTheme.prompt,
      source: 'prompt',
    });
    controllerMocks.getStyleTransferGeneratedSummaries.mockReturnValue([
      generatedTheme,
    ]);
    controllerMocks.resolveActiveStyleTransferArtwork.mockReturnValue({
      artwork: generatedTheme.artwork,
      key: `prompt:${generatedTheme.id}`,
    });

    render(<StyleTransferPrompt />);

    expect(
      screen.getByRole('button', { name: /generated theme/i }),
    ).toBeInTheDocument();
  });

  it('renders the trace inspector for an active preset', async () => {
    const preset = styleTransferPresetSummaries.find(
      (entry) => entry.id === 'toasted-marshmallow',
    );

    expect(preset).toBeTruthy();

    controllerMocks.getStyleTransferControllerState.mockReturnValue({
      id: preset!.id,
      mode: 'auto',
      name: preset!.name,
      presetId: preset!.id,
      prompt: preset!.prompt,
      source: 'preset',
    });
    controllerMocks.getStyleTransferPresetSummaries.mockReturnValue(
      styleTransferPresetSummaries,
    );
    controllerMocks.resolveActiveStyleTransferArtwork.mockReturnValue({
      artwork: preset!.artwork,
      key: `preset:${preset!.id}`,
    });

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    expect(screen.getByText(/^preset brief$/i)).toBeInTheDocument();
  });

  it('opens the corresponding trace card when a stage step is clicked', async () => {
    const preset = styleTransferPresetSummaries.find(
      (entry) => entry.id === 'toasted-marshmallow',
    );

    expect(preset).toBeTruthy();

    controllerMocks.getStyleTransferControllerState.mockReturnValue({
      id: preset!.id,
      mode: 'auto',
      name: preset!.name,
      presetId: preset!.id,
      prompt: preset!.prompt,
      source: 'preset',
    });
    controllerMocks.getStyleTransferPresetSummaries.mockReturnValue(
      styleTransferPresetSummaries,
    );
    controllerMocks.resolveActiveStyleTransferArtwork.mockReturnValue({
      artwork: preset!.artwork,
      key: `preset:${preset!.id}`,
    });

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    const presetBriefSummary = screen
      .getByText(/^preset brief$/i)
      .closest('summary');
    const structuredPresetSummary = screen
      .getByText(/^structured preset record$/i)
      .closest('summary');

    expect(presetBriefSummary).toBeTruthy();
    expect(structuredPresetSummary).toBeTruthy();

    const presetBriefAccordion = presetBriefSummary?.closest('details');
    const structuredPresetAccordion =
      structuredPresetSummary?.closest('details');

    expect(presetBriefAccordion).not.toHaveAttribute('open');
    expect(structuredPresetAccordion).not.toHaveAttribute('open');

    fireEvent.click(structuredPresetSummary!);

    expect(structuredPresetAccordion).toHaveAttribute('open');
  });

  it('submits the prompt form on Enter but not on Shift+Enter', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () =>
        JSON.stringify({ theme: createPassingPromptThemePayload() }),
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    const textarea = await screen.findByLabelText(
      /give the portfolio this vibe/i,
    );

    fireEvent.change(textarea, {
      target: {
        value: 'Glacial editorial with cobalt accents',
      },
    });

    fireEvent.keyDown(textarea, {
      key: 'Enter',
      shiftKey: true,
    });

    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, {
      key: 'Enter',
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it('falls back when requestSubmit is unavailable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () =>
        JSON.stringify({ theme: createPassingPromptThemePayload() }),
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    const textarea = await screen.findByLabelText(
      /give the portfolio this vibe/i,
    );

    fireEvent.change(textarea, {
      target: {
        value: 'Glacial editorial with cobalt accents',
      },
    });

    const form = textarea.closest('form');

    expect(form).toBeTruthy();

    Object.defineProperty(form!, 'requestSubmit', {
      configurable: true,
      value: undefined,
    });

    fireEvent.keyDown(textarea, {
      key: 'Enter',
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it('shows a loading placeholder tick while waiting for the remix API', async () => {
    let resolveFetch!: (value: {
      ok: boolean;
      status: number;
      statusText: string;
      text: () => Promise<string>;
    }) => void;

    const fetchMock = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    fireEvent.change(screen.getByLabelText(/give the portfolio this vibe/i), {
      target: {
        value: 'Glacial editorial with cobalt accents',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate remix/i }));

    await waitFor(() => {
      expect(screen.getByText(/making the remix/i)).toBeInTheDocument();
      expect(
        document.querySelector('.style-transfer__theme-tick--placeholder'),
      ).toBeTruthy();
    });

    resolveFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () =>
        JSON.stringify({ theme: createPassingPromptThemePayload() }),
    });

    await waitFor(() => {
      expect(
        document.querySelector('.style-transfer__theme-tick--placeholder'),
      ).toBeFalsy();
    });
  });

  it('retries once when the first valid remix is still too weak', async () => {
    const weakThemePayload = {
      styleName: 'Sunny Editorial',
      palette: {
        background: { light: '#f6fbff', dark: '#ffffff' },
        backgroundAlt: { light: '#ebf3f8', dark: '#ffffff' },
        surface: { light: '#ffffff', dark: '#000000' },
        surfaceStrong: { light: '#d7e3ec', dark: '#111111' },
        surfaceTint: { light: '#eef7fb', dark: '#181818' },
        surfacePaper: { light: '#fcfefc', dark: '#0d0d0d' },
        text: { light: '#132131', dark: '#777777' },
        muted: { light: '#5b6f84', dark: '#888888' },
        accent: { light: '#2f7aa2', dark: '#4f8bb2' },
        accentStrong: { light: '#1f5d82', dark: '#999999' },
        focus: { light: '#0f766e', dark: '#999999' },
      },
      fonts: {
        sans: 'neo-grotesk',
        serif: 'editorial',
      },
      density: 'balanced',
      surfaceStyle: 'glass',
      buttonStyle: 'outline',
      pattern: 'grid',
      motion: 'calm',
    };
    const strongThemePayload = createPassingPromptThemePayload();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ theme: weakThemePayload }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ theme: strongThemePayload }),
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    fireEvent.change(screen.getByLabelText(/give the portfolio this vibe/i), {
      target: {
        value: 'sunshine',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate remix/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(
      await screen.findByText(/after another pass for readability/i),
    ).toBeInTheDocument();
    expect(controllerMocks.applyStyleTransferApplication).toHaveBeenCalledTimes(
      1,
    );
  });

  it('applies the best readable attempt when the prompt cannot be expanded further', async () => {
    const weakThemePayload = {
      styleName: 'Sunny Editorial',
      palette: {
        background: { light: '#f6fbff', dark: '#ffffff' },
        backgroundAlt: { light: '#ebf3f8', dark: '#ffffff' },
        surface: { light: '#ffffff', dark: '#000000' },
        surfaceStrong: { light: '#d7e3ec', dark: '#111111' },
        surfaceTint: { light: '#eef7fb', dark: '#181818' },
        surfacePaper: { light: '#fcfefc', dark: '#0d0d0d' },
        text: { light: '#132131', dark: '#777777' },
        muted: { light: '#5b6f84', dark: '#888888' },
        accent: { light: '#2f7aa2', dark: '#4f8bb2' },
        accentStrong: { light: '#1f5d82', dark: '#999999' },
        focus: { light: '#0f766e', dark: '#999999' },
      },
      fonts: {
        sans: 'neo-grotesk',
        serif: 'editorial',
      },
      density: 'balanced',
      surfaceStyle: 'glass',
      buttonStyle: 'outline',
      pattern: 'grid',
      motion: 'calm',
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ theme: weakThemePayload }),
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    fireEvent.change(screen.getByLabelText(/give the portfolio this vibe/i), {
      target: {
        value: 'a'.repeat(400),
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate remix/i }));

    expect(
      await screen.findByText(
        /after some local tuning\. it passes, though the palette still leans soft\./i,
      ),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(controllerMocks.applyStyleTransferApplication).toHaveBeenCalledTimes(
      1,
    );
  });

  it('keeps the prompt notice visible when switching between light and dark modes', async () => {
    const weakThemePayload = {
      styleName: 'Sunny Editorial',
      palette: {
        background: { light: '#f6fbff', dark: '#ffffff' },
        backgroundAlt: { light: '#ebf3f8', dark: '#ffffff' },
        surface: { light: '#ffffff', dark: '#000000' },
        surfaceStrong: { light: '#d7e3ec', dark: '#111111' },
        surfaceTint: { light: '#eef7fb', dark: '#181818' },
        surfacePaper: { light: '#fcfefc', dark: '#0d0d0d' },
        text: { light: '#132131', dark: '#777777' },
        muted: { light: '#5b6f84', dark: '#888888' },
        accent: { light: '#2f7aa2', dark: '#4f8bb2' },
        accentStrong: { light: '#1f5d82', dark: '#999999' },
        focus: { light: '#0f766e', dark: '#999999' },
      },
      fonts: {
        sans: 'neo-grotesk',
        serif: 'editorial',
      },
      density: 'balanced',
      surfaceStyle: 'glass',
      buttonStyle: 'outline',
      pattern: 'grid',
      motion: 'calm',
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ theme: weakThemePayload }),
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    fireEvent.change(screen.getByLabelText(/give the portfolio this vibe/i), {
      target: {
        value: 'sunshine',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate remix/i }));

    const notice = await screen.findByText(
      /after some local tuning\. it passes, though the palette still leans soft\./i,
    );

    fireEvent.click(screen.getByRole('button', { name: /^dark$/i }));

    expect(notice).toBeInTheDocument();
    expect(
      screen.getByText(
        /after some local tuning\. it passes, though the palette still leans soft\./i,
      ),
    ).toBeInTheDocument();
    expect(controllerMocks.setStyleTransferMode).toHaveBeenCalledWith('dark');
  });

  it('surfaces the backend error message for 400 remix rejections', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () =>
        JSON.stringify({
          error: 'Invalid prompt payload.',
        }),
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    fireEvent.change(screen.getByLabelText(/give the portfolio this vibe/i), {
      target: {
        value: 'A clean, modern website with soft colors',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate remix/i }));

    expect(
      await screen.findByText(/invalid prompt payload\./i),
    ).toBeInTheDocument();
  });

  it('keeps remix errors visible when switching between light and dark modes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () =>
        JSON.stringify({
          error: "That remix didn't quite land. Try a different prompt.",
        }),
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    fireEvent.change(screen.getByLabelText(/give the portfolio this vibe/i), {
      target: {
        value: 'white one white',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate remix/i }));

    const errorMessage = await screen.findByText(
      /that remix didn't quite land\. try a different prompt\./i,
    );

    fireEvent.click(screen.getByRole('button', { name: /^light$/i }));

    expect(errorMessage).toBeInTheDocument();
    expect(
      screen.getByText(/that remix didn't quite land\. try a different prompt\./i),
    ).toBeInTheDocument();
    expect(controllerMocks.setStyleTransferMode).toHaveBeenCalledWith('light');
  });

  it('shows a live character count and disables submission when the prompt exceeds 400 characters', async () => {
    const fetchMock = vi.fn();

    vi.stubGlobal('fetch', fetchMock);

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    const textarea = await screen.findByLabelText(
      /give the portfolio this vibe/i,
    );

    fireEvent.change(textarea, {
      target: {
        value: 'a'.repeat(401),
      },
    });

    expect(screen.getByText('401 / 400')).toHaveClass(
      'style-transfer__character-count--over-limit',
    );
    expect(
      screen.getByRole('button', { name: /generate remix/i }),
    ).toBeDisabled();

    fireEvent.keyDown(textarea, {
      key: 'Enter',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('replaces the reset button with the unified theme explorer slider', async () => {
    const generatedTheme = createGeneratedThemeSummary();

    controllerMocks.getStyleTransferGeneratedSummaries.mockImplementation(
      () => [generatedTheme],
    );

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    expect(
      screen.getByRole('slider', { name: /explore and switch themes/i }),
    ).toHaveAttribute(
      'aria-valuetext',
      expect.stringContaining('Original Canvas (Default)'),
    );
    expect(
      screen.queryByRole('button', { name: /reset to default/i }),
    ).not.toBeInTheDocument();
  });

  it('keeps the trace column open when a generated theme is selected from the slider', async () => {
    const generatedTheme = createGeneratedThemeSummary();
    let controllerState: StyleTransferControllerState = {
      id: null,
      mode: 'auto',
      name: 'Original Canvas',
      presetId: null,
      prompt: null,
      source: 'default',
    };
    let activeArtwork: ResolvedStyleTransferArtworkState = {
      artwork: null,
      key: null,
    };

    controllerMocks.getStyleTransferControllerState.mockImplementation(
      () => controllerState,
    );
    controllerMocks.getStyleTransferGeneratedSummaries.mockImplementation(
      () => [generatedTheme],
    );
    controllerMocks.resolveActiveStyleTransferArtwork.mockImplementation(
      () => activeArtwork,
    );
    controllerMocks.applyGeneratedStyleTransferTheme.mockImplementation(() => {
      controllerState = {
        id: generatedTheme.id,
        mode: 'auto',
        name: generatedTheme.name,
        presetId: null,
        prompt: generatedTheme.prompt,
        source: 'prompt',
      };
      activeArtwork = {
        artwork: generatedTheme.artwork,
        key: `prompt:${generatedTheme.id}`,
      };
      return true;
    });

    render(<StyleTransferPrompt />);

    await openPromptPanel();
    fireEvent.change(
      screen.getByRole('slider', { name: /explore and switch themes/i }),
      {
        target: {
          value: '1',
        },
      },
    );

    await waitFor(() => {
      expect(
        screen.getByText(/how the remix turns into a theme/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/restored from history/i)).toBeInTheDocument();
  });

  it('keeps the trace panel mounted in-flow while it animates out on reset', async () => {
    const generatedTheme = createGeneratedThemeSummary();
    let controllerState: StyleTransferControllerState = {
      id: generatedTheme.id,
      mode: 'auto',
      name: generatedTheme.name,
      presetId: null,
      prompt: generatedTheme.prompt,
      source: 'prompt',
    };
    let activeArtwork: ResolvedStyleTransferArtworkState = {
      artwork: generatedTheme.artwork,
      key: `prompt:${generatedTheme.id}`,
    };

    controllerMocks.getStyleTransferControllerState.mockImplementation(
      () => controllerState,
    );
    controllerMocks.getStyleTransferGeneratedSummaries.mockImplementation(
      () => [generatedTheme],
    );
    controllerMocks.resolveActiveStyleTransferArtwork.mockImplementation(
      () => activeArtwork,
    );
    controllerMocks.resetStyleTransferController.mockImplementation(() => {
      controllerState = {
        id: null,
        mode: 'auto',
        name: 'Original Canvas',
        presetId: null,
        prompt: null,
        source: 'default',
      };
      activeArtwork = {
        artwork: null,
        key: null,
      };
    });

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    const traceHeading = await screen.findByText(
      /how the remix turns into a theme/i,
    );
    const tracePanel = traceHeading.closest(
      '.style-transfer__panel-trace',
    ) as HTMLElement | null;

    expect(tracePanel).not.toBeNull();
    if (!tracePanel) {
      throw new Error('Expected the trace panel to render in the prompt.');
    }

    fireEvent.change(
      screen.getByRole('slider', { name: /explore and switch themes/i }),
      {
        target: { value: '0' },
      },
    );

    await waitFor(() => {
      expect(tracePanel).toHaveAttribute('data-trace-visibility', 'exiting');
    });
    expect(traceHeading).toBeInTheDocument();
  });

  it('clears the prompt notice when switching themes and does not resurrect it when reselecting a generated theme', async () => {
    const prompt = 'frog';
    const payload = createPassingPromptThemePayload();
    const theme = createCustomStyleTransferThemeRecord(prompt, payload);
    const generatedTheme = {
      application: deriveStyleTransferApplication(theme),
      artwork: createDefaultStyleTransferArtworkPreview(theme, {
        source: 'fallback',
      }),
      id: theme.id,
      name: theme.name,
      prompt,
    };
    let controllerState: StyleTransferControllerState = {
      id: null,
      mode: 'auto',
      name: 'Original Canvas',
      presetId: null,
      prompt: null,
      source: 'default',
    };
    let generatedThemes: typeof generatedTheme[] = [];
    let activeArtwork: ResolvedStyleTransferArtworkState = {
      artwork: null,
      key: null,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ theme: payload }),
    });

    vi.stubGlobal('fetch', fetchMock);
    controllerMocks.getStyleTransferControllerState.mockImplementation(
      () => controllerState,
    );
    controllerMocks.getStyleTransferGeneratedSummaries.mockImplementation(
      () => generatedThemes,
    );
    controllerMocks.resolveActiveStyleTransferArtwork.mockImplementation(
      () => activeArtwork,
    );
    controllerMocks.applyStyleTransferApplication.mockImplementation(() => {
      generatedThemes = [generatedTheme];
      controllerState = {
        id: generatedTheme.id,
        mode: 'auto',
        name: generatedTheme.name,
        presetId: null,
        prompt: generatedTheme.prompt,
        source: 'prompt',
      };
      activeArtwork = {
        artwork: generatedTheme.artwork,
        key: `prompt:${generatedTheme.id}`,
      };
      return true;
    });
    controllerMocks.resetStyleTransferController.mockImplementation(() => {
      controllerState = {
        id: null,
        mode: 'auto',
        name: 'Original Canvas',
        presetId: null,
        prompt: null,
        source: 'default',
      };
      activeArtwork = {
        artwork: null,
        key: null,
      };
    });
    controllerMocks.applyGeneratedStyleTransferTheme.mockImplementation(() => {
      controllerState = {
        id: generatedTheme.id,
        mode: 'auto',
        name: generatedTheme.name,
        presetId: null,
        prompt: generatedTheme.prompt,
        source: 'prompt',
      };
      activeArtwork = {
        artwork: generatedTheme.artwork,
        key: `prompt:${generatedTheme.id}`,
      };
      return true;
    });

    render(<StyleTransferPrompt />);

    await openPromptPanel();

    fireEvent.change(screen.getByLabelText(/give the portfolio this vibe/i), {
      target: { value: prompt },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate remix/i }));

    expect(await screen.findByText(/applied "frog"\./i)).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('slider', { name: /explore and switch themes/i }),
      {
        target: { value: '0' },
      },
    );

    await waitFor(() => {
      expect(screen.queryByText(/applied "frog"\./i)).not.toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByRole('slider', { name: /explore and switch themes/i }),
      {
        target: { value: '1' },
      },
    );

    await waitFor(() => {
      expect(screen.queryByText(/applied "frog"\./i)).not.toBeInTheDocument();
    });
  });
});
