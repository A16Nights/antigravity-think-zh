/**
 * 跨 8 个苍蓝系列 Antigravity 插件共享的主题色调配置存储
 * 配置文件路径：~/.gemini/azure-theme.json
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

export const AZURE_THEME_PATH = path.join(os.homedir(), ".gemini", "azure-theme.json");
export const THEME_SLOT_COUNT = 4;

export const OFFICIAL_THEME_PRESETS = [
  {
    id: "official-azure",
    name: "苍蓝星辉",
    desc: "默认官方 · 苍蓝为主、柔紫点缀",
    primary: "#3b82f6",
    secondary: "#7c3aed",
    official: true
  },
  {
    id: "official-violet",
    name: "星雾黑紫",
    desc: "官方经典 · 星紫为主、苍蓝点缀",
    primary: "#8b5cf6",
    secondary: "#3b82f6",
    official: true
  }
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function normalizeHex(val, fallback) {
  if (typeof val !== "string") return fallback;
  const s = val.trim();
  if (HEX_RE.test(s)) return s.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(s)) return ("#" + s).toLowerCase();
  return fallback;
}

function normalizeSlot(raw, idx) {
  if (!raw || typeof raw !== "object") return null;
  const primary = normalizeHex(raw.primary, "");
  const secondary = normalizeHex(raw.secondary, "");
  if (!primary || !secondary) return null;
  const name = String(raw.name || `自定义 ${idx + 1}`).trim().slice(0, 18) || `自定义 ${idx + 1}`;
  return {
    id: `slot-${idx}`,
    name,
    primary,
    secondary
  };
}

export function getDefaultAzureThemeConfig() {
  return {
    version: 1,
    activeId: "official-azure",
    customDraft: { primary: "#3b82f6", secondary: "#7c3aed" },
    slots: Array.from({ length: THEME_SLOT_COUNT }, () => null)
  };
}

export function sanitizeAzureThemeConfig(raw) {
  const def = getDefaultAzureThemeConfig();
  if (!raw || typeof raw !== "object") return def;

  const slots = Array.from({ length: THEME_SLOT_COUNT }, (_, i) => {
    const item = Array.isArray(raw.slots) ? raw.slots[i] : null;
    return normalizeSlot(item, i);
  });

  const customDraft = {
    primary: normalizeHex(raw.customDraft?.primary, def.customDraft.primary),
    secondary: normalizeHex(raw.customDraft?.secondary, def.customDraft.secondary)
  };

  let activeId = typeof raw.activeId === "string" ? raw.activeId.trim() : def.activeId;
  const validOfficial = OFFICIAL_THEME_PRESETS.some((p) => p.id === activeId);
  const slotMatch = /^slot-([0-9]+)$/.exec(activeId);
  const validSlot = slotMatch ? Boolean(slots[Number(slotMatch[1])]) : false;
  if (!validOfficial && !validSlot && activeId !== "custom") {
    activeId = def.activeId;
  }

  return {
    version: 1,
    activeId,
    customDraft,
    slots
  };
}

export function readAzureThemeConfig() {
  try {
    if (!fs.existsSync(AZURE_THEME_PATH)) return getDefaultAzureThemeConfig();
    const text = fs.readFileSync(AZURE_THEME_PATH, "utf8");
    return sanitizeAzureThemeConfig(JSON.parse(text));
  } catch {
    return getDefaultAzureThemeConfig();
  }
}

export function writeAzureThemeConfig(nextRaw) {
  const current = readAzureThemeConfig();
  const merged = nextRaw && typeof nextRaw === "object"
    ? {
        ...current,
        ...nextRaw,
        customDraft: nextRaw.customDraft ? { ...current.customDraft, ...nextRaw.customDraft } : current.customDraft,
        slots: Array.isArray(nextRaw.slots) ? nextRaw.slots : current.slots
      }
    : current;
  const clean = sanitizeAzureThemeConfig(merged);
  const dir = path.dirname(AZURE_THEME_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${AZURE_THEME_PATH}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(clean, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, AZURE_THEME_PATH);
  return clean;
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 65536) raw = raw.slice(0, 65536);
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
}

export function openLocalUrlInBrowser(rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || "").trim());
  } catch {
    return { ok: false, error: "无效 URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "仅允许 HTTP/HTTPS 协议" };
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") {
    return { ok: false, error: "仅允许打开本地 Sidecar 地址" };
  }
  const href = parsed.toString();
  try {
    if (process.platform === "win32") {
      // 使用 Windows 原生 URL 协议处理器直接拉起默认浏览器（完整保留 & 参数、不弹黑框）
      spawn("rundll32.exe", ["url.dll,FileProtocolHandler", href], {
        detached: true,
        stdio: "ignore",
        windowsHide: true
      }).unref();
    } else if (process.platform === "darwin") {
      spawn("open", [href], { detached: true, stdio: "ignore" }).unref();
    } else {
      spawn("xdg-open", [href], { detached: true, stdio: "ignore" }).unref();
    }
    return { ok: true, url: href };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

/**
 * Sidecar HTTP 路由辅助：直接拦截 GET/POST /api/azure-theme 及 POST /api/azure-open-web
 * @returns {Promise<boolean>} 是否已处理该请求
 */
export async function handleAzureThemeHttp(req, res) {
  const urlPath = (req.url || "").split("?")[0];
  if (urlPath === "/api/azure-open-web") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
      return true;
    }
    const body = await readJsonBody(req);
    let targetUrl = String(body?.url || "").trim();
    let useFallback = false;
    try {
      const u = new URL(targetUrl);
      const h = u.hostname.toLowerCase();
      if ((u.protocol !== "http:" && u.protocol !== "https:") || (h !== "127.0.0.1" && h !== "localhost" && h !== "::1")) {
        useFallback = true;
      }
    } catch {
      useFallback = true;
    }
    if (useFallback) {
      // 右侧栏若走宿主代理域名或非本地 origin，自动回退为当前 Sidecar 真实监听的 127.0.0.1:PORT
      const hostHeader = String(req.headers?.host || "").trim();
      const sockPort = req.socket && req.socket.localPort ? req.socket.localPort : 0;
      const localHost = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(hostHeader)
        ? hostHeader
        : (sockPort ? `127.0.0.1:${sockPort}` : "");
      if (localHost) {
        let qs = "";
        try {
          const orig = new URL(targetUrl);
          qs = orig.search || "";
        } catch {}
        const hdrTok = String(req.headers?.["x-codeium-sidecar-token"] || body?.token || "").trim();
        if (!qs && hdrTok) qs = `?token=${encodeURIComponent(hdrTok)}`;
        targetUrl = `http://${localHost}/${qs}`;
      }
    }
    const result = openLocalUrlInBrowser(targetUrl);
    res.writeHead(result.ok ? 200 : 400);
    res.end(JSON.stringify(result));
    return true;
  }
  if (urlPath !== "/api/azure-theme") return false;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, official: OFFICIAL_THEME_PRESETS, config: readAzureThemeConfig() }));
    return true;
  }
  if (req.method === "POST") {
    const body = await readJsonBody(req);
    const saved = writeAzureThemeConfig(body?.config || body);
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, official: OFFICIAL_THEME_PRESETS, config: saved }));
    return true;
  }
  res.writeHead(405);
  res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
  return true;
}
