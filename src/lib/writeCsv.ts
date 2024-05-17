import * as csv from "fast-csv";
import { createWriteStream, unlinkSync, existsSync, readFileSync } from "fs";

export default async function writeCsv(
  outpath: string,
  rows: Record<string, unknown>[]
) {
  console.log(`Writing CSV to ${outpath}`);
  console.log("Number of rows:", rows.length);
  console.dir(rows, { depth: null });

  if (existsSync(outpath)) {
    unlinkSync(outpath);
  }

  const csvStream = csv.format({ headers: true });
  const writeStream = createWriteStream(outpath, { flags: "a" });

  csvStream.pipe(writeStream);

  for (const row of rows) {
    csvStream.write(row);
  }

  csvStream.end();

  console.log(`CSV written to ${outpath}`);

  const content = readFileSync(outpath, "utf8");
  console.log("CSV content:");
  console.log(content);
}
