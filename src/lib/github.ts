export type GitHubRepoRef = {
  owner: string;
  repo: string;
};

export function parseGitHubRepoUrl(repoUrl: string): GitHubRepoRef | null {
  try {
    const url = new URL(repoUrl);
    const hostname = url.hostname.replace(/^www\./, '');

    if (hostname !== 'github.com') {
      return null;
    }

    const [owner, repo] = url.pathname.replace(/^\/+|\/+$/g, '').split('/');

    if (!owner || !repo) {
      return null;
    }

    return {
      owner,
      repo: repo.replace(/\.git$/i, ''),
    };
  } catch {
    return null;
  }
}

export function getGitHubRepoApiUrl(repo: GitHubRepoRef) {
  return `https://api.github.com/repos/${repo.owner}/${repo.repo}`;
}
