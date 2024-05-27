import { Issue } from "./scanUrls.js";
import core from "@actions/core";

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
    ["Instance Count", "URL Count", "Selector Count"],
    [issues.length.toString(), urlCount.toString(), selectorCount.toString()],
  ]);
}

function addInstanceTable(issues: Issue[]) {
  const headerRow = ["URL", "Code", "Selector", "Context"];
  const rows = issues.map((issue) => [
    issue.url,
    issue.code,
    issue.selector,
    issue.context,
  ]);
  core.summary.addTable([headerRow, ...rows]);
}

export default async function updateSummary(issues: Issue[]) {
  if (!issues.length) {
    return;
  }

  const codes = getCodes(issues);

  for (const code of codes) {
    const instances = getInstances(issues, code);

    core.summary.addHeading(code);
    core.summary.addQuote(instances[0].message);

    addSummaryTable(instances);
    addInstanceTable(instances);
  }

  core.summary.write({ overwrite: true });
}
