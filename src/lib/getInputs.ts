export default function getInputs(): {
  sitemapUrl: string;
  find: string;
  replace: string;
  include: string;
  ignore: string;
  configPath: string;
} {
  return {
    sitemapUrl: process.env.SITEMAP_URL || "",
    find: process.env.FIND || "",
    replace: process.env.REPLACE || "",
    include: process.env.INCLUDE || "",
    ignore: process.env.IGNORE || "",
    configPath: process.env.CONFIG_PATH || "",
  };
}
