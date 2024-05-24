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
Code | New | Fixed | Retained
---- | --- | ----- | --------
{{#codes}}
{{code}} | {{newCount}} | {{fixedCount}} | {{retainedCount}}
{{/codes}}
`;

function renderSection(data: SectionData): string {
  return Mustache.render(template, data);
}

function prepareData(title: string, issues: Issue[]): SectionData {
  const codes = issues.reduce<SectionData["codes"]>((acc, issue) => {
    const existing = acc.find((x) => x.code === issue.code);

    if (existing) {
      if (issue.context === "new") {
        existing.newCount++;
      } else if (issue.context === "fixed") {
        existing.fixedCount++;
      } else if (issue.context === "retained") {
        existing.retainedCount++;
      }
    } else {
      acc.push({
        code: issue.code,
        newCount: issue.context === "new" ? 1 : 0,
        fixedCount: issue.context === "fixed" ? 1 : 0,
        retainedCount: issue.context === "retained" ? 1 : 0,
      });
    }

    return acc;
  }, []);

  return {
    codes,
  };
}

export default async function commentIssues(
  issues: {
    new: Issue[];
    fixed: Issue[];
    retained: Issue[];
  },
  artifact: { data: { archive_download_url: string } }
) {
  // let body =
  //   "[Download full report](" + artifact.data.archive_download_url + ")\n\n";

  // if (issues.new.length) {
  //   body += renderSection(prepareData("🚨 New Issues", issues.new));
  // }

  // if (issues.fixed.length) {
  //   body += renderSection(prepareData("🎉 Fixed issues", issues.fixed));
  // }

  // if (issues.retained.length) {
  //   body += renderSection(prepareData("⚠️ Retained issues", issues.retained));
  // }

  const body = renderSection(prepareData("Summary", issues.new));

  await upsertComment(body);
}
