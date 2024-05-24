import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import Mustache from "mustache";

type SectionData = {
  codes: {
    code: string;
    newCount: number;
    fixedCount: number;
    retainedCount: number;
  }[];
};

const template = `
Code | N:F:R
---- | -----
{{#codes}}
{{code}} | {{newCount}}:{{fixedCount}}:{{retainedCount}}
{{/codes}}
`;

function renderSection(data: SectionData): string {
  return Mustache.render(template, data);
}

function prepareData(
  title: string,
  issues: {
    new: Issue[];
    fixed: Issue[];
    retained: Issue[];
  }
): SectionData {
  const codes = issues.new
    .concat(issues.fixed)
    .concat(issues.retained)
    .reduce((acc, issue) => {
      const existing = acc.find((x) => x.code === issue.code);

      if (existing) {
        if (issues.new.includes(issue)) {
          existing.newCount++;
        } else if (issues.fixed.includes(issue)) {
          existing.fixedCount++;
        } else {
          existing.retainedCount++;
        }
      } else {
        acc.push({
          code: issue.code,
          newCount: issues.new.includes(issue) ? 1 : 0,
          fixedCount: issues.fixed.includes(issue) ? 1 : 0,
          retainedCount: issues.retained.includes(issue) ? 1 : 0,
        });
      }

      return acc;
    }, [] as SectionData["codes"]);

  return {
    codes,
  };
}

export default async function updateComment(issues: {
  new: Issue[];
  fixed: Issue[];
  retained: Issue[];
}) {
  const body = renderSection(prepareData("Summary", issues));

  await upsertComment(body);
}
