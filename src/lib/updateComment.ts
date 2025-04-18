import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import compareIssues from "./compareIssues.js";
import core from "@actions/core";
import getSummaryUrl from "../services/github/getSummaryUrl.js";
import sleep from "./sleep.js";
import { Comparison } from "./compareIssues.js";
import { getIgnoredCodes } from "./getIgnoredCodes.js";
import { getCodes } from "./getCodes.js";

function addSummary(baseIssues: Issue[] | undefined, headIssues: Issue[]) {
  if (!baseIssues) {
    core.summary.addRaw(`<p>No baseline issues found.</p>`);
    return;
  }

  const baseLen = baseIssues.length;
  const headLen = headIssues.length;

  if (baseLen === headLen) {
    core.summary.addRaw(`<p>Issue count is the same as the baseline.</p>`);
  }

  if (baseLen > headLen) {
    core.summary.addRaw(`<p>🎉 Issue count is less than the baseline!</p>`);
  }

  if (baseLen < headLen) {
    core.summary.addRaw(`<p>🚨 Issue count is greater than the baseline.</p>`);
  }

  core.summary.addRaw(`<p>Baseline issues: ${baseLen}</p>`);
  core.summary.addRaw(`<p>Head issues: ${headLen}</p>`);
}

function addIgnoredCodes(headIssues: Issue[]) {
  const ignoredCodes = getIgnoredCodes();

  if (!ignoredCodes.length) {
    return;
  }

  const codesResolved = ignoredCodes.filter(
    (code) => !headIssues.some((issue) => issue.code === code)
  );

  core.summary.addRaw(
    `<p>The following codes are ignored, and will not result in a CI failure.</p>`
  );

  core.summary.addList(ignoredCodes);

  if (!codesResolved.length) return;

  core.summary.addRaw(
    `<p>The following ignored codes were not found in this PR. Please consider removing them from the list of ignored codes.</p>`
  );

  core.summary.addList(codesResolved);
}

type CodeComparison = Comparison & { code: string };

function getCodeComparisons(
  baseIssues: Issue[],
  headIssues: Issue[]
): CodeComparison[] {
  const codes = getCodes([...baseIssues, ...headIssues]);
  return codes.map((code) => ({
    code,
    ...compareIssues({
      baseIssues: baseIssues.filter((issue) => issue.code === code),
      headIssues: headIssues.filter((issue) => issue.code === code),
    }),
  }));
}

async function addComparativeTable(baseIssues: Issue[], headIssues: Issue[]) {
  const data = getCodeComparisons(baseIssues, headIssues);

  core.summary.addTable([
    ["Code", "Before", "After", "Net Change"],
    ...data.map((d) => [
      d.code,
      baseIssues.filter((issue) => issue.code === d.code).length.toString(),
      headIssues.filter((issue) => issue.code === d.code).length.toString(),
      (
        headIssues.filter((issue) => issue.code === d.code).length -
        baseIssues.filter((issue) => issue.code === d.code).length
      ).toString(),
    ]),
  ]);
}

function addHeadTable(headIssues: Issue[]) {
  const codes = getCodes(headIssues);

  core.summary.addTable([
    ["Code", "Count"],
    ...codes.map((code) => [
      code,
      headIssues.filter((issue) => issue.code === code).length.toString(),
    ]),
  ]);
}

export default async function updateComment(
  baseIssues: Issue[] | undefined,
  headIssues: Issue[]
) {
  core.summary.emptyBuffer();

  // WORKAROUND: Wait for buffer to be emptied
  await sleep(1000);

  core.summary.addHeading("Accessibility Issues", 2);

  core.summary.addHeading("Summary", 3);

  addSummary(baseIssues, headIssues);

  core.summary.addHeading("Issue Breakdown", 3);

  if (baseIssues) {
    addComparativeTable(baseIssues, headIssues);
  } else {
    addHeadTable(headIssues);
  }

  const summaryUrl = await getSummaryUrl();

  core.summary.addLink("View full breakdown", summaryUrl);

  core.summary.addHeading("Ignored Codes", 3);

  addIgnoredCodes(headIssues);

  const body = core.summary.stringify();

  await upsertComment(body);
}
