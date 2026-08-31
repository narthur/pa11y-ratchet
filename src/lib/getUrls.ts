import xml2js from "xml2js";
import fetch from "node-fetch";

// xml2js represents an empty XML element (no children, no text) as the
// empty string rather than an object -- e.g. `<urlset></urlset>` parses to
// `{ urlset: "" }`, not `{ urlset: { url: [] } }`. Both shapes are valid,
// so every node below is typed as `{...} | ""`.
type UrlsetResponse = {
  urlset?: { url?: { loc: string[] }[] } | "";
};

type SitemapIndexResponse = {
  sitemapindex?: { sitemap?: { loc: string[] }[] } | "";
};

type Response = UrlsetResponse & SitemapIndexResponse;

export default async function getUrls(
  sitemapUrl: string,
  // Tracks sitemap URLs already visited in this traversal, so a sitemap
  // index that references itself (directly, or through a cycle of child
  // sitemaps) fails fast instead of recursing forever.
  seen: Set<string> = new Set()
): Promise<string[]> {
  if (seen.has(sitemapUrl)) {
    throw new Error(
      "Circular sitemap index detected: " +
        sitemapUrl +
        " was already visited earlier in this traversal"
    );
  }
  seen.add(sitemapUrl);

  let parsed: Response;

  try {
    const siteMap = await fetch(sitemapUrl).then((res) => res.text());
    parsed = (await xml2js.parseStringPromise(siteMap)) as Response;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Failed to parse sitemap:\nError Message: " +
          error.message +
          "\nSitemap URL: " +
          sitemapUrl
      );
    } else {
      throw new Error(
        "Failed to parse sitemap:\nUnknown error\nSitemap URL: " + sitemapUrl
      );
    }
  }

  // A sitemap index points at child sitemaps rather than listing URLs
  // directly. Fetch and flatten them so callers don't need to know or care
  // whether a site's sitemap has been split. `parsed` can be `null` for an
  // empty response body, so this (and the urlset check below) must not
  // assume it's an object.
  if (parsed && "sitemapindex" in parsed) {
    const sitemapindex = parsed.sitemapindex;
    const children =
      typeof sitemapindex === "object" ? (sitemapindex.sitemap ?? []) : [];
    const childSitemapUrls = children.map((sitemap) => sitemap.loc[0]);
    const childUrls = await Promise.all(
      childSitemapUrls.map((childUrl) => getUrls(childUrl, seen))
    );
    return childUrls.flat();
  }

  if (parsed && "urlset" in parsed) {
    const urlset = parsed.urlset;
    const urls = typeof urlset === "object" ? (urlset.url ?? []) : [];
    return urls.map((url) => url.loc[0]);
  }

  // The XML parsed without error, so this is a shape problem, not a parse
  // failure -- say so rather than reusing the "Failed to parse" message.
  throw new Error(
    "Unexpected sitemap shape (not a <urlset> or <sitemapindex>):\nSitemap URL: " +
      sitemapUrl
  );
}
