#!/usr/bin/env node
import { ThinkZhStore, buildSessionStartText } from "../lib/store.mjs";

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
  await readStdin();
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
