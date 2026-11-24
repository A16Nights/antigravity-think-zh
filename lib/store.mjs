import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const THINKING_LANGUAGES = ["zh", "en"];
export const PER_TURN_SCOPES = ["per_user_turn", "every_invocation"];
export const MAX_STATE_CONVERSATIONS = 100;
// 回合去重状态（hook-state.json）保留的会话数上限
export const MAX_DEDUP_CONVERSATIONS = 64;

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
    customText: typeof input.customText === "string" ? input.customText.slice(0, 4000) : DEFAULT_CONFIG.customText,
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

// ─── 回合去重（hook-state.json）──────────────────────────────────────────────

// 指纹 = 模式 | 自定义指令哈希：模式或自定义指令变更时立即失效（必须重新注入）。
export function buildTurnFingerprint(cfg) {
  const resolved = resolveConfig(cfg);
  const custom = resolved.customText.trim();
  return `${resolved.thinkingLanguage}|${custom ? sha256Short(custom) : ""}`;
}

export function normalizeTurnKey(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean" || typeof value === "object") return null;
  const text = String(value).trim();
  if (!text) return null;
  const num = Number(text);
  return Number.isFinite(num) ? num : text;
}

export function extractTurnContext(input = {}) {
  const src = input && typeof input === "object" ? input : {};
  const conversationId = String(src.conversationId || src.conversation_id || "").trim();
  const userTurnKey = normalizeTurnKey(src.initialNumSteps ?? src.initial_num_steps ?? null);
  const invocationNum = normalizeTurnKey(src.invocationNum ?? src.invocation_num ?? null);
  return { conversationId, userTurnKey, invocationNum };
}

function readTurnState(statePath) {
  try {
    if (!fs.existsSync(statePath)) return { seq: 0, conversations: {} };
    const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
    const raw =
      parsed && typeof parsed === "object" && parsed.conversations && typeof parsed.conversations === "object"
        ? parsed.conversations
        : {};
    const conversations = {};
    for (const [key, value] of Object.entries(raw)) {
      if (key && value && typeof value === "object") {
        conversations[key] = value;
      }
    }
    return { seq: Number(parsed?.seq) || 0, conversations };
  } catch {
    return { seq: 0, conversations: {} };
  }
}

function writeTurnState(statePath, state) {
  try {
    const conversations =
      state?.conversations && typeof state.conversations === "object" ? state.conversations : {};
    let entries = Object.entries(conversations).filter(([, v]) => v && typeof v === "object");
    if (entries.length > MAX_DEDUP_CONVERSATIONS) {
      entries = entries.sort((a, b) => (Number(b[1]?.seq) || 0) - (Number(a[1]?.seq) || 0));
      entries = entries.slice(0, MAX_DEDUP_CONVERSATIONS);
    }
    const payload = { seq: Number(state?.seq) || 0, conversations: Object.fromEntries(entries) };
    atomicWriteFile(statePath, JSON.stringify(payload, null, 2) + "\n");
    return true;
  } catch {
    return false;
  }
}

// 判定是否跳过本次注入（返回 skip 原因便于排查；null 表示不跳过）
// 跳过条件：conversationId 非空 && userTurnKey !== null && 指纹一致 && 同一 userTurnKey
//   - invocationNum !== null 且与上次不同 -> 同轮后续工具调用，跳过
//   - invocationNum === null（宿主未传该字段）-> 只要同轮已注入过一次也跳过
export function computeTurnSkip(prev, ctx) {
  const { conversationId, userTurnKey, invocationNum, fingerprint } = ctx;
  if (!conversationId || userTurnKey === null || userTurnKey === undefined) return null;
  if (!prev || typeof prev !== "object") return null;
  if (String(prev.fingerprint || "") !== String(fingerprint || "")) return null;
  if (normalizeTurnKey(prev.userTurnKey ?? null) !== userTurnKey) return null;
  const seenCount = Math.max(0, Number(prev.seenCount) || 0);
  if (seenCount < 1) return null;
  const prevInvocation = normalizeTurnKey(prev.invocationNum ?? null);
  if (invocationNum !== null && invocationNum !== prevInvocation) return "same_turn_followup";
  if (invocationNum === null) return "same_turn_no_invocation_num";
  return null;
}

function buildTurnRecord(prev, ctx) {
  const { userTurnKey, invocationNum, fingerprint, seq } = ctx;
  const sameTurn = Boolean(
    prev &&
      typeof prev === "object" &&
      String(prev.fingerprint || "") === String(fingerprint || "") &&
      normalizeTurnKey(prev.userTurnKey ?? null) === userTurnKey
  );
  const prevSeen = sameTurn ? Math.max(0, Number(prev.seenCount) || 0) : 0;
  return {
    fingerprint: String(fingerprint || ""),
    userTurnKey,
    invocationNum,
    seenCount: prevSeen + 1,
    seq: Number(seq) || 0,
    lastUpdatedAt: new Date().toISOString()
  };
}

