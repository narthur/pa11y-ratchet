type Options = {
  baseIssues: Record<string, unknown>[];
  headIssues: Record<string, unknown>[];
};

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
        !baseIssues.some(
          (baseIssue) => JSON.stringify(baseIssue) === JSON.stringify(headIssue)
        )
    ),
    fixed: baseIssues.filter(
      (baseIssue) =>
        !headIssues.some(
          (headIssue) => JSON.stringify(baseIssue) === JSON.stringify(headIssue)
        )
    ),
    retained: baseIssues.filter((baseIssue) =>
      headIssues.some(
        (headIssue) => JSON.stringify(baseIssue) === JSON.stringify(headIssue)
      )
    ),
  };
}
