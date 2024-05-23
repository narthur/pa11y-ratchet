import downloadBaseArtifact from "./downloadBaseArtifact.js";
import readCsv from "./readCsv.js";
import { Issue } from "./scanUrls.js";

export default async function retrieveIssues(
  sha: string
): Promise<Issue[] | undefined> {
  const workspace = process.env.GITHUB_WORKSPACE;

  if (!workspace) {
    throw new Error("GITHUB_WORKSPACE not set");
  }

  const success = await downloadBaseArtifact();

  if (!success) {
    return undefined;
  }

  return readCsv<Issue>(`${workspace}/pa11y-${sha}.csv`).catch((error) => {
    console.error(`Error reading base CSV file: ${error}`);
    return undefined;
  });
}
