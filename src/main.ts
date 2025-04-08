import getUrls from "./lib/getUrls.js";
import getInputs from "./lib/getInputs.js";
import updateComment, { getCodes } from "./lib/updateComment.js";
import core from "@actions/core";
import findPr from "./services/github/findPr.js";
import { HEAD_SHA } from "./services/github/constants.js";
import scanUrls from "./lib/scanUrls.js";
import uploadIssues from "./lib/uploadIssues.js";
import retrieveIssues from "./lib/retrieveIssues.js";
import updateSummary from "./lib/updateSummary.js";

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

  // Fail fast if any URLs returned error responses
  const errorIssues = headIssues.filter(issue => issue.code === 'error');
  if (errorIssues.length > 0) {
    const urls = errorIssues.map(issue => issue.url).join(', ');
    core.setFailed(`Failed to scan URLs: ${urls}`);
    return;
  }

  const { id } = await uploadIssues(headIssues, headSha);

  if (!id) {
    throw new Error("Failed to upload issues");
  }

  const baseIssues = await retrieveIssues(baseSha);

  await updateComment(baseIssues, headIssues);
  await updateSummary(headIssues);

  if (!baseIssues) {
    return;
  }
  const codes = getCodes([...baseIssues, ...headIssues]);

  console.log("basecodes", baseIssues, "headcodes", headIssues);

  console.log("codes", codes);

  codes.forEach(async (code) => {
    if (
      headIssues.filter((issue) => issue.code === code).length >
      baseIssues.filter((issue) => issue.code === code).length
    ) {
      core.setFailed(`New ${code} issues detected`);
    }
  });
}
