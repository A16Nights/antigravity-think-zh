#!/usr/bin/env node
import readline from "node:readline";
import { ThinkZhStore, resolveConfig } from "./lib/store.mjs";

const store = new ThinkZhStore();

const TOOLS = [
  {
    name: "think_zh_status",
    description: "查看思语中文（Think-ZH）当前思考语言档位、各通道开关、每轮策略、规则文件同步状态与注入预览。",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "think_zh_set",
    description: "设置思语中文（Think-ZH）的思考语言档位、静态规则开关、会话开场/每轮强化开关或自定义指令，并立即持久化且同步 rules/AGENTS.md。",
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
          description: "是否启用静态规则注入（写入 rules/AGENTS.md）"
        },
        injectSessionStart: {
          type: "boolean",
          description: "是否启用新会话启动时的一次性开场注入（SessionStart Hook）"
        },
        injectPerTurn: {
          type: "boolean",
          description: "是否启用每轮前置强化（PreInvocation Hook），增强长对话防漂移"
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
    description: "将思语中文（Think-ZH）恢复为默认配置（简体中文思考 + 开启静态规则 + 关闭附加钩子 + 清空自定义文本），并同步 rules/AGENTS.md。",
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
          capabilities: { tools: {} },
          serverInfo: { name: "think-zh", version: "1.0.0" }
        });
        break;
      case "ping":
        sendResponse(id, {});
        break;
      case "tools/list":
        sendResponse(id, { tools: TOOLS });
        break;
      case "tools/call": {
        const toolName = params?.name;
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
