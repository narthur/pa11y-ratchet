import { Issue } from "./scanUrls.js";
import upsertComment from "../services/github/upsertComment.js";
import Mustache from "mustache";
import compareIssues from "./compareIssues.js";

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

function prepareData(baseIssues: Issue[], headIssues: Issue[]): SectionData {
  const codes = Array.from(
    new Set([...baseIssues, ...headIssues].map(({ code }) => code))
  ).map((code) => {
    const baseMatches = baseIssues.filter((issue) => issue.code === code);
    const headMatches = headIssues.filter((issue) => issue.code === code);
    const comparison = compareIssues({
      baseIssues: baseMatches,
      headIssues: headMatches,
    });

    return {
      code,
      newCount: comparison.new.length,
      fixedCount: comparison.fixed.length,
      retainedCount: comparison.retained.length,
    };
  });

  return { codes };
}

export default async function updateComment(
  baseIssues: Issue[],
  headIssues: Issue[]
) {
  const body = renderSection(prepareData(baseIssues, headIssues));

  await upsertComment(body);
}
