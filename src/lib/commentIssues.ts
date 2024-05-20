import github from "@actions/github";
import octokit from "../services/octokit.js";

function issue(data: Record<string, unknown>) {
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export default async function commentIssues(issues: {
  new: Record<string, unknown>[];
  fixed: Record<string, unknown>[];
  retained: Record<string, unknown>[];
}) {
  const issue_number = github.context.payload.pull_request?.number;

  if (!issue_number) {
    throw new Error("No issue number found in the context");
  }

  const body = `Pa11y found the following issues in this pull request:
  
  ### New Issues (${issues.new.length})

  ${issues.new.map(issue).join("\n")}

  ### Fixed Issues (${issues.fixed.length})

  ${issues.fixed.map(issue).join("\n")}

  <details>
  <summary><h3>Retained Issues (${issues.retained.length})</h3></summary>
  
  ${issues.retained.map(issue).join("\n")}

  </details>
  `;

  await octokit.rest.issues.createComment({
    body,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number,
  });
}
