import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import compareIssues from "./compareIssues.js";
import core from "@actions/core";
import getSummaryUrl from "../services/github/getSummaryUrl.js";
import sleep from "./sleep.js";
import { Comparison } from "./compareIssues.js";
import { getIgnoredCodes } from "./getIgnoredCodes.js";

type CodeComparison = Comparison & { code: string };

export function getCodes(issues: Issue[]): string[] {
  return Array.from(new Set(issues.map((issue) => issue.code)));
}

type Summary = typeof core.summary;

function addIgnoredCodes(summary: Summary, headIssues: Issue[]) {
  const ignoredCodes = getIgnoredCodes();

  if (!ignoredCodes.length) {
    return;
  }

  const codesResolved = ignoredCodes.filter(
    (code) => !headIssues.some((issue) => issue.code === code)
  );

  summary.addHeading("Ignored Codes", 2);

  summary.addRaw(
    `The following codes are ignored, and will not result in a CI failure.`
  );

  summary.addEOL();

  summary.addList(ignoredCodes);

  if (codesResolved.length) {
    summary.addRaw(
      `The following ignored codes were not found in this PR. Please consider removing them from the list of ignored codes.`
    );

    summary.addEOL();

    summary.addList(codesResolved);
  }
}

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

async function getComparativeBody(
  baseIssues: Issue[],
  headIssues: Issue[]
): Promise<string> {
  const data = getCodeComparisons(baseIssues, headIssues);
  core.summary.emptyBuffer();

  // WORKAROUND: Wait for buffer to be emptied
  await sleep(1000);

  core.summary.addHeading("Accessibility Issues", 2);

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

  const summaryUrl = await getSummaryUrl();

  core.summary.addLink("View full summary", summaryUrl);

  addIgnoredCodes(core.summary, headIssues);

  return core.summary.stringify();
}

async function getHeadBody(headIssues: Issue[]): Promise<string> {
  core.summary.emptyBuffer();

  // WORKAROUND: Wait for buffer to be emptied
  await sleep(1000);

  core.summary.addHeading("Accessibility Issues", 2);

  const codes = getCodes(headIssues);

  core.summary.addTable([
    ["Code", "Count"],
    ...codes.map((code) => [
      code,
      headIssues.filter((issue) => issue.code === code).length.toString(),
    ]),
  ]);

  const summaryUrl = await getSummaryUrl();

  core.summary.addLink("View full summary", summaryUrl);

  addIgnoredCodes(core.summary, headIssues);

  return core.summary.stringify();
}

export default async function updateComment(
  baseIssues: Issue[] | undefined,
  headIssues: Issue[]
) {
  const body = baseIssues
    ? await getComparativeBody(baseIssues, headIssues)
    : await getHeadBody(headIssues);

  await upsertComment(body);
}
