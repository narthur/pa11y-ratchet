import github from "@actions/github";
import octokit from "../services/octokit.js";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function issue(data: Record<string, unknown>) {
  return `
<p>${data.type}: ${data.code}</p>
<blockquote>${data.message}</blockquote>
<p>${data.selector}</p>
${data.context ? `<p>${escapeHtml(String(data.context))}</p>` : ``}
`;
}

function issuesList(issues: Record<string, unknown>[]) {
  return `${issues.map(issue).join("<hr/>")}`;
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
