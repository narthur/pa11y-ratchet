import octokit from "./octokit.js";
import github from "@actions/github";

export default async function findPr() {
  const { data } =
    await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      commit_sha: github.context.sha,
    });
  return data[0];
}
