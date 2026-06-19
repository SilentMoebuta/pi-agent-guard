import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectSensitivePath, REJECTION_MESSAGE } from "../src/sensitive";

describe("sensitive", () => {
  it("detects .env path", () => {
    assert.ok(detectSensitivePath("/home/u/project/.env", [".env", "*.key"]));
  });
  it("detects .git-credentials", () => {
    assert.ok(detectSensitivePath("/root/.git-credentials", [".env", ".git-credentials"]));
  });
  it("detects *.key glob", () => {
    assert.ok(detectSensitivePath("/a/b/private.key", [".env", "*.key"]));
  });
  it("does not flag normal files", () => {
    assert.equal(detectSensitivePath("/a/b/src/index.ts", [".env", "*.key"]), null);
  });
  it("extracts path from bash command string", () => {
    // bash args may be {command: "cat /root/.git-credentials"}
    assert.ok(detectSensitivePath("cat /root/.git-credentials", [".git-credentials"]));
  });
  it("REJECTION_MESSAGE is non-empty and mentions guard", () => {
    assert.ok(REJECTION_MESSAGE.includes("pi-agent-guard"));
  });
});
