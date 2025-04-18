import { Issue } from "./scanUrls.js";

export function getCodes(issues: Issue[]): string[] {
  return Array.from(new Set(issues.map((issue) => issue.code)));
}
