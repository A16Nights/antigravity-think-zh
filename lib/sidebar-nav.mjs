import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import https from "node:https";

export const SIDEBAR_NAV_CONFIG_PATH = path.join(os.homedir(), ".gemini", "azure-sidebar-nav.json");
export const SIDEBAR_RUNTIME_DIR = path.join(os.homedir(), ".gemini", "azure-sidebar-runtime");

export const OWNED_PLUGINS = [
  {
    id: "agent-presets",
    title: "苍蓝罗盘",
    desc: "Agent 预设中心与上下文监测",
    toolName: "open_agent_presets_ui",
    defaultLeftSidebar: false,
    hasSidecar: true
  },
  {
    id: "azure-corridor",
    title: "苍蓝回廊",
    desc: "会话与工作区管理面板",
    toolName: "open_azure_corridor_ui",
    defaultLeftSidebar: false,
    hasSidecar: true
  },
  {
    id: "azure-orbit",
    title: "苍蓝星轨",
    desc: "自定义主脑模型挂载控制台",
    toolName: "open_azure_orbit_ui",
    defaultLeftSidebar: false,
    hasSidecar: true
  },
  {
    id: "external-orchestrator",
    title: "苍蓝协奏台",
    desc: "外部执行手路由与实时执行监控",
    toolName: "open_external_orchestrator_ui",
    defaultLeftSidebar: false,
    hasSidecar: true
  },
  {
    id: "lingshu-cortex",
    title: "蓝汐 · 潮汐星海",
    desc: "长期认知图谱记忆工作台",
    toolName: "open_lingshu_cortex_ui",
    defaultLeftSidebar: false,
    hasSidecar: true
  },
  {
    id: "soul-md",
    title: "苍蓝魂匣",
    desc: "人设卡与分层记忆工作室",
    toolName: "open_soul_md_ui",
    defaultLeftSidebar: false,
    hasSidecar: true
  },
  {
    id: "think-zh",
    title: "思语中文",
    desc: "思考语言预设与双通道强化",
    toolName: "open_think_zh_ui",
    defaultLeftSidebar: false,
    hasSidecar: true
  },
  {
    id: "azure-prism",
    title: "苍蓝棱镜",
    desc: "原生思考轨迹阅读与按需翻译",
    toolName: "azure_prism_open",
    defaultLeftSidebar: true,
    hasSidecar: false
  }
];

export function getOwnedPluginMeta(pluginId) {
  return OWNED_PLUGINS.find((p) => p.id === pluginId) || null;
}

function isPidAlive(pid) {
  if (!pid || !Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e?.code === "EPERM";
  }
}

export function readSidebarNavConfig() {
  const defaults = {};
  for (const p of OWNED_PLUGINS) {
    defaults[p.id] = { showInLeftSidebar: Boolean(p.defaultLeftSidebar) };
  }
  try {
    if (fs.existsSync(SIDEBAR_NAV_CONFIG_PATH)) {
      const raw = JSON.parse(fs.readFileSync(SIDEBAR_NAV_CONFIG_PATH, "utf8"));
      const saved = raw?.plugins && typeof raw.plugins === "object" ? raw.plugins : {};
      for (const p of OWNED_PLUGINS) {
        if (typeof saved[p.id]?.showInLeftSidebar === "boolean") {
          defaults[p.id].showInLeftSidebar = saved[p.id].showInLeftSidebar;
        } else if (p.id === "azure-prism" && typeof saved["thought-viewer"]?.showInLeftSidebar === "boolean") {
          defaults[p.id].showInLeftSidebar = saved["thought-viewer"].showInLeftSidebar;
        }
      }
      return {
        version: 1,
        updatedAt: Number(raw?.updatedAt) || Date.now(),
        plugins: defaults
      };
    }
  } catch {}
  return { version: 1, updatedAt: Date.now(), plugins: defaults };
}

