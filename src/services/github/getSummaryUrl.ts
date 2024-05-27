import findPr from "./findPr.js";
import github from "@actions/github";

export default async function getSummaryUrl() {
  const pr = await findPr();

  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  const runNumber = github.context.runNumber;
  const prNumber = pr.number;

  return `https://github.com/${owner}/${repo}/actions/runs/${runNumber}?pr=${prNumber}#pa11y-summary`;
}
