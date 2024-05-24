import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import Mustache from "mustache";

type SectionData = {
  title: string;
  issueCount: number;
  issues: {
    code: string;
    message: string;
    pages: {
      url: string;
      instances: Issue[];
      remaining: number;
    }[];
    remaining: number;
  }[];
  remaining: number;
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
{{#remaining}}
  - ... and {{remaining}} more
{{/remaining}}
{{/pages}}
{{#remaining}}
- ... and {{remaining}} more
{{/remaining}}
{{/issues}}
{{#remaining}}

... and {{remaining}} more
{{/remaining}}
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
        pages: Object.entries(pages)
          .slice(0, 3)
          .map(([url, instances]) => ({
            url,
            instances: instances.slice(0, 3),
            remaining: Math.max(0, instances.length - 3),
          })),
        remaining: Math.max(0, instances.length - 3),
      };
    });

  return {
    title,
    issueCount: issues.length,
    issues: issuesData,
    remaining: Math.max(0, issues.length - 3),
  };
}

export default async function commentIssues(
  issues: {
    new: Issue[];
    fixed: Issue[];
    retained: Issue[];
  },
  artifact: { archive_download_url: string }
) {
  let body =
    "[Download full report](" + artifact.archive_download_url + ")\n\n";

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
