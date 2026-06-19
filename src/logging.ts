import * as fs from "node:fs";
import * as path from "node:path";

export interface LogEntry { ts: number; event: string; [k: string]: unknown; }

export function formatLogEntry(e: LogEntry): string {
  return JSON.stringify(e);
}

export function appendLog(logFile: string | null, e: LogEntry): void {
  if (!logFile) return;
  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, formatLogEntry(e) + "\n");
  } catch { /* logging must never throw */ }
}
