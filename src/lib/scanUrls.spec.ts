import { describe, it, expect, vi } from "vitest";
import scanUrls from "./scanUrls.js";
import pa11y from "pa11y";

describe("scanUrls", () => {
  it("inclueds exceptions in returned issues", async () => {
    vi.mocked(pa11y).mockRejectedValue(new Error("the_error_message"));

    const issues = await scanUrls(["https://example.com"]);

    expect(issues).toEqual([
      expect.objectContaining({
        url: "https://example.com",
        message: "the_error_message",
      }),
    ]);
  });
});
