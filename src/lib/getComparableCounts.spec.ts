import { describe, it, expect } from "vitest";
import { getUrlIntersection, getComparableCounts } from "./getComparableCounts.js";

describe("getUrlIntersection", () => {
  it("returns URLs present in both base and head as common", () => {
    const baseIssues = [
      { code: "the_code", url: "https://example.com/url1" },
    ] as any;

    const { commonUrls } = getUrlIntersection(baseIssues, [
      "https://example.com/url1",
      "https://example.com/url2",
    ]);

    expect(commonUrls).toEqual(new Set(["https://example.com/url1"]));
  });

  it("lists a head-only URL as added", () => {
    const baseIssues = [
      { code: "the_code", url: "https://example.com/url1" },
    ] as any;

    const { addedUrls } = getUrlIntersection(baseIssues, [
      "https://example.com/url1",
      "https://example.com/url2",
    ]);

    expect(addedUrls).toEqual(["https://example.com/url2"]);
  });

  it("lists a base-only URL as removed", () => {
    const baseIssues = [
      { code: "the_code", url: "https://example.com/url1" },
      { code: "the_code", url: "https://example.com/url2" },
    ] as any;

    const { removedUrls } = getUrlIntersection(baseIssues, [
      "https://example.com/url1",
    ]);

    expect(removedUrls).toEqual(["https://example.com/url2"]);
  });

  it("derives head URL membership from `urls`, not from which URLs have base-matching issues", () => {
    // url1 has no base issues of its own recorded here, but it IS in the
    // scanned `urls` list, so it must not be misclassified as absent from
    // head just because head happened to find nothing there.
    const baseIssues = [
      { code: "the_code", url: "https://example.com/url1" },
    ] as any;

    const { commonUrls, removedUrls } = getUrlIntersection(baseIssues, [
      "https://example.com/url1",
    ]);

    expect(commonUrls.has("https://example.com/url1")).toBe(true);
    expect(removedUrls).toEqual([]);
  });

  it("returns no added or removed URLs when the set is unchanged", () => {
    const baseIssues = [
      { code: "the_code", url: "https://example.com/url1" },
    ] as any;

    const { addedUrls, removedUrls } = getUrlIntersection(baseIssues, [
      "https://example.com/url1",
    ]);

    expect(addedUrls).toEqual([]);
    expect(removedUrls).toEqual([]);
  });
});

describe("getComparableCounts", () => {
  it("restricts base and head counts to URLs common to both runs", () => {
    const baseIssues = [
      { code: "the_code", url: "https://example.com/url1" },
      { code: "the_code", url: "https://example.com/url2" },
    ] as any;
    const headIssues = [
      { code: "the_code", url: "https://example.com/url1" },
      { code: "the_code", url: "https://example.com/url3" },
    ] as any;
    // url2 (base-only) and url3 (head-only) are both excluded; only
    // url1 is common.
    const commonUrls = new Set(["https://example.com/url1"]);

    const result = getComparableCounts(
      "the_code",
      baseIssues,
      headIssues,
      commonUrls
    );

    expect(result).toEqual({
      code: "the_code",
      baseCount: 1,
      headCount: 1,
    });
  });

  it("compares raw totals for a code with zero occurrences anywhere in base, ignoring commonUrls", () => {
    const baseIssues = [
      { code: "other_code", url: "https://example.com/url1" },
    ] as any;
    const headIssues = [
      { code: "new_code", url: "https://example.com/url2" },
    ] as any;
    // url2 is not in commonUrls at all -- the zero-base-count carve-out
    // must still surface it.
    const commonUrls = new Set(["https://example.com/url1"]);

    const result = getComparableCounts(
      "new_code",
      baseIssues,
      headIssues,
      commonUrls
    );

    expect(result).toEqual({
      code: "new_code",
      baseCount: 0,
      headCount: 1,
    });
  });

  it("does not fall back to raw totals when a code's only base occurrences are outside commonUrls", () => {
    // "the_code" has a nonzero raw base count (on url2), so it must stay
    // on the restricted comparison -- not qualify for the zero-base-count
    // exception just because none of its base occurrences survive the
    // intersection.
    const baseIssues = [
      { code: "the_code", url: "https://example.com/url2" },
    ] as any;
    const headIssues = [
      { code: "the_code", url: "https://example.com/url1" },
    ] as any;
    const commonUrls = new Set(["https://example.com/url1"]);

    const result = getComparableCounts(
      "the_code",
      baseIssues,
      headIssues,
      commonUrls
    );

    expect(result).toEqual({
      code: "the_code",
      baseCount: 0,
      headCount: 1,
    });
  });
});
