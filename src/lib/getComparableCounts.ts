import { Issue } from "./scanUrls.js";

export type UrlIntersection = {
  commonUrls: Set<string>;
  addedUrls: string[];
  removedUrls: string[];
};

/**
 * Determines which URLs are present in both the base and head runs.
 *
 * Base URL membership can only be derived from base's stored issue
 * records -- a URL scanned-and-clean in that run leaves no record, so
 * it's indistinguishable from a URL that wasn't scanned at all. Head URL
 * membership comes from `urls`, every URL this run actually scanned,
 * rather than from head issues -- otherwise a common page that's now
 * clean in head would wrongly look absent from head too.
 */
export function getUrlIntersection(
  baseIssues: Issue[],
  urls: string[]
): UrlIntersection {
  const baseUrls = new Set(baseIssues.map((issue) => issue.url));
  const headUrls = new Set(urls);
  const commonUrls = new Set(
    [...baseUrls].filter((url) => headUrls.has(url))
  );
  const addedUrls = [...headUrls].filter((url) => !baseUrls.has(url));
  const removedUrls = [...baseUrls].filter((url) => !headUrls.has(url));

  return { commonUrls, addedUrls, removedUrls };
}

export type ComparableCounts = {
  code: string;
  baseCount: number;
  headCount: number;
};

/**
 * Counts base and head issues for a single code, restricted to URLs
 * common to both runs. A code with zero occurrences anywhere in the
 * base run has nothing for URL-set drift to dilute -- any occurrence in
 * head is a genuine regression -- so that case compares raw totals
 * instead.
 *
 * This is the rule the pass/fail gate uses; the PR comment must use the
 * exact same rule so the two can never disagree.
 */
export function getComparableCounts(
  code: string,
  baseIssues: Issue[],
  headIssues: Issue[],
  commonUrls: Set<string>
): ComparableCounts {
  const baseCountForCode = baseIssues.filter((v) => v.code === code).length;

  if (baseCountForCode === 0) {
    return {
      code,
      baseCount: 0,
      headCount: headIssues.filter((v) => v.code === code).length,
    };
  }

  return {
    code,
    baseCount: baseIssues.filter(
      (v) => v.code === code && commonUrls.has(v.url)
    ).length,
    headCount: headIssues.filter(
      (v) => v.code === code && commonUrls.has(v.url)
    ).length,
  };
}
