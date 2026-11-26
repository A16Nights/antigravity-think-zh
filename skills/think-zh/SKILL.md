---
name: think-zh
description: Manage thinking/reasoning language presets (Simplified Chinese or default English) specifically for external custom reasoning models in Antigravity (auto-skips native Gemini/Antigravity models), toggle external-model hooks (PreInvocation, SessionStart) or optional static AGENTS.md fallback, customize directives, or open the Think-ZH control panel. Trigger when the user asks to switch thinking language for external models, lock reasoning to Chinese, revert to English reasoning, inspect Think-ZH status, or asks why native Gemini still shows English thoughts.
---

# 思语中文 · Think-ZH

专为 **外部自定义推理模型** 设计的思考语言控制插件（默认仅在使用外部模型时生效，Antigravity 原生模型自动静默跳过）。

## 适用范围与原生 Gemini 限制说明

- **适用对象**：通过苍蓝星轨（`azure-orbit`）等挂载到 Antigravity 的外部推理模型（如 DeepSeek、Qwen、GLM、MiniMax 等直接透传原生 `reasoning_content` 的模型）。
- **为何无法对原生 Gemini 生效**：Google Cloud Code 服务端不会将 Gemini 的原始内部思考下发给客户端，而是由云端 **Thought Summarizer** 将模型内部思考压缩改写成客观的英文第三人称摘要（并附带不可在本地解密的加密 `thoughtSignature`）；客户端注入任何提示词都无法关闭或修改云端摘要器的输出语言。
- **开启行为**：`PreInvocation`（默认开启）与 `SessionStart` Hook 均内置 `external-model-guard` 守卫，**仅在识别到外部自定义模型时触发注入**，使用原生 Gemini / Antigravity 内置模型时自动静默跳过（零额外 Token 消耗）。
- **原生 Gemini 替代方案**：若希望在原生 Gemini 会话中阅读中文版思考摘要，请使用苍蓝棱镜（`azure-prism`）进行按需翻译。

## 可用 MCP 工具

1. **`think_zh_status`**：查看当前思考语言档位（`zh` / `en`）、各通道开关、每轮策略、文件同步状态与实际注入预览。
2. **`think_zh_set`**：修改配置并立即同步到 Hooks 共享配置与 `rules/AGENTS.md`：
   - `thinkingLanguage`: `"zh"`（简体中文思考）或 `"en"`（默认英文思考，仅约束回复跟随提问语言）
   - `injectPerTurn`: 布尔值，默认 `true`，是否开启 `PreInvocation` 每轮前置强化（仅外部模型生效，按回合去重）
   - `perTurnScope`: `"per_user_turn"`（每轮用户提问仅注入一次）或 `"every_invocation"`（每次模型调用前均注入）
   - `injectSessionStart`: 布尔值，是否开启新会话开场注入（仅外部模型生效）
   - `injectPrompt`: 布尔值，默认 `false`，是否开启静态全局 `rules/AGENTS.md` 兜底（注意：开启后宿主会无差别加载给所有模型，包括原生 Gemini，一般无需开启）
   - `customText`: 字符串，传入非空内容时替代内置预设文案；传 `""` 恢复内置预设
3. **`think_zh_preview`**：不修改本地配置，预览指定档位或自定义文案下实际生成的各通道注入文本及字符数。
4. **`think_zh_reset`**：恢复默认配置（简体中文思考 + 开启仅外部模型生效的 `PreInvocation` 回合去重强化 + 关闭静态全局规则与 `SessionStart`）。

## 侧栏可视化面板

插件启用且 Sidecar 运行后，仅在用户需要打开面板调整配置时在回复中提供一键打开链接（Antigravity 2.35.1+ 会自动在侧栏展开）：

```markdown
[思语中文 · Think-ZH](sidecar://think-zh/panel/)
```

## 能力边界

- 仅对透传原始思考流的外部推理模型生效；无法改变原生 Gemini 云端 Thought Summarizer 的英文摘要输出。
- 思考语言属于模型自身推理行为，插件通过高优先级前置提示强力引导，无法在模型权重底层 100% 硬锁；若长对话或英文日志较多时偶发切回英文，可将 `perTurnScope` 调整为 `every_invocation`。
