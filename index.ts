// pi-agent-guard — Behavior quality guard for pi agent.
// Status: scaffolded. Implementation pending design confirmation.
// See README.md for the P0/P1 implementation roadmap.
//
// Key pi APIs (verified against pi 0.79.8 dist, do not change pi core):
//   - pi.on("session_start", ...)        // types.d.ts:406 — post-hoc jsonl integrity check
//   - pi.on("tool_result", (event) =>    // types.d.ts:694 "Can modify result"
//       ({ content?, details?, isError? })  // runner.js:592 emitToolResult consumes this
//     )
//   - pi.on("tool_execution_start", ...)  // types.d.ts:542 — doom_loop observation
//   - pi.on("tool_execution_end", ...)    // types.d.ts:556
//   - pi.on("before_provider_request", ...)// types.d.ts:481 — logging
//
// Intentionally minimal entry for now. Handlers will be added per README roadmap.

export default function (_pi: any): void {
  // TODO: register handlers per README P0/P1 roadmap.
  // P0-S2: session_start jsonl integrity check
  // P1-S1: tool_result truncation-to-file
  // P1-S2: continuous logging via event subscriptions
  // P1-S3: tool_result sensitive-file soft protection
  // (multi-roles P1): doom_loop detection, query-level structured output
}
