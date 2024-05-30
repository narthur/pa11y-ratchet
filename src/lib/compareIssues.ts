import { Issue } from "./scanUrls.js";
import getInputs from "./getInputs.js";

type Options = {
  baseIssues: Issue[];
  headIssues: Issue[];
};

function eq(a: Issue, b: Issue) {
  return a.code === b.code && a.selector === b.selector && a.url === b.url;
}

export default function compareIssues({
  baseIssues: base,
  headIssues: head,
}: Options): {
  new: Issue[];
  fixed: Issue[];
  retained: Issue[];
  ignored: Issue[];
} {
  const { ignore } = getInputs();
  const ignoreCodes = ignore.split(",").map((i) => i.trim());

  function isIgnored(issue: Issue) {
    return ignoreCodes.some((c) => issue.code === c);
  }

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
