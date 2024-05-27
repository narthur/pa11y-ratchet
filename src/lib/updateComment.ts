import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import compareIssues from "./compareIssues.js";
import core from "@actions/core";
import getSummaryUrl from "../services/github/getSummaryUrl.js";

type CodeComparison = {
  code: string;
  new: Issue[];
  fixed: Issue[];
  retained: Issue[];
};

async function getBody(data: CodeComparison[]): Promise<string> {
  core.summary.emptyBuffer();

  let body = "";

  core.summary.addHeading("Accessibility Issues", 2);

  body += core.summary.stringify();

  core.summary.addTable([
    ["Code", "New:Fixed:Retained"],
    ...data.map((d) => [
      d.code,
      `${d.new.length}:${d.fixed.length}:${d.retained.length}`,
    ]),
  ]);

  body += core.summary.stringify();

  const summaryUrl = await getSummaryUrl();

  core.summary.addLink("View full summary", summaryUrl);

  body += core.summary.stringify();

  return body;
}

function getCodeComparisons(
  baseIssues: Issue[],
  headIssues: Issue[]
): CodeComparison[] {
  return Array.from(
    new Set([...baseIssues, ...headIssues].map(({ code }) => code))
  ).map((code) => ({
    code,
    ...compareIssues({
      baseIssues: baseIssues.filter((issue) => issue.code === code),
      headIssues: headIssues.filter((issue) => issue.code === code),
    }),
  }));
}

export default async function updateComment(
  baseIssues: Issue[],
  headIssues: Issue[]
) {
  const comparisons = getCodeComparisons(baseIssues, headIssues);
  const body = await getBody(comparisons);

  await upsertComment(body);
}
