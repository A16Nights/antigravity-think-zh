import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_CONFIG,
  MAX_STATE_CONVERSATIONS,
  ThinkZhStore,
  buildPerTurnText,
  buildRuleMarkdown,
  buildSessionStartText,
  normalizePerTurnScope,
  normalizeThinkingLanguage,
  resolveConfig
} from "../lib/store.mjs";
import { isExternalModel } from "../lib/external-model-guard.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..");

function makeTempEnv(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "think-zh-test-"));
  const dataDir = path.join(root, "data");
  const pluginDir = path.join(root, "plugin");
  const customModelsPath = path.join(root, "custom_models.json");
  fs.mkdirSync(path.join(pluginDir, "rules"), { recursive: true });
  fs.writeFileSync(
    path.join(pluginDir, "rules", "AGENTS.md"),
    buildRuleMarkdown(DEFAULT_CONFIG),
    "utf8"
  );
  fs.writeFileSync(
    customModelsPath,
    JSON.stringify({
      models: [
        {
          name: "models/deepseek-r1-custom",
          displayName: "DeepSeek R1 Custom",
          externalModelName: "deepseek-reasoner"
        }
      ]
    }),
    "utf8"
  );
  t.after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { root, dataDir, pluginDir, customModelsPath };
}

function runHookProcess(scriptRelPath, stdinText, envOverrides = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(PLUGIN_ROOT, scriptRelPath)], {
      cwd: PLUGIN_ROOT,
      env: { ...process.env, ...envOverrides },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
    child.stdin.end(stdinText);
  });
}

test("normalize and resolveConfig handle casing, trimming, and invalid fallbacks", () => {
  assert.equal(normalizeThinkingLanguage(" EN "), "en");
  assert.equal(normalizeThinkingLanguage("ZH"), "zh");
  assert.equal(normalizeThinkingLanguage("jp"), "zh");
  assert.equal(normalizeThinkingLanguage(null), "zh");

  assert.equal(normalizePerTurnScope(" EVERY_INVOCATION "), "every_invocation");
  assert.equal(normalizePerTurnScope("bad"), "per_user_turn");

  const resolved = resolveConfig({
    thinkingLanguage: " en ",
    injectPrompt: "nope",
    injectSessionStart: true,
    injectPerTurn: true,
    perTurnScope: "every_invocation",
    customText: "只用简体中文推理",
    updatedAt: 123
  });

  assert.deepEqual(resolved, {
    thinkingLanguage: "en",
    injectPrompt: false,
    injectSessionStart: true,
    injectPerTurn: true,
    perTurnScope: "every_invocation",
    customText: "只用简体中文推理",
    updatedAt: ""
  });
});

test("isExternalModel distinguishes external custom models from native Gemini/Antigravity models", (t) => {
  const { customModelsPath } = makeTempEnv(t);
  const opts = { customModelsPath };

  // 原生模型与空值 -> false
  assert.equal(isExternalModel({}, opts), false);
  assert.equal(isExternalModel({ modelName: "" }, opts), false);
  assert.equal(isExternalModel({ modelName: "auto" }, opts), false);
  assert.equal(isExternalModel({ modelName: "gemini-4-neon-high" }, opts), false);
  assert.equal(isExternalModel({ modelName: "claude-opus-4-6" }, opts), false);

  // 外接自定义模型 -> true
  assert.equal(isExternalModel({ modelName: "models/deepseek-r1-custom" }, opts), true);
  assert.equal(isExternalModel({ modelName: "deepseek-reasoner" }, opts), true);
  assert.equal(isExternalModel({ modelName: "models/openrouter/qwen-qwq" }, opts), true);
  assert.equal(isExternalModel({ modelName: "custom-model--high" }, opts), true);
});

