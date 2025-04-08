import { describe, it, expect, vi } from "vitest";
import scanUrls from "./scanUrls.js";
import pa11y from "pa11y";
import * as fs from "node:fs/promises";
import getInputs from "./getInputs.js";

vi.mock("node:fs/promises");

describe("scanUrls", () => {
  it("uses noSandbox arg", async () => {
    await scanUrls(["https://example.com"]);

    expect(pa11y).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        chromeLaunchConfig: expect.objectContaining({
          args: ["--no-sandbox"],
        }),
      })
    );
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
