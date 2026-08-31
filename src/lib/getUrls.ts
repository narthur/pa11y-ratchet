import xml2js from "xml2js";
import fetch from "node-fetch";

type UrlsetResponse = {
  urlset: {
    url: {
      loc: string[];
    }[];
  };
};

type SitemapIndexResponse = {
  sitemapindex: {
    sitemap: {
      loc: string[];
    }[];
  };
};

type Response = UrlsetResponse | SitemapIndexResponse;

export default async function getUrls(sitemapUrl: string): Promise<string[]> {
  const siteMap = await fetch(sitemapUrl).then((res) => res.text());

  let parsed: Response;

  try {
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
  // whether a site's sitemap has been split.
  if ("sitemapindex" in parsed) {
    const childSitemapUrls = parsed.sitemapindex.sitemap.map(
      (sitemap) => sitemap.loc[0]
    );
    const childUrls = await Promise.all(
      childSitemapUrls.map((childUrl) => getUrls(childUrl))
    );
    return childUrls.flat();
  }

  if ("urlset" in parsed && parsed.urlset?.url) {
    return parsed.urlset.url.map((url) => url.loc[0]);
  }

  // The XML parsed without error, so this is a shape problem, not a parse
  // failure -- say so rather than reusing the "Failed to parse" message.
  throw new Error(
    "Unexpected sitemap shape (not a <urlset> or <sitemapindex>):\nSitemap URL: " +
      sitemapUrl
  );
}
