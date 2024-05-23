import { Issue } from "./scanUrls.js";

type Options = {
  baseIssues: Issue[];
  headIssues: Issue[];
};

function eq(a: Issue, b: Issue) {
  return a.code === b.code && a.selector === b.selector && a.url === b.url;
}

export default async function compareIssues({
  baseIssues,
  headIssues,
}: Options): Promise<{
  new: Record<string, unknown>[];
  fixed: Record<string, unknown>[];
  retained: Record<string, unknown>[];
}> {
  return {
    new: headIssues.filter(
      (headIssue) => !baseIssues.some((baseIssue) => eq(baseIssue, headIssue))
    ),
    fixed: baseIssues.filter(
      (baseIssue) => !headIssues.some((headIssue) => eq(baseIssue, headIssue))
    ),
    retained: baseIssues.filter((baseIssue) =>
      headIssues.some((headIssue) => eq(baseIssue, headIssue))
    ),
  };
}
