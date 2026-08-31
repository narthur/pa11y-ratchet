import getUrls from "./lib/getUrls.js";
import getInputs from "./lib/getInputs.js";
import updateComment from "./lib/updateComment.js";
import { getCodes } from "./lib/getCodes.js";
import core from "@actions/core";
import findPr from "./services/github/findPr.js";
import { HEAD_SHA } from "./services/github/constants.js";
import scanUrls from "./lib/scanUrls.js";
import uploadIssues from "./lib/uploadIssues.js";
import retrieveIssues from "./lib/retrieveIssues.js";
import updateSummary from "./lib/updateSummary.js";
import { getIgnoredCodes } from "./lib/getIgnoredCodes.js";
import { getUrlIntersection, getComparableCounts } from "./lib/getComparableCounts.js";

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

  let rawUrls: string[];

  if (inputs.urls) {
    rawUrls = inputs.urls
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (rawUrls.length === 0) {
      throw new Error("urls input was provided but no valid URLs were found");
    }
  } else if (inputs.sitemapUrl) {
    rawUrls = await getUrls(inputs.sitemapUrl);
  } else {
    throw new Error("Either sitemap-url or urls input must be provided");
  }

  console.log(`Resolved ${rawUrls.length} URL(s) before filtering`);

  const urls = rawUrls
    .filter((url: string) => includeRegex.test(url))
    .map((url: string) => url.replace(inputs.find, inputs.replace));

  const headIssues = await scanUrls(urls);

  const { id } = await uploadIssues(headIssues, headSha);

  if (!id) {
    throw new Error("Failed to upload issues");
  }

  const baseIssues = await retrieveIssues(baseSha);

  await updateComment(baseIssues, headIssues, urls);
  await updateSummary(headIssues);

  const ignoredCodes = getIgnoredCodes();

  // Codes seen so far for this PR: the current scan plus the base branch's
  // last recorded scan, when one exists. Computed even with no base
  // artifact (e.g. the very first run on a PR) so the check below isn't
  // itself a silent no-op on that path.
  const codes = getCodes([...(baseIssues ?? []), ...headIssues]);

  // `ignore` codes are runner-specific (htmlcs vs. axe). An entry that
  // matches none of the codes seen in this scan is almost always a
  // mistake -- and it fails silently in the dangerous direction, since
  // the rule it was meant to ignore stays active. Warn so it's visible.
  const unmatchedIgnoredCodes = ignoredCodes.filter(
    (ignoredCode) => !codes.includes(ignoredCode)
  );

  unmatchedIgnoredCodes.forEach((code) => {
    core.warning(
      `ignore code "${code}" matched no issues in this scan. ` +
        `Ignore codes must match the configured runner's code format ` +
        `(e.g. "color-contrast" for axe, ` +
        `"WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail" for htmlcs).`
    );
  });

  if (!baseIssues) {
    return;
  }

  console.log("basecodes", baseIssues, "headcodes", headIssues);

  console.log("codes", codes);

  // Base counts come from a stored artifact of the base SHA, while head
  // URLs come from the *current* sitemap. Nothing guarantees the two runs
  // covered the same URLs: a PR that adds pages would raise head's raw
  // totals and could fail on issues it didn't introduce, and a PR that
  // removes pages would lower head's raw totals and could mask a genuine
  // regression on a page that's still there. Restrict the comparison to
  // URLs seen in both runs so drift in the URL set doesn't produce a
  // false pass or fail -- except for a code with zero occurrences in the
  // base run, which always compares on raw totals regardless of URL
  // overlap (see getComparableCounts).
  const { commonUrls, addedUrls, removedUrls } = getUrlIntersection(
    baseIssues,
    urls
  );

  if (addedUrls.length > 0 || removedUrls.length > 0) {
    core.info(
      `Comparing issues on the ${commonUrls.size} URL(s) common to both ` +
        `the base and head runs. ${addedUrls.length} URL(s) are new in ` +
        `this run and ${removedUrls.length} URL(s) from the base run are ` +
        `no longer present; issues on those URLs were excluded from the ` +
        `pass/fail comparison (codes with no prior occurrences in the ` +
        `base run are still compared on raw totals -- see below).`
    );
  }

  codes.forEach(async (code) => {
    if (ignoredCodes.includes(code)) {
      return;
    }

    const { baseCount, headCount } = getComparableCounts(
      code,
      baseIssues,
      headIssues,
      commonUrls
    );

    if (headCount > baseCount) {
      core.setFailed(`New ${code} issues detected`);
    }
  });
}