test("ThinkZhStore persists config, syncs rules/AGENTS.md, and resets cleanly", (t) => {
  const { dataDir, pluginDir } = makeTempEnv(t);
  const store = new ThinkZhStore({ dataDir, pluginDir });

  const initial = store.getStatus();
  assert.equal(initial.config.thinkingLanguage, "zh");
  assert.equal(initial.config.injectPrompt, false);
  assert.equal(initial.config.injectPerTurn, true);
  assert.equal(initial.targetScope, "external_models_only");
  assert.equal(initial.ruleSynced, true);
  assert.match(initial.preview.ruleMarkdown, /静态全局规则已关闭/);

  // 写入不同步的规则文件时可检测 ruleSynced = false
  fs.writeFileSync(store.rulePath, "stale", "utf8");
  assert.equal(store.getStatus().ruleSynced, false);

  // 开启静态兜底并切换到 en 档位
  const enStatus = store.updateConfig({ thinkingLanguage: "en", injectPrompt: true });
  assert.equal(enStatus.config.thinkingLanguage, "en");
  assert.equal(enStatus.config.injectPrompt, true);
  assert.equal(enStatus.ruleSynced, true);
  assert.match(fs.readFileSync(store.rulePath, "utf8"), /思考语言保持模型默认行为/);
  assert.equal(buildPerTurnText(enStatus.config), "");
  assert.match(buildSessionStartText(enStatus.config), /默认英文思考模式已激活/);

  // 自定义文本覆盖内置文案
  const customStatus = store.updateConfig({ customText: "Always think in Simplified Chinese." });
  assert.equal(customStatus.ruleSynced, true);
  assert.match(fs.readFileSync(store.rulePath, "utf8"), /Always think in Simplified Chinese\./);
  assert.equal(buildPerTurnText(customStatus.config), "[think-zh] Always think in Simplified Chinese.");

  // 关闭静态规则注入
  const offStatus = store.updateConfig({ injectPrompt: false });
  assert.match(fs.readFileSync(store.rulePath, "utf8"), /静态全局规则已关闭/);
  assert.equal(offStatus.ruleSynced, true);

  // 重置配置（恢复默认：仅外部模型 PreInvocation 开启，静态规则关闭）
  const resetStatus = store.resetConfig();
  assert.equal(resetStatus.config.thinkingLanguage, "zh");
  assert.equal(resetStatus.config.injectPrompt, false);
  assert.equal(resetStatus.config.injectPerTurn, true);
  assert.equal(resetStatus.config.customText, "");
  assert.equal(resetStatus.ruleSynced, true);
  assert.equal(fs.readFileSync(store.rulePath, "utf8"), buildRuleMarkdown(DEFAULT_CONFIG));
});

