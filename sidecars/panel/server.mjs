import { checkGithubUpdate } from "../../lib/update-checker.mjs";
import { isLeftSidebarEnabled, setLeftSidebarEnabled, listOwnedPluginsNavState, registerSidecarRuntime, refreshAntigravityMcpServers, injectSidebarToggleWidget } from "../../lib/sidebar-nav.mjs";
import { handleAzureThemeHttp } from "../../lib/azure-theme.mjs";
import { injectAzureUiKit } from "../../lib/azure-ui-kit.mjs";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { ThinkZhStore } from "../../lib/store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_PATH = path.join(__dirname, "index.html");
const PLUGIN_DIR = process.env.PLUGIN_ROOT || path.resolve(__dirname, "..", "..");
const store = new ThinkZhStore({ pluginDir: PLUGIN_DIR });

const rawPort = process.env.ANTIGRAVITY_SIDECAR_WEB_PORT ?? process.env.PORT ?? "18795";
const parsedPort = Number.parseInt(String(rawPort), 10);
const PORT = Number.isNaN(parsedPort) ? 18795 : parsedPort;

const TOKEN = (
  process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN ||
  process.env.ANTIGRAVITY_SIDECAR_AUTH_TOKEN ||
  process.env.ANTIGRAVITY_SIDECAR_WEB_TOKEN ||
  ""
).trim();

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (chunk) => {
      buf += chunk;
      if (buf.length > 512 * 1024) {
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function checkAuth(req, url) {
  if (!TOKEN) return true;
  const hdr = req.headers["x-codeium-sidecar-token"] || req.headers["x-sidecar-token"];
  const q = url.searchParams.get("token");
  return hdr === TOKEN || q === TOKEN;
}

// 若用户已有持久化配置，启动 Sidecar 时顺便确保 rules/AGENTS.md 处于同步状态
if (fs.existsSync(store.configPath)) {
  try {
    store.syncRulesFile(store.loadConfig());
  } catch {}
}

let actualPort = PORT;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${actualPort || 80}`);
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/api/check-update") {
    const force = new URL(req.url, "http://127.0.0.1").searchParams.get("force") === "1";
    const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
    const info = await checkGithubUpdate({ pluginRoot, repo: "A16Nights/antigravity-think-zh", force });
    sendJson(res, 200, info);
    return;
  }

  if (pathname === "/healthz") {
    sendJson(res, 200, { ok: true, service: "think-zh-panel" });
    return;
  }

  if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    const html = fs.readFileSync(HTML_PATH, "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(injectAzureUiKit(injectSidebarToggleWidget(html, "think-zh"), "think-zh"));
    return;
  }

  if (pathname.startsWith("/api/")) {
    if (!checkAuth(req, url)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    try {
      if (await handleAzureThemeHttp(req, res)) return;
    if (req.method === "GET" && pathname === "/api/sidebar-nav") {
        sendJson(res, 200, {
          ok: true,
          pluginId: "think-zh",
          showInLeftSidebar: isLeftSidebarEnabled("think-zh"),
          plugins: listOwnedPluginsNavState()
        });
        return;
      }
      if (req.method === "POST" && pathname === "/api/sidebar-nav") {
        const body = await readBody(req);
        const targetId = String(body.pluginId || "think-zh").trim();
        const nextVal = Boolean(body.showInLeftSidebar);
        setLeftSidebarEnabled(targetId, nextVal);
        const rf = await refreshAntigravityMcpServers();
        sendJson(res, 200, {
          ok: true,
          pluginId: targetId,
          showInLeftSidebar: nextVal,
          refreshed: Boolean(rf?.ok),
          plugins: listOwnedPluginsNavState()
        });
        return;
      }
      if (req.method === "GET" && pathname === "/api/state") {
        sendJson(res, 200, store.getStatus());
        return;
      }
      if (req.method === "POST" && pathname === "/api/config") {
        const body = await readBody(req);
        sendJson(res, 200, store.updateConfig(body));
        return;
      }
      if (req.method === "POST" && pathname === "/api/reset") {
        sendJson(res, 200, store.resetConfig());
        return;
      }
      sendJson(res, 404, { error: "API route not found" });
    } catch (err) {
      sendJson(res, 400, { error: err.message || String(err) });
    }
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  const addr = server.address();
  if (addr && typeof addr === "object") {
    actualPort = addr.port;
  }
  console.log(`[think-zh panel] listening on http://127.0.0.1:${actualPort}`);
  try {
    const __a = server.address();
    const __p = (__a && typeof __a === "object" && __a.port) ? __a.port : Number(PORT) || 0;
    const __t = (process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN || process.env.ANTIGRAVITY_SIDECAR_AUTH_TOKEN || process.env.ANTIGRAVITY_SIDECAR_WEB_TOKEN || "").trim();
    const __u = __t ? `http://127.0.0.1:${__p}/?token=${encodeURIComponent(__t)}` : `http://127.0.0.1:${__p}/`;
    registerSidecarRuntime("think-zh", { port: __p, url: __u });
  } catch {}
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
