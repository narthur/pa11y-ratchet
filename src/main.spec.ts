import main from "./main.js";
import { describe, it, beforeEach, vi, expect } from "vitest";
import getUrls from "./lib/getUrls.js";
import pa11y from "pa11y";
import getInputs from "./lib/getInputs.js";
import findArtifact from "./services/artifacts/findArtifact.js";
import downloadArtifact from "./services/artifacts/downloadArtifact.js";
import core from "@actions/core";
import readCsv from "./lib/readCsv.js";

describe("main", () => {
  beforeEach(() => {
    vi.mocked(findArtifact).mockResolvedValue({
      name: "pa11y-ratchet-the_base_sha",
      id: 3,
    } as any);
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

    expect(pa11y).toBeCalledWith(expect.stringContaining("the_replace"));
  });

  it("downloads base sha artifact", async () => {
    await main();

    expect(downloadArtifact).toBeCalledWith(
      expect.objectContaining({ artifactId: 3 })
    );
  });

  it("sets failed status if new issues found", async () => {
    vi.mocked(readCsv).mockImplementation((path: string) => {
      if (path.includes("the_base_sha")) {
        return Promise.resolve([]);
      }
      return Promise.resolve([{}]);
    });

    await main();

    expect(core.setFailed).toBeCalled();
  });

  it("does not set failed status if no new issues found", async () => {
    await main();

    expect(core.setFailed).not.toBeCalled();
  });
});
