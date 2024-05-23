import { describe, it, expect } from "vitest";
import commentIssues from "./commentIssues.js";
import octokit from "../services/github/octokit.js";

describe("commentIssues", () => {
  it("creates comment", async () => {
    await commentIssues({
      new: [{ context: "new" }],
      fixed: [{ context: "fixed" }],
      retained: [{ context: "retained" }],
    } as any);

    expect(octokit.rest.issues.createComment).toHaveBeenCalled();
  });
});
