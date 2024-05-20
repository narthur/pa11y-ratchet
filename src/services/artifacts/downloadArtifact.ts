import octokit from "../octokit.js";
import exec from "@actions/exec";

type Options = {
  artifactId: number;
  owner: string;
  repo: string;
  outdir: string;
};

export default async function downloadArtifact(
  options: Options
): Promise<void> {
  // Gets a redirect URL to download an archive for a repository. This URL
  // expires after 1 minute. Look for Location: in the response header to
  // find the URL for the download. The :archive_format must be zip.

  // OAuth tokens and personal access tokens (classic) need the repo scope
  // to use this endpoint.
  const response = await octokit.rest.actions.downloadArtifact({
    owner: options.owner,
    repo: options.repo,
    artifact_id: options.artifactId,
    archive_format: "zip",
  });

  const outpath = `${options.outdir}/artifact.zip`;

  await exec.exec("curl", ["-L", response.url, "-o", outpath]);
  await exec.exec("unzip", [outpath]);
}
