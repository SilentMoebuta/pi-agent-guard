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

import { makeStructuredOutputTool, DEFAULT_STRUCT_SCHEMA } from "../src/structured-output";

function textOf(r: { content: any[] }): string {
  return r.content.map((c: any) => c?.text ?? "").join("");
}

describe("structured_output tool", () => {
  // Default schema for the tool: { title: string, priority: string, tags?: string[] }
  it("accepts a valid payload, echoes it in details, no isError", async () => {
    const tool = makeStructuredOutputTool();
    // execute(toolCallId, params, signal, onUpdate, ctx)
    const r: any = await tool.execute("tc-1", { title: "fix bug", priority: "high", tags: ["x"] }, undefined, undefined, {} as any);
    assert.equal(Array.isArray(r.content), true);
    assert.match(textOf(r), /accepted/i);
    assert.deepEqual(r.details, { title: "fix bug", priority: "high", tags: ["x"] });
    assert.equal("isError" in r, false); // AgentToolResult has no isError
  });
  it("rejects invalid payload with a rejection message describing the violation", async () => {
    const tool = makeStructuredOutputTool();
    const r: any = await tool.execute("tc-2", { priority: "high" }, undefined, undefined, {} as any); // title missing
    assert.match(textOf(r), /title/);
    assert.equal("isError" in r, false);
  });
  it("rejects wrong type with rejection message mentioning the field", async () => {
    const tool = makeStructuredOutputTool();
    const r: any = await tool.execute("tc-3", { title: 42, priority: "high" }, undefined, undefined, {} as any);
    assert.match(textOf(r), /title/);
  });
});

import { shouldRegisterStructuredOutput } from "../src/structured-output";

describe("shouldRegisterStructuredOutput (gating)", () => {
  it("returns false when env var unset", () => {
    assert.equal(shouldRegisterStructuredOutput({}), false);
  });
  it("returns false when env var is not '1'", () => {
    assert.equal(shouldRegisterStructuredOutput({ PI_GUARD_STRUCTURED_OUTPUT: "0" }), false);
    assert.equal(shouldRegisterStructuredOutput({ PI_GUARD_STRUCTURED_OUTPUT: "true" }), false);
  });
  it("returns true only when env var === '1'", () => {
    assert.equal(shouldRegisterStructuredOutput({ PI_GUARD_STRUCTURED_OUTPUT: "1" }), true);
  });
});