test("evaluatePreInvocation enforces external-model-only guard, per_user_turn dedup, every_invocation, and zh<->en hot switch", (t) => {
  const { dataDir, pluginDir, customModelsPath } = makeTempEnv(t);
  const store = new ThinkZhStore({ dataDir, pluginDir });
  const evalOpts = { customModelsPath };
  const extModel = "models/deepseek-r1-custom";

  // 原生 Gemini 模型即使开启 injectPerTurn 也必须静默跳过
  let res = store.evaluatePreInvocation(
    { conversationId: "native-c1", modelName: "gemini-4-neon-high", lastUserInput: "你好", invocationNum: 1 },
    evalOpts
  );
  assert.equal(res.shouldInject, false);
  assert.equal(res.reason, "native_model_skipped");
  assert.equal(res.externalModel, false);

  // 关闭 injectPerTurn 时外部模型同语言不注入，但记录状态
  store.updateConfig({ injectPerTurn: false });
  res = store.evaluatePreInvocation(
    { conversationId: "c1", modelName: extModel, lastUserInput: "你好", invocationNum: 1 },
    evalOpts
  );
  assert.equal(res.shouldInject, false);
  assert.equal(res.externalModel, true);

  // 开启 per_user_turn 模式
  store.updateConfig({ injectPerTurn: true, perTurnScope: "per_user_turn" });

  // 同一轮新输入第 1 次调用 -> 注入
  res = store.evaluatePreInvocation(
    { conversationId: "c1", modelName: extModel, lastUserInput: "帮我看下这个报错", invocationNum: 1 },
    evalOpts
  );
  assert.equal(res.shouldInject, true);
  assert.equal(res.reason, "per_user_turn");
  assert.match(res.text, /简体中文/);

  // 同轮工具回调第 2 次调用（同输入） -> 去重跳过
  res = store.evaluatePreInvocation(
    { conversationId: "c1", modelName: extModel, lastUserInput: "帮我看下这个报错", invocationNum: 2 },
    evalOpts
  );
  assert.equal(res.shouldInject, false);

  // 连续重复相同文本但 invocationNum 重置为 1（新用户轮次）-> 注入
  res = store.evaluatePreInvocation(
    { conversationId: "c1", modelName: extModel, lastUserInput: "帮我看下这个报错", invocationNum: 1 },
    evalOpts
  );
  assert.equal(res.shouldInject, true);

  // 切换为 every_invocation -> 同轮第 2 步也会注入
  store.updateConfig({ perTurnScope: "every_invocation" });
  res = store.evaluatePreInvocation(
    { conversationId: "c1", modelName: extModel, lastUserInput: "继续下一步", invocationNum: 1 },
    evalOpts
  );
  assert.equal(res.shouldInject, true);
  res = store.evaluatePreInvocation(
    { conversationId: "c1", modelName: extModel, lastUserInput: "继续下一步", invocationNum: 2 },
    evalOpts
  );
  assert.equal(res.shouldInject, true);
  assert.equal(res.reason, "every_invocation");

  // 对话中途热切回默认英文（even with injectPerTurn off） -> 提醒一次，随后静音
  store.updateConfig({ thinkingLanguage: "en", injectPerTurn: false });
  res = store.evaluatePreInvocation(
    { conversationId: "c1", modelName: extModel, lastUserInput: "继续下一步", invocationNum: 3 },
    evalOpts
  );
  assert.equal(res.shouldInject, true);
  assert.equal(res.reason, "mode_changed");
  assert.match(res.text, /模式已切回默认英文思考/);

  res = store.evaluatePreInvocation(
    { conversationId: "c1", modelName: extModel, lastUserInput: "下一轮问题", invocationNum: 1 },
    evalOpts
  );
  assert.equal(res.shouldInject, false);

  // 验证会话记录裁剪上限
  for (let i = 0; i < MAX_STATE_CONVERSATIONS + 15; i += 1) {
    store.evaluatePreInvocation(
      { conversationId: `conv-${i}`, modelName: extModel, lastUserInput: `q-${i}`, invocationNum: 1 },
      evalOpts
    );
  }
  const savedState = store.loadState();
  assert.equal(Object.keys(savedState.conversations).length, MAX_STATE_CONVERSATIONS);
});

