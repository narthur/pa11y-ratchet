import github from "@actions/github";

export default github.getOctokit(process.env.GITHUB_TOKEN || "");
