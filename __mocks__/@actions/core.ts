import { vi } from "vitest";

let summary = "";

export default {
  summary: {
    addHeading: vi.fn((s: string) => (summary += `# ${s}\n`)),
    addRaw: vi.fn((s: string) => (summary += `${s}\n`)),
    addList: vi.fn((s: string[]) =>
      s.forEach((item) => (summary += `- ${item}\n`))
    ),
    addLink: vi.fn((s: string, url: string) => (summary += `[${s}](${url})\n`)),
    stringify: vi.fn(() => summary),
    emptyBuffer: vi.fn(() => (summary = "")),
    addTable: vi.fn((table: string[][]) => {
      table.forEach((row) => {
        summary += `| ${row.join(" | ")} |\n`;
      });
    }),
    addQuote: vi.fn((s: string) => (summary += `> ${s}\n`)),
    write: vi.fn(() => {}),
  },
  setFailed: vi.fn(),
  setOutput: vi.fn(),
};