test("SessionStart and PreInvocation hooks enforce external-model-only guard and fail-open", async (t) => {
  const { dataDir, pluginDir, customModelsPath } = makeTempEnv(t);
  const store = new ThinkZhStore({ dataDir, pluginDir });
  const hookEnv = {
    THINK_ZH_DATA_DIR: dataDir,
    PLUGIN_ROOT: pluginDir,
    THINK_ZH_CUSTOM_MODELS_PATH: customModelsPath
  };

  // SessionStart 默认关闭 -> {}
  let out = await runHookProcess(
    "hooks/session-start.mjs",
    JSON.stringify({ conversationId: "h1", modelName: "models/deepseek-r1-custom" }),
    hookEnv
  );
  assert.equal(out.code, 0);
  assert.deepEqual(JSON.parse(out.stdout), {});

  // 开启 SessionStart + PreInvocation
  store.updateConfig({ injectSessionStart: true, injectPerTurn: true });

  // 原生 Gemini 模型 -> SessionStart 和 PreInvocation 都必须静默返回 {}
  out = await runHookProcess(
    "hooks/session-start.mjs",
    JSON.stringify({ conversationId: "h-native", modelName: "gemini-4-neon-high" }),
    hookEnv
  );
  assert.equal(out.code, 0);
  assert.deepEqual(JSON.parse(out.stdout), {});

  out = await runHookProcess(
    "hooks/pre-invocation.mjs",
    JSON.stringify({
      conversationId: "h-native",
      modelName: "gemini-4-neon-high",
      lastUserInput: "Explain this stacktrace",
      invocationNum: 1
    }),
    hookEnv
  );
  assert.equal(out.code, 0);
  assert.deepEqual(JSON.parse(out.stdout), {});

  // 外部自定义模型 -> SessionStart 正常注入
  out = await runHookProcess(
    "hooks/session-start.mjs",
    JSON.stringify({ conversationId: "h1", modelName: "models/deepseek-r1-custom" }),
    hookEnv
  );
  assert.equal(out.code, 0);
  const ssJson = JSON.parse(out.stdout);
  assert.equal(typeof ssJson.injectSteps[0].systemMessage.systemMessage, "string");
  assert.match(ssJson.injectSteps[0].systemMessage.systemMessage, /简体中文思考模式已激活/);

  // 外部自定义模型 -> PreInvocation 首步注入，同轮第二步去重
  out = await runHookProcess(
    "hooks/pre-invocation.mjs",
    JSON.stringify({
      conversationId: "h2",
      modelName: "models/deepseek-r1-custom",
      lastUserInput: "Explain this stacktrace",
      invocationNum: 1
    }),
    hookEnv
  );
  assert.equal(out.code, 0);
  const preJson = JSON.parse(out.stdout);
  assert.equal(typeof preJson.injectSteps[0].systemMessage.systemMessage, "string");
  assert.match(preJson.injectSteps[0].systemMessage.systemMessage, /简体中文/);

  out = await runHookProcess(
    "hooks/pre-invocation.mjs",
    JSON.stringify({
      conversationId: "h2",
      modelName: "models/deepseek-r1-custom",
      lastUserInput: "Explain this stacktrace",
      invocationNum: 2
    }),
    hookEnv
  );
  assert.equal(out.code, 0);
  assert.deepEqual(JSON.parse(out.stdout), {});

  // 非法 JSON stdin 必须 fail-open 返回 {}
  out = await runHookProcess("hooks/pre-invocation.mjs", "{not-valid-json", hookEnv);
  assert.equal(out.code, 0);
  assert.deepEqual(JSON.parse(out.stdout), {});
});

test("MCP server supports initialize, tools/list, status, set, preview, and reset", async (t) => {
  const { dataDir, pluginDir } = makeTempEnv(t);
  const child = spawn(process.execPath, [path.join(PLUGIN_ROOT, "mcp-server.mjs")], {
    cwd: PLUGIN_ROOT,
    env: { ...process.env, THINK_ZH_DATA_DIR: dataDir, PLUGIN_ROOT: pluginDir },
    stdio: ["pipe", "pipe", "pipe"]
  });
  t.after(() => {
    try {
      child.kill();
    } catch {}
  });

  const pending = new Map();
  let buf = "";
  child.stdout.on("data", (chunk) => {
    buf += chunk.toString("utf8");
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const msg = JSON.parse(trimmed);
      if (msg.id !== undefined && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    }
  });

  function rpc(id, method, params) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`RPC timeout for ${method}`)), 5000);
      pending.set(id, (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }

  const initRes = await rpc(1, "initialize", { protocolVersion: "2024-11-05" });
  assert.equal(initRes.result.serverInfo.name, "think-zh");

  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

  const pingRes = await rpc(2, "ping", {});
  assert.deepEqual(pingRes.result, {});

  const listRes = await rpc(3, "tools/list", {});
  const names = listRes.result.tools.map((tool) => tool.name);
  assert.deepEqual(names, ["think_zh_status", "think_zh_set", "think_zh_preview", "think_zh_reset"]);

  const setRes = await rpc(4, "tools/call", {
    name: "think_zh_set",
    arguments: { thinkingLanguage: "en", injectPrompt: true, injectPerTurn: true, perTurnScope: "every_invocation" }
  });
  assert.equal(setRes.result.isError, false);
  const setData = JSON.parse(setRes.result.content[0].text);
  assert.equal(setData.config.thinkingLanguage, "en");
  assert.equal(setData.config.injectPrompt, true);
  assert.equal(setData.config.injectPerTurn, true);
  assert.equal(setData.ruleSynced, true);
  assert.match(fs.readFileSync(path.join(pluginDir, "rules", "AGENTS.md"), "utf8"), /默认行为/);

  const previewRes = await rpc(5, "tools/call", {
    name: "think_zh_preview",
    arguments: { thinkingLanguage: "zh", injectPrompt: true, customText: "只做简短预览" }
  });
  const previewData = JSON.parse(previewRes.result.content[0].text);
  assert.match(previewData.preview.ruleMarkdown, /只做简短预览/);
  // think_zh_preview 不应覆盖当前配置
  const statusRes = await rpc(6, "tools/call", { name: "think_zh_status", arguments: {} });
  assert.equal(JSON.parse(statusRes.result.content[0].text).config.thinkingLanguage, "en");

  const resetRes = await rpc(7, "tools/call", { name: "think_zh_reset", arguments: {} });
  const resetData = JSON.parse(resetRes.result.content[0].text);
  assert.equal(resetData.config.thinkingLanguage, "zh");
  assert.equal(resetData.config.injectPrompt, false);
  assert.equal(resetData.config.injectPerTurn, true);
  assert.equal(resetData.ruleSynced, true);
});

