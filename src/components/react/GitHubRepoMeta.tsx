import { useEffect, useId, useState } from 'react';

import { getGitHubRepoApiUrl, parseGitHubRepoUrl } from '../../lib/github';

type GitHubRepoMetaProps = {
  repoUrl: string;
};

type GitHubRepoResponse = {
  default_branch: string;
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string;
  html_url: string;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export default function GitHubRepoMeta({ repoUrl }: GitHubRepoMetaProps) {
  const repo = parseGitHubRepoUrl(repoUrl);
  const repoApiUrl = repo ? getGitHubRepoApiUrl(repo) : null;
  const titleId = useId();
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [data, setData] = useState<GitHubRepoResponse | null>(null);

  useEffect(() => {
    if (!repoApiUrl) {
      return;
    }

    const apiUrl: string = repoApiUrl;

    const controller = new AbortController();
    let ignore = false;

    async function loadRepoMeta() {
      setStatus('loading');

      try {
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });

        if (!response.ok) {
          throw new Error(`GitHub API returned ${response.status}`);
        }

        const payload = (await response.json()) as GitHubRepoResponse;

        if (!ignore) {
          setData(payload);
          setStatus('success');
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        if (!ignore) {
          setStatus('error');
        }
      }
    }

    void loadRepoMeta();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [repoApiUrl]);

  if (!repoApiUrl) {
    return null;
  }

  if (status === 'loading') {
    return (
      <p className="repo-activity repo-activity--status" role="status">
        Loading public repo metadata…
      </p>
    );
  }

  if (status !== 'success' || !data) {
    return null;
  }

  return (
    <section className="repo-activity surface-card" aria-labelledby={titleId}>
      <div className="repo-activity__header">
        <p className="repo-activity__eyebrow">Public repo activity</p>
        <h3 id={titleId}>GitHub snapshot</h3>
      </div>

      <dl className="repo-activity__grid">
        <div>
          <dt>Last push</dt>
          <dd>
            <time dateTime={data.pushed_at}>
              {dateFormatter.format(new Date(data.pushed_at))}
            </time>
          </dd>
        </div>
        <div>
          <dt>Default branch</dt>
          <dd>{data.default_branch}</dd>
        </div>
        <div>
          <dt>Stars</dt>
          <dd>{data.stargazers_count}</dd>
        </div>
        <div>
          <dt>Open issues / PRs</dt>
          <dd>{data.open_issues_count}</dd>
        </div>
      </dl>

      <p className="repo-activity__note">
        Fetched from the public GitHub repository so the case study can show
        recent activity without changing the static content model.
      </p>

      <a
        className="repo-activity__link"
        href={data.html_url}
        target="_blank"
        rel="noreferrer"
      >
        Open repository
      </a>
    </section>
  );
}
