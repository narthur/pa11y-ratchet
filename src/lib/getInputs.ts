export default function getInputs(): {
  sitemapUrl: string;
  find: string;
  replace: string;
  include: string;
} {
  return {
    sitemapUrl: process.env.SITEMAP_URL || "",
    find: process.env.FIND || "",
    replace: process.env.REPLACE || "",
    include: process.env.INCLUDE || "",
  };
}
