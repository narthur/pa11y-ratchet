import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import core from "@actions/core";
import getSummaryUrl from "../services/github/getSummaryUrl.js";
import sleep from "./sleep.js";
import { getIgnoredCodes } from "./getIgnoredCodes.js";
import { getCodes } from "./getCodes.js";
import {
  getComparableCounts,
  ComparableCounts,
  UrlIntersection,
} from "./getComparableCounts.js";

// `data` is this code's Before/After counts under the same restricted
// comparison the pass/fail gate uses (see getComparableCounts). Summing
// it here gives an aggregate total that reflects the same underlying
// counts as the gate, but -- because the gate fails on any single
// code's regression while this sums across all codes -- an aggregate
// "unchanged" doesn't itself guarantee every code passed. The per-code
// table (addComparativeTable) is what actually mirrors the gate's
// decision one-for-one.
function addSummary(data: ComparableCounts[] | undefined, headIssues: Issue[]) {
  if (!data) {
    core.summary.addRaw(`<p>No baseline issues found.</p>`);
    core.summary.addTable([
      ["Baseline", "Head"],
      ["-", headIssues.length.toString()],
    ]);
    return;
  }

  const { baseLen, headLen } = data.reduce(
    (totals, { baseCount, headCount }) => ({
      baseLen: totals.baseLen + baseCount,
      headLen: totals.headLen + headCount,
    }),
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

// Skipped when there's no real baseline to drift from (no artifact, or
// a baseline that's a genuinely empty scan) -- otherwise every current
// URL would be misreported as "added" just because an empty baseline
// has no URLs on record at all.
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
function addComparativeTable(data: ComparableCounts[]) {
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
  // Precomputed by main.ts (getUrlIntersection), not recomputed here --
  // one computation shared by both the gate and the comment, per code
  // and in aggregate, rather than two calls that happen to agree.
  urlIntersection: UrlIntersection | undefined
) {
  core.summary.emptyBuffer();

  // WORKAROUND: Wait for buffer to be emptied
  await sleep(1000);

  core.summary.addHeading("Accessibility Issues", 2);

  // Same restricted comparison the pass/fail gate uses (see
  // getComparableCounts), computed once here and reused for both the
  // Summary total and the per-code table below.
  const data: ComparableCounts[] | undefined =
    baseIssues && urlIntersection
      ? getCodes([...baseIssues, ...headIssues]).map((code) =>
          getComparableCounts(code, baseIssues, headIssues, urlIntersection.commonUrls)
        )
      : undefined;

  core.summary.addHeading("Summary", 3);

  // A genuinely empty baseline (base run executed, found zero issues)
  // is treated as "no baseline" here, same as before this refactor --
  // it's indistinguishable from "not scanned at all" once nothing was
  // recorded to compare against.
  addSummary(baseIssues?.length ? data : undefined, headIssues);

  // Same guard: an empty baseline carries no URL records at all, so
  // every current URL would misleadingly read as "added" -- an artifact
  // of having nothing to compare against, not a real drift signal.
  if (baseIssues?.length && urlIntersection) {
    addUrlDrift(urlIntersection.addedUrls, urlIntersection.removedUrls);
  }

  core.summary.addHeading("Issue Breakdown", 3);

  if (data) {
    addComparativeTable(data);
  } else {
    addHeadTable(headIssues);
  }

  const summaryUrl = await getSummaryUrl();

  core.summary.addLink("View full breakdown", summaryUrl);

  addIgnoredCodes(headIssues);

  const body = core.summary.stringify();

  await upsertComment(body);
}
