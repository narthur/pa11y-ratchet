import github from "@actions/github";
import octokit from "../services/octokit.js";

export default async function commentIssues(issues: {
  new: unknown[];
  fixed: unknown[];
  retained: unknown[];
}) {
  const commentBody = `Pa11y found the following issues in this pull request: ${JSON.stringify(
    issues
  )}`;
  const issue_number = github.context.payload.pull_request?.number;

  if (!issue_number) {
    throw new Error("No issue number found in the context");
  }

  await octokit.rest.issues.createComment({
    body: commentBody,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number,
  });
}
