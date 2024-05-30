import pa11y from "pa11y";

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

export default async function scanUrls(urls: string[]): Promise<Issue[]> {
  const issues = [];
  const len = urls.length;

  for (const [i, url] of urls.entries()) {
    const key = `${i + 1}/${len}: ${url}`;
    console.time(key);
    const res = await pa11y(url).catch((err) => {
      console.error(err);
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
    });
    const issuesForUrl = res.issues.map((issue) => ({ url, ...issue }));
    issues.push(...issuesForUrl);
    console.timeEnd(key);
  }

  return issues;
}
