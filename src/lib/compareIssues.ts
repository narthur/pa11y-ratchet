import { Issue } from "./scanUrls.js";

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
} {
  return {
    new: head.filter((hi) => !base.some((bi) => eq(bi, hi))),
    fixed: base.filter((bi) => !head.some((hi) => eq(bi, hi))),
    retained: base.filter((bi) => head.some((hi) => eq(bi, hi))),
  };
}
