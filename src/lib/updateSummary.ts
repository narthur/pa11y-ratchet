import { Issue } from "./scanUrls.js";
import core from "@actions/core";

function addCodeTable(issues: Issue[]) {
  const codes = Array.from(new Set(issues.map((issue) => issue.code)));
  const headerRow = [
    "Code",
    "Description",
    "Type",
    "Runner",
    "Instance Count",
    "URL Count",
    "Selector Count",
  ];
  const rows = codes.map((code) => {
    const instances = issues.filter((issue) => issue.code === code);
    const urlCount = Array.from(
      new Set(instances.map((issue) => issue.url))
    ).length;
    const selectorCount = Array.from(
      new Set(instances.map((issue) => issue.selector))
    ).length;
    return [
      code,
      instances[0].message,
      instances[0].type,
      instances[0].runner || "",
      instances.length.toString(),
      urlCount.toString(),
      selectorCount.toString(),
    ];
  });
  core.summary.addTable([headerRow, ...rows]);
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

  addCodeTable(issues);
  addInstanceTable(issues);

  core.summary.write({ overwrite: true });
}