function writeSidebarNavConfig(cfg) {
  fs.mkdirSync(path.dirname(SIDEBAR_NAV_CONFIG_PATH), { recursive: true });
  const payload = {
    version: 1,
    updatedAt: Date.now(),
    plugins: cfg.plugins
  };
  const tmp = `${SIDEBAR_NAV_CONFIG_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf8");
  fs.renameSync(tmp, SIDEBAR_NAV_CONFIG_PATH);
  return payload;
}

export function isLeftSidebarEnabled(pluginId) {
  const cfg = readSidebarNavConfig();
  return Boolean(cfg.plugins?.[pluginId]?.showInLeftSidebar);
}

export function setLeftSidebarEnabled(pluginId, enabled) {
  const meta = getOwnedPluginMeta(pluginId);
  if (!meta) throw new Error(`Unknown pluginId: ${pluginId}`);
  const cfg = readSidebarNavConfig();
  cfg.plugins[pluginId] = { showInLeftSidebar: Boolean(enabled) };
  return writeSidebarNavConfig(cfg);
}

export function listOwnedPluginsNavState() {
  const cfg = readSidebarNavConfig();
  return OWNED_PLUGINS.map((p) => {
    const rt = p.hasSidecar ? readSidecarRuntime(p.id) : null;
    return {
      id: p.id,
      title: p.title,
      desc: p.desc,
      hasSidecar: p.hasSidecar,
      showInLeftSidebar: Boolean(cfg.plugins?.[p.id]?.showInLeftSidebar),
      runtimeAlive: rt ? rt.alive : true
    };
  });
}

export function registerSidecarRuntime(pluginId, { port, url }) {
  try {
    fs.mkdirSync(SIDEBAR_RUNTIME_DIR, { recursive: true });
    const file = path.join(SIDEBAR_RUNTIME_DIR, `${pluginId}.json`);
    const payload = {
      pluginId,
      port: Number(port) || 0,
      url: String(url || ""),
      pid: process.pid,
      updatedAt: Date.now()
    };
    fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
  } catch {}
}

export function readSidecarRuntime(pluginId) {
  const file = path.join(SIDEBAR_RUNTIME_DIR, `${pluginId}.json`);
  try {
    if (!fs.existsSync(file)) return { alive: false, port: 0, url: "", pid: 0, updatedAt: 0 };
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const alive = isPidAlive(Number(data.pid));
    return {
      alive,
      port: Number(data.port) || 0,
      url: String(data.url || ""),
      pid: Number(data.pid) || 0,
      updatedAt: Number(data.updatedAt) || 0
    };
  } catch {
    return { alive: false, port: 0, url: "", pid: 0, updatedAt: 0 };
  }
}

export function refreshAntigravityMcpServers() {
  return new Promise((resolve) => {
    try {
      const daemonDir = path.join(os.homedir(), ".gemini", "antigravity", "daemon");
      if (!fs.existsSync(daemonDir)) return resolve({ ok: false, reason: "no_daemon_dir" });
      const files = fs.readdirSync(daemonDir)
        .filter((f) => /^hub_.*\.json$/i.test(f))
        .map((f) => {
          const full = path.join(daemonDir, f);
          const stat = fs.statSync(full);
          return { full, mtimeMs: stat.mtimeMs };
        })
        .sort((a, b) => b.mtimeMs - a.mtimeMs);

      let hub = null;
      for (const item of files) {
        try {
          const j = JSON.parse(fs.readFileSync(item.full, "utf8"));
          if (j.httpsPort && j.csrfToken && isPidAlive(Number(j.pid))) {
            hub = j;
            break;
          }
        } catch {}
      }
      if (!hub) return resolve({ ok: false, reason: "no_alive_hub" });

      const body = JSON.stringify({});
      const req = https.request(
        {
          hostname: "127.0.0.1",
          port: Number(hub.httpsPort),
          path: "/exa.language_server_pb.LanguageServerService/RefreshMcpServers",
          method: "POST",
          rejectUnauthorized: false,
          timeout: 4000,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
            "x-codeium-csrf-token": hub.csrfToken
          }
        },
        (res) => {
          let chunks = "";
          res.on("data", (d) => { chunks += d; });
          res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode }));
        }
      );
      req.on("timeout", () => { try { req.destroy(); } catch {} resolve({ ok: false, reason: "timeout" }); });
      req.on("error", (err) => resolve({ ok: false, reason: err?.message || "request_error" }));
      req.write(body);
      req.end();
    } catch (e) {
      resolve({ ok: false, reason: e?.message || "unknown" });
    }
  });
}

export function getSidebarResourceUri(pluginId) {
  return `ui://${pluginId}/sidebar-launcher.html`;
}

