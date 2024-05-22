// src/main.ts
import pa11y from "pa11y";

// src/lib/getUrls.ts
import xml2js from "xml2js";
import fetch from "node-fetch";
async function getUrls(sitemapUrl) {
  const siteMap = await fetch(sitemapUrl).then((res) => res.text());
  return xml2js.parseStringPromise(siteMap).then((res) => res.urlset.url.map((url) => url.loc[0]));
}

// src/lib/writeCsv.ts
import * as csv from "fast-csv";
import { createWriteStream, unlinkSync, existsSync } from "fs";
async function writeCsv(outpath, rows) {
  console.log(`Writing CSV to ${outpath}`);
  if (existsSync(outpath)) {
    unlinkSync(outpath);
  }
  const csvStream = csv.format({ headers: true });
  const writeStream = createWriteStream(outpath, { flags: "a" });
  csvStream.pipe(writeStream);
  for (const row of rows) {
    csvStream.write(row);
  }
  return new Promise((resolve, reject) => {
    writeStream.on("error", reject);
    writeStream.on("finish", () => {
      console.log(`CSV written to ${outpath}`);
      resolve(void 0);
    });
    csvStream.end();
  });
}

// src/main.ts
import { DefaultArtifactClient } from "@actions/artifact";
import github4 from "@actions/github";

// src/lib/getInputs.ts
function getInputs() {
  return {
    sitemapUrl: process.env.SITEMAP_URL || "",
    find: process.env.FIND || "",
    replace: process.env.REPLACE || "",
    include: process.env.INCLUDE || ""
  };
}

// src/lib/commentIssues.ts
import github2 from "@actions/github";

// src/services/octokit.ts
import github from "@actions/github";
var octokit_default = github.getOctokit(process.env.GITHUB_TOKEN || "");

// src/lib/commentIssues.ts
var BODY_PREFIX = "<!-- pa11y summary -->";
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function issue(data) {
  return `
<p><strong>${data.type}: ${data.code}</strong></p>
<p><a href="${data.url}">${data.url}</a></p>
<blockquote>${data.message}</blockquote>
<p><code>${data.selector}</code></p>
${data.context ? `<div><pre><code>${escapeHtml(
    String(data.context).replaceAll("><", ">\n<")
  )}</code></pre></div>` : ``}
`;
}
function issuesList(issues) {
  return `${issues.map(issue).join("<hr/>")}`;
}
async function commentIssues(issues) {
  const issue_number = github2.context.payload.pull_request?.number;
  if (!issue_number) {
    throw new Error("No issue number found in the context");
  }
  const body = `${BODY_PREFIX}
  ${!issues.new.length && !issues.fixed.length && !issues.retained.length ? "\u{1F389} Pa11y found no accessibility issues!" : "Pa11y found the following accessibility issues:"}
  
${issues.new.length ? `  ### \u{1F6A8} New Issues (${issues.new.length})

${issuesList(issues.new)}` : ""}

${issues.fixed.length ? `  ### \u{1F389} Fixed Issues (${issues.fixed.length})

  ${issuesList(issues.fixed)}` : ""}

${issues.retained.length ? ` 

  <details>
  <summary><h3>\u26A0\uFE0F Retained Issues (${issues.retained.length})</h3></summary>
  
  ${issuesList(issues.retained)}

  </details> ` : ""}
  `;
  const { data: comments } = await octokit_default.rest.issues.listComments({
    owner: github2.context.repo.owner,
    repo: github2.context.repo.repo,
    issue_number
  });
  const existingComment = comments.find(
    ({ body: body2 }) => body2?.startsWith(BODY_PREFIX)
  );
  if (existingComment) {
    await octokit_default.rest.issues.updateComment({
      body,
      owner: github2.context.repo.owner,
      repo: github2.context.repo.repo,
      comment_id: existingComment.id
    });
  } else {
    await octokit_default.rest.issues.createComment({
      body,
      owner: github2.context.repo.owner,
      repo: github2.context.repo.repo,
      issue_number
    });
  }
}

