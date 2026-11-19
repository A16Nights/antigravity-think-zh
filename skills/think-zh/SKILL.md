---
name: think-zh
description: Manage model thinking/reasoning language presets (Simplified Chinese or default English), toggle dual-channel reinforcement (static AGENTS.md rules, SessionStart, and PreInvocation per-turn hooks), customize prompt directives, or open the Think-ZH control panel. Trigger when the user asks to switch thinking language, lock reasoning to Chinese, revert to English reasoning, toggle per-turn reinforcement, or inspect Think-ZH status.
---

# 思语中文 · Think-ZH

用于管理模型思考语言与双通道注入策略。

## 可用 MCP 工具

1. **`think_zh_status`**：查看当前思考语言档位（`zh` / `en`）、静态规则 / `SessionStart` / `PreInvocation` 开关、每轮策略、文件同步状态与实际注入预览。
2. **`think_zh_set`**：修改配置并立即同步到 `rules/AGENTS.md` 与 Hooks 共享配置：
   - `thinkingLanguage`: `"zh"`（简体中文思考）或 `"en"`（默认英文思考，仅约束回复跟随提问语言）
   - `injectPrompt`: 布尔值，是否开启静态 `rules/AGENTS.md` 约束
   - `injectSessionStart`: 布尔值，是否开启新会话开场注入
   - `injectPerTurn`: 布尔值，是否开启 `PreInvocation` 每轮前置强化（适合长对话防漂移）
   - `perTurnScope`: `"per_user_turn"`（每轮用户提问仅注入一次）或 `"every_invocation"`（每次模型调用前均注入）
   - `customText`: 字符串，传入非空内容时替代内置预设文案；传 `""` 恢复内置文案
3. **`think_zh_preview`**：不修改本地配置，预览指定档位或自定义文案下实际生成的静态规则与每轮提示及字符数。
4. **`think_zh_reset`**：恢复默认配置（简体中文思考 + 开启静态规则 + 关闭附加 Hook）。

## 侧栏可视化面板

插件启用且 Sidecar 运行后，可在回复中提供一键打开链接：

```markdown
[思语中文 · Think-ZH](sidecar://think-zh/panel/)
```

## 能力边界

- 思考语言属于模型自身推理行为，插件通过高优先级规则与前置消息强力引导，无法在模型底层 100% 强制锁死。
- 若长对话或代码密集任务中模型仍偶发切换回英文思考，可建议开启 `injectPerTurn: true` 增强提醒。