export function getSidebarToolDefinition(pluginId) {
  const meta = getOwnedPluginMeta(pluginId);
  if (!meta || !meta.hasSidecar) return null;
  if (!isLeftSidebarEnabled(pluginId)) return null;
  return {
    name: meta.toolName,
    description: `在 Antigravity 左侧栏全页打开「${meta.title}」可视化面板（${meta.desc}）。`,
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    _meta: {
      ui: {
        resourceUri: getSidebarResourceUri(pluginId),
        visibility: ["app", "model"]
      },
      "com.google.antigravity/ui": {
        entrypoints: [
          { type: "global", title: meta.title }
        ]
      }
    }
  };
}

export function getSidebarResourceDefinition(pluginId) {
  const meta = getOwnedPluginMeta(pluginId);
  if (!meta || !meta.hasSidecar) return null;
  return {
    uri: getSidebarResourceUri(pluginId),
    name: `${meta.title} 左侧栏视图`,
    description: `全页嵌入「${meta.title}」Sidecar 面板`,
    mimeType: "text/html;profile=mcp-app"
  };
}

export function handleSidebarToolCall(pluginId) {
  const meta = getOwnedPluginMeta(pluginId);
  const rt = readSidecarRuntime(pluginId);
  const title = meta ? meta.title : pluginId;
  return {
    content: [
      {
        type: "text",
        text: rt.alive && rt.url
          ? `已打开「${title}」界面（${rt.url}）。`
          : `「${title}」后台面板服务暂未就绪，请先在右侧栏打开一次或稍后点击重试。`
      }
    ],
    structuredContent: {
      pluginId,
      title,
      desc: meta?.desc || "",
      url: rt.url || "",
      port: rt.port || 0,
      alive: Boolean(rt.alive && rt.url)
    }
  };
}

