import pa11y from "pa11y";
import getUrls from "./lib/getUrls.js";
import writeCsv from "./lib/writeCsv.js";
import { DefaultArtifactClient } from "@actions/artifact";
import github from "@actions/github";
import getInputs from "./lib/getInputs.js";
import commentIssues from "./lib/commentIssues.js";
import compareIssues from "./lib/compareIssues.js";
import findArtifact from "./services/artifacts/findArtifact.js";

export default async function main() {
  const artifact = new DefaultArtifactClient();
  const sha = github.context.sha;
  const baseSha = github.context.payload.pull_request?.base.sha;
  const inputs = getInputs();
  const includeRegex = new RegExp(inputs.include);
  const workspace = process.env.GITHUB_WORKSPACE;

  console.log({ workspace });

  if (!workspace) {
    throw new Error("GITHUB_WORKSPACE not set");
  }

  const outdir = workspace;
  const outname = `pa11y-${sha}.csv`;
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

  await artifact.uploadArtifact(`pa11y-ratchet-${sha}`, [outname], outdir);

  const baseArtifact = await findArtifact(baseSha);

  if (!baseArtifact) {
    console.log("No base artifact found, skipping comparison");
    console.log("baseSha", baseSha);
    return;
  }

  const response = await artifact.downloadArtifact(baseArtifact.id, {
    path: outdir,
  });
  console.dir({ response }, { depth: null });

  console.log("Comparing issues and commenting on PR");
  await commentIssues(
    await compareIssues(`/tmp/pa11y-${baseSha}.csv`, outpath)
  );
}
