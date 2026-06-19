import * as fs from "node:fs";
import * as path from "node:path";

export function shouldTruncate(text: string, maxLines: number, maxBytes: number): boolean {
  if (Buffer.byteLength(text, "utf-8") > maxBytes) return true;
  // count lines: text with N newlines has N or N+1 lines
  const lines = text.split("\n").length;
  return lines > maxLines;
}

// ponytail: wrap fs ops so a read-only cwd / unwritable .pi / full disk does not
// throw out of the tool_result handler and lose the original output entirely.
// On failure, return an in-memory preview so the agent still sees something.
export function truncateToTempFile(content: string, tempDir: string, toolCallId: string): string {
  try {
    fs.mkdirSync(tempDir, { recursive: true });
    const safeId = toolCallId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fname = `${safeId}-${Date.now()}.txt`;
    const fpath = path.join(tempDir, fname);
    fs.writeFileSync(fpath, content, "utf-8");
    return `[pi-agent-guard] output truncated (>${path.basename(fpath)}). Full output at: ${fpath}`;
  } catch {
    const preview = content.slice(0, 2000);
    return `[pi-agent-guard] output truncated (temp file write failed; in-memory preview):\n${preview}`;
  }
}
