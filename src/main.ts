import pa11y from "pa11y";
import getUrls from "./lib/getUrls.js";
import writeCsv from "./lib/writeCsv.js";
import { DefaultArtifactClient } from "@actions/artifact";
import github from "@actions/github";
import getInputs from "./lib/getInputs.js";

export default async function main() {
  const artifact = new DefaultArtifactClient();
  const sha = github.context.sha;
  const inputs = getInputs();
  const includeRegex = new RegExp(inputs.include);

  const outpath = "/tmp/pa11y.csv";

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
  await artifact.uploadArtifact(sha, [outpath], "/");
}
