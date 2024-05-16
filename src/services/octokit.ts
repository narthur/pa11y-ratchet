import github from "@actions/github";
import core from "@actions/core";

const token = core.getInput("github-token");

export default github.getOctokit(token);
