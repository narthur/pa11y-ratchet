import { describe, it, expect } from "vitest";
import compareIssues from "./compareIssues.js";

describe("compareIssues", () => {
  it("returns an array of new issues", async () => {
    const result = await compareIssues({
      headIssues: [{ context: "new" }],
      baseIssues: [],
    } as any);

    expect(result.new).toHaveLength(1);
  });

  it("returns an array of fixed issues", async () => {
    const result = await compareIssues({
      headIssues: [],
      baseIssues: [{ context: "fixed" }],
    } as any);

    expect(result.fixed).toHaveLength(1);
  });

  it("returns an array of retained issues", async () => {
    const result = await compareIssues({
      headIssues: [{ context: "retained" }],
      baseIssues: [{ context: "retained" }],
    } as any);

    expect(result.retained).toHaveLength(1);
  });
});
