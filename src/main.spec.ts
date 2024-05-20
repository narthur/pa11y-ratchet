import main from "./main.js";
import { describe, it, beforeEach, vi, expect } from "vitest";
import getUrls from "./lib/getUrls.js";
import pa11y from "pa11y";
import getInputs from "./lib/getInputs.js";
import { DefaultArtifactClient } from "@actions/artifact";
import findArtifact from "./services/artifacts/findArtifact.js";

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

    expect(DefaultArtifactClient.prototype.downloadArtifact).toBeCalledWith(
      3,
      expect.anything()
    );
  });
});
