import * as fs from "node:fs/promises";
import pa11y from "pa11y";
import getInputs from "./getInputs.js";
import path from "path";
import pThrottle from "p-throttle";

export type Issue = {
  code: string;
  context: string;
  message: string;
  selector: string;
  type: string;
  typeCode: number;
  url: string;
  runner?: string;
};

type RawPa11yOptions = NonNullable<Parameters<typeof pa11y>[1]>;

type LaunchConfig = Partial<
  NonNullable<RawPa11yOptions["chromeLaunchConfig"]>
> & {
  args?: string[];
};

type Pa11yOptions = Omit<RawPa11yOptions, "chromeLaunchConfig"> & {
  chromeLaunchConfig?: LaunchConfig;
};

const throttle = pThrottle({
  limit: 1,
  interval: 1000,
});

const throttledScan = throttle(pa11y);

// Sitemaps and the `urls` input frequently contain raw, unencoded
// characters (e.g. a literal space in a path segment). Fetching that
// directly 404s, and pa11y then audits the 404 page instead of the real
// one. `new URL(url).toString()` percent-encodes the path/query/hash
// without touching the scheme, host, or port, and -- critically -- is a
// no-op on a URL that's already correctly encoded, so it doesn't
// double-encode an existing `%20` into `%2520`.
//
// This is only used for the actual fetch. The original `url` string is
// still what gets stored on each issue below, so base/head comparisons
// and the URL intersection in getComparableCounts.ts keep matching on
// exactly the same identity they always have. That matters across the
// version boundary too: a base run from before this fix stored raw URLs,
// so storing the encoded form here would make every space-containing URL
// look absent from base and report its issues as newly introduced.
//
// `new URL` throws on input it can't parse, and the `urls` input and the
// find/replace rewrite are both hand-written, so that's reachable. Fall
// back to the original string rather than letting one bad URL abort the
// whole run -- pa11y then fails on it exactly as it did before.
function toFetchUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
}

export default async function scanUrls(urls: string[]): Promise<Issue[]> {
  const issues = [];
  const len = urls.length;
  const { configPath } = getInputs();
  const absConfigPath = path.resolve(configPath);

  let pa11yOpts: Pa11yOptions = {};
  if (configPath !== "") {
    const configJSON = await fs.readFile(absConfigPath, "utf8");
    pa11yOpts = JSON.parse(configJSON);
  }

  pa11yOpts = {
    ...pa11yOpts,
    chromeLaunchConfig: {
      args: ["--no-sandbox"],
      ...pa11yOpts?.chromeLaunchConfig,
    },
  };

  for (const [i, url] of urls.entries()) {
    const key = `${i + 1}/${len}: ${url}`;
    console.time(key);
    const res = await throttledScan(
      toFetchUrl(url),
      pa11yOpts as RawPa11yOptions
    );
    const issuesForUrl = res.issues.map((issue) => ({ url, ...issue }));
    issues.push(...issuesForUrl);
    console.timeEnd(key);
  }

  return issues;
}