// src/lib/readCsv.ts
import * as csv2 from "fast-csv";
async function readCsv(path) {
  const rows = [];
  return new Promise((resolve, reject) => {
    csv2.parseFile(path, { headers: true }).on("error", (error) => reject(error)).on("data", (row) => rows.push(row)).on("end", () => resolve(rows));
  });
}

// src/lib/compareIssues.ts
async function compareIssues(baseCsvPath, eventCsvPath) {
  const baseIssues = await readCsv(baseCsvPath);
  const eventIssues = await readCsv(eventCsvPath);
  return {
    new: eventIssues.filter(
      (eventIssue) => !baseIssues.some(
        (baseIssue) => JSON.stringify(baseIssue) === JSON.stringify(eventIssue)
      )
    ),
    fixed: baseIssues.filter(
      (baseIssue) => !eventIssues.some(
        (eventIssue) => JSON.stringify(baseIssue) === JSON.stringify(eventIssue)
      )
    ),
    retained: baseIssues.filter(
      (baseIssue) => eventIssues.some(
        (eventIssue) => JSON.stringify(baseIssue) === JSON.stringify(eventIssue)
      )
    )
  };
}

// src/services/artifacts/findArtifact.ts
import github3 from "@actions/github";
async function findArtifact(sha) {
  const result = await octokit_default.rest.actions.listArtifactsForRepo({
    owner: github3.context.repo.owner,
    repo: github3.context.repo.repo,
    name: `pa11y-ratchet-${sha}`,
    per_page: 1
  });
  if (!sha) {
    return void 0;
  }
  return result.data.artifacts.pop();
}

// src/services/artifacts/downloadArtifact.ts
import exec from "@actions/exec";
async function downloadArtifact(options) {
  const response = await octokit_default.rest.actions.downloadArtifact({
    owner: options.owner,
    repo: options.repo,
    artifact_id: options.artifactId,
    archive_format: "zip"
  });
  const outpath = `${options.outdir}/artifact.zip`;
  await exec.exec("curl", ["-L", response.url, "-o", outpath]);
  await exec.exec("unzip", ["-n", outpath]);
}

// src/main.ts
import core from "@actions/core";
async function main() {
  const artifact = new DefaultArtifactClient();
  const eventSha = github4.context.sha;
  const baseSha = github4.context.payload.pull_request?.base.sha;
  const inputs = getInputs();
  const includeRegex = new RegExp(inputs.include);
  const workspace = process.env.GITHUB_WORKSPACE;
  console.log({ baseSha, eventSha, workspace });
  if (!workspace) {
    throw new Error("GITHUB_WORKSPACE not set");
  }
  const outdir = workspace;
  const outname = `pa11y-${eventSha}.csv`;
  const outpath = `${outdir}/${outname}`;
  const urls = await getUrls(inputs.sitemapUrl).then(
    (urls2) => urls2.filter((url) => includeRegex.test(url)).map((url) => url.replace(inputs.find, inputs.replace))
  );
  const issues = [];
  for (const url of urls) {
    const res = await pa11y(url);
    const issuesForUrl = res.issues.map((issue2) => ({ url, ...issue2 }));
    issues.push(...issuesForUrl);
  }
  await writeCsv(outpath, issues);
  await artifact.uploadArtifact(`pa11y-ratchet-${eventSha}`, [outname], outdir);
  const baseArtifact = await findArtifact(baseSha);
  if (!baseArtifact) {
    console.log("No base artifact found, skipping comparison");
    console.log("baseSha", baseSha);
    return;
  }
  console.log("Downloading base artifact", baseArtifact.id, baseArtifact.name);
  await downloadArtifact({
    artifactId: baseArtifact.id,
    owner: github4.context.repo.owner,
    repo: github4.context.repo.repo,
    outdir
  });
  const comparison = await compareIssues(
    `${workspace}/pa11y-${baseSha}.csv`,
    outpath
  );
  console.log("Comparing issues and commenting on PR");
  await commentIssues(comparison);
  if (comparison.new.length) core.setFailed("Found new accessibility issues");
}

// src/index.ts
main();
