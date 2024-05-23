import { DefaultArtifactClient } from "@actions/artifact";
import writeCsv from "./writeCsv.js";

export default async function uploadIssues(
  issues: Record<string, unknown>[],
  sha: string
) {
  const workspace = process.env.GITHUB_WORKSPACE;

  if (!workspace) {
    throw new Error("GITHUB_WORKSPACE not set");
  }

  const artifact = new DefaultArtifactClient();
  const outname = `pa11y-${sha}.csv`;
  const outpath = `${workspace}/${outname}`;

  await writeCsv(outpath, issues);

  await artifact.uploadArtifact(`pa11y-ratchet-${sha}`, [outname], workspace);
}
