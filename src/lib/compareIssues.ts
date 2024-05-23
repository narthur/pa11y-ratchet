import { Issue } from "./scanUrls.js";

type Options = {
  baseIssues: Issue[];
  headIssues: Issue[];
};

function areEqual(a: Issue, b: Issue) {
  return (
    a.code === b.code &&
    a.context === b.context &&
    a.message === b.message &&
    a.selector === b.selector &&
    a.type === b.type &&
    a.typeCode === b.typeCode &&
    a.url === b.url
  );
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
      (headIssue) =>
        !baseIssues.some((baseIssue) => areEqual(baseIssue, headIssue))
    ),
    fixed: baseIssues.filter(
      (baseIssue) =>
        !headIssues.some((headIssue) => areEqual(baseIssue, headIssue))
    ),
    retained: baseIssues.filter((baseIssue) =>
      headIssues.some((headIssue) => areEqual(baseIssue, headIssue))
    ),
  };
}
