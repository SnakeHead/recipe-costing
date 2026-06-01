import type { CostedRecipeLine } from "./types";

export function sumLineCosts(lines: CostedRecipeLine[]): number {
  return lines.reduce((sum, line) => sum + (line.lineCost ?? 0), 0);
}