export class ThinkZhStore {
  constructor(options = {}) {
    this.dataDir =
      options.dataDir ||
      process.env.THINK_ZH_DATA_DIR ||
      path.join(getDefaultHome(), ".gemini", "think-zh");
    this.pluginDir = options.pluginDir || process.env.PLUGIN_ROOT || path.resolve(__dirname, "..");
    this.configPath = path.join(this.dataDir, "config.json");
    this.statePath = path.join(this.dataDir, "state.json");
    // 回合去重状态文件（允许通过构造参数 / 环境变量覆盖数据目录，避免污染真实目录）
    this.hookStatePath =
      options.hookStatePath ||
      process.env.THINK_ZH_HOOK_STATE ||
      path.join(this.dataDir, "hook-state.json");
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

  // ─── 回合去重状态（hook-state.json，与 state.json 分离）──────────────────

  loadTurnState() {
    return readTurnState(this.hookStatePath);
  }

  saveTurnState(state) {
    return writeTurnState(this.hookStatePath, state);
  }

  // 只读判定：当前 input 是否属于"同一用户轮次内已注入过"的后续调用
  checkTurnDedup(input = {}, fingerprint = "") {
    try {
      const ctx = extractTurnContext(input);
      if (!ctx.conversationId || ctx.userTurnKey === null) return null;
      const state = readTurnState(this.hookStatePath);
      const prev = state.conversations[ctx.conversationId] || null;
      return computeTurnSkip(prev, { ...ctx, fingerprint: String(fingerprint || "") });
    } catch {
      return null;
    }
  }

  // 记录一次成功注入（异常静默，绝不影响注入结果）
  recordTurnInjection(input = {}, fingerprint = "") {
    try {
      const ctx = extractTurnContext(input);
      if (!ctx.conversationId || ctx.userTurnKey === null) return false;
      const state = readTurnState(this.hookStatePath);
      const prev = state.conversations[ctx.conversationId] || null;
      const seq = (Number(state.seq) || 0) + 1;
      state.seq = seq;
      state.conversations[ctx.conversationId] = buildTurnRecord(prev, {
        ...ctx,
        fingerprint: String(fingerprint || ""),
        seq
      });
      return writeTurnState(this.hookStatePath, state);
    } catch {
      return false;
    }
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

    // 回合级去重：指纹 = 模式 | 自定义指令哈希；userTurnKey = initialNumSteps
    const turnCtx = extractTurnContext(input);
    const fingerprint = buildTurnFingerprint(cfg);
    const turnSkipReason = this.checkTurnDedup(input, fingerprint);
    const prevTurnKey = (() => {
      try {
        if (!turnCtx.conversationId) return null;
        const ts = readTurnState(this.hookStatePath);
        return normalizeTurnKey(ts.conversations[turnCtx.conversationId]?.userTurnKey ?? null);
      } catch {
        return null;
      }
    })();
    const turnKeyChanged = turnCtx.userTurnKey !== null && prevTurnKey !== turnCtx.userTurnKey;

    const modeChanged = Boolean(prev && (prevLanguage !== cfg.thinkingLanguage || prevCustomHash !== customHash));

    let isNewUserTurn = false;
    if (inputHash) {
      isNewUserTurn =
        inputHash !== (prev?.lastInputHash || "") ||
        (Number(prev?.lastInvocationNum || 0) > 1 && invocationNum === 1);
    } else {
      isNewUserTurn = !prev || invocationNum === 1;
    }
    if (turnKeyChanged) {
      isNewUserTurn = true;
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

    let text = shouldInject ? buildPerTurnText(cfg, { modeChanged, previousLanguage: prevLanguage }) : "";
    if (!text) {
      shouldInject = false;
      if (reason !== "disabled_or_deduped") {
        reason = "empty_text";
      }
    }

    // 同轮第 2 次及之后（含宿主不传 invocationNum 的情况）跳过注入
    if (turnSkipReason) {
      if (shouldInject) {
        shouldInject = false;
        text = "";
        reason = turnSkipReason;
      } else if (reason === "disabled_or_deduped") {
        reason = turnSkipReason;
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

    if (shouldInject) {
      this.recordTurnInjection(input, fingerprint);
    }

    return {
      shouldInject,
      reason,
      text,
      isNewUserTurn,
      modeChanged,
      turnDeduped: Boolean(turnSkipReason)
    };
  }
}
