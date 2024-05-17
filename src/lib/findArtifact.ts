import octokit from "../services/octokit.js";
import github from "@actions/github";

export default async function findArtifact(sha: string) {
  const findBy = {
    name: `pa11y-ratchet-${sha}`,
  };

  const result = await octokit.rest.actions.listArtifactsForRepo({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    findBy,
    per_page: 1,
  });

  return result.data.artifacts.pop();
}
