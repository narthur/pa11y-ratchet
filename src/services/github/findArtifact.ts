import octokit from "./octokit.js";
import github from "@actions/github";

export default async function findArtifact(sha: string) {
  const result = await octokit.rest.actions.listArtifactsForRepo({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    name: `pa11y-ratchet-${sha}`,
    per_page: 1,
  });

  if (!sha) {
    return undefined;
  }

  return result.data.artifacts.pop();
}
