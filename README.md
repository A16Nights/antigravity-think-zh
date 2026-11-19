# 思语中文 · Think-ZH

[English Documentation](./README.en.md)

面向 Antigravity 的零依赖独立插件：引导模型使用**简体中文**进行内部思考与推理（`thinking / reasoning`），并保留代码、标识符、路径与报错原文，同时支持随时切回**默认英文思考**（仅保留回复语言跟随提问）。

> **致谢**：本插件的核心规则与双通道强化思路受开源项目 [`Len7183/DSH-Think-zh`](https://github.com/Len7183/DSH-Think-zh)（MIT）启发，并结合 Antigravity 原生插件架构（Rules + Lifecycle Hooks + MCP Server + Sidecar UI）重新设计与实现。

---

## 核心特性

1. **双档位思考语言预设（即时生效）**
   - **简体中文思考（默认推荐，`zh`）**：要求模型从第一个字起全程使用简体中文推理，涵盖方案规划、工具调用前后推理与报错排查；代码、路径、标识符与命令保持原文；最终回复跟随用户提问语言。
   - **默认英文思考（`en`）**：把思考语言交还模型默认行为，仅保留“最终回复跟随用户最近一条实质提问语言”的约束。
2. **双通道强化机制**
   - **静态规则通道（`rules/AGENTS.md`）**：配置改动后即时原子同步到插件规则文件，轻量且常驻生效。
   - **生命周期 Hook 通道（`SessionStart` + `PreInvocation`）**：
     - 可选新会话开场一次性提醒（`SessionStart`）；
     - 可选每轮前置强化（`PreInvocation`），专为长对话或大量英文日志/代码上下文中容易漂移回英文思考的模型设计；
     - 支持按「每轮用户提问一次（`per_user_turn`）」或「每次模型调用（`every_invocation`）」去重节流，避免刷屏与 Token 浪费；
     - 支持对话中途热切换提醒（`zh` ↔ `en` 切换后下一轮自动同步告知模型）。
3. **自定义指令覆盖**：支持传入 `customText` 替代内置文案，留空即自动恢复内置预设。
4. **双入口即时控制**：提供 4 个前缀清晰的 MCP 工具与一个轻量侧栏控制面板（Sidecar UI）。
5. **零第三方依赖**：纯 Node.js（`>=22.0.0`）原生 ESM 实现，无需 `npm install`。

---

## 安装方法

将本仓库目录复制（或链接）到 Antigravity 全局插件目录下的 `think-zh`：

- **Windows（PowerShell）**：
  ```powershell
  Copy-Item -Recurse -Force ".\antigravity-think-zh" "$env:USERPROFILE\.gemini\config\plugins\think-zh"
  ```
- **macOS / Linux**：
  ```bash
  cp -R ./antigravity-think-zh ~/.gemini/config/plugins/think-zh
  ```

安装后在 Antigravity 插件管理页确认 **思语中文 · Think-ZH** 已启用即可生效（无需额外安装依赖）。

---

## 使用方式

### 1. 侧栏可视化控制面板（Sidecar UI）

插件启用后，可在对话中点击链接打开侧栏面板（或请求助手打开）：

```markdown
[思语中文 · Think-ZH](sidecar://think-zh/panel/)
```

在面板中可以直接切换「简体中文思考 / 默认英文思考」、开关各个注入通道、编辑自定义指令并实时预览最终注入内容。

### 2. MCP 工具

| 工具名 | 用途 |
| :--- | :--- |
| `think_zh_status` | 查看当前档位、开关状态、每轮策略、规则文件同步状态及注入预览 |
| `think_zh_set` | 修改档位（`zh`/`en`）、静态规则/Hook 开关、触发粒度或自定义指令 |
| `think_zh_preview` | 不写入磁盘地预览指定配置下实际生成的规则与前置提示 |
| `think_zh_reset` | 一键恢复默认配置并同步 `rules/AGENTS.md` |

配置与轻量会话去重状态统一保存在 `~/.gemini/think-zh/`（可通过环境变量 `THINK_ZH_DATA_DIR` 覆盖），MCP、Hook 与 Sidecar 共享同一份配置，改动即时生效。

---

## 本地测试

```bash
node --test tests/think-zh.test.mjs
```

---

## 能力边界说明

思考语言本质上属于模型自身的推理行为。本插件通过高优先级规则文件、可选开场提醒与前置系统消息对模型进行强力引导，但**无法在模型底层 100% 强制锁死思考语言**。对于较长上下文或英文技术资料较多的任务，建议在面板或 `think_zh_set` 中开启 `injectPerTurn: true` 以提升中文思考稳定性。

---

## 许可证

[MIT License](./LICENSE)
