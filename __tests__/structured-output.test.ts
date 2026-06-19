import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateStructuredOutput, type StructSchema } from "../src/structured-output";

const schema: StructSchema = {
  type: "object",
  required: ["title", "priority"],
  properties: {
    title: { type: "string" },
    priority: { type: "string" },
    tags: { type: "array" },
  },
};

describe("validateStructuredOutput", () => {
  it("ok for a valid payload with required + optional fields", () => {
    const r = validateStructuredOutput({ title: "x", priority: "high", tags: ["a"] }, schema);
    assert.equal(r.ok, true);
    assert.equal(r.error, undefined);
  });
  it("ok when optional field omitted", () => {
    const r = validateStructuredOutput({ title: "x", priority: "high" }, schema);
    assert.equal(r.ok, true);
  });
  it("fails on missing required field (error mentions the field)", () => {
    const r = validateStructuredOutput({ priority: "high" }, schema); // title missing
    assert.equal(r.ok, false);
    assert.match(r.error!, /title/);
  });
  it("fails on wrong type (error mentions the field)", () => {
    const r = validateStructuredOutput({ title: 123, priority: "high" }, schema); // title not string
    assert.equal(r.ok, false);
    assert.match(r.error!, /title/);
  });
  it("fails on wrong type for array field", () => {
    const r = validateStructuredOutput({ title: "x", priority: "high", tags: "not-array" }, schema);
    assert.equal(r.ok, false);
    assert.match(r.error!, /tags/);
  });
  it("fails when payload is not an object", () => {
    const r = validateStructuredOutput("not-an-object", schema);
    assert.equal(r.ok, false);
    assert.match(r.error!, /object/i);
  });
});
