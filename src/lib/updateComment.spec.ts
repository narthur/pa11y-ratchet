import { describe, it, expect, vi } from "vitest";
import updateComment from "./updateComment.js";
import upsertComment from "../services/github/upsertComment.js";
import getInputs from "./getInputs.js";

describe("commentIssues", () => {
  it("creates comment", async () => {
    await updateComment([], []);

    expect(upsertComment).toHaveBeenCalled();
  });

  it("lists ignored codes", async () => {
    vi.mocked(getInputs).mockReturnValue({
      ignore: "the_ignored_code",
    } as any);

    await updateComment([], []);

    expect(upsertComment).toHaveBeenCalledWith(
      expect.stringContaining("the_ignored_code")
    );
  });
});
