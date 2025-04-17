import { Issue } from "./scanUrls.js";
import { getIgnoredCodes } from "./getIgnoredCodes.js";

type Options = {
  baseIssues: Issue[];
  headIssues: Issue[];
};

export type Comparison = {
  new: Issue[];
  fixed: Issue[];
  retained: Issue[];
  ignored: Issue[];
};

function eq(a: Issue, b: Issue) {
  return a.code === b.code && a.selector === b.selector && a.url === b.url;
}

export default function compareIssues({
  baseIssues: base,
  headIssues: head,
}: Options): Comparison {
  const ignoreCodes = getIgnoredCodes();
  const isIgnored = (issue: Issue) => ignoreCodes.some((c) => issue.code === c);

  return {
    new: head.filter((hi) => !base.some((bi) => eq(bi, hi)) && !isIgnored(hi)),
    fixed: base.filter(
      (bi) => !head.some((hi) => eq(bi, hi)) && !isIgnored(bi)
    ),
    retained: base.filter(
      (bi) => head.some((hi) => eq(bi, hi)) && !isIgnored(bi)
    ),
    ignored: head.filter(isIgnored),
  };
}
