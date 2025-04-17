import getInputs from "./getInputs.js";

export function getIgnoredCodes(): string[] {
  const { ignore } = getInputs();
  return ignore.split(",").map((i) => i.trim());
}
