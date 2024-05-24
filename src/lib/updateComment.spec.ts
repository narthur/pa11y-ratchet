import { describe, it, expect } from "vitest";
import updateComment from "./updateComment.js";
import octokit from "../services/github/octokit.js";

describe("commentIssues", () => {
  it("creates comment", async () => {
    await updateComment([], []);

    expect(octokit.rest.issues.createComment).toHaveBeenCalled();
  });
});
