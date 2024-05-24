import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import Mustache from "mustache";

type SectionData = {
  title: string;
  issueCount: number;
  issues: {
    code: string;
    message: string;
    pageCount: number;
    pages: {
      url: string;
      instanceCount: number;
      instances: Issue[];
    }[];
  }[];
};

const template = `
### {{title}} ({{issueCount}} issues)

{{#issues}}
#### {{code}}

> {{message}}

{{#pages}}
- [{{url}}]({{url}})
{{#instances}}
  - \`{{{selector}}}\`
{{/instances}}
  - ... and {{instanceCount - 3}} more
{{/pages}}
- ... and {{pageCount - 3}} more
{{/issues}}
`;

function renderSection(data: SectionData): string {
  return Mustache.render(template, data);
}

function prepareData(title: string, issues: Issue[]): SectionData {
  const issuesByCode = issues.reduce((acc, issue) => {
    if (!acc[issue.code]) {
      acc[issue.code] = [];
    }

    acc[issue.code].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);

  const issuesData = Object.entries(issuesByCode)
    .slice(0, 3)
    .map(([code, instances]) => {
      const pages = instances.reduce((acc, instance) => {
        if (!acc[instance.url]) {
          acc[instance.url] = [];
        }

        acc[instance.url].push(instance);
        return acc;
      }, {} as Record<string, Issue[]>);

      return {
        code,
        message: instances[0].message,
        pageCount: Object.keys(pages).length,
        pages: Object.entries(pages)
          .slice(0, 3)
          .map(([url, instances]) => ({
            url,
            instanceCount: instances.length,
            instances: instances.slice(0, 3),
          })),
      };
    });

  return {
    title,
    issueCount: issues.length,
    issues: issuesData,
  };
}

export default async function commentIssues(issues: {
  new: Issue[];
  fixed: Issue[];
  retained: Issue[];
}) {
  let body = "";

  if (issues.new.length) {
    body += renderSection(prepareData("🚨 New Issues", issues.new));
  }

  if (issues.fixed.length) {
    body += renderSection(prepareData("🎉 Fixed issues", issues.fixed));
  }

  if (issues.retained.length) {
    body += renderSection(prepareData("⚠️ Retained issues", issues.retained));
  }

  await upsertComment(body);
}
