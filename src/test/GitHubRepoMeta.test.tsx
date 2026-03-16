import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import GitHubRepoMeta from '../components/react/GitHubRepoMeta';

describe('GitHubRepoMeta', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing for a non-GitHub URL', () => {
    const { container } = render(
      <GitHubRepoMeta repoUrl="https://example.com/repo" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders repo metadata after a successful fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        default_branch: 'main',
        stargazers_count: 3,
        open_issues_count: 1,
        pushed_at: '2026-03-06T19:27:06Z',
        html_url: 'https://github.com/sethtipton/belltower-brewing',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    render(
      <GitHubRepoMeta repoUrl="https://github.com/sethtipton/belltower-brewing" />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading public repo metadata…',
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'GitHub snapshot' }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Mar 6, 2026')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
