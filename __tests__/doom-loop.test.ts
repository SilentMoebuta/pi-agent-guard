import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DoomLoopTracker } from "../src/doom-loop";

describe("DoomLoopTracker", () => {
  it("returns false before threshold reached", () => {
    const t = new DoomLoopTracker(3);
    t.observe("bash", { command: "ls" });
    assert.equal(t.isLooping("bash", { command: "ls" }), false); // would be 2nd, below threshold 3
  });
  it("returns true at threshold (3 consecutive identical)", () => {
    const t = new DoomLoopTracker(3);
    t.observe("bash", { command: "ls" });
    t.observe("bash", { command: "ls" });
    assert.equal(t.isLooping("bash", { command: "ls" }), true); // this would be 3rd
  });
  it("resets counter when input changes", () => {
    const t = new DoomLoopTracker(3);
    t.observe("bash", { command: "ls" });
    t.observe("bash", { command: "pwd" }); // different — resets pwd run to count 1
    assert.equal(t.isLooping("bash", { command: "pwd" }), false); // would be 2nd pwd, below threshold
  });
  it("ignores toolName differences", () => {
    const t = new DoomLoopTracker(3);
    t.observe("read", { path: "/a" });
    assert.equal(t.isLooping("bash", { path: "/a" }), false);
  });
});
