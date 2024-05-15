import { vi } from "vitest";

const fs: {
  readFileSync: (path: string, encoding: string) => string;
} = await vi.importActual("fs");
const sitemap = fs.readFileSync("data/sitemap.xml", "utf8");

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
      sha: "sha",
    },
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

vi.mock("./src/lib/writeCsv.js");

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
  default: vi.fn(() => Promise.resolve({ text: vi.fn(() => sitemap) })),
}));

vi.mock("pa11y", () => ({
  default: vi.fn(() => Promise.resolve({ issues: [] })),
}));
