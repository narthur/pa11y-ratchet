import * as csv from "fast-csv";
import { createWriteStream, unlinkSync, existsSync } from "fs";

export default async function writeCsv(
  outpath: string,
  rows: Record<string, unknown>[]
) {
  console.log(`Writing CSV to ${outpath}`);

  if (existsSync(outpath)) {
    unlinkSync(outpath);
  }

  const csvStream = csv.format({ headers: true });
  const writeStream = createWriteStream(outpath, { flags: "a" });

  csvStream.pipe(writeStream);

  for (const row of rows) {
    csvStream.write(row);
  }

  return new Promise((resolve, reject) => {
    writeStream.on("error", reject);
    writeStream.on("finish", () => {
      console.log(`CSV written to ${outpath}`);
      resolve(undefined);
    });
    csvStream.end();
  });
}
