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
  it("detects no-slash bash paths by tokenizing the command (cat ~/.git-credentials)", () => {
    assert.ok(detectSensitivePath({ command: "cat ~/.git-credentials" }, [".git-credentials"]));
  });
  it("detects bare `cat .env` (no slash)", () => {
    assert.ok(detectSensitivePath({ command: "cat .env" }, [".env"]));
  });
  it("detects *.pem token in a bash command with no slash (cat ~/secrets.pem)", () => {
    assert.ok(detectSensitivePath({ command: "cat ~/secrets.pem" }, ["*.pem"]));
  });
  it("recurses into nested object values", () => {
    assert.ok(detectSensitivePath({ options: { path: "/home/u/.env" } }, [".env"]));
  });
  it("does not flag a normal bash command", () => {
    assert.equal(detectSensitivePath({ command: "cat src/index.ts" }, [".env", "*.key"]), null);
  });
  it("REJECTION_MESSAGE is non-empty and mentions guard", () => {
    assert.ok(REJECTION_MESSAGE.includes("pi-agent-guard"));
  });
});
