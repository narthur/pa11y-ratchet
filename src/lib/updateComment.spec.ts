import { describe, it, expect } from "vitest";
import updateComment from "./updateComment.js";
import upsertComment from "../services/github/upsertComment.js";

describe("commentIssues", () => {
  it("creates comment", async () => {
    await updateComment([], []);

    expect(upsertComment).toHaveBeenCalled();
  });
});
