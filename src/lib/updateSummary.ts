import { Issue } from "./scanUrls.js";
import core from "@actions/core";

export default async function updateSummary(issues: Issue[]) {
  if (!issues.length) {
    return;
  }
  const headerRow = Object.keys(issues[0]).map((k) => ({
    data: k,
    header: true,
  }));
  const rows = issues.map((issue) =>
    Object.values(issue).map((v) => v.toString())
  );
  core.summary.addTable([headerRow, ...rows]);
  core.summary.write({ overwrite: true });
}
