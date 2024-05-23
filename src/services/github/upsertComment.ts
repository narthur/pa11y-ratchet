import findPr from "./findPr.js";
import octokit from "./octokit.js";
import github from "@actions/github";

const MAX_LENGTH = 65536;
const BODY_PREFIX = "<!-- pa11y summary -->";

export default async function upsertComment(text: string) {
  const pr = await findPr();
  const issue_number = pr?.number;
  const body = `${BODY_PREFIX}\n${text}`.slice(0, MAX_LENGTH);

  if (!issue_number) {
    throw new Error("No issue number found in the context");
  }

  const { data: comments } = await octokit.rest.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number,
  });

  const existingComment = comments.find(({ body }) =>
    body?.startsWith(BODY_PREFIX)
  );

  if (existingComment) {
    await octokit.rest.issues.updateComment({
      body,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      comment_id: existingComment.id,
    });
  } else {
    await octokit.rest.issues.createComment({
      body,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number,
    });
  }
}
