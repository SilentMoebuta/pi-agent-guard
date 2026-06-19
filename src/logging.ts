import * as fs from "node:fs";
import * as path from "node:path";

export interface LogEntry { ts: number; event: string; [k: string]: unknown; }

export function formatLogEntry(e: LogEntry): string {
  return JSON.stringify(e);
}

// ponytail: shard the log file by PID so concurrent pi processes never share a
// file. appendFileSync is atomic only for writes <= PIPE_BUF (4KB on Linux);
// JSON entries with long tool args routinely exceed that and interleave across
// processes, corrupting the log. A per-process file (`<file>.<pid>`) removes the
// cross-process interleaving entirely. Within one process appendFileSync stays
// single-threaded by Node's event loop, so no intra-process corruption.
export function appendLog(logFile: string | null, e: LogEntry): void {
  if (!logFile) return;
  const sharded = `${logFile}.${process.pid}`;
  try {
    fs.mkdirSync(path.dirname(sharded), { recursive: true });
    fs.appendFileSync(sharded, formatLogEntry(e) + "\n");
  } catch { /* logging must never throw */ }
}

// Exposed for tests: resolve the per-process shard path for a given logFile.
export function shardPath(logFile: string): string {
  return `${logFile}.${process.pid}`;
}