export function buildSidebarResourceReadResult(pluginId) {
  const meta = getOwnedPluginMeta(pluginId);
  const title = meta ? meta.title : pluginId;
  const rt = readSidecarRuntime(pluginId);
  const frameDomains = [];
  const connectDomains = [];
  if (rt.port > 0) {
    frameDomains.push(`http://127.0.0.1:${rt.port}`, `http://localhost:${rt.port}`);
    connectDomains.push(`http://127.0.0.1:${rt.port}`, `http://localhost:${rt.port}`);
  }
  const initialUrl = rt.alive && rt.url ? rt.url : "";
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0f1320; color: #e6ecf8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; }
  #frame { width: 100%; height: 100%; border: 0; display: block; background: transparent; }
  #fallback { display: none; height: 100%; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
  .box { max-width: 460px; padding: 20px 22px; border-radius: 14px; border: 1px solid rgba(124,156,255,0.28); background: rgba(20,26,44,0.92); text-align: center; }
  .box h3 { margin: 0 0 8px; font-size: 16px; }
  .box p { margin: 0 0 14px; font-size: 13px; color: #9aa7c2; line-height: 1.6; }
  .actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  button { padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(124,156,255,0.45); background: rgba(124,156,255,0.16); color: #e6ecf8; font-size: 12.5px; cursor: pointer; }
  button:hover { background: rgba(124,156,255,0.28); }
</style>
</head>
<body>
  <iframe id="frame" allow="clipboard-read; clipboard-write"></iframe>
  <div id="fallback">
    <div class="box">
      <h3 id="fb-title">${title}</h3>
      <p id="fb-msg">正在连接插件本地面板服务...</p>
      <div class="actions">
        <button id="btn-retry">重新连接</button>
        <button id="btn-open" style="display:none;">在浏览器中打开</button>
      </div>
    </div>
  </div>
<script>
(function(){
  const frame = document.getElementById("frame");
  const fb = document.getElementById("fallback");
  const fbMsg = document.getElementById("fb-msg");
  const btnRetry = document.getElementById("btn-retry");
  const btnOpen = document.getElementById("btn-open");
  let currentUrl = ${JSON.stringify(initialUrl)};
  let rpcId = 1;

  function showFallback(msg, url) {
    frame.style.display = "none";
    fb.style.display = "flex";
    fbMsg.textContent = msg;
    if (url) {
      btnOpen.style.display = "inline-block";
      btnOpen.onclick = () => {
        try {
          window.parent.postMessage({ jsonrpc: "2.0", id: rpcId++, method: "ui/open-link", params: { url } }, "*");
        } catch {
          window.open(url, "_blank", "noopener");
        }
      };
    } else {
      btnOpen.style.display = "none";
    }
  }

  function mountUrl(url) {
    if (!url) {
      showFallback("插件后台 Sidecar 面板尚未启动，请先在右侧栏打开一次「${title}」，或稍后点击重新连接。", "");
      return;
    }
    currentUrl = url;
    fb.style.display = "none";
    frame.style.display = "block";
    frame.src = url;
  }

  btnRetry.onclick = () => {
    try {
      window.parent.postMessage({
        jsonrpc: "2.0",
        id: rpcId++,
        method: "tools/call",
        params: { name: ${JSON.stringify(meta?.toolName || "")}, arguments: {} }
      }, "*");
    } catch {}
    if (currentUrl) mountUrl(currentUrl);
  };

  window.addEventListener("message", (ev) => {
    const msg = ev.data;
    if (!msg || typeof msg !== "object") return;
    if (msg.method === "ui/notifications/tool-result" && msg.params?.structuredContent) {
      const sc = msg.params.structuredContent;
      if (sc.alive && sc.url) mountUrl(sc.url);
      else showFallback("插件后台 Sidecar 面板尚未就绪，请先在右侧栏打开一次「${title}」后再点重试。", sc.url || "");
    }
    if (msg.id && msg.result?.structuredContent) {
      const sc = msg.result.structuredContent;
      if (sc.alive && sc.url) mountUrl(sc.url);
    }
  });

  try {
    const initId = rpcId++;
    window.parent.postMessage({
      jsonrpc: "2.0",
      id: initId,
      method: "ui/initialize",
      params: {
        protocolVersion: "2026-01-26",
        appInfo: { name: ${JSON.stringify(pluginId + "-sidebar")}, version: "1.0.0" },
        appCapabilities: {}
      }
    }, "*");
    setTimeout(() => {
      window.parent.postMessage({ jsonrpc: "2.0", method: "ui/notifications/initialized", params: {} }, "*");
    }, 60);
  } catch {}

  mountUrl(currentUrl);
})();
</script>
</body>
</html>`;

  return {
    contents: [
      {
        uri: getSidebarResourceUri(pluginId),
        mimeType: "text/html;profile=mcp-app",
        text: html,
        _meta: {
          ui: {
            prefersBorder: false,
            csp: {
              frameDomains,
              connectDomains
            }
          }
        }
      }
    ]
  };
}

export function injectSidebarToggleWidget(html, pluginId) {
  if (!html || typeof html !== "string" || html.includes("AGY_SIDEBAR_NAV_WIDGET")) return html;
  const meta = getOwnedPluginMeta(pluginId);
  const title = meta ? meta.title : pluginId;
  const snippet = `
<!-- AGY_SIDEBAR_NAV_WIDGET -->
<style>
  .agy-sb-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid var(--border, #2a334a);
    background: var(--panel-2, var(--card, rgba(128,128,128,0.12)));
    color: var(--muted, #94a3b8);
    font-size: 11px;
    line-height: 1.2;
    cursor: pointer;
    white-space: nowrap;
    transition: background .15s, border-color .15s, color .15s, transform .12s;
  }
  .agy-sb-btn:hover {
    border-color: var(--accent, #58a6ff);
    color: var(--text, #e6ecf8);
    transform: translateY(-1px);
  }
  .agy-sb-btn.is-on {
    border-color: rgba(61, 220, 151, 0.55);
    background: rgba(61, 220, 151, 0.14);
    color: #3ddc97;
  }
  .agy-sb-toast {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 99999;
    padding: 8px 13px;
    border-radius: 10px;
    border: 1px solid rgba(124, 156, 255, 0.45);
    background: rgba(15, 19, 32, 0.94);
    color: #e6ecf8;
    font-size: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    max-width: 340px;
  }
</style>
<script>
(function(){
  const PLUGIN_ID = ${JSON.stringify(pluginId)};
  const PLUGIN_TITLE = ${JSON.stringify(title)};
  const tok = new URLSearchParams(location.search).get("token") || "";
  let currentOn = false;

  function headers(extra) {
    const h = Object.assign({}, extra || {});
    if (tok) h["X-Codeium-Sidecar-Token"] = tok;
    return h;
  }

  function flashTip(text) {
    const old = document.getElementById("agy-sb-toast");
    if (old) old.remove();
    const el = document.createElement("div");
    el.id = "agy-sb-toast";
    el.className = "agy-sb-toast";
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { try { el.remove(); } catch {} }, 3400);
  }

  function renderBtn(btn) {
    if (!btn) return;
    btn.classList.toggle("is-on", currentOn);
    btn.textContent = currentOn ? "左侧栏: 开" : "左侧栏: 关";
    btn.title = currentOn
      ? "已在 Antigravity 左侧栏显示「" + PLUGIN_TITLE + "」入口，点击隐藏"
      : "点击在 Antigravity 左侧栏显示「" + PLUGIN_TITLE + "」快捷按钮";
  }

  async function loadState(btn) {
    try {
      const r = await fetch("/api/sidebar-nav", { headers: headers() });
      if (!r.ok) return;
      const d = await r.json();
      currentOn = Boolean(d.showInLeftSidebar);
      renderBtn(btn);
    } catch {}
  }

  function mount() {
    if (document.getElementById("agy-sb-btn")) return;
    const btn = document.createElement("button");
    btn.id = "agy-sb-btn";
    btn.type = "button";
    btn.className = "agy-sb-btn";
    btn.textContent = "左侧栏: ...";
    btn.onclick = async () => {
      const next = !currentOn;
      btn.disabled = true;
      try {
        const r = await fetch("/api/sidebar-nav", {
          method: "POST",
          headers: headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ pluginId: PLUGIN_ID, showInLeftSidebar: next })
        });
        const d = await r.json();
        if (r.ok && d.ok) {
          currentOn = Boolean(d.showInLeftSidebar);
          renderBtn(btn);
          flashTip((currentOn ? "已开启" : "已隐藏") + "「" + PLUGIN_TITLE + "」左侧栏按钮" + (d.refreshed ? "（已通知刷新，未变化时按 Ctrl+R）" : "（按 Ctrl+R 生效）"));
          window.dispatchEvent(new CustomEvent("agy-sidebar-nav-changed", { detail: { pluginId: PLUGIN_ID, showInLeftSidebar: currentOn } }));
        } else {
          flashTip("切换失败：" + (d.error || "未知错误"));
        }
      } catch (e) {
        flashTip("切换失败：" + (e.message || e));
      } finally {
        btn.disabled = false;
      }
    };

    const anchor = document.getElementById("agy-upd-btn");
    if (anchor && anchor.parentElement) {
      anchor.parentElement.insertBefore(btn, anchor);
    } else {
      const slot = document.querySelector(".topbar .actions, header .actions, .header-actions, .topbar-right, .toolbar-right, .topbar, header");
      if (slot) slot.appendChild(btn);
      else {
        btn.style.position = "fixed";
        btn.style.top = "10px";
        btn.style.right = "12px";
        btn.style.zIndex = "9999";
        document.body.appendChild(btn);
      }
    }
    loadState(btn);
  }

  function start() {
    setTimeout(mount, 180);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
</script>`;
  const idx = html.lastIndexOf("</body>");
  if (idx !== -1) {
    return html.slice(0, idx) + snippet + "\n" + html.slice(idx);
  }
  return html + "\n" + snippet;
}
