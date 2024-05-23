import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import Mustache from "mustache";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type SectionData = {
  title: string;
  issues: {
    code: string;
    message: string;
    pages: {
      url: string;
      instances: Issue[];
    }[];
  }[];
};

const template = readFileSync(
  `${__dirname}/../templates/commentSection.md.mustache`,
  "utf8"
);

function renderSection(data: SectionData): string {
  return Mustache.render(template, data);
}

function prepareData(title: string, issues: Issue[]): SectionData {
  const issuesByCode = issues.reduce<Record<string, SectionData["issues"][0]>>(
    (acc, issue) => {
      if (!acc[issue.code]) {
        acc[issue.code] = {
          code: issue.code,
          message: issue.message,
          pages: [],
        };
      }

      const page = acc[issue.code].pages.find((p) => p.url === issue.url);

      if (page) {
        page.instances.push(issue);
      } else {
        acc[issue.code].pages.push({
          url: issue.url,
          instances: [issue],
        });
      }

      return acc;
    },
    {}
  );

  return {
    title,
    issues: Object.values(issuesByCode),
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
