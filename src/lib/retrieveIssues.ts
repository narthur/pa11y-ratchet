import downloadBaseArtifact from "./downloadBaseArtifact.js";
import readCsv from "./readCsv.js";

export default async function retrieveIssues(sha: string) {
  const workspace = process.env.GITHUB_WORKSPACE;

  if (!workspace) {
    throw new Error("GITHUB_WORKSPACE not set");
  }

  await downloadBaseArtifact();

  return readCsv(`${workspace}/pa11y-${sha}.csv`).catch((error) => {
    console.error(`Error reading base CSV file: ${error}`);
    return undefined;
  });
}
