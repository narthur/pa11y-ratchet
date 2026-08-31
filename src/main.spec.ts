import main from "./main.js";
import { describe, it, beforeEach, vi, expect } from "vitest";
import getUrls from "./lib/getUrls.js";
import pa11y from "pa11y";
import getInputs from "./lib/getInputs.js";
import findArtifact from "./services/github/findArtifact.js";
import downloadArtifact from "./services/github/downloadArtifact.js";
import core from "@actions/core";
import readCsv from "./lib/readCsv.js";
import { DefaultArtifactClient } from "@actions/artifact";
import upsertComment from "./services/github/upsertComment.js";

describe("main", () => {
  beforeEach(() => {
    vi.mocked(findArtifact).mockResolvedValue({
      name: "pa11y-ratchet-the_base_sha",
      id: 3,
    } as any);

    vi.mocked(DefaultArtifactClient.prototype.uploadArtifact).mockResolvedValue(
      {
        id: 1,
      }
    );
  });

  it("gets sitemap", async () => {
    await main();

    expect(getUrls).toBeCalledWith("the_sitemap-url");
  });

  it("filters by include input", async () => {
    vi.mocked(getInputs).mockReturnValue({
      sitemapUrl: "the_sitemap-url",
      urls: "",
      find: "the_find",
      replace: "the_replace",
      include: "2$",
      ignore: "",
      configPath: "",
    });

    await main();

    expect(pa11y).toBeCalledTimes(1);
  });

  it("does not filter by include if no include provided", async () => {
    await main();

    expect(pa11y).toBeCalledTimes(2);
  });

  it("respects find and replace", async () => {
    vi.mocked(getUrls).mockResolvedValue(["the_find"]);

    await main();

    expect(pa11y).toBeCalledWith(
      expect.stringContaining("the_replace"),
      expect.anything()
    );
  });

  it("loads and uses the config file correctly", async () => {
    vi.mocked(getInputs).mockReturnValue({
      sitemapUrl: "the_sitemap-url",
      urls: "",
      find: "the_find",
      replace: "the_replace",
      include: "2$",
      ignore: "",
      configPath: "src/config.spec.json",
    });

    await main();

    expect(pa11y).toBeCalledWith(
      expect.anything(),
      expect.objectContaining({
        hideElements: 'iframe[src*="doubleclick.net"]',
      })
    );
  });

  it("uses urls input and skips sitemap fetch", async () => {
    vi.mocked(getInputs).mockReturnValue({
      sitemapUrl: "the_sitemap-url",
      urls: "https://example.com/\nhttps://example.com/about",
      find: "",
      replace: "",
      include: "",
      ignore: "",
      configPath: "",
    });

    await main();

    expect(getUrls).not.toBeCalled();
    expect(pa11y).toBeCalledTimes(2);
  });

  it("applies include/find/replace to urls input", async () => {
    vi.mocked(getInputs).mockReturnValue({
      sitemapUrl: "",
      urls: "https://example.com/home\nhttps://example.com/about",
      find: "about",
      replace: "team",
      include: "about$",
      ignore: "",
      configPath: "",
    });

    await main();

    expect(getUrls).not.toBeCalled();
    expect(pa11y).toBeCalledTimes(1);
    expect(pa11y).toBeCalledWith(
      "https://example.com/team",
      expect.anything()
    );
  });

  it("throws if neither sitemap-url nor urls is provided", async () => {
    vi.mocked(getInputs).mockReturnValue({
      sitemapUrl: "",
      urls: "",
      find: "",
      replace: "",
      include: "",
      ignore: "",
      configPath: "",
    });

    await expect(main()).rejects.toThrow(
      "Either sitemap-url or urls input must be provided"
    );
    expect(getUrls).not.toBeCalled();
    expect(pa11y).not.toBeCalled();
  });

  it("downloads base sha artifact", async () => {
    await main();

    expect(downloadArtifact).toBeCalledWith(
      expect.objectContaining({ artifactId: 3 })
    );
  });

  it("sets failed status if new issues found", async () => {
    vi.mocked(pa11y).mockResolvedValue({
      issues: [
        {
          message: "the_error_message",
          url: "https://the.url",
          code: "the_code",
        },
      ],
    } as any);
    vi.mocked(readCsv).mockResolvedValue([]);

    await main();

    expect(core.setFailed).toBeCalled();
  });

  it("does not set failed status if no new issues found", async () => {
    await main();

    expect(core.setFailed).not.toBeCalled();
  });

  it("uses head sha to name artifact", async () => {
    await main();

    expect(DefaultArtifactClient.prototype.uploadArtifact).toBeCalledWith(
      expect.stringContaining("the_head_sha"),
      expect.anything(),
      expect.anything()
    );
  });

  it("updates comment before updating summary", async () => {
    // WORKAROUND: Updating our PR comment after we update the
    // summary results in the summary being lost.

    await main();

    expect(upsertComment).toBeCalledTimes(1);
    expect(core.summary.write).toBeCalledTimes(1);

    const upsertCommentOrder =
      vi.mocked(upsertComment).mock.invocationCallOrder[0];
    const summaryWriteOrder = vi.mocked(core.summary.write).mock
      .invocationCallOrder[0];

    expect(upsertCommentOrder).toBeLessThan(summaryWriteOrder);
  });

  it("does not fail run if no base artifact found", async () => {
    vi.mocked(pa11y).mockResolvedValue({
      issues: [{ message: "the_error_message", url: "https://the.url" }],
    } as any);
    vi.mocked(findArtifact).mockResolvedValue(undefined);

    await main();

    expect(core.setFailed).not.toBeCalled();
  });

  it("fails if the total issues is the same, but new issues are found for a code", async () => {
    vi.mocked(getUrls).mockResolvedValue(["https://the.url"]);

    vi.mocked(readCsv).mockResolvedValue([
      { code: "the_old_code", url: "https://the.url" },
      { code: "the_code", url: "https://the.url" },
    ]);

    vi.mocked(pa11y).mockResolvedValueOnce({
      issues: [
        {
          message: "the_error_message",
          url: "https://the.url",
          code: "the_code",
        },
        {
          message: "the_error_message",
          url: "https://the.url",
          code: "the_code",
        },
      ],
    } as any);

    await main();

    expect(core.setFailed).toBeCalled();
  });

  it("does not fail on pre-existing issues when a PR adds a new page", async () => {
    // Current sitemap now resolves url1 (existing) and url3 (newly added).
    vi.mocked(getUrls).mockResolvedValue([
      "https://example.com/url1",
      "https://example.com/url3",
    ]);

    // Base run only ever saw url1, with one pre-existing "the_code" issue.
    vi.mocked(readCsv).mockResolvedValue([
      { code: "the_code", url: "https://example.com/url1" },
    ]);

    // Head run's sitemap now also includes url3 (a newly added page), and
    // that new page carries its own "the_code" issues. Raw per-code totals
    // (1 base vs. 2 head) would fail the PR for issues it didn't
    // introduce; restricting the comparison to url1 (present in both
    // runs) should not.
    vi.mocked(pa11y).mockResolvedValueOnce({
      issues: [
        {
          code: "the_code",
          message: "the_error_message",
          url: "https://example.com/url1",
        },
        {
          code: "the_code",
          message: "the_error_message",
          url: "https://example.com/url3",
        },
      ],
    } as any);

    await main();

    expect(core.setFailed).not.toBeCalled();
  });

  it("catches a regression on a page still present when a PR removes other pages", async () => {
    // Current sitemap only lists url1 -- url2 has been removed from the
    // site since the base run.
    vi.mocked(getUrls).mockResolvedValue(["https://example.com/url1"]);

    // Base run saw both url1 (1 issue) and url2 (5 issues) of "the_code".
    vi.mocked(readCsv).mockResolvedValue([
      { code: "the_code", url: "https://example.com/url1" },
      { code: "the_code", url: "https://example.com/url2" },
      { code: "the_code", url: "https://example.com/url2" },
      { code: "the_code", url: "https://example.com/url2" },
      { code: "the_code", url: "https://example.com/url2" },
      { code: "the_code", url: "https://example.com/url2" },
    ]);

    // Head run only scans url1, which has regressed from 1 to 2 issues.
    // Raw totals (2 head vs. 6 base) would mask this regression because
    // url2 dropping out lowers the head total; restricting the
    // comparison to url1 (present in both runs) should still catch it.
    vi.mocked(pa11y).mockResolvedValueOnce({
      issues: [
        {
          code: "the_code",
          message: "the_error_message",
          url: "https://example.com/url1",
        },
        {
          code: "the_code",
          message: "the_error_message",
          url: "https://example.com/url1",
        },
      ],
    } as any);

    await main();

    expect(core.setFailed).toBeCalled();
  });

  it("logs how many URLs were excluded when the URL set changes between runs", async () => {
    vi.mocked(getUrls).mockResolvedValue(["https://example.com/url1"]);

    vi.mocked(readCsv).mockResolvedValue([
      { code: "the_code", url: "https://example.com/url1" },
      { code: "the_code", url: "https://example.com/url2" },
    ]);

    vi.mocked(pa11y).mockResolvedValueOnce({
      issues: [
        {
          code: "the_code",
          message: "the_error_message",
          url: "https://example.com/url1",
        },
      ],
    } as any);

    await main();

    expect(core.info).toBeCalledWith(
      expect.stringContaining("1 URL(s) from the base run are no longer present")
    );
  });

  it("does not log an excluded-URL count when the URL set is unchanged", async () => {
    vi.mocked(getUrls).mockResolvedValue(["https://example.com/url1"]);

    vi.mocked(readCsv).mockResolvedValue([
      { code: "the_code", url: "https://example.com/url1" },
    ]);

    vi.mocked(pa11y).mockResolvedValueOnce({
      issues: [
        {
          code: "the_code",
          message: "the_error_message",
          url: "https://example.com/url1",
        },
      ],
    } as any);

    await main();

    expect(core.info).not.toBeCalled();
  });

  it("catches a regression when a code's only base occurrences were on a now-removed page", async () => {
    // Current sitemap lists url1 -- url2 has been removed from the site.
    vi.mocked(getUrls).mockResolvedValue(["https://example.com/url1"]);

    // url1 already had a base issue (a different code), so it's verifiably
    // common to both runs -- not merely "no base data for it", which would
    // be the unresolvable added-vs-previously-clean ambiguity this fix
    // deliberately doesn't try to solve. "the_code"'s only base occurrence
    // was on url2, now gone.
    vi.mocked(readCsv).mockResolvedValue([
      { code: "other_code", url: "https://example.com/url1" },
      { code: "the_code", url: "https://example.com/url2" },
    ]);

    // Head run finds a fresh "the_code" issue on url1, a page confirmed
    // common to both runs. baseCountForCode for "the_code" (1) is nonzero,
    // so this exercises the restricted-comparison branch, not the
    // zero-base-count fallback -- and within that branch,
    // comparableBaseCount is 0 because the only base occurrence of
    // "the_code" sits outside commonUrls. That must still register as a
    // regression, not be treated as "no data to compare".
    vi.mocked(pa11y).mockResolvedValueOnce({
      issues: [
        {
          code: "the_code",
          message: "the_error_message",
          url: "https://example.com/url1",
        },
      ],
    } as any);

    await main();

    expect(core.setFailed).toBeCalled();
  });

  it("does not fail when a common page goes fully clean and an unrelated common page has an unchanged issue count", async () => {
    // Both url1 and url2 are scanned in both runs.
    vi.mocked(getUrls).mockResolvedValue([
      "https://example.com/url1",
      "https://example.com/url2",
    ]);

    // Base: url1 has 1 "the_code" issue; url2 has 1 "other_code" issue
    // (present only so url2 is verifiably common, per the same reasoning
    // as the test above).
    vi.mocked(readCsv).mockResolvedValue([
      { code: "the_code", url: "https://example.com/url1" },
      { code: "other_code", url: "https://example.com/url2" },
    ]);

    // Head: url1 is now fully clean (0 issues of any code) -- pinning the
    // fix from `headUrls = new Set(headIssues...)` to
    // `headUrls = new Set(urls)`. Under the old, issue-derived headUrls, a
    // page with zero head issues produces no head issue record at all, so
    // it would silently drop out of commonUrls even though it was
    // genuinely scanned -- taking its base "the_code" occurrence with it.
    // That would leave comparableBaseCount("the_code") at 0 while url2's
    // fresh "the_code" occurrence (below) still counts, wrongly failing
    // the PR even though the total "the_code" count is unchanged (1 base,
    // 1 head). With url1 correctly retained in commonUrls, both totals
    // stay at 1 and the PR should not fail.
    vi.mocked(pa11y)
      .mockResolvedValueOnce({ issues: [] } as any)
      .mockResolvedValueOnce({
        issues: [
          {
            code: "the_code",
            message: "the_error_message",
            url: "https://example.com/url2",
          },
        ],
      } as any);

    await main();

    expect(core.setFailed).not.toBeCalled();
  });

  it("fails immediately if pa11y returns an error issue, without comparing to base", async () => {
    vi.mocked(pa11y).mockRejectedValue(new Error("the_error_message"));

    await expect(main()).rejects.toThrow("the_error_message");

    expect(downloadArtifact).not.toBeCalled();
  });

  it("does not fail on ignored code", async () => {
    vi.mocked(readCsv).mockResolvedValue([]);

    vi.mocked(getInputs).mockReturnValue({
      ignore: "the_ignored_code",
      sitemapUrl: "the_sitemap-url",
      find: "the_find",
      replace: "the_replace",
      include: "2$",
      configPath: "",
    } as any);

    vi.mocked(pa11y).mockResolvedValue({
      issues: [
        {
          code: "the_ignored_code",
          message: "the_error_message",
          url: "https://the.url",
        },
      ],
    } as any);

    await main();

    expect(core.setFailed).not.toBeCalled();
  });

  it("warns about ignore codes that match none of the scanned issues", async () => {
    vi.mocked(readCsv).mockResolvedValue([]);

    vi.mocked(getInputs).mockReturnValue({
      // htmlcs-shaped code, but the scan below returns an axe-shaped code,
      // so this entry should never match anything.
      ignore: "WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail",
      sitemapUrl: "the_sitemap-url",
      find: "the_find",
      replace: "the_replace",
      include: "2$",
      configPath: "",
    } as any);

    vi.mocked(pa11y).mockResolvedValue({
      issues: [
        {
          code: "color-contrast",
          message: "the_error_message",
          url: "https://the.url",
        },
      ],
    } as any);

    await main();

    expect(core.warning).toBeCalledWith(
      expect.stringContaining(
        "WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail"
      )
    );
  });

  it("does not warn about ignore codes that match a scanned issue", async () => {
    vi.mocked(readCsv).mockResolvedValue([]);

    vi.mocked(getInputs).mockReturnValue({
      ignore: "the_ignored_code",
      sitemapUrl: "the_sitemap-url",
      find: "the_find",
      replace: "the_replace",
      include: "2$",
      configPath: "",
    } as any);

    vi.mocked(pa11y).mockResolvedValue({
      issues: [
        {
          code: "the_ignored_code",
          message: "the_error_message",
          url: "https://the.url",
        },
      ],
    } as any);

    await main();

    expect(core.warning).not.toBeCalled();
  });

  it("warns only about the unmatched entry in a mixed ignore list", async () => {
    vi.mocked(readCsv).mockResolvedValue([]);

    vi.mocked(getInputs).mockReturnValue({
      ignore: "the_ignored_code,WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail",
      sitemapUrl: "the_sitemap-url",
      find: "the_find",
      replace: "the_replace",
      include: "2$",
      configPath: "",
    } as any);

    vi.mocked(pa11y).mockResolvedValue({
      issues: [
        {
          code: "the_ignored_code",
          message: "the_error_message",
          url: "https://the.url",
        },
      ],
    } as any);

    await main();

    expect(core.warning).toBeCalledTimes(1);
    expect(core.warning).toBeCalledWith(
      expect.stringContaining(
        "WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail"
      )
    );
    expect(core.warning).not.toBeCalledWith(
      expect.stringContaining("the_ignored_code")
    );
  });

  it("warns about an unmatched ignore code even when no base artifact is found", async () => {
    // Regression check: the warning used to sit after the `if (!baseIssues)
    // return` early exit, so it silently never fired on a PR's first run --
    // exactly when someone is most likely to be newly wiring up `ignore`.
    vi.mocked(findArtifact).mockResolvedValue(undefined);

    vi.mocked(getInputs).mockReturnValue({
      ignore: "WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail",
      sitemapUrl: "the_sitemap-url",
      find: "the_find",
      replace: "the_replace",
      include: "2$",
      configPath: "",
    } as any);

    vi.mocked(pa11y).mockResolvedValue({
      issues: [
        {
          code: "color-contrast",
          message: "the_error_message",
          url: "https://the.url",
        },
      ],
    } as any);

    await main();

    expect(core.warning).toBeCalledWith(
      expect.stringContaining(
        "WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail"
      )
    );
  });
});
