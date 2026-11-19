# Think-ZH · 思语中文

[中文文档](./README.md)

A zero-dependency standalone plugin for Antigravity that guides model reasoning (`thinking / reasoning`) to **Simplified Chinese** while keeping code, identifiers, file paths, and error outputs verbatim — with instant switching back to **Default English** reasoning and an optional per-turn reinforcement hook.

> **Acknowledgement**: Inspired by [`Len7183/DSH-Think-zh`](https://github.com/Len7183/DSH-Think-zh) (MIT), re-architected natively for Antigravity using Rules, Lifecycle Hooks (`SessionStart` & `PreInvocation`), an MCP Server, and an Aux-Pane Sidecar UI.

---

## Key Features

1. **Two Instant Presets**
   - **Simplified Chinese Thinking (`zh`, default)**: Instructs the model to reason strictly in Simplified Chinese from the very first character (including planning, tool reasoning, and debugging), while keeping code, symbols, paths, and CLI commands verbatim. Final replies follow the user's prompt language.
   - **Default English Thinking (`en`)**: Leaves reasoning language to the model default while keeping the reply-language rule intact.
2. **Dual-Channel Injection**
   - **Static Rule Channel (`rules/AGENTS.md`)**: Atomically updated whenever configuration changes.
   - **Lifecycle Hook Channel (`SessionStart` & `PreInvocation`)**:
     - Optional one-time `SessionStart` notice for new sessions;
     - Optional `PreInvocation` per-turn reinforcement for models that drift back to English reasoning in long, code-heavy trajectories;
     - Configurable granularity (`per_user_turn` deduplicated per prompt, or `every_invocation`);
     - Live hot-switch notice when toggling `zh` ↔ `en` mid-conversation.
3. **Custom Directive Override**: Set `customText` to override built-in presets; clear it to restore presets immediately.
4. **MCP + Sidecar Panel**: 4 clean MCP tools plus a responsive theme-aware Aux Pane control panel.
5. **Zero External Dependencies**: Pure Node.js (`>=22.0.0`) ESM.

---

## Installation

Copy this folder as `think-zh` inside your Antigravity global plugins directory:

- **Windows (PowerShell)**:
  ```powershell
  Copy-Item -Recurse -Force ".\antigravity-think-zh" "$env:USERPROFILE\.gemini\config\plugins\think-zh"
  ```
- **macOS / Linux**:
  ```bash
  cp -R ./antigravity-think-zh ~/.gemini/config/plugins/think-zh
  ```

Verify that **思语中文 · Think-ZH** is enabled in Antigravity Customizations.

---

## Usage

### Sidecar Control Panel

Once enabled, open the control panel via:

```markdown
[思语中文 · Think-ZH](sidecar://think-zh/panel/)
```

### MCP Tools

| Tool | Description |
| :--- | :--- |
| `think_zh_status` | Inspect active language preset, channel toggles, sync status, and rendered previews |
| `think_zh_set` | Update preset (`zh`/`en`), rule/hook toggles, `perTurnScope`, or `customText` |
| `think_zh_preview` | Preview rendered directives without persisting changes |
| `think_zh_reset` | Reset to defaults and sync `rules/AGENTS.md` |

Shared configuration and lightweight per-conversation dedup state live under `~/.gemini/think-zh/` (override via `THINK_ZH_DATA_DIR`).

---

## Tests

```bash
node --test tests/think-zh.test.mjs
```

---

## Caveat

Reasoning language is ultimately determined by the model itself. This plugin strongly guides the model via rules and lifecycle reminders, rather than hard-locking model internals. Enabling `injectPerTurn` is recommended for long multi-step coding sessions if a model drifts back to English reasoning.

---

## License

[MIT License](./LICENSE)
