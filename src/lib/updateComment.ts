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

function prepareData(baseIssues: Issue[], headIssues: Issue[]): SectionData {
  const codes = Array.from(
    new Set([...baseIssues, ...headIssues].map(({ code }) => code))
  ).map((code) => {
    const newCount = headIssues.filter((issue) => issue.code === code).length;
    const fixedCount = baseIssues.filter((issue) => issue.code === code).length;
    const retainedCount = baseIssues.length - fixedCount;

    return { code, newCount, fixedCount, retainedCount };
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
