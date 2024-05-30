import { describe, it, expect, vi } from "vitest";
import compareIssues from "./compareIssues.js";
import getInputs from "./getInputs.js";

describe("compareIssues", () => {
  it("returns an array of new issues", async () => {
    const result = compareIssues({
      headIssues: [{ context: "new" }],
      baseIssues: [],
    } as any);

    expect(result.new).toHaveLength(1);
  });

  it("returns an array of fixed issues", async () => {
    const result = compareIssues({
      headIssues: [],
      baseIssues: [{ context: "fixed" }],
    } as any);

    expect(result.fixed).toHaveLength(1);
  });

  it("returns an array of retained issues", async () => {
    const result = compareIssues({
      headIssues: [{ context: "retained" }],
      baseIssues: [{ context: "retained" }],
    } as any);

    expect(result.retained).toHaveLength(1);
  });

  it("returns an array of ignored issues", async () => {
    vi.mocked(getInputs).mockReturnValue({ ignore: "the_ignored_code" } as any);

    const result = compareIssues({
      headIssues: [{ code: "the_ignored_code", context: "ignored" }],
      baseIssues: [{ code: "the_ignored_code", context: "ignored" }],
    } as any);

    expect(result.ignored).toHaveLength(1);
  });

  it("does not include ignored issues in new", async () => {
    vi.mocked(getInputs).mockReturnValue({ ignore: "the_ignored_code" } as any);

    const result = compareIssues({
      headIssues: [{ code: "the_ignored_code", context: "new" }],
      baseIssues: [],
    } as any);

    expect(result.new).toHaveLength(0);
  });

  it("does not include ignored issues in fixed", async () => {
    vi.mocked(getInputs).mockReturnValue({ ignore: "the_ignored_code" } as any);

    const result = compareIssues({
      headIssues: [],
      baseIssues: [{ code: "the_ignored_code", context: "fixed" }],
    } as any);

    expect(result.fixed).toHaveLength(0);
  });

  it("does not include ignored issues in retained", async () => {
    vi.mocked(getInputs).mockReturnValue({ ignore: "the_ignored_code" } as any);

    const result = compareIssues({
      headIssues: [{ code: "the_ignored_code", context: "retained" }],
      baseIssues: [{ code: "the_ignored_code", context: "retained" }],
    } as any);

    expect(result.retained).toHaveLength(0);
  });
});
