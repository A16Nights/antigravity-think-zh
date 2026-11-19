#!/usr/bin/env node
import { ThinkZhStore } from "../lib/store.mjs";

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
  const store = new ThinkZhStore();
  const result = store.evaluatePreInvocation(input);
  if (!result.shouldInject || !result.text) {
    process.stdout.write("{}\n");
    return;
  }
  const output = {
    injectSteps: [
      {
        systemMessage: {
          systemMessage: result.text
        }
      }
    ]
  };
  process.stdout.write(JSON.stringify(output) + "\n");
}

main().catch(() => {
  process.stdout.write("{}\n");
});
