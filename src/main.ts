import pa11y from "pa11y";
import getUrls from "./lib/getUrls.js";
import writeCsv from "./lib/writeCsv.js";
import { DefaultArtifactClient } from "@actions/artifact";
import github from "@actions/github";
import getInputs from "./lib/getInputs.js";
import commentIssues from "./lib/commentIssues.js";
import compareIssues from "./lib/compareIssues.js";
import findArtifact from "./services/github/findArtifact.js";
import downloadArtifact from "./services/github/downloadArtifact.js";
import core from "@actions/core";
import findPr from "./services/github/findPr.js";

export default async function main() {
  const artifact = new DefaultArtifactClient();
  const pr = await findPr();
  const eventSha = github.context.sha;
  const baseSha = pr?.base.sha;
  const inputs = getInputs();
  const includeRegex = new RegExp(inputs.include);
  const workspace = process.env.GITHUB_WORKSPACE;

  console.log({ baseSha, eventSha, workspace });

  if (!workspace) {
    throw new Error("GITHUB_WORKSPACE not set");
  }

  const outdir = workspace;
  const outname = `pa11y-${eventSha}.csv`;
  const outpath = `${outdir}/${outname}`;

  const urls = await getUrls(inputs.sitemapUrl).then((urls: string[]) =>
    urls
      .filter((url: string) => includeRegex.test(url))
      .map((url: string) => url.replace(inputs.find, inputs.replace))
  );

  const issues = [];

  for (const url of urls) {
    const res = await pa11y(url);
    const issuesForUrl = res.issues.map((issue) => ({ url, ...issue }));
    issues.push(...issuesForUrl);
  }

  await writeCsv(outpath, issues);

  await artifact.uploadArtifact(`pa11y-ratchet-${eventSha}`, [outname], outdir);

  const baseArtifact = await findArtifact(baseSha);

  if (!baseArtifact) {
    console.log("No base artifact found, skipping comparison");
    console.log("baseSha", baseSha);
    return;
  }

  console.log("Downloading base artifact", baseArtifact.id, baseArtifact.name);

  await downloadArtifact({
    artifactId: baseArtifact.id,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    outdir,
  });

  const comparison = await compareIssues(
    `${workspace}/pa11y-${baseSha}.csv`,
    outpath
  );

  console.log("Comparing issues and commenting on PR");
  await commentIssues(comparison);

  if (comparison.new.length) core.setFailed("Found new accessibility issues");
}
