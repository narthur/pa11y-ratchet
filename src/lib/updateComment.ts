import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import core from "@actions/core";
import getSummaryUrl from "../services/github/getSummaryUrl.js";
import sleep from "./sleep.js";
import { getIgnoredCodes } from "./getIgnoredCodes.js";
import { getCodes } from "./getCodes.js";
import {
  getUrlIntersection,
  getComparableCounts,
} from "./getComparableCounts.js";

// Same restricted comparison the pass/fail gate uses (see
// getComparableCounts), so the totals shown here can't disagree with
// whether the check passed.
function addSummary(
  baseIssues: Issue[] | undefined,
  headIssues: Issue[],
  commonUrls: Set<string> | undefined
) {
  if (!baseIssues?.length || !commonUrls) {
    core.summary.addRaw(`<p>No baseline issues found.</p>`);
    core.summary.addTable([
      ["Baseline", "Head"],
      ["-", headIssues.length.toString()],
    ]);
    return;
  }

  const codes = getCodes([...baseIssues, ...headIssues]);
  const { baseLen, headLen } = codes.reduce(
    (totals, code) => {
      const { baseCount, headCount } = getComparableCounts(
        code,
        baseIssues,
        headIssues,
        commonUrls
      );
      return {
        baseLen: totals.baseLen + baseCount,
        headLen: totals.headLen + headCount,
      };
    },
    { baseLen: 0, headLen: 0 }
  );

  if (baseLen === headLen) {
    core.summary.addRaw(`<p>Issue count is the same as the baseline.</p>`);
  } else if (baseLen > headLen) {
    core.summary.addRaw(`<p>🎉 Issue count is less than the baseline!</p>`);
  } else {
    core.summary.addRaw(`<p>🚨 Issue count is greater than the baseline.</p>`);
  }

  core.summary.addTable([
    ["Baseline", "Head"],
    [baseLen.toString(), headLen.toString()],
  ]);
}

function addUrlDrift(addedUrls: string[], removedUrls: string[]) {
  if (addedUrls.length === 0 && removedUrls.length === 0) {
    return;
  }

  core.summary.addRaw(
    `<p>The set of scanned URLs changed since the baseline: ` +
      `${addedUrls.length} URL(s) are new and ${removedUrls.length} URL(s) ` +
      `are no longer present. Counts above and below are restricted to ` +
      `URLs present in both runs, so newly added or removed pages don't ` +
      `skew the comparison.</p>`
  );
}

function addIgnoredCodes(headIssues: Issue[]) {
  const ignoredCodes = getIgnoredCodes();

  if (!ignoredCodes.length) {
    return;
  }

  core.summary.addHeading("Ignored Codes", 3);

  const codesResolved = ignoredCodes.filter(
    (code) => !headIssues.some((issue) => issue.code === code)
  );

  core.summary.addRaw(
    `<p>The following codes are ignored, and will not result in a CI failure.</p>`
  );

  core.summary.addList(ignoredCodes);

  if (!codesResolved.length) return;

  core.summary.addRaw(
    `<p>The following ignored codes were not found in this PR. Please consider removing them from the list of ignored codes.</p>`
  );

  core.summary.addList(codesResolved);
}

// Same restricted comparison the pass/fail gate uses (see
// getComparableCounts), so a code's Before/After counts here can't
// disagree with whether that code failed the check.
function addComparativeTable(
  baseIssues: Issue[],
  headIssues: Issue[],
  commonUrls: Set<string>
) {
  const codes = getCodes([...baseIssues, ...headIssues]);
  const data = codes.map((code) =>
    getComparableCounts(code, baseIssues, headIssues, commonUrls)
  );

  core.summary.addTable([
    ["Code", "Before", "After", "Net Change"],
    ...data.map((d) => [
      d.code,
      d.baseCount.toString(),
      d.headCount.toString(),
      (d.headCount - d.baseCount).toString(),
    ]),
  ]);
}

function addHeadTable(headIssues: Issue[]) {
  const codes = getCodes(headIssues);

  core.summary.addTable([
    ["Code", "Count"],
    ...codes.map((code) => [
      code,
      headIssues.filter((issue) => issue.code === code).length.toString(),
    ]),
  ]);
}

export default async function updateComment(
  baseIssues: Issue[] | undefined,
  headIssues: Issue[],
  urls: string[]
) {
  core.summary.emptyBuffer();

  // WORKAROUND: Wait for buffer to be emptied
  await sleep(1000);

  core.summary.addHeading("Accessibility Issues", 2);

  // Restricted to the same base/head URL intersection the pass/fail gate
  // uses, so the comment can never disagree with whether the check
  // passed. See getComparableCounts for the rule.
  const urlIntersection = baseIssues
    ? getUrlIntersection(baseIssues, urls)
    : undefined;

  core.summary.addHeading("Summary", 3);

  addSummary(baseIssues, headIssues, urlIntersection?.commonUrls);

  if (urlIntersection) {
    addUrlDrift(urlIntersection.addedUrls, urlIntersection.removedUrls);
  }

  core.summary.addHeading("Issue Breakdown", 3);

  if (baseIssues && urlIntersection) {
    addComparativeTable(baseIssues, headIssues, urlIntersection.commonUrls);
  } else {
    addHeadTable(headIssues);
  }

  const summaryUrl = await getSummaryUrl();

  core.summary.addLink("View full breakdown", summaryUrl);

  addIgnoredCodes(headIssues);

  const body = core.summary.stringify();

  await upsertComment(body);
}
