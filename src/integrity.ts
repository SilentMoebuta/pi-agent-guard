import * as fs from "node:fs";

export interface IntegrityReport {
  file: string;
  totalLines: number;   // non-blank lines
  malformed: number;
  missing: boolean;
}

export function countMalformedLines(sessionFile: string): IntegrityReport {
  const report: IntegrityReport = { file: sessionFile, totalLines: 0, malformed: 0, missing: false };
  let content: string;
  try { content = fs.readFileSync(sessionFile, "utf-8"); }
  catch { report.missing = true; return report; }
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    report.totalLines++;
    try { JSON.parse(line); } catch { report.malformed++; }
  }
  return report;
}

export function formatIntegrityAlert(r: IntegrityReport): string {
  return `[pi-agent-guard] session integrity: ${r.malformed} malformed / ${r.totalLines} lines in ${r.file}`;
}
