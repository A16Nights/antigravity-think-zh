# 思语中文 · Think-ZH (`antigravity-think-zh`)

[English Documentation](./README.en.md)

面向 **Google Antigravity** 的零依赖思考语言控制插件：引导模型从第一个字起全程使用**简体中文**进行内部思考与推理（`thinking / reasoning`），同时严格保留代码、标识符、文件路径、命令行与报错原文不强行翻译，并支持随时一键切回**默认英文思考**。

> **致谢**：本插件的核心规则与双通道强化思路受开源项目 [`Len7183/DSH-Think-zh`](https://github.com/Len7183/DSH-Think-zh)（MIT）启发，并结合 Antigravity 原生插件架构（Rules + Lifecycle Hooks + 外接模型智能识别 + MCP Server + Sidecar UI）重新设计与实现。

---

## ✨ 功能全景

### 1. 双档位思考语言预设（即时热切换）
- **简体中文思考（默认推荐，`zh`）**：
  - 要求模型内部思考与推理（涵盖任务分析、方案规划、工具调用前后推理、日志排查、报错诊断与最终自查）从第一个字起全程使用简体中文，禁止先用英文起草再翻译；
  - 即使提问、代码、报错、路径或工具输出为英文，内部思考仍保持简体中文；
  - 代码、标识符、文件路径、命令行与报错原文保持原样；最终回复跟随用户最近一条实质提问语言。
- **默认英文思考（`en`）**：
  - 将内部思考语言交还模型默认英文习惯，仅保留「最终回复跟随用户提问语言」的基础约束。

### 2. 双通道强化与外接模型智能识别（省 Token 防漂移）
- **静态规则通道（`rules/AGENTS.md`）**：切换档位或修改自定义文案后，即时原子同步写入插件规则文件，轻量常驻生效。
- **生命周期 Hook 通道（`SessionStart` + `PreInvocation`）**：
  - **新会话开场提醒（`SessionStart`）**：会话启动时注入一次思考语言锚点；
  - **外接模型智能前置强化（`PreInvocation` + `external-model-guard`）**：
    - 自动识别当前主模型：当使用外接自定义模型或长对话英文日志较多时，按设定粒度注入前置中文思考提醒，防止模型在大量英文代码/报错诱导下漂移回英文思考；
    - 当使用 Antigravity 内置原生模型时，默认自动跳过每轮重复注入以节省 Token；
  - **智能去重与热切换感知**：支持「每轮用户提问一次（`per_user_turn`）」或「每次模型调用（`every_invocation`）」粒度，并在对话中途切换 `zh` ↔ `en` 时自动在下一轮通知模型更新思考语言。

### 3. 自定义指令文案与实时预览
- 支持在侧栏面板直接编写自定义思考语言指令（`customText`）覆盖内置文案，留空即可一键恢复官方推荐预设；
- 面板底部提供 **「实时注入内容预览」**，清晰展示当前配置下实际写入 `AGENTS.md` 的静态规则与 Hook 前置注入文本。

### 4. 苍蓝统一视觉与交互体系
- **Sidecar + 独立 Web UI 双形态**：提供直观的右侧栏控制面板，点击顶栏 `Web UI` 可在系统默认浏览器中全屏打开。
- **Neko Glass 毛玻璃界面 & 苍蓝主题色调中心**：支持深色/浅色切换、自定义毛玻璃下拉框（`AzureSelect`）、6 套官方主题预设 + 自定义双色 + 4 个自定义栏位跨插件同步、左侧栏快捷入口开关与 GitHub Release 在线更新检查。

---

## 🚀 安装方法

> 前置要求：**Node.js >= 22.0.0**（零第三方 npm 依赖，纯 Node.js 原生 ESM 实现）。

将本仓库克隆到 Antigravity 全局插件目录（目录名固定为 `think-zh`）：

```powershell
# Windows (PowerShell)
git clone https://github.com/A16Nights/antigravity-think-zh.git "$env:USERPROFILE\.gemini\config\plugins\think-zh"

# macOS / Linux
git clone https://github.com/A16Nights/antigravity-think-zh.git ~/.gemini/config/plugins/think-zh
```

重启或重载 Antigravity（`Ctrl+R`），在 **Plugins** 管理页确认 **思语中文 · Think-ZH** 已启用即可生效。

---

## 🧰 MCP 工具一览（4 个）

| 工具名 | 用途 |
| :--- | :--- |
| `think_zh_status` | 查看当前思考语言档位（`zh`/`en`）、各通道开关、去重策略、规则文件同步状态及注入预览 |
| `think_zh_set` | 修改思考语言档位、静态规则开关、`SessionStart`/`PreInvocation` 开关、触发粒度或自定义指令文案 |
| `think_zh_preview` | 不写入磁盘地预览指定参数组合下生成的静态规则与 Hook 注入文本 |
| `think_zh_reset` | 一键恢复默认配置并自动同步 `rules/AGENTS.md` |

---

## 📂 数据与配置存储

- **思考语言配置与会话去重状态**：`~/.gemini/think-zh/config.json`、`state.json`
- **苍蓝套件共享主题 / 左侧栏配置**：`~/.gemini/azure-theme.json`、`~/.gemini/azure-sidebar-nav.json`

---

## 🧪 本地自检

```bash
node --test tests/think-zh.test.mjs
```

## 📄 License

[MIT License](./LICENSE)
