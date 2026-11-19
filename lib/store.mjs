import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const THINKING_LANGUAGES = ["zh", "en"];
export const PER_TURN_SCOPES = ["per_user_turn", "every_invocation"];
export const MAX_STATE_CONVERSATIONS = 100;

export const DEFAULT_CONFIG = Object.freeze({
  thinkingLanguage: "zh",
  injectPrompt: true,
  injectSessionStart: false,
  injectPerTurn: false,
  perTurnScope: "per_user_turn",
  customText: "",
  updatedAt: ""
});

const ZH_RULE_TEXT = `# 思语中文 · 思考语言约束（最高优先级）

1. 内部思考与推理（thinking / reasoning）必须全程使用简体中文，从第一个字起即使用简体中文，禁止先用英文起草再翻译。
2. 涵盖任务分析、方案规划、工具调用前后的推理、日志排查、报错诊断与最终自查；即使提问、代码、报错、路径或工具输出为英文，内部思考仍保持简体中文。
3. 最终回复跟随用户最近一条实质提问的语言（无法判断时默认简体中文）；代码、标识符、文件路径、命令行与报错原文保持原样，不强行翻译。
`;

const EN_RULE_TEXT = `# 思语中文 · 回复语言约束

1. 最终回复使用与用户最近一条实质提问相同的语言；无法判断时默认简体中文。思考语言保持模型默认行为。
2. 代码、标识符、文件路径、命令行与报错原文保持原样，不强行翻译；工具输出与引用不改变回复语言。
`;

export function normalizeThinkingLanguage(value) {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return THINKING_LANGUAGES.includes(raw) ? raw : DEFAULT_CONFIG.thinkingLanguage;
}

export function normalizePerTurnScope(value) {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return PER_TURN_SCOPES.includes(raw) ? raw : DEFAULT_CONFIG.perTurnScope;
}

function toBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

export function resolveConfig(raw = {}) {
  const input = raw && typeof raw === "object" ? raw : {};
  return {
    thinkingLanguage: normalizeThinkingLanguage(input.thinkingLanguage),
    injectPrompt: toBoolean(input.injectPrompt, DEFAULT_CONFIG.injectPrompt),
    injectSessionStart: toBoolean(input.injectSessionStart, DEFAULT_CONFIG.injectSessionStart),
    injectPerTurn: toBoolean(input.injectPerTurn, DEFAULT_CONFIG.injectPerTurn),
    perTurnScope: normalizePerTurnScope(input.perTurnScope),
    customText: typeof input.customText === "string" ? input.customText : DEFAULT_CONFIG.customText,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : DEFAULT_CONFIG.updatedAt
  };
}

export function buildRuleMarkdown(cfg) {
  const resolved = resolveConfig(cfg);
  if (!resolved.injectPrompt) {
    return "<!-- think-zh: 静态规则注入已关闭 -->\n";
  }
  const custom = resolved.customText.trim();
  if (custom.length > 0) {
    return `# 思语中文 · 自定义语言约束\n\n${custom}\n`;
  }
  return resolved.thinkingLanguage === "en" ? EN_RULE_TEXT : ZH_RULE_TEXT;
}

export function buildSessionStartText(cfg) {
  const resolved = resolveConfig(cfg);
  const custom = resolved.customText.trim();
  if (custom.length > 0) {
    return `[think-zh] 自定义语言规则已激活：\n${custom}`;
  }
  if (resolved.thinkingLanguage === "en") {
    return "[think-zh] 默认英文思考模式已激活：内部思考保持模型默认语言，仅保持最终回复跟随用户最近一条实质提问的语言。";
  }
  return "[think-zh] 简体中文思考模式已激活：本次会话的内部思考与推理（thinking / reasoning）请全程使用简体中文（从首字起）；代码、标识符、路径与命令保持原文，最终回复跟随提问语言。";
}

export function buildPerTurnText(cfg, options = {}) {
  const resolved = resolveConfig(cfg);
  const modeChanged = Boolean(options?.modeChanged);
  const custom = resolved.customText.trim();
  if (custom.length > 0) {
    return `[think-zh] ${custom}`;
  }
  if (resolved.thinkingLanguage === "zh") {
    return "[think-zh] 思考语言提醒：本轮内部思考与推理（thinking / reasoning）请全程使用简体中文（从首字起）；代码、路径与命令保持原文，回复跟随用户提问语言。";
  }
  if (modeChanged) {
    return "[think-zh] 模式已切回默认英文思考：思考语言恢复模型默认，仅保持回复跟随提问语言。";
  }
  return "";
}

