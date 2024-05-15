import readCsv from "./readCsv.js";

export default async function compareIssues(
  baseCsvPath: string,
  eventCsvPath: string
): Promise<{
  new: unknown[];
  fixed: unknown[];
  retained: unknown[];
}> {
  const baseIssues = await readCsv(baseCsvPath);
  const eventIssues = await readCsv(eventCsvPath);

  return {
    new: eventIssues.filter(
      (eventIssue) =>
        !baseIssues.some(
          (baseIssue) =>
            JSON.stringify(baseIssue) === JSON.stringify(eventIssue)
        )
    ),
    fixed: baseIssues.filter(
      (baseIssue) =>
        !eventIssues.some(
          (eventIssue) =>
            JSON.stringify(baseIssue) === JSON.stringify(eventIssue)
        )
    ),
    retained: baseIssues.filter((baseIssue) =>
      eventIssues.some(
        (eventIssue) => JSON.stringify(baseIssue) === JSON.stringify(eventIssue)
      )
    ),
  };
}
