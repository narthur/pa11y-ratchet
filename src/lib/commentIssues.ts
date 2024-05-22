import github from "@actions/github";
import octokit from "../services/github/octokit.js";
import findPr from "../services/github/findPr.js";

const BODY_PREFIX = "<!-- pa11y summary -->";

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
<p><strong>${data.type}: ${data.code}</strong></p>
<p><a href="${data.url}">${data.url}</a></p>
<blockquote>${data.message}</blockquote>
<p><code>${data.selector}</code></p>
${
  data.context
    ? `<div><pre><code>${escapeHtml(
        String(data.context).replaceAll("><", ">\n<")
      )}</code></pre></div>`
    : ``
}
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
  const pr = await findPr();
  const issue_number = pr?.number;

  if (!issue_number) {
    throw new Error("No issue number found in the context");
  }

  const body = `${BODY_PREFIX}
  ${
    !issues.new.length && !issues.fixed.length && !issues.retained.length
      ? "🎉 Pa11y found no accessibility issues!"
      : "Pa11y found the following accessibility issues:"
  }
  
${
  issues.new.length
    ? `  ### 🚨 New Issues (${issues.new.length})

${issuesList(issues.new)}`
    : ""
}

${
  issues.fixed.length
    ? `  ### 🎉 Fixed Issues (${issues.fixed.length})

  ${issuesList(issues.fixed)}`
    : ""
}

${
  issues.retained.length
    ? ` 

  <details>
  <summary><h3>⚠️ Retained Issues (${issues.retained.length})</h3></summary>
  
  ${issuesList(issues.retained)}

  </details> `
    : ""
}
  `;

  const { data: comments } = await octokit.rest.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number,
  });

  const existingComment = comments.find(({ body }) =>
    body?.startsWith(BODY_PREFIX)
  );

  if (existingComment) {
    await octokit.rest.issues.updateComment({
      body,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      comment_id: existingComment.id,
    });
  } else {
    await octokit.rest.issues.createComment({
      body,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number,
    });
  }
}
