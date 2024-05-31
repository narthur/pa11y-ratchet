import { vi } from "vitest";

vi.stubEnv("GITHUB_WORKSPACE", "/github/workspace");

vi.mock("@actions/artifact");
vi.mock("@actions/core");

vi.mock("@actions/github", () => ({
  default: {
    context: {
      repo: {
        owner: "owner",
        repo: "repo",
      },
      eventName: "push",
      payload: {
        pull_request: {
          head: {
            sha: "the_head_sha",
          },
        },
      },
    },
    getOctokit: vi.fn(() => ({
      rest: {
        issues: {
          listComments: vi.fn(() => Promise.resolve({ data: [] })),
          updateComment: vi.fn(),
          createComment: vi.fn(),
        },
      },
    })),
  },
}));

vi.mock("./src/lib/getInputs.js", () => ({
  default: vi.fn(() => ({
    sitemapUrl: "the_sitemap-url",
    find: "the_find",
    replace: "the_replace",
    include: "",
    ignore: "",
  })),
}));

vi.mock("./src/lib/getUrls.js", () => ({
  default: vi.fn(() => Promise.resolve(["url1", "url2"])),
}));

vi.mock("./src/lib/readCsv.js", () => ({
  default: vi.fn(() => Promise.resolve([])),
}));

vi.mock("./src/lib/sleep.js", () => ({
  default: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock("./src/lib/writeCsv.js");
vi.mock("./src/services/github/downloadArtifact.js");
vi.mock("./src/services/github/findArtifact.js");

vi.mock("./src/services/github/findPr.js", () => ({
  default: vi.fn(() =>
    Promise.resolve({ number: 1, base: { sha: "the_base_sha" } })
  ),
}));

vi.mock("./src/services/github/getArtifact.js", () => ({
  default: vi.fn(() => Promise.resolve({ url: "the_artifact_url" })),
}));

vi.mock("./src/services/github/upsertComment.js", () => ({
  default: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock("fast-csv", () => ({
  format: vi.fn(() => ({
    pipe: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
  })),
}));

vi.mock("fs", () => ({
  createWriteStream: vi.fn(() => ({
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
  })),
  existsSync: vi.fn(() => false),
  unlinkSync: vi.fn(),
  readFileSync: vi.fn(() => ""),
}));

vi.mock("node-fetch", () => ({
  default: vi.fn(() => Promise.resolve({ text: vi.fn(() => "") })),
}));

vi.mock("pa11y", () => ({
  default: vi.fn(() => Promise.resolve({ issues: [] })),
}));
