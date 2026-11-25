/**
 * 跨 9 个苍蓝系列 Antigravity 插件共享的主题色调配置存储
 * 配置文件路径：~/.gemini/azure-theme.json
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
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
  if (!nextRaw || typeof nextRaw !== "object" || Array.isArray(nextRaw) || Object.keys(nextRaw).length === 0) {
    return current;
  }
  const merged = {
    ...current,
    ...nextRaw,
    customDraft: nextRaw.customDraft && typeof nextRaw.customDraft === "object"
      ? { ...current.customDraft, ...nextRaw.customDraft }
      : current.customDraft,
    slots: Array.isArray(nextRaw.slots) ? nextRaw.slots : current.slots
  };
  const clean = sanitizeAzureThemeConfig(merged);
  const dir = path.dirname(AZURE_THEME_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const rand = crypto.randomBytes(4).toString("hex");
  const tmp = `${AZURE_THEME_PATH}.${process.pid}.${Date.now()}.${rand}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(clean, null, 2) + "\n", "utf8");
    fs.renameSync(tmp, AZURE_THEME_PATH);
  } catch (err) {
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch {}
    throw err;
  }
  return clean;
}

function isAllowedLocalOrigin(req) {
  const origin = String(req.headers?.origin || "").trim();
  if (!origin || origin === "null") return true;
  try {
    const u = new URL(origin);
    const h = u.hostname.toLowerCase();
    return h === "127.0.0.1" || h === "localhost" || h === "::1" || h === "[::1]";
  } catch {
    return false;
  }
}

function readJsonBody(req, maxBytes = 65536) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    const fail = (statusCode, msg) => {
      if (settled) return;
      settled = true;
      const err = new Error(msg);
      err.statusCode = statusCode;
      reject(err);
    };
    req.on("data", (chunk) => {
      if (settled) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), "utf8");
      total += buf.length;
      if (total > maxBytes) {
        req.destroy();
        fail(413, "Payload too large");
        return;
      }
      chunks.push(buf);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          const err = new Error("Invalid JSON object");
          err.statusCode = 400;
          reject(err);
          return;
        }
        resolve(parsed);
      } catch {
        const err = new Error("Invalid JSON body");
        err.statusCode = 400;
        reject(err);
      }
    });
    req.on("error", () => fail(400, "Request stream error"));
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
    if (!isAllowedLocalOrigin(req)) {
      res.writeHead(403);
      res.end(JSON.stringify({ ok: false, error: "Forbidden origin" }));
      return true;
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      res.writeHead(err.statusCode || 400);
      res.end(JSON.stringify({ ok: false, error: err.message }));
      return true;
    }
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
    if (!isAllowedLocalOrigin(req)) {
      res.writeHead(403);
      res.end(JSON.stringify({ ok: false, error: "Forbidden origin" }));
      return true;
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      res.writeHead(err.statusCode || 400);
      res.end(JSON.stringify({ ok: false, error: err.message }));
      return true;
    }
    const payload = body && typeof body.config === "object" ? body.config : body;
    if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "Empty theme config payload" }));
      return true;
    }
    const saved = writeAzureThemeConfig(payload);
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, official: OFFICIAL_THEME_PRESETS, config: saved }));
    return true;
  }
  res.writeHead(405);
  res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
  return true;
}
