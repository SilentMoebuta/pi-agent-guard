import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { shouldTruncate, truncateToTempFile } from "../src/truncate";

describe("truncate", () => {
  const dirs: string[] = [];
  after(() => { for (const d of dirs) fs.rmSync(d, { recursive: true, force: true }); });
  function tmpDir(): string { const d = fs.mkdtempSync(path.join(os.tmpdir(), "trunc-")); dirs.push(d); return d; }

  it("shouldTruncate false for short text", () => {
    assert.equal(shouldTruncate("hello", 10, 100), false);
  });
  it("shouldTruncate true when over byte limit", () => {
    assert.equal(shouldTruncate("x".repeat(101), 2000, 100), true);
  });
  it("shouldTruncate true when over line limit", () => {
    assert.equal(shouldTruncate(("a\n").repeat(5), 3, 100), true); // 5 lines > 3
  });
  it("truncateToTempFile writes content + returns replacement text with path", () => {
    const dir = tmpDir();
    const big = ("line\n").repeat(10);
    const out = truncateToTempFile(big, dir, "toolcall-1");
    assert.ok(out.includes("[pi-agent-guard] output truncated"));
    assert.ok(out.includes(dir));
    const written = fs.readdirSync(dir).find(f => f.startsWith("toolcall-1"));
    assert.ok(written, "temp file created");
    assert.equal(fs.readFileSync(path.join(dir, written!), "utf-8"), big);
  });
  it("returns an in-memory fallback preview when the temp dir is not writable", () => {
    // A read-only / non-creatable tempDir must not throw out of the handler.
    const big = ("line\n").repeat(10);
    const out = truncateToTempFile(big, "/proc/this/cannot/be/created/guard-output", "toolcall-2");
    assert.ok(out.includes("[pi-agent-guard] output truncated"));
    assert.ok(out.includes("temp file write failed"));
    assert.ok(out.includes("line")); // preview retained
  });
});
