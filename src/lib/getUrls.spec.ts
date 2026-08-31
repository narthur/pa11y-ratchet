import { describe, it, expect, vi } from "vitest";
import fetch from "node-fetch";

// vitest.setup.ts globally mocks getUrls.js (main.ts's dependency) — undo
// that here so this file exercises the real implementation.
vi.unmock("./getUrls.js");
const { default: getUrls } = await import("./getUrls.js");

function textResponse(body: string) {
  return Promise.resolve({ text: () => Promise.resolve(body) } as any);
}

describe("getUrls", () => {
  it("returns urls from a urlset document", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      (await textResponse(
        `<urlset><url><loc>https://example.com/</loc></url></urlset>`
      )) as any
    );

    const urls = await getUrls("https://example.com/sitemap.xml");

    expect(urls).toEqual(["https://example.com/"]);
  });

  it("follows a sitemap index and flattens the child sitemaps' urls", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        (await textResponse(
          `<sitemapindex>
            <sitemap><loc>https://example.com/sitemap-0.xml</loc></sitemap>
            <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
          </sitemapindex>`
        )) as any
      )
      .mockResolvedValueOnce(
        (await textResponse(
          `<urlset><url><loc>https://example.com/a</loc></url></urlset>`
        )) as any
      )
      .mockResolvedValueOnce(
        (await textResponse(
          `<urlset><url><loc>https://example.com/b</loc></url></urlset>`
        )) as any
      );

    const urls = await getUrls("https://example.com/sitemap.xml");

    expect(urls).toEqual(["https://example.com/a", "https://example.com/b"]);
  });

  it("reports an honest error for a document that is neither a urlset nor a sitemap index", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      (await textResponse(`<somethingElse></somethingElse>`)) as any
    );

    await expect(getUrls("https://example.com/sitemap.xml")).rejects.toThrow(
      /not a <urlset> or <sitemapindex>/
    );
  });

  it("reports a parse-failure error for genuinely invalid XML", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      (await textResponse(`<urlset><url><loc>unclosed`)) as any
    );

    await expect(getUrls("https://example.com/sitemap.xml")).rejects.toThrow(
      /Failed to parse sitemap/
    );
  });
});
