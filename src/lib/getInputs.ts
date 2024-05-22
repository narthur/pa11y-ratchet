import core from "@actions/core";

export default function getInputs(): {
  sitemapUrl: string;
  find: string;
  replace: string;
  include: string;
} {
  return {
    sitemapUrl: core.getInput("sitemap-url"),
    find: core.getInput("find"),
    replace: core.getInput("replace"),
    include: core.getInput("include"),
  };
}
