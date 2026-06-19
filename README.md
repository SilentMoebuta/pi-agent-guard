# pi-agent-guard

> Behavior quality guard for the [pi](https://github.com/earendil-works/pi) coding agent.
> Status: scaffolded (2026-06-19). Implementation pending design confirmation.

## 定位

pi agent 的**行为质量保障层**——单 agent / subagent / 未来 team teammate 通用。不改 pi 核心，全部通过扩展事件机制实现。

与现有包的区别：
- **pi-hooks-system** = 用户配的**静态规则**（JSON 规则，如"禁止 rm -rf"）
- **pi-agent-guard** = 自动的**行为质量机制**（doom_loop 检测、工具结果改写、日志、完整性校验）

两者并存，职责不重叠。

## 待实现项（按 P0/P1）

### P0（单 agent 基础，必做）
- **P0-S2 session 完整性告警**：`session_start` hook 校验 jsonl，损坏行 > 0 告警（核心仍静默丢，扩展能发现丢了多少）。~30 行。

### P1（轻补，单 agent 也受益）
- **P1-S1 工具输出截断落盘**：`tool_result` handler 检测超长 content → 写临时文件 → 改写 content 附 path。~40 行。
- **P1-S2 持续日志**：订阅 `tool_execution_*` / `before_provider_request` / `session_*` 事件写日志文件。~60 行。
- **P1-S3 敏感文件软保护**：`tool_result` handler 检测 read/bash 路径命中 `.env` / `.git-credentials` / `*.key` → 改写 content 为拒绝。~50 行。
- **(multi-roles P1) doom_loop 检测**：连续 N 次相同 tool+input 触发 abort。~40 行。
- **(multi-roles P1) query 级结构化输出**：StructuredOutput 工具 + toolChoice:required。~80 行。

## 关键机制依赖（pi 核心已有，不改核心）

- `session_start` 事件（事后只读校验 jsonl）— types.d.ts:406
- `tool_result` 事件能改写结果（content/details/isError）— types.d.ts:694 "Can modify result"；runner.js:592 `emitToolResult`
- `tool_execution_start/end` 事件（观察 + doom_loop 检测）
- `before_provider_request` / `session_*` 事件（日志）

## 不做（取向差异 / 无 hook 替代）

- **PreToolUse 阻断式 hook**：pi 走 setActiveTools 粗粒度白名单路线（同 OpenCode/Claude），非 Codex OS sandbox 路线。改 pi 核心 emit 高风险。触发条件：出现白名单表达不了的半信任 role。
- **session 写原子化 / 跨进程锁**：要改核心写路径，无 hook 可绕。触发条件窄（并发同 session / 断电），接受为已知缺口，与 pi by-design 极简取向一致。

## 远期演进

- **multi-roles 阶段**：doom_loop / 步数 / 契约对 subagent 同样适用，本包复用
- **teams 阶段**：teammate 是 subagent 的延伸，本包机制对 teammate 通用

## 关联文档

- 单 agent 差距分析：`/home/qliy/project27-pi/2026-06-19-agent-baseline-gap-analysis.md`
- multi-roles 差距分析：`/home/qliy/project27-pi/2026-06-19-advanced-agent-gap-analysis.md`
- pi-roles 设计：`/home/qliy/project27-pi/2026-06-19-pi-roles-design.md`

## License

MIT