function getDefaultHome() {
  return process.env.USERPROFILE || process.env.HOME || os.homedir();
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function atomicWriteFile(filePath, content) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  const tmpName = `.tmp.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const tmpPath = path.join(dir, tmpName);
  try {
    fs.writeFileSync(tmpPath, content, "utf8");
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    } catch {}
    throw err;
  }
}

function sha256Short(text) {
  return crypto.createHash("sha256").update(String(text)).digest("hex").slice(0, 16);
}

export class ThinkZhStore {
  constructor(options = {}) {
    this.dataDir = options.dataDir || process.env.THINK_ZH_DATA_DIR || path.join(getDefaultHome(), ".gemini", "think-zh");
    this.pluginDir = options.pluginDir || process.env.PLUGIN_ROOT || path.resolve(__dirname, "..");
    this.configPath = path.join(this.dataDir, "config.json");
    this.statePath = path.join(this.dataDir, "state.json");
    this.rulePath = path.join(this.pluginDir, "rules", "AGENTS.md");
  }

  loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        return resolveConfig(DEFAULT_CONFIG);
      }
      const raw = fs.readFileSync(this.configPath, "utf8");
      const parsed = JSON.parse(raw);
      return resolveConfig(parsed);
    } catch {
      return resolveConfig(DEFAULT_CONFIG);
    }
  }

  saveConfig(cfg) {
    const resolved = resolveConfig(cfg);
    atomicWriteFile(this.configPath, JSON.stringify(resolved, null, 2) + "\n");
    return resolved;
  }

  syncRulesFile(cfg = this.loadConfig()) {
    const markdown = buildRuleMarkdown(cfg);
    const existing = fs.existsSync(this.rulePath) ? fs.readFileSync(this.rulePath, "utf8") : null;
    if (existing !== markdown) {
      atomicWriteFile(this.rulePath, markdown);
    }
    return markdown;
  }

  getPreview(cfg = this.loadConfig()) {
    const resolved = resolveConfig(cfg);
    const ruleMarkdown = buildRuleMarkdown(resolved);
    const sessionStartText = buildSessionStartText(resolved);
    const perTurnText = buildPerTurnText(resolved);
    return {
      ruleMarkdown,
      ruleChars: ruleMarkdown.length,
      sessionStartText,
      sessionStartChars: sessionStartText.length,
      perTurnText,
      perTurnChars: perTurnText.length
    };
  }

  getStatus() {
    const config = this.loadConfig();
    const preview = this.getPreview(config);
    let ruleSynced = false;
    try {
      if (fs.existsSync(this.rulePath)) {
        ruleSynced = fs.readFileSync(this.rulePath, "utf8") === preview.ruleMarkdown;
      }
    } catch {
      ruleSynced = false;
    }
    return {
      config,
      preview,
      paths: {
        dataDir: this.dataDir,
        configPath: this.configPath,
        statePath: this.statePath,
        pluginDir: this.pluginDir,
        rulePath: this.rulePath
      },
      ruleSynced
    };
  }

  updateConfig(patch = {}) {
    const current = this.loadConfig();
    const incoming = patch && typeof patch === "object" ? patch : {};
    const merged = {
      ...current,
      ...(incoming.thinkingLanguage !== undefined ? { thinkingLanguage: incoming.thinkingLanguage } : {}),
      ...(incoming.injectPrompt !== undefined ? { injectPrompt: incoming.injectPrompt } : {}),
      ...(incoming.injectSessionStart !== undefined ? { injectSessionStart: incoming.injectSessionStart } : {}),
      ...(incoming.injectPerTurn !== undefined ? { injectPerTurn: incoming.injectPerTurn } : {}),
      ...(incoming.perTurnScope !== undefined ? { perTurnScope: incoming.perTurnScope } : {}),
      ...(incoming.customText !== undefined ? { customText: incoming.customText } : {}),
      updatedAt: new Date().toISOString()
    };
    const saved = this.saveConfig(merged);
    this.syncRulesFile(saved);
    return this.getStatus();
  }

  resetConfig() {
    const saved = this.saveConfig({
      ...DEFAULT_CONFIG,
      updatedAt: new Date().toISOString()
    });
    this.syncRulesFile(saved);
    return this.getStatus();
  }

  loadState() {
    try {
      if (!fs.existsSync(this.statePath)) {
        return { conversations: {} };
      }
      const parsed = JSON.parse(fs.readFileSync(this.statePath, "utf8"));
      if (parsed && typeof parsed === "object" && parsed.conversations && typeof parsed.conversations === "object") {
        return { conversations: parsed.conversations };
      }
    } catch {}
    return { conversations: {} };
  }

  saveState(state) {
    const convs = state?.conversations && typeof state.conversations === "object" ? state.conversations : {};
    const entries = Object.entries(convs);
    if (entries.length > MAX_STATE_CONVERSATIONS) {
      entries.sort((a, b) => String(b[1]?.lastUpdatedAt || "").localeCompare(String(a[1]?.lastUpdatedAt || "")));
      const trimmed = Object.fromEntries(entries.slice(0, MAX_STATE_CONVERSATIONS));
      atomicWriteFile(this.statePath, JSON.stringify({ conversations: trimmed }, null, 2) + "\n");
      return;
    }
    atomicWriteFile(this.statePath, JSON.stringify({ conversations: convs }, null, 2) + "\n");
  }

  evaluatePreInvocation(input = {}) {
    const cfg = this.loadConfig();
    const convId = String(input?.conversationId || "default").trim() || "default";
    const userText = String(input?.lastUserInput || "").trim();
    const invocationNum = Number(input?.invocationNum || 0);
    const inputHash = userText ? sha256Short(userText) : "";
    const customTrimmed = cfg.customText.trim();
    const customHash = customTrimmed ? sha256Short(customTrimmed) : "";

    const state = this.loadState();
    const prev = state.conversations[convId] || null;
    const prevLanguage = prev?.lastLanguage || "";
    const prevCustomHash = prev?.lastCustomHash || "";
    const modeChanged = Boolean(prev && (prevLanguage !== cfg.thinkingLanguage || prevCustomHash !== customHash));

    let isNewUserTurn = false;
    if (inputHash) {
      isNewUserTurn = inputHash !== (prev?.lastInputHash || "") || (Number(prev?.lastInvocationNum || 0) > 1 && invocationNum === 1);
    } else {
      isNewUserTurn = !prev || invocationNum === 1;
    }

    let shouldInject = false;
    let reason = "disabled_or_deduped";
    const hasActiveContent = cfg.thinkingLanguage === "zh" || customTrimmed.length > 0;

    if (cfg.injectPerTurn) {
      if (cfg.perTurnScope === "every_invocation") {
        if (hasActiveContent || modeChanged) {
          shouldInject = true;
          reason = modeChanged ? "mode_changed" : "every_invocation";
        }
      } else if (modeChanged) {
        shouldInject = true;
        reason = "mode_changed";
      } else if (isNewUserTurn && hasActiveContent) {
        shouldInject = true;
        reason = "per_user_turn";
      }
    } else if (modeChanged) {
      shouldInject = true;
      reason = "mode_changed";
    }

    const text = shouldInject ? buildPerTurnText(cfg, { modeChanged, previousLanguage: prevLanguage }) : "";
    if (!text) {
      shouldInject = false;
      if (reason !== "disabled_or_deduped") {
        reason = "empty_text";
      }
    }

    const stateDirty =
      !prev ||
      prev.lastInputHash !== inputHash ||
      prevLanguage !== cfg.thinkingLanguage ||
      prevCustomHash !== customHash ||
      prev.lastInvocationNum !== invocationNum ||
      shouldInject;

    if (stateDirty) {
      state.conversations[convId] = {
        lastInputHash: inputHash,
        lastLanguage: cfg.thinkingLanguage,
        lastCustomHash: customHash,
        lastInvocationNum: invocationNum,
        lastUpdatedAt: new Date().toISOString(),
        injectCount: Number(prev?.injectCount || 0) + (shouldInject ? 1 : 0)
      };
      this.saveState(state);
    }

    return {
      shouldInject,
      reason,
      text,
      isNewUserTurn,
      modeChanged
    };
  }
}
