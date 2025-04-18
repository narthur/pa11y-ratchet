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
    vi.mocked(readCsv).mockResolvedValue([
      { code: "the_old_code" },
      { code: "the_code" },
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
});
