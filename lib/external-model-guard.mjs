import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HOME = process.env.USERPROFILE || process.env.HOME || os.homedir();
export const DEFAULT_CUSTOM_MODELS_PATH = path.join(
  HOME,
  ".gemini",
  "antigravity",
  "custom_models.json"
);

function stripModelsPrefix(name) {
  return name.startsWith("models/") ? name.slice("models/".length) : name;
}

function loadCustomModelIdentifiers(customModelsPath) {
  const targetPath =
    customModelsPath ||
    process.env.THINK_ZH_CUSTOM_MODELS_PATH ||
    DEFAULT_CUSTOM_MODELS_PATH;
  const ids = new Set();
  try {
    if (!fs.existsSync(targetPath)) return ids;
    const raw = JSON.parse(fs.readFileSync(targetPath, "utf8"));
    const list = Array.isArray(raw?.models) ? raw.models : [];
    for (const m of list) {
      if (!m || typeof m !== "object") continue;
      for (const field of [m.name, m.displayName, m.externalModelName]) {
        const val = String(field || "").trim().toLowerCase();
        if (!val) continue;
        ids.add(val);
        ids.add(stripModelsPrefix(val));
      }
    }
  } catch {
    // ignore malformed or unreadable custom_models.json
  }
  return ids;
}

/**
 * 判断当前会话是否正在使用外接自定义模型。
 * - Antigravity 原生模型（auto、MODEL_*、内置 gemini-* / claude-* / gpt-oss-* 等，或未传入模型名）返回 false。
 * - 外接模型（命中 ~/.gemini/antigravity/custom_models.json，或使用多级外接路径 models/<provider>/<model> / 推理档位后缀）返回 true。
 */
export function isExternalModel(input = {}, options = {}) {
  const rawName = String(
    input?.modelName ?? input?.model_name ?? input?.model ?? ""
  ).trim();
  if (!rawName) return false;

  const lower = rawName.toLowerCase();
  if (lower === "auto") return false;

  const customIds = loadCustomModelIdentifiers(options.customModelsPath);
  if (customIds.has(lower) || customIds.has(stripModelsPrefix(lower))) {
    return true;
  }

  // 兜底：苍蓝星轨 / 外接模型常见的多级路径或推理档位后缀
  if (/^models\/[^/]+\/.+/.test(lower)) return true;
  if (/--(low|medium|high|xhigh)$/.test(lower)) return true;

  return false;
}
