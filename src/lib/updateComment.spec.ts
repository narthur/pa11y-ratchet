import { describe, it, expect, vi } from "vitest";
import updateComment from "./updateComment.js";
import upsertComment from "../services/github/upsertComment.js";
import getInputs from "./getInputs.js";
import { getUrlIntersection } from "./getComparableCounts.js";

describe("commentIssues", () => {
  it("creates comment", async () => {
    await updateComment([], [], undefined);

    expect(upsertComment).toHaveBeenCalled();
  });

  it("does not include ignored codes section when no ignored codes", async () => {
    await updateComment([], [], undefined);

    expect(upsertComment).toHaveBeenCalledWith(
      expect.not.stringContaining("Ignored Codes")
    );
  });

  it("lists ignored codes", async () => {
    vi.mocked(getInputs).mockReturnValue({
      ignore: "the_ignored_code",
    } as any);

    await updateComment([], [], undefined);

    expect(upsertComment).toHaveBeenCalledWith(
      expect.stringContaining("the_ignored_code")
    );
  });

  it("restricts the comparative table to URLs common to both runs", async () => {
    // url2 is a newly added page: it's in `urls` (this run's scan) but
    // wasn't seen in `baseIssues`. Its issue must not count toward
    // "the_code"'s After total, or the table would disagree with the
    // gate, which excludes it too.
    const baseIssues = [
      { code: "the_code", url: "https://example.com/url1" },
    ] as any;
    const headIssues = [
      { code: "the_code", url: "https://example.com/url1" },
      { code: "the_code", url: "https://example.com/url2" },
    ] as any;
    const urls = [
      "https://example.com/url1",
      "https://example.com/url2",
    ];

    await updateComment(
      baseIssues,
      headIssues,
      getUrlIntersection(baseIssues, urls)
    );

    expect(upsertComment).toHaveBeenCalledWith(
      expect.stringContaining("| the_code | 1 | 1 | 0 |")
    );
  });

  it("uses raw totals for a code with zero occurrences anywhere in base", async () => {
    // "new_code" only exists in head, on a URL outside the base/head
    // intersection -- the same zero-base-count carve-out the gate uses
    // (see getComparableCounts). The table must still show the raw head
    // count rather than treating "not in the intersection" as "no data".
    const baseIssues = [
      { code: "other_code", url: "https://example.com/url1" },
    ] as any;
    const headIssues = [
      { code: "other_code", url: "https://example.com/url1" },
      { code: "new_code", url: "https://example.com/url2" },
    ] as any;
    const urls = [
      "https://example.com/url1",
      "https://example.com/url2",
    ];

    await updateComment(
      baseIssues,
      headIssues,
      getUrlIntersection(baseIssues, urls)
    );

    expect(upsertComment).toHaveBeenCalledWith(
      expect.stringContaining("| new_code | 0 | 1 | 1 |")
    );
  });

  it("surfaces added and removed URL counts when the URL set drifts", async () => {
    const baseIssues = [
      { code: "the_code", url: "https://example.com/url1" },
      { code: "the_code", url: "https://example.com/url2" },
    ] as any;
    const headIssues = [
      { code: "the_code", url: "https://example.com/url1" },
    ] as any;
    const urls = ["https://example.com/url1", "https://example.com/url3"];

    await updateComment(
      baseIssues,
      headIssues,
      getUrlIntersection(baseIssues, urls)
    );

    expect(upsertComment).toHaveBeenCalledWith(
      expect.stringContaining(
        "1 URL(s) are new and 1 URL(s) are no longer present"
      )
    );
  });

  it("does not mention URL drift when the URL set is unchanged", async () => {
    const baseIssues = [
      { code: "the_code", url: "https://example.com/url1" },
    ] as any;
    const headIssues = [
      { code: "the_code", url: "https://example.com/url1" },
    ] as any;
    const urls = ["https://example.com/url1"];

    await updateComment(
      baseIssues,
      headIssues,
      getUrlIntersection(baseIssues, urls)
    );

    expect(upsertComment).toHaveBeenCalledWith(
      expect.not.stringContaining("URLs changed")
    );
  });

  it("treats a genuinely empty baseline as no baseline, not as a full URL-drift signal", async () => {
    // baseIssues is a real (if empty) array here -- the base run
    // executed and found zero issues, as opposed to no base artifact at
    // all (undefined). An empty base carries no URL records, so
    // getUrlIntersection would otherwise report every current URL as
    // "added". The comment must not surface that as a drift message, and
    // must still show "No baseline issues found" rather than a computed
    // 0-vs-N total.
    const baseIssues: any[] = [];
    const headIssues = [
      { code: "the_code", url: "https://example.com/url1" },
    ] as any;
    const urls = ["https://example.com/url1"];

    await updateComment(
      baseIssues,
      headIssues,
      getUrlIntersection(baseIssues, urls)
    );

    expect(upsertComment).toHaveBeenCalledWith(
      expect.stringContaining("No baseline issues found")
    );
    expect(upsertComment).toHaveBeenCalledWith(
      expect.not.stringContaining("URL(s) are new")
    );
  });
});
