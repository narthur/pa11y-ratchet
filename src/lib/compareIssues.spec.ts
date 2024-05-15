import { vi, describe, it, expect, beforeEach } from "vitest";
import compareIssues from "./compareIssues.js";
import readCsv from "./readCsv.js";

describe("compareIssues", () => {
  beforeEach(() => {
    vi.mocked(readCsv).mockImplementation(async (path: string) => {
      if (path.includes("base")) {
        return [
          {
            context: "fixed",
          },
          {
            context: "retained",
          },
        ];
      }
      if (path.includes("event")) {
        return [
          {
            context: "new",
          },
          {
            context: "retained",
          },
        ];
      }
      return [];
    });
  });

  it("loads base csv file", async () => {
    await compareIssues("the_base_csv_path", "the_event_csv_path");

    expect(readCsv).toBeCalledWith("the_base_csv_path");
  });

  it("loads event csv file", async () => {
    await compareIssues("the_base_csv_path", "the_event_csv_path");

    expect(readCsv).toBeCalledWith("the_event_csv_path");
  });

  it("returns an array of new issues", async () => {
    const result = await compareIssues(
      "the_base_csv_path",
      "the_event_csv_path"
    );

    expect(result.new).toHaveLength(1);
  });

  it("returns an array of fixed issues", async () => {
    const result = await compareIssues(
      "the_base_csv_path",
      "the_event_csv_path"
    );

    expect(result.fixed).toHaveLength(1);
  });

  it("returns an array of retained issues", async () => {
    const result = await compareIssues(
      "the_base_csv_path",
      "the_event_csv_path"
    );

    expect(result.retained).toHaveLength(1);
  });
});
