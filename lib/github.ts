const GITHUB_API = 'https://api.github.com';
const DEFAULT_OWNER = 'BruinBier';
const DEFAULT_REPO = 'technische-issues';

function authHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN ontbreekt in .env');
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'shift2-auditor',
  };
}

function getRepo(): { owner: string; repo: string } {
  return {
    owner: process.env.GITHUB_ISSUES_OWNER || DEFAULT_OWNER,
    repo: process.env.GITHUB_ISSUES_REPO || DEFAULT_REPO,
  };
}

async function labelExists(owner: string, repo: string, name: string): Promise<boolean> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/labels/${encodeURIComponent(name)}`, {
    headers: authHeaders(),
  });
  if (res.status === 200) return true;
  if (res.status === 404) return false;
  const text = await res.text();
  throw new Error(`GitHub label check failed (${res.status}): ${text}`);
}

async function createLabel(owner: string, repo: string, name: string, color: string): Promise<void> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/labels`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  if (res.status === 201) return;
  if (res.status === 422) return; // already exists (race)
  const text = await res.text();
  throw new Error(`GitHub label create failed (${res.status}): ${text}`);
}

function colorForLabel(name: string): string {
  if (name.startsWith('leverancier:')) return '0E8A16'; // green
  if (name.startsWith('wcag:')) return '1D76DB'; // blue
  if (name.startsWith('impact:')) {
    if (name.endsWith(':kritiek')) return 'B60205';
    if (name.endsWith(':serieus')) return 'D93F0B';
    if (name.endsWith(':matig')) return 'FBCA04';
    if (name.endsWith(':klein')) return 'C2E0C6';
    return 'EDEDED';
  }
  return 'EDEDED';
}

async function ensureLabels(owner: string, repo: string, labels: string[]): Promise<void> {
  for (const label of labels) {
    const exists = await labelExists(owner, repo, label);
    if (!exists) {
      await createLabel(owner, repo, label, colorForLabel(label));
    }
  }
}

export interface CreateIssueInput {
  title: string;
  body: string;
  labels: string[];
}

export interface CreateIssueResult {
  url: string; // https://github.com/owner/repo/issues/123
  number: number;
  nodeId: string; // GraphQL node id, for project assignment
}

export interface GithubIssueSummary {
  number: number;
  url: string;
  state: 'open' | 'closed';
  title: string;
  body: string;
  nodeId: string;
}

export async function listGithubIssues(): Promise<GithubIssueSummary[]> {
  const { owner, repo } = getRepo();
  const results: GithubIssueSummary[] = [];
  let page = 1;
  for (;;) {
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`,
      { headers: authHeaders(), cache: 'no-store' }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub issues list failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as Array<{
      number: number;
      html_url: string;
      state: 'open' | 'closed';
      title: string;
      body: string | null;
      node_id: string;
      pull_request?: unknown;
    }>;
    for (const i of data) {
      if (i.pull_request) continue;
      results.push({
        number: i.number,
        url: i.html_url,
        state: i.state,
        title: i.title,
        body: i.body || '',
        nodeId: i.node_id,
      });
    }
    if (data.length < 100) break;
    page += 1;
    if (page > 10) break;
  }
  return results;
}

export interface GithubComment {
  id: number;
  author: string;
  avatarUrl: string;
  htmlUrl: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

function parseIssueUrl(issueUrl: string): { owner: string; repo: string; number: number } | null {
  const m = issueUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: Number(m[3]) };
}

export async function fetchGithubComments(issueUrl: string): Promise<GithubComment[]> {
  const parsed = parseIssueUrl(issueUrl);
  if (!parsed) return [];

  const res = await fetch(
    `${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}/issues/${parsed.number}/comments?per_page=100`,
    { headers: authHeaders(), cache: 'no-store' }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub comments fetch failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as Array<{
    id: number;
    user: { login: string; avatar_url: string } | null;
    html_url: string;
    body: string | null;
    created_at: string;
    updated_at: string;
  }>;

  return data.map((c) => ({
    id: c.id,
    author: c.user?.login || 'onbekend',
    avatarUrl: c.user?.avatar_url || '',
    htmlUrl: c.html_url,
    body: c.body || '',
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

export async function createGithubIssue(input: CreateIssueInput): Promise<CreateIssueResult> {
  const { owner, repo } = getRepo();

  if (input.labels.length > 0) {
    await ensureLabels(owner, repo, input.labels);
  }

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      body: input.body,
      labels: input.labels,
    }),
  });

  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`GitHub issue create failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { html_url: string; number: number; node_id: string };
  return { url: data.html_url, number: data.number, nodeId: data.node_id };
}