test("Sidecar panel HTTP server enforces token auth and syncs config changes", async (t) => {
  const { dataDir, pluginDir } = makeTempEnv(t);
  const token = "test-secret-token";
  const child = spawn(process.execPath, [path.join(PLUGIN_ROOT, "sidecars", "panel", "server.mjs")], {
    cwd: path.join(PLUGIN_ROOT, "sidecars", "panel"),
    env: {
      ...process.env,
      PORT: "0",
      ANTIGRAVITY_SIDECAR_UI_TOKEN: token,
      THINK_ZH_DATA_DIR: dataDir,
      PLUGIN_ROOT: pluginDir
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  t.after(() => {
    try {
      child.kill();
    } catch {}
  });

  const baseUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Sidecar startup timeout")), 5000);
    let out = "";
    child.stdout.on("data", (chunk) => {
      out += chunk.toString("utf8");
      const m = out.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (m) {
        clearTimeout(timer);
        resolve(`http://127.0.0.1:${m[1]}`);
      }
    });
    child.stderr.on("data", (chunk) => {
      out += chunk.toString("utf8");
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Sidecar exited early (${code}): ${out}`));
    });
  });

  const healthRes = await fetch(`${baseUrl}/healthz`);
  assert.equal(healthRes.status, 200);
  const healthJson = await healthRes.json();
  assert.equal(healthJson.ok, true);

  const htmlRes = await fetch(`${baseUrl}/`);
  assert.equal(htmlRes.status, 200);
  assert.match(await htmlRes.text(), /思语中文 · Think-ZH/);

  // 未携带 token 访问 /api/state 应被拦截返回 401
  const unauthRes = await fetch(`${baseUrl}/api/state`);
  assert.equal(unauthRes.status, 401);

  // 通过 header 鉴权获取状态
  const stateRes = await fetch(`${baseUrl}/api/state`, {
    headers: { "x-sidecar-token": token }
  });
  assert.equal(stateRes.status, 200);
  const stateJson = await stateRes.json();
  assert.equal(stateJson.config.thinkingLanguage, "zh");

  // 通过 query token 更新配置
  const cfgRes = await fetch(`${baseUrl}/api/config?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thinkingLanguage: "en", injectPerTurn: true })
  });
  assert.equal(cfgRes.status, 200);
  const cfgJson = await cfgRes.json();
  assert.equal(cfgJson.config.thinkingLanguage, "en");
  assert.equal(cfgJson.config.injectPerTurn, true);
  assert.equal(cfgJson.ruleSynced, true);

  // 重置配置
  const resetRes = await fetch(`${baseUrl}/api/reset`, {
    method: "POST",
    headers: { "x-codeium-sidecar-token": token }
  });
  assert.equal(resetRes.status, 200);
  const resetJson = await resetRes.json();
  assert.equal(resetJson.config.thinkingLanguage, "zh");
  assert.equal(resetJson.config.injectPrompt, false);
  assert.equal(resetJson.config.injectPerTurn, true);
});
