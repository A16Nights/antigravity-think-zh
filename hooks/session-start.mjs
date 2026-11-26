#!/usr/bin/env node
import { ThinkZhStore, buildSessionStartText } from "../lib/store.mjs";
import { isExternalModel } from "../lib/external-model-guard.mjs";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data.trim()));
    process.stdin.on("error", () => resolve(""));
  });
}

async function main() {
  const raw = await readStdin();
  let input = {};
  if (raw) {
    try {
      input = JSON.parse(raw);
    } catch {
      process.stdout.write("{}\n");
      return;
    }
  }
  // 仅对使用外接自定义模型时生效；Antigravity 原生模型（含 Gemini）自动跳过
  if (!isExternalModel(input)) {
    process.stdout.write("{}\n");
    return;
  }
  const store = new ThinkZhStore();
  const cfg = store.loadConfig();
  if (!cfg.injectSessionStart) {
    process.stdout.write("{}\n");
    return;
  }
  const text = buildSessionStartText(cfg);
  if (!text) {
    process.stdout.write("{}\n");
    return;
  }
  const output = {
    injectSteps: [
      {
        systemMessage: {
          systemMessage: text
        }
      }
    ]
  };
  process.stdout.write(JSON.stringify(output) + "\n");
}

main().catch(() => {
  process.stdout.write("{}\n");
});
