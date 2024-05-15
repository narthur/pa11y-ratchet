import * as csv from "fast-csv";

export default async function readCsv(
  path: string
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];

  return new Promise((resolve, reject) => {
    csv
      .parseFile(path, { headers: true })
      .on("error", (error) => reject(error))
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
}
