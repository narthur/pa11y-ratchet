import * as csv from "fast-csv";
import { createWriteStream, unlinkSync, existsSync } from "fs";

export default async function writeCsv(
  outpath: string,
  rows: Record<string, unknown>[]
) {
  if (existsSync(outpath)) {
    unlinkSync(outpath);
  }

  const csvStream = csv.format({ headers: true });
  const writeStream = createWriteStream(outpath, { flags: "a" });

  csvStream.pipe(writeStream);

  for (const row of rows) {
    csvStream.write(row);
  }
}
