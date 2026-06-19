export type JsonType = "string" | "number" | "boolean" | "array" | "object" | "null";

export interface StructSchemaProperty { type: JsonType; }
export interface StructSchema {
  type: "object";
  required: string[];
  properties: Record<string, StructSchemaProperty>;
}

export interface ValidationResult { ok: boolean; error?: string; }

function jsType(v: unknown): JsonType {
  if (Array.isArray(v)) return "array";
  if (v === null) return "null";
  return typeof v as JsonType;
}

export function validateStructuredOutput(payload: unknown, schema: StructSchema): ValidationResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, error: "payload must be an object" };
  }
  const obj = payload as Record<string, unknown>;
  for (const key of schema.required) {
    if (!(key in obj)) return { ok: false, error: `missing required field: ${key}` };
  }
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (key in obj) {
      const t = jsType(obj[key]);
      if (t !== prop.type) {
        return { ok: false, error: `field ${key} expected ${prop.type}, got ${t}` };
      }
    }
  }
  return { ok: true };
}

import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";

export const DEFAULT_STRUCT_SCHEMA: StructSchema = {
  type: "object",
  required: ["title", "priority"],
  properties: {
    title: { type: "string" },
    priority: { type: "string" },
    tags: { type: "array" },
  },
};

const StructParams = Type.Object({
  title: Type.String(),
  priority: Type.String(),
  tags: Type.Optional(Type.Array(Type.String(), { description: "optional tags" })),
});

export function makeStructuredOutputTool(schema: StructSchema = DEFAULT_STRUCT_SCHEMA) {
  return defineTool({
    name: "structured_output",
    label: "Structured Output",
    description:
      "Produce a structured (JSON-validated) result. " +
      "Only call this tool when the user explicitly requests structured/JSON output for the current task. " +
      "On success the validated payload is echoed back as the structured result.",
    parameters: StructParams,
    async execute(_toolCallId: string, params: Static<typeof StructParams>, _signal, _onUpdate, _ctx) {
      const result = validateStructuredOutput(params as unknown as Record<string, unknown>, schema);
      if (!result.ok) {
        return {
          content: [{ type: "text" as const, text: `[pi-agent-guard] structured_output rejected: ${result.error}` }],
          details: { error: result.error },
        };
      }
      return {
        content: [{ type: "text" as const, text: `[pi-agent-guard] structured_output accepted.` }],
        details: params,
      };
    },
  });
}

/** Returns true iff the structured_output tool should be registered for this session.
 *  Default off (no pollution of normal sessions); opt-in via PI_GUARD_STRUCTURED_OUTPUT=1. */
export function shouldRegisterStructuredOutput(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.PI_GUARD_STRUCTURED_OUTPUT === "1";
}
