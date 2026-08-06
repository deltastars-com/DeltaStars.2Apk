import { Octokit } from 'octokit';

// GitHub Personal Access Token or App Token
const githubToken = import.meta.env.VITE_GITHUB_TOKEN || '';

export const octokit = githubToken 
  ? new Octokit({ auth: githubToken })
  : null;

/**
 * Ensures Octokit is initialized with a token.
 */
export function getOctokit() {
  if (!octokit) {
    throw new Error('GitHub token (VITE_GITHUB_TOKEN) is not configured in environment variables.');
  }
  return octokit;
}

/**
 * Utility to check repository status or trigger workflows
 */
export async function triggerWorkflow(owner: string, repo: string, workflow_id: string) {
  const client = getOctokit();
  try {
    await client.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id,
      ref: 'main',
    });
    return { success: true };
  } catch (error) {
    console.error('GitHub Workflow Trigger Error:', error);
    throw error;
  }
}
