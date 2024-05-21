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
      sha: "the_event_sha",
      payload: {
        pull_request: {
          number: 1,
          base: {
            sha: "the_base_sha",
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
  })),
}));

vi.mock("./src/lib/getUrls.js", () => ({
  default: vi.fn(() => Promise.resolve(["url1", "url2"])),
}));

vi.mock("./src/lib/readCsv.js", () => ({
  default: vi.fn(() => Promise.resolve([])),
}));
vi.mock("./src/lib/writeCsv.js");
vi.mock("./src/services/artifacts/downloadArtifact.js");
vi.mock("./src/services/artifacts/findArtifact.js");

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
}));

vi.mock("node-fetch", () => ({
  default: vi.fn(() => Promise.resolve({ text: vi.fn(() => "") })),
}));

vi.mock("pa11y", () => ({
  default: vi.fn(() => Promise.resolve({ issues: [] })),
}));
