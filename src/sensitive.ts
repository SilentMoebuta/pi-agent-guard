import * as path from "node:path";

export const REJECTION_MESSAGE =
  "[pi-agent-guard] BLOCKED: access to a sensitive file was denied by the guard. " +
  "The original content was not loaded into context.";

// minimatch-style: glob with * (any chars except /), matching basename or full path
function globMatch(str: string, glob: string): boolean {
  const re = "^" + glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$";
  return new RegExp(re).test(str);
}

function extractPaths(input: unknown): string[] {
  if (typeof input === "string") return [input];
  if (input && typeof input === "object") {
    const out: string[] = [];
    for (const v of Object.values(input as Record<string, unknown>)) {
      if (typeof v === "string") out.push(v);
    }
    return out;
  }
  return [];
}

export function detectSensitivePath(input: unknown, patterns: string[]): string | null {
  for (const candidate of extractPaths(input)) {
    const base = path.basename(candidate);
    for (const p of patterns) {
      if (globMatch(base, p) || globMatch(candidate, p)) return candidate;
    }
  }
  return null;
}
