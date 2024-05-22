import github from "@actions/github";

export const HEAD_SHA =
  github.context.payload.pull_request?.head.sha || github.context.sha;
