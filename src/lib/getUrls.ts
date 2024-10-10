import xml2js from "xml2js";
import fetch from "node-fetch";

type Response = {
  urlset: {
    url: {
      loc: string[];
    }[];
  };
};

export default async function getUrls(sitemapUrl: string): Promise<string[]> {
  const siteMap = await fetch(sitemapUrl).then((res) => res.text());

  try {
    const parsed = await xml2js.parseStringPromise(siteMap);
    return (parsed as Response).urlset.url.map((url) => url.loc[0]);
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
}
