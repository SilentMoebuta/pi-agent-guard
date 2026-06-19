import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { countMalformedLines, type IntegrityReport } from "../src/integrity";

describe("countMalformedLines", () => {
  const dirs: string[] = [];
  after(() => { for (const d of dirs) fs.rmSync(d, { recursive: true, force: true }); });
  function mkSession(content: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "integ-"));
    dirs.push(dir);
    const file = path.join(dir, "session.jsonl");
    fs.writeFileSync(file, content, "utf-8");
    return file;
  }
  it("returns 0 malformed for a clean jsonl", () => {
    const f = mkSession([`{"type":"session","id":"a"}`, `{"type":"message"}`].join("\n") + "\n");
    const r = countMalformedLines(f);
    assert.equal(r.malformed, 0);
    assert.equal(r.totalLines, 2);
  });
  it("counts malformed lines, skips blank lines", () => {
    const f = mkSession([`{"ok":1}`, `not json`, ``, `{"ok":2}`, `also bad`].join("\n"));
    const r = countMalformedLines(f);
    assert.equal(r.malformed, 2);
    assert.equal(r.totalLines, 4); // blank not counted
  });
  it("returns malformed=0 and missing=true when file absent", () => {
    const r = countMalformedLines("/nonexistent/path.jsonl");
    assert.equal(r.malformed, 0);
    assert.equal(r.missing, true);
  });
});
