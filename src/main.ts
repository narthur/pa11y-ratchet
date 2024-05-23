import getUrls from "./lib/getUrls.js";
import getInputs from "./lib/getInputs.js";
import commentIssues from "./lib/commentIssues.js";
import compareIssues from "./lib/compareIssues.js";
import core from "@actions/core";
import findPr from "./services/github/findPr.js";
import { HEAD_SHA } from "./services/github/constants.js";
import scanUrls from "./lib/scanUrls.js";
import uploadIssues from "./lib/uploadIssues.js";
import retrieveIssues from "./lib/retrieveIssues.js";

export default async function main() {
  const pr = await findPr();
  const baseSha = pr?.base.sha;
  const headSha = HEAD_SHA;
  const inputs = getInputs();
  const includeRegex = new RegExp(inputs.include);
  const workspace = process.env.GITHUB_WORKSPACE;

  console.log({ baseSha, headSha, workspace });

  if (!workspace) {
    throw new Error("GITHUB_WORKSPACE not set");
  }

  const urls = await getUrls(inputs.sitemapUrl).then((urls: string[]) =>
    urls
      .filter((url: string) => includeRegex.test(url))
      .map((url: string) => url.replace(inputs.find, inputs.replace))
  );

  const headIssues = await scanUrls(urls);

  await uploadIssues(headIssues, headSha);

  const baseIssues = (await retrieveIssues(baseSha)) || [];
  const comparison = await compareIssues({ baseIssues, headIssues });

  console.log("Comparing issues and commenting on PR");
  await commentIssues(comparison);

  if (comparison.new.length) core.setFailed("Found new accessibility issues");
}
