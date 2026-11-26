#!/usr/bin/env node
import { getSidebarToolDefinition, getSidebarResourceDefinition, getSidebarResourceUri, handleSidebarToolCall, buildSidebarResourceReadResult } from "./lib/sidebar-nav.mjs";
import { readPluginVersion } from "./lib/update-checker.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import { ThinkZhStore, resolveConfig } from "./lib/store.mjs";

const PLUGIN_ROOT = path.dirname(fileURLToPath(import.meta.url));
const store = new ThinkZhStore();

const TOOLS = [
  {
    name: "think_zh_status",
    description: "查看思语中文（Think-ZH）当前思考语言档位、各通道开关、每轮策略、规则文件同步状态与注入预览。注意：本插件专为外部自定义推理模型设计，开启后默认仅对外部模型生效，无法对原生 Gemini 生效（Google 云端 Thought Summarizer 不下发原始思考）。",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "think_zh_set",
    description: "设置思语中文（Think-ZH）的思考语言档位、每轮强化/开场注入（均仅对外部模型生效）、静态全局规则兜底开关或自定义指令，并立即持久化。注意：无法改变原生 Gemini 的云端英文思考摘要。",
    inputSchema: {
      type: "object",
      properties: {
        thinkingLanguage: {
          type: "string",
          enum: ["zh", "en"],
          description: "思考语言档位：'zh' 为简体中文思考，'en' 为默认英文思考（仅约束回复跟随提问语言）"
        },
        injectPrompt: {
          type: "boolean",
          description: "是否启用静态全局规则兜底（写入 rules/AGENTS.md；默认关闭，开启后宿主会无差别加载给含原生 Gemini 在内的所有模型）"
        },
        injectSessionStart: {
          type: "boolean",
          description: "是否启用新会话启动时的一次性开场注入（SessionStart Hook，仅对外部自定义模型生效）"
        },
        injectPerTurn: {
          type: "boolean",
          description: "是否启用每轮前置强化（PreInvocation Hook，默认开启，仅对外部自定义模型生效，Antigravity 原生模型自动跳过）"
        },
        perTurnScope: {
          type: "string",
          enum: ["per_user_turn", "every_invocation"],
          description: "每轮强化触发粒度：'per_user_turn'（每轮新提问一次）或 'every_invocation'（每次调用模型前）"
        },
        customText: {
          type: "string",
          description: "自定义语言约束文本；非空时覆盖内置档位文案，传空字符串 '' 恢复内置预设"
        }
      }
    }
  },
  {
    name: "think_zh_preview",
    description: "不保存地预览指定配置下生成的静态规则内容、SessionStart 提示与每轮前置强化提示。",
    inputSchema: {
      type: "object",
      properties: {
        thinkingLanguage: {
          type: "string",
          enum: ["zh", "en"],
          description: "要预览的思考语言档位，不填则沿用当前设置"
        },
        injectPrompt: {
          type: "boolean",
          description: "是否预览开启/关闭静态规则时的文本"
        },
        customText: {
          type: "string",
          description: "要预览的自定义指令文本"
        }
      }
    }
  },
  {
    name: "think_zh_reset",
    description: "将思语中文（Think-ZH）恢复为默认配置（简体中文思考 + 开启仅外部模型生效的 PreInvocation 回合去重强化 + 关闭静态全局规则与 SessionStart + 清空自定义文本），并同步 rules/AGENTS.md。",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

function sendResponse(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message, data) {
  send({ jsonrpc: "2.0", id, error: { code, message, ...(data !== undefined ? { data } : {}) } });
}

function dispatchTool(name, args = {}) {
  switch (name) {
    case "think_zh_status":
      return store.getStatus();
    case "think_zh_set":
      return store.updateConfig(args);
    case "think_zh_preview": {
      const current = store.loadConfig();
      const simulated = resolveConfig({
        ...current,
        ...(args.thinkingLanguage !== undefined ? { thinkingLanguage: args.thinkingLanguage } : {}),
        ...(args.injectPrompt !== undefined ? { injectPrompt: args.injectPrompt } : {}),
        ...(args.customText !== undefined ? { customText: args.customText } : {})
      });
      return {
        simulatedConfig: simulated,
        preview: store.getPreview(simulated)
      };
    }
    case "think_zh_reset":
      return store.resetConfig();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let req;
  try {
    req = JSON.parse(trimmed);
  } catch {
    return;
  }
  const { id, method, params } = req;
  if (id === undefined || id === null) {
    return;
  }
  try {
    switch (method) {
      case "initialize":
        sendResponse(id, {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: "think-zh", version: readPluginVersion(PLUGIN_ROOT) }
        });
        break;
      case "ping":
        sendResponse(id, {});
        break;
      case "tools/list": {
        const sbTool = getSidebarToolDefinition("think-zh");
        sendResponse(id, { tools: sbTool ? [...TOOLS, sbTool] : TOOLS });
        break;
      }
      case "resources/list": {
        const sbRes = getSidebarResourceDefinition("think-zh");
        sendResponse(id, { resources: sbRes ? [sbRes] : [] });
        break;
      }
      case "resources/read": {
        const uri = params?.uri;
        if (uri === getSidebarResourceUri("think-zh")) {
          sendResponse(id, buildSidebarResourceReadResult("think-zh"));
        } else {
          sendError(id, -32602, `Unknown resource: ${uri}`);
        }
        break;
      }
      case "tools/call": {
        const toolName = params?.name;
        if (toolName === "open_think_zh_ui") {
          sendResponse(id, handleSidebarToolCall("think-zh"));
          break;
        }
        const toolArgs = params?.arguments || {};
        try {
          const result = dispatchTool(toolName, toolArgs);
          sendResponse(id, {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            isError: false
          });
        } catch (err) {
          sendResponse(id, {
            content: [{ type: "text", text: `Error (${toolName}): ${err.message || String(err)}` }],
            isError: true
          });
        }
        break;
      }
      default:
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    sendError(id, -32603, "Internal error", String(err));
  }
});
