import { describe, it, expect, vi } from "vitest";
import scanUrls from "./scanUrls.js";
import pa11y from "pa11y";
import * as fs from "node:fs/promises";
import getInputs from "./getInputs.js";

vi.mock("node:fs/promises");

describe("scanUrls", () => {
  it("uses noSandbox arg", async () => {
    await scanUrls(["https://example.com"]);

    // Trailing slash: URL normalization gives a bare origin its root
    // path. Same resource, and the issue's stored `url` keeps the
    // original string, so nothing downstream sees the difference.
    expect(pa11y).toHaveBeenCalledWith(
      "https://example.com/",
      expect.objectContaining({
        chromeLaunchConfig: expect.objectContaining({
          args: ["--no-sandbox"],
        }),
      })
    );
  });

  it("percent-encodes a raw space in the path before fetching", async () => {
    await scanUrls(["https://example.com/authors/Adam Wolf/"]);

    expect(pa11y).toHaveBeenCalledWith(
      "https://example.com/authors/Adam%20Wolf/",
      expect.anything()
    );
  });

  it("does not double-encode a URL that is already percent-encoded", async () => {
    await scanUrls(["https://example.com/authors/Adam%20Wolf/"]);

    expect(pa11y).toHaveBeenCalledWith(
      "https://example.com/authors/Adam%20Wolf/",
      expect.anything()
    );
  });

  it("encodes a mix of raw and already-encoded characters in one URL", async () => {
    await scanUrls(["https://example.com/a b/c%20d/?q=x y"]);

    expect(pa11y).toHaveBeenCalledWith(
      "https://example.com/a%20b/c%20d/?q=x%20y",
      expect.anything()
    );
  });

  it("passes an unparseable URL through untouched instead of aborting the run", async () => {
    await scanUrls(["not a url"]);

    expect(pa11y).toHaveBeenCalledWith("not a url", expect.anything());
  });

  it("stores the original, unencoded URL on the issue so base/head comparisons keep matching on the same identity", async () => {
    vi.mocked(pa11y).mockResolvedValueOnce({
      issues: [
        {
          code: "the_code",
          context: "",
          message: "",
          selector: "",
          type: "error",
          typeCode: 1,
        },
      ],
    } as any);

    const issues = await scanUrls(["https://example.com/authors/Adam Wolf/"]);

    expect(issues[0].url).toEqual("https://example.com/authors/Adam Wolf/");
  });

  it("preserves provided chromeLaunchConfig", async () => {
    vi.mocked(getInputs).mockReturnValue({
      configPath: "the_config_path",
    } as any);

    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({
        chromeLaunchConfig: {
          anotherOption: "the_option_value",
        },
      }) as any
    );

    await scanUrls(["https://example.com"]);

    expect(pa11y).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        chromeLaunchConfig: expect.objectContaining({
          anotherOption: "the_option_value",
        }),
      })
    );
  });
});
