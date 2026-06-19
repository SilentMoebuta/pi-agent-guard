import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { formatLogEntry, appendLog, shardPath, type LogEntry } from "../src/logging";

describe("logging", () => {
  const dirs: string[] = [];
  after(() => { for (const d of dirs) fs.rmSync(d, { recursive: true, force: true }); });
  function tmpFile(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "log-")); dirs.push(dir);
    return path.join(dir, "guard.log");
  }
  it("formatLogEntry produces single-line JSON with ts/event/fields", () => {
    const e: LogEntry = { ts: 1700000000000, event: "tool_execution_start", toolName: "bash", toolCallId: "c1" };
    const s = formatLogEntry(e);
    const parsed = JSON.parse(s);
    assert.equal(parsed.event, "tool_execution_start");
    assert.equal(parsed.toolName, "bash");
    assert.equal(parsed.ts, 1700000000000);
    assert.ok(!s.includes("\n"));
  });
  it("appendLog writes then appends to a per-PID shard", () => {
    const f = tmpFile();
    appendLog(f, { ts: 1, event: "a" });
    appendLog(f, { ts: 2, event: "b" });
    // ponytail: appendLog shards by process pid to avoid cross-process interleaving
    const sharded = shardPath(f);
    assert.equal(sharded, `${f}.${process.pid}`);
    const lines = fs.readFileSync(sharded, "utf-8").trim().split("\n");
    assert.equal(lines.length, 2);
    assert.equal(JSON.parse(lines[1]).event, "b");
  });
  it("appendLog is a no-op when file is null", () => {
    assert.doesNotThrow(() => appendLog(null as unknown as string, { ts: 1, event: "a" }));
  });
});
