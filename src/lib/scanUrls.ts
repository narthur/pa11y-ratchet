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
    const res = await throttledScan(url, pa11yOpts as RawPa11yOptions).catch(
      (err) => {
        console.error(`Error scanning URL: ${url}`, err);
        return {
          issues: [
            {
              code: "error",
              context: "",
              message: err.message,
              selector: "",
              type: "error",
              typeCode: 1,
              url,
              runner: "action",
            },
          ],
        };
      }
    );
    const issuesForUrl = res.issues.map((issue) => ({ url, ...issue }));
    issues.push(...issuesForUrl);
    console.timeEnd(key);
  }

  return issues;
}
