import github from "@actions/github";
import octokit from "../services/octokit.js";

function issue(data: Record<string, unknown>) {
  return `<li><p>${Object.entries(data)
    .map(([key, value]) => `<strong>${key}:</strong> ${value}<br/>`)
    .join("\n")}</p></li>`;
}

function issuesList(issues: Record<string, unknown>[]) {
  return `<ol>${issues.map(issue).join("\n")}</ol>`;
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

  ${issuesList(issues.new)}

  ### Fixed Issues (${issues.fixed.length})

  ${issuesList(issues.fixed)}

  <details>
  <summary><h3>Retained Issues (${issues.retained.length})</h3></summary>
  
  ${issuesList(issues.retained)}

  </details>
  `;

  await octokit.rest.issues.createComment({
    body,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number,
  });
}
