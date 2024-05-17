import writeCsv from "../src/lib/writeCsv.js";

await writeCsv("./test.csv", [{ a: 1 }, { a: 2 }]);
