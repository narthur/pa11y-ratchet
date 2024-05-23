import * as csv from "fast-csv";

export default async function readCsv<T extends Record<string, unknown>>(
  path: string
): Promise<T[]> {
  const rows: T[] = [];

  return new Promise((resolve, reject) => {
    try {
      csv
        .parseFile(path, { headers: true })
        .on("error", (error) => reject(error))
        .on("data", (row) => rows.push(row))
        .on("end", () => resolve(rows));
    } catch (error) {
      reject(error);
    }
  });
}
