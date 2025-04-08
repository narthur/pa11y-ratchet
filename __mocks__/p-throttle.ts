import { vi } from "vitest";

export default function pThrottle() {
  return vi.fn((fn: () => Promise<void>) => fn);
}
