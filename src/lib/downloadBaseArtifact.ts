import downloadArtifact from "../services/github/downloadArtifact.js";
import findArtifact from "../services/github/findArtifact.js";
import findPr from "../services/github/findPr.js";
import github from "@actions/github";

export default async function downloadBaseArtifact(): Promise<boolean> {
  const pr = await findPr();
  const baseSha = pr?.base.sha;

  const baseArtifact = await findArtifact(baseSha);

  if (!baseArtifact) {
    console.warn("No base artifact found");
    console.log("baseSha", baseSha);
    return false;
  }

  console.log("Downloading base artifact", baseArtifact.id, baseArtifact.name);

  await downloadArtifact({
    artifactId: baseArtifact.id,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    outdir: process.env.GITHUB_WORKSPACE || "",
  });

  return true;
}
