import { describe, it, expect, vi } from "vitest";
import updateComment from "./updateComment.js";
import upsertComment from "../services/github/upsertComment.js";
import getInputs from "./getInputs.js";

describe("commentIssues", () => {
  it("creates comment", async () => {
    await updateComment([], [], []);

    expect(upsertComment).toHaveBeenCalled();
  });

  it("does not include ignored codes section when no ignored codes", async () => {
    await updateComment([], [], []);

    expect(upsertComment).toHaveBeenCalledWith(
      expect.not.stringContaining("Ignored Codes")
    );
  });

  it("lists ignored codes", async () => {
    vi.mocked(getInputs).mockReturnValue({
      ignore: "the_ignored_code",
    } as any);

    await updateComment([], [], []);

    expect(upsertComment).toHaveBeenCalledWith(
      expect.stringContaining("the_ignored_code")
    );
  });

  it("restricts the comparative table to URLs common to both runs", async () => {
    // url2 is a newly added page: it's in `urls` (this run's scan) but
    // wasn't seen in `baseIssues`. Its issue must not count toward
    // "the_code"'s After total, or the table would disagree with the
    // gate, which excludes it too.
    await updateComment(
      [{ code: "the_code", url: "https://example.com/url1" }] as any,
      [
        { code: "the_code", url: "https://example.com/url1" },
        { code: "the_code", url: "https://example.com/url2" },
      ] as any,
      ["https://example.com/url1", "https://example.com/url2"]
    );

    expect(upsertComment).toHaveBeenCalledWith(
      expect.stringContaining("| the_code | 1 | 1 | 0 |")
    );
  });

  it("surfaces added and removed URL counts when the URL set drifts", async () => {
    await updateComment(
      [
        { code: "the_code", url: "https://example.com/url1" },
        { code: "the_code", url: "https://example.com/url2" },
      ] as any,
      [{ code: "the_code", url: "https://example.com/url1" }] as any,
      ["https://example.com/url1", "https://example.com/url3"]
    );

    expect(upsertComment).toHaveBeenCalledWith(
      expect.stringContaining(
        "1 URL(s) are new and 1 URL(s) are no longer present"
      )
    );
  });

  it("does not mention URL drift when the URL set is unchanged", async () => {
    await updateComment(
      [{ code: "the_code", url: "https://example.com/url1" }] as any,
      [{ code: "the_code", url: "https://example.com/url1" }] as any,
      ["https://example.com/url1"]
    );

    expect(upsertComment).toHaveBeenCalledWith(
      expect.not.stringContaining("URLs changed")
    );
  });
});
