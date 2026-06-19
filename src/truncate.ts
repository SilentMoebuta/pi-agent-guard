import * as fs from "node:fs";
import * as path from "node:path";

export function shouldTruncate(text: string, maxLines: number, maxBytes: number): boolean {
  if (Buffer.byteLength(text, "utf-8") > maxBytes) return true;
  // count lines: text with N newlines has N or N+1 lines
  const lines = text.split("\n").length;
  return lines > maxLines;
}

export function truncateToTempFile(content: string, tempDir: string, toolCallId: string): string {
  fs.mkdirSync(tempDir, { recursive: true });
  const safeId = toolCallId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fname = `${safeId}-${Date.now()}.txt`;
  const fpath = path.join(tempDir, fname);
  fs.writeFileSync(fpath, content, "utf-8");
  return `[pi-agent-guard] output truncated (>${path.basename(fpath)}). Full output at: ${fpath}`;
}
