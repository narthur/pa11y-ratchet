import pa11y from "pa11y";
import getUrls from "./lib/getUrls.js";
import writeCsv from "./lib/writeCsv.js";
import { DefaultArtifactClient } from "@actions/artifact";
import github from "@actions/github";
import getInputs from "./lib/getInputs.js";
import commentIssues from "./lib/commentIssues.js";
import compareIssues from "./lib/compareIssues.js";

export default async function main() {
  const artifact = new DefaultArtifactClient();
  const sha = github.context.sha;
  const baseSha = github.context.payload.pull_request?.base.sha;
  const inputs = getInputs();
  const includeRegex = new RegExp(inputs.include);

  const outpath = "/pa11y.csv";

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

  await artifact.uploadArtifact(`pa11y-ratchet-${sha}`, [outpath], "/");

  const result = await artifact.listArtifacts();

  const baseArtifact = result.artifacts.find((artifact) =>
    artifact.name.includes(baseSha)
  );

  if (baseArtifact) {
    await artifact.downloadArtifact(baseArtifact.id, { path: "/" });

    console.log("Comparing issues and commenting on PR");
    await commentIssues(
      await compareIssues(`/pa11y-ratchet-${baseSha}`, outpath)
    );
  }
}
