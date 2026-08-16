export interface GitHubRepoData {
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  defaultBranch: string;
  updatedAt: string;
  pushedAt: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  topics: string[];
}

export interface GitHubCommitData {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorDate: string;
  authorAvatar?: string;
  htmlUrl: string;
}

export interface GitHubBranchData {
  name: string;
  commitSha: string;
  isProtected?: boolean;
}

export interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  fileExtension?: string;
  url: string;
}

const REPO_OWNER = 'Ehna12';
const REPO_NAME = 'Field-Oriented-Control-of-BLDC-motor';
const GITHUB_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

const cache: {
  repo?: CacheEntry<GitHubRepoData>;
  commits?: CacheEntry<GitHubCommitData[]>;
  branches?: CacheEntry<GitHubBranchData[]>;
  tree?: CacheEntry<GitHubTreeItem[]>;
} = {};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'FOC-Drive-Project-Tracker/2.0',
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }
  return headers;
}

export async function fetchGitHubRepo(): Promise<GitHubRepoData> {
  const now = Date.now();
  if (cache.repo && now - cache.repo.cachedAt < CACHE_TTL_MS) {
    return cache.repo.data;
  }

  try {
    const res = await fetch(GITHUB_API_BASE, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }
    const data = await res.json();
    const repoInfo: GitHubRepoData = {
      name: data.name || REPO_NAME,
      fullName: data.full_name || `${REPO_OWNER}/${REPO_NAME}`,
      description: data.description || 'Field-Oriented Control (FOC) of BLDC Motor with Planetary Gearhead and MATLAB/Simulink Models.',
      htmlUrl: data.html_url || `https://github.com/${REPO_OWNER}/${REPO_NAME}`,
      defaultBranch: data.default_branch || 'main',
      updatedAt: data.updated_at || new Date().toISOString(),
      pushedAt: data.pushed_at || new Date().toISOString(),
      starsCount: data.stargazers_count || 0,
      forksCount: data.forks_count || 0,
      openIssuesCount: data.open_issues_count || 0,
      topics: data.topics || ['bldc', 'foc', 'simulink', 'matlab', 'motor-control', 'planetary-gearbox'],
    };

    cache.repo = { data: repoInfo, cachedAt: now };
    return repoInfo;
  } catch (err) {
    console.warn('Could not reach live GitHub API, serving repository baseline:', err);
    // Return baseline if API rate-limited
    return {
      name: REPO_NAME,
      fullName: `${REPO_OWNER}/${REPO_NAME}`,
      description: 'Field-Oriented Control (FOC) of BLDC Motor with Planetary Gearhead and MATLAB/Simulink Models.',
      htmlUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}`,
      defaultBranch: 'main',
      updatedAt: new Date().toISOString(),
      pushedAt: new Date().toISOString(),
      starsCount: 0,
      forksCount: 0,
      openIssuesCount: 0,
      topics: ['bldc', 'foc', 'simulink', 'matlab', 'motor-control', 'planetary-gearbox'],
    };
  }
}

export async function fetchGitHubCommits(): Promise<GitHubCommitData[]> {
  const now = Date.now();
  if (cache.commits && now - cache.commits.cachedAt < CACHE_TTL_MS) {
    return cache.commits.data;
  }

  try {
    const res = await fetch(`${GITHUB_API_BASE}/commits?per_page=15`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }
    const rawCommits = await res.json();
    const commits: GitHubCommitData[] = rawCommits.map((c: any) => ({
      sha: c.sha,
      shortSha: c.sha.substring(0, 7),
      message: c.commit?.message || 'Updated project files',
      authorName: c.commit?.author?.name || c.author?.login || 'Developer',
      authorDate: c.commit?.author?.date || new Date().toISOString(),
      authorAvatar: c.author?.avatar_url,
      htmlUrl: c.html_url || `https://github.com/${REPO_OWNER}/${REPO_NAME}/commit/${c.sha}`,
    }));

    cache.commits = { data: commits, cachedAt: now };
    return commits;
  } catch (err) {
    console.warn('Could not fetch GitHub commits from API:', err);
    return [];
  }
}

export async function fetchGitHubBranches(): Promise<GitHubBranchData[]> {
  const now = Date.now();
  if (cache.branches && now - cache.branches.cachedAt < CACHE_TTL_MS) {
    return cache.branches.data;
  }

  try {
    const res = await fetch(`${GITHUB_API_BASE}/branches`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }
    const rawBranches = await res.json();
    const branches: GitHubBranchData[] = rawBranches.map((b: any) => ({
      name: b.name,
      commitSha: b.commit?.sha,
      isProtected: b.protected || false,
    }));

    cache.branches = { data: branches, cachedAt: now };
    return branches;
  } catch (err) {
    console.warn('Could not fetch GitHub branches:', err);
    return [{ name: 'main', commitSha: '' }];
  }
}

export async function fetchGitHubTree(branch: string = 'main'): Promise<GitHubTreeItem[]> {
  const now = Date.now();
  if (cache.tree && now - cache.tree.cachedAt < CACHE_TTL_MS) {
    return cache.tree.data;
  }

  try {
    const res = await fetch(`${GITHUB_API_BASE}/git/trees/${branch}?recursive=1`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }
    const rawTree = await res.json();
    const tree: GitHubTreeItem[] = (rawTree.tree || []).map((t: any) => {
      const ext = t.path.includes('.') ? t.path.split('.').pop() : '';
      return {
        path: t.path,
        type: t.type === 'blob' ? 'blob' : 'tree',
        size: t.size,
        fileExtension: ext,
        url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${branch}/${t.path}`,
      };
    });

    cache.tree = { data: tree, cachedAt: now };
    return tree;
  } catch (err) {
    console.warn('Could not fetch GitHub tree:', err);
    return [];
  }
}
