import main from "./main.js";
import { describe, it, beforeEach, vi, expect } from "vitest";
import core from "@actions/core";
import getUrls from "./lib/getUrls.js";
import pa11y from "pa11y";
import getInputs from "./lib/getInputs.js";

describe("main", () => {
  beforeEach(() => {
    vi.mocked(core.getInput).mockImplementation((key: string) => {
      return `the_${key}`;
    });
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
    vi.mocked(core.getInput).mockImplementation((key: string) => {
      return key === "include" ? "" : `the_${key}`;
    });

    await main();

    expect(pa11y).toBeCalledTimes(2);
  });

  it("respects find and replace", async () => {
    vi.mocked(getUrls).mockResolvedValue(["the_find"]);

    await main();

    expect(pa11y).toBeCalledWith(expect.stringContaining("the_replace"));
  });
});
