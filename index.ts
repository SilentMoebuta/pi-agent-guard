import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import * as path from "node:path";
import { resolveConfig } from "./src/config";
import { countMalformedLines, formatIntegrityAlert } from "./src/integrity";
import { appendLog } from "./src/logging";
import { shouldTruncate, truncateToTempFile } from "./src/truncate";
import { detectSensitivePath, REJECTION_MESSAGE } from "./src/sensitive";
import { DoomLoopTracker } from "./src/doom-loop";

export default function (pi: ExtensionAPI): void {
  const cfg = resolveConfig();

  pi.on("session_start", (event, ctx) => {
    const sm = (ctx as any).sessionManager;
    // On new/resume/fork, audit the PREVIOUS session file for malformed lines.
    // On startup (no previous), audit the current session file if available.
    const sessionFile = event.previousSessionFile ?? sm?.getSessionFile?.();
    if (typeof sessionFile === "string") {
      const r = countMalformedLines(sessionFile);
      if (r.malformed > 0) {
        const alert = formatIntegrityAlert(r);
        appendLog(cfg.logFile, { ts: Date.now(), event: "integrity_alert", ...r });
        try { (ctx as any).ui?.addSystemMessage?.(alert); } catch {}
        if (typeof console !== "undefined") console.warn(alert);
      }
    }
  });

  // doom loop tracking keyed per-tool-call via tool_execution_start
  const doom = new DoomLoopTracker(cfg.doomLoopThreshold);
  pi.on("tool_execution_start", (event, ctx) => {
    appendLog(cfg.logFile, { ts: Date.now(), event: "tool_execution_start", toolName: event.toolName, toolCallId: event.toolCallId });
    if (doom.isLooping(event.toolName, event.args)) {
      appendLog(cfg.logFile, { ts: Date.now(), event: "doom_loop_detected", toolName: event.toolName, toolCallId: event.toolCallId });
      try { ctx.abort(); } catch {}
    } else {
      doom.observe(event.toolName, event.args);
    }
  });

  pi.on("tool_execution_end", (event, ctx) => {
    appendLog(cfg.logFile, { ts: Date.now(), event: "tool_execution_end", toolName: event.toolName, toolCallId: event.toolCallId, isError: event.isError });
  });

  pi.on("before_provider_request", (event, _ctx) => {
    appendLog(cfg.logFile, { ts: Date.now(), event: "before_provider_request" });
  });

  // tool_result rewriting: truncation + sensitive protection
  pi.on("tool_result", (event, ctx) => {
    // 1. sensitive-file protection (read/bash path in input)
    const hit = detectSensitivePath(event.input, cfg.sensitivePatterns);
    if (hit) {
      appendLog(cfg.logFile, { ts: Date.now(), event: "sensitive_blocked", path: hit, toolCallId: event.toolCallId });
      return { content: [{ type: "text", text: REJECTION_MESSAGE }], isError: true };
    }
    // 2. truncation: join text content, check size
    const text = (event.content || []).map((c: any) => c?.text ?? "").join("\n");
    if (shouldTruncate(text, cfg.maxOutputLines, cfg.maxOutputBytes)) {
      const tempDir = path.join((ctx as any).cwd ?? process.cwd(), ".pi", "guard-output");
      const replacement = truncateToTempFile(text, tempDir, event.toolCallId);
      appendLog(cfg.logFile, { ts: Date.now(), event: "output_truncated", toolCallId: event.toolCallId });
      return { content: [{ type: "text", text: replacement }] };
    }
    return undefined;
  });
}
