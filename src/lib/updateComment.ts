import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import compareIssues from "./compareIssues.js";
import core from "@actions/core";
import getSummaryUrl from "../services/github/getSummaryUrl.js";
import sleep from "./sleep.js";
import { Comparison } from "./compareIssues.js";

type CodeComparison = Comparison & { code: string };

function getCodes(issues: Issue[]): string[] {
  return Array.from(new Set(issues.map((issue) => issue.code)));
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

  const newCount = data.reduce((acc, d) => acc + d.new.length, 0);
  const fixedCount = data.reduce((acc, d) => acc + d.fixed.length, 0);

  if (newCount) {
    core.summary.addRaw(`⚠️ ${newCount} new issues found!\n`);
  }

  if (fixedCount) {
    core.summary.addRaw(`✅ ${fixedCount} issues fixed!\n`);
  }

  core.summary.addTable([
    ["Code", "New", "Fixed", "Retained", "Ignored", "Total"],
    ...data.map((d) => [
      d.code,
      d.new.length.toString(),
      d.fixed.length.toString(),
      d.retained.length.toString(),
      d.ignored.length.toString(),
      (d.new.length + d.ignored.length + d.retained.length).toString(),
    ]),
  ]);

  const summaryUrl = await getSummaryUrl();

  core.summary.addLink("View full summary", summaryUrl);

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
