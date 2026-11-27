import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_PATH = path.join(__dirname, "azure-onboarding-ui.css");
const JS_PATH = path.join(__dirname, "azure-onboarding-ui.js");
const STATE_PATH = path.join(os.homedir(), ".gemini", "azure-onboarding.json");

function readStateFile() {
  try {
    if (!fs.existsSync(STATE_PATH)) return { version: 1, plugins: {} };
    const parsed = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    if (parsed && typeof parsed === "object") {
      return { version: 1, plugins: parsed.plugins && typeof parsed.plugins === "object" ? parsed.plugins : {} };
    }
  } catch {}
  return { version: 1, plugins: {} };
}

function writeStateFile(data) {
  try {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    const tmp = `${STATE_PATH}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tmp, STATE_PATH);
    return true;
  } catch {
    return false;
  }
}

export function getOnboardingStatus(pluginId, guideVersion = "1") {
  const id = String(pluginId || "").trim();
  const ver = String(guideVersion || "1").trim();
  const st = readStateFile();
  const rec = st.plugins[id] || null;
  const dismissed = Boolean(rec && rec.dismissed && String(rec.guideVersion || "") === ver);
  return {
    pluginId: id,
    guideVersion: ver,
    shouldShow: !dismissed,
    dismissed,
    dismissedAt: rec?.dismissedAt || null
  };
}

export function setOnboardingDismissed(pluginId, { dismissed = true, guideVersion = "1" } = {}) {
  const id = String(pluginId || "").trim();
  if (!id) return { ok: false };
  const st = readStateFile();
  if (dismissed) {
    st.plugins[id] = {
      dismissed: true,
      guideVersion: String(guideVersion || "1").trim(),
      dismissedAt: new Date().toISOString()
    };
  } else {
    delete st.plugins[id];
  }
  const ok = writeStateFile(st);
  return { ok, ...getOnboardingStatus(id, guideVersion) };
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let total = 0;
    req.on("data", (c) => {
      total += c.length;
      if (total <= 64 * 1024) chunks.push(c);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

export async function handleAzureOnboardingHttp(req, res, pluginId, guideVersion = "1") {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  if (url.pathname !== "/api/azure-onboarding") return false;

  if (req.method === "GET") {
    const ver = String(url.searchParams.get("v") || guideVersion || "1").trim();
    sendJson(res, 200, { ok: true, ...getOnboardingStatus(pluginId, ver) });
    return true;
  }

  if (req.method === "POST") {
    const body = await readJsonBody(req);
    const ver = String(body.guideVersion || guideVersion || "1").trim();
    const action = String(body.action || "dismiss").trim();
    const result = setOnboardingDismissed(pluginId, {
      dismissed: action !== "reset",
      guideVersion: ver
    });
    sendJson(res, 200, result);
    return true;
  }

  sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
  return true;
}

export function injectAzureOnboarding(html, pluginId, guideConfig) {
  if (!html || typeof html !== "string" || html.includes("AGY_AZURE_ONBOARDING")) return html;
  let css = "";
  let js = "";
  try {
    css = fs.readFileSync(CSS_PATH, "utf8");
    js = fs.readFileSync(JS_PATH, "utf8");
  } catch {
    return html;
  }
  const safePayload = JSON.stringify({
    pluginId: String(pluginId || "").trim(),
    guide: guideConfig || {}
  }).replace(/</g, "\\u003c");

  const snippet = `
<!-- AGY_AZURE_ONBOARDING -->
<style>
${css}
</style>
<script>
window.__AZURE_ONBOARDING_CONFIG__ = ${safePayload};
${js}
</script>`;

  const idx = html.lastIndexOf("</body>");
  if (idx !== -1) return html.slice(0, idx) + snippet + "\n" + html.slice(idx);
  return html + snippet;
}
