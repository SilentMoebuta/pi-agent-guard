import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveConfig, type GuardConfig } from "../src/config";

describe("resolveConfig", () => {
  it("returns defaults when given empty overrides", () => {
    const c = resolveConfig({});
    assert.equal(c.maxOutputLines, 2000);
    assert.equal(c.maxOutputBytes, 50000);
    assert.equal(c.doomLoopThreshold, 3);
    assert.deepEqual(c.sensitivePatterns, [".env", ".git-credentials", ".npmrc", "*.pem", "*.key", "id_rsa"]);
  });
  it("overrides individual fields", () => {
    const c = resolveConfig({ doomLoopThreshold: 5 });
    assert.equal(c.doomLoopThreshold, 5);
    assert.equal(c.maxOutputLines, 2000); // unchanged
  });
  it("merges env vars (PI_GUARD_*) as JSON if present", () => {
    process.env.PI_GUARD_OPTIONS = JSON.stringify({ doomLoopThreshold: 7 });
    const c = resolveConfig({});
    assert.equal(c.doomLoopThreshold, 7);
    delete process.env.PI_GUARD_OPTIONS;
  });
});
