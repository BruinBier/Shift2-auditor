const GRAPHQL = 'https://api.github.com/graphql';

interface ProjectMeta {
  projectId: string;
  statusFieldId: string;
  optionByName: Record<string, string>;
}

let cachedMeta: ProjectMeta | null = null;

function authHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN ontbreekt in .env');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'shift2-auditor',
  };
}

function getProjectConfig(): { owner: string; ownerType: 'user' | 'organization'; number: number } | null {
  const owner = process.env.GITHUB_PROJECT_OWNER;
  const number = process.env.GITHUB_PROJECT_NUMBER;
  const ownerType = (process.env.GITHUB_PROJECT_OWNER_TYPE || 'user').toLowerCase();
  if (!owner || !number) return null;
  if (ownerType !== 'user' && ownerType !== 'organization') return null;
  return { owner, ownerType, number: Number(number) };
}

async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ query, variables }),
  });
  const data = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!res.ok || data.errors) {
    const msg = data.errors?.map((e) => e.message).join('; ') || `GraphQL HTTP ${res.status}`;
    throw new Error(`GitHub GraphQL: ${msg}`);
  }
  return data.data as T;
}

async function loadProjectMeta(): Promise<ProjectMeta | null> {
  if (cachedMeta) return cachedMeta;

  const cfg = getProjectConfig();
  if (!cfg) return null;

  const root = cfg.ownerType === 'user' ? 'user' : 'organization';
  const query = `
    query($login: String!, $number: Int!) {
      ${root}(login: $login) {
        projectV2(number: $number) {
          id
          fields(first: 50) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options { id name }
              }
            }
          }
        }
      }
    }
  `;

  type FieldNode = { id?: string; name?: string; options?: Array<{ id: string; name: string }> };
  type Resp = {
    [key: string]: {
      projectV2: {
        id: string;
        fields: { nodes: FieldNode[] };
      } | null;
    };
  };

  const data = await graphql<Resp>(query, { login: cfg.owner, number: cfg.number });
  const project = data[root]?.projectV2;
  if (!project) return null;

  const statusField = project.fields.nodes.find((n) => n.name === 'Status' && n.options);
  if (!statusField || !statusField.id || !statusField.options) return null;

  const optionByName: Record<string, string> = {};
  for (const o of statusField.options) optionByName[o.name] = o.id;

  cachedMeta = {
    projectId: project.id,
    statusFieldId: statusField.id,
    optionByName,
  };
  return cachedMeta;
}

export async function addIssueToProjectAndSetStatus(
  issueNodeId: string,
  statusName: string
): Promise<void> {
  const meta = await loadProjectMeta();
  if (!meta) return; // Project niet geconfigureerd; gewoon overslaan

  const optionId = meta.optionByName[statusName];

  const addMutation = `
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }
  `;
  type AddResp = { addProjectV2ItemById: { item: { id: string } } };
  const added = await graphql<AddResp>(addMutation, {
    projectId: meta.projectId,
    contentId: issueNodeId,
  });
  const itemId = added.addProjectV2ItemById.item.id;

  if (!optionId) return;

  const updateMutation = `
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId,
        itemId: $itemId,
        fieldId: $fieldId,
        value: { singleSelectOptionId: $optionId }
      }) {
        projectV2Item { id }
      }
    }
  `;
  await graphql(updateMutation, {
    projectId: meta.projectId,
    itemId,
    fieldId: meta.statusFieldId,
    optionId,
  });
}
