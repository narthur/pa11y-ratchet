import octokit from "./octokit.js";
import github from "@actions/github";

export default function getArtifact(id: number) {
  return octokit.rest.actions.getArtifact({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    artifact_id: id,
  });
}
