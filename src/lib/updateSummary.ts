import { Issue } from "./scanUrls.js";
import core from "@actions/core";
import escapeHtml from "./escapeHtml.js";
import sleep from "./sleep.js";

function getCodes(issues: Issue[]): string[] {
  return Array.from(new Set(issues.map((issue) => issue.code)));
}

function getInstances(issues: Issue[], code: string): Issue[] {
  return issues.filter((issue) => issue.code === code);
}

function addSummaryTable(issues: Issue[]) {
  const urlCount = Array.from(new Set(issues.map((issue) => issue.url))).length;
  const selectorCount = Array.from(
    new Set(issues.map((issue) => issue.selector))
  ).length;
  core.summary.addTable([
    ["Instances", "URLs", "Selectors"],
    [issues.length.toString(), urlCount.toString(), selectorCount.toString()],
  ]);
}

function addInstanceTable(issues: Issue[]) {
  const headerRow = ["Path", "Selector", "Context"];
  const rows = issues
    .slice(0, 100)
    .map((issue) => [
      `<a href="${issue.url}">${new URL(issue.url).pathname}</a>`,
      issue.selector ? `<code>${escapeHtml(issue.selector)}</code>` : "",
      issue.context ? `<code>${escapeHtml(issue.context)}</code>` : "",
    ]);
  core.summary.addTable([headerRow, ...rows]);
  core.summary.addRaw(`... and ${issues.length - 100} more`);
}

function addSummary(issues: Issue[]) {
  core.summary.addRaw('<h2 id="pa11y-summary">Accessibility Issues</h2>');

  const codes = getCodes(issues);

  for (const code of codes) {
    const instances = getInstances(issues, code);

    core.summary.addHeading(code, 3);
    core.summary.addQuote(instances[0].message);

    addSummaryTable(instances);
    addInstanceTable(instances);
  }
}

export default async function updateSummary(issues: Issue[]) {
  core.summary.emptyBuffer();

  // WORKAROUND: Wait for buffer to be emptied
  await sleep(1000);

  if (issues.length) {
    addSummary(issues);
  } else {
    core.summary.addRaw("🎉 No accessibility issues found!");
  }

  core.summary.write({ overwrite: true });
}
