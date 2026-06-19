import * as path from "node:path";

export const REJECTION_MESSAGE =
  "[pi-agent-guard] BLOCKED: access to a sensitive file was denied by the guard. " +
  "The original content was not loaded into context.";

// minimatch-style: glob with * (any chars except /), matching basename or full path
function globMatch(str: string, glob: string): boolean {
  const re = "^" + glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$";
  return new RegExp(re).test(str);
}

// Deep-walk every string in an arbitrary input (top-level value, nested object
// values, array elements). bash tool inputs land as {command: "cat ~/...."}; the
// command string is one candidate, but inputs may also nest ({options:{path}}).
function* walkStrings(input: unknown): Generator<string> {
  if (typeof input === "string") { yield input; return; }
  if (input && typeof input === "object") {
    for (const v of Array.isArray(input) ? input : Object.values(input as Record<string, unknown>)) {
      yield* walkStrings(v);
    }
  }
}

// Collect candidate strings to test: every string reachable in the input, PLUS
// each whitespace-delimited token of those strings (so bash commands like
// `cat ~/.git-credentials` with no slash are still caught by their basename).
function extractPaths(input: unknown): string[] {
  const out: string[] = [];
  for (const s of walkStrings(input)) {
    out.push(s);
    for (const tok of s.split(/\s+/)) {
      if (tok) out.push(tok);
    }
  }
  return out;
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
