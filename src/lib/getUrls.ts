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

  return xml2js
    .parseStringPromise(siteMap)
    .then((res: Response) => res.urlset.url.map((url) => url.loc[0]));
}
