import fs from "node:fs";
import path from "node:path";

const CACHE_TTL_MS = 10 * 60 * 1000;
let cached = null;

function parseSemver(v) {
  const clean = String(v || "").trim().replace(/^v/i, "").split("-")[0];
  const parts = clean.split(".").map((n) => parseInt(n, 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

export function compareVersions(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  }
  return 0;
}

export function readPluginVersion(pluginRoot) {
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(pluginRoot, "plugin.json"), "utf8"));
    return String(pj.version || "0.0.0").trim();
  } catch {
    return "0.0.0";
  }
}

async function fetchLatestViaRedirect(repo, signal) {
  const res = await fetch(`https://github.com/${repo}/releases/latest`, {
    method: "HEAD",
    redirect: "follow",
    headers: { "User-Agent": "antigravity-plugin-updater" },
    signal
  });
  const finalUrl = res.url || "";
  const m = finalUrl.match(/\/releases\/tag\/([^/?#]+)/i);
  if (!m) return null;
  const tag = decodeURIComponent(m[1]).trim();
  const latestVersion = tag.replace(/^v/i, "");
  return {
    latestVersion,
    releaseUrl: finalUrl,
    releaseName: tag,
    publishedAt: ""
  };
}

export async function checkGithubUpdate({ pluginRoot, repo, force = false }) {
  const currentVersion = readPluginVersion(pluginRoot);
  const now = Date.now();
  if (!force && cached && now - cached.checkedAt < CACHE_TTL_MS && cached.repo === repo) {
    return { ...cached.data, currentVersion, hasUpdate: compareVersions(cached.data.latestVersion, currentVersion) > 0, fromCache: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);
  try {
    // 优先走网页 releases/latest 重定向（无 GitHub API 匿名限流），失败再回退 API
    let info = null;
    try {
      info = await fetchLatestViaRedirect(repo, controller.signal);
    } catch {}

    if (!info) {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": `antigravity-plugin-updater/${currentVersion}`
        },
        signal: controller.signal
      });
      if (!res.ok) {
        return {
          ok: false,
          currentVersion,
          latestVersion: currentVersion,
          hasUpdate: false,
          releaseUrl: `https://github.com/${repo}/releases`,
          error: `HTTP ${res.status}`,
          checkedAt: now
        };
      }
      const json = await res.json();
      const tag = String(json.tag_name || json.name || currentVersion).trim();
      info = {
        latestVersion: tag.replace(/^v/i, ""),
        releaseUrl: json.html_url || `https://github.com/${repo}/releases`,
        releaseName: json.name || tag,
        publishedAt: json.published_at || ""
      };
    }

    const data = {
      ok: true,
      currentVersion,
      latestVersion: info.latestVersion,
      hasUpdate: compareVersions(info.latestVersion, currentVersion) > 0,
      releaseUrl: info.releaseUrl,
      releaseName: info.releaseName,
      publishedAt: info.publishedAt,
      checkedAt: now
    };
    cached = { repo, checkedAt: now, data };
    return data;
  } catch (err) {
    return {
      ok: false,
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      releaseUrl: `https://github.com/${repo}/releases`,
      error: err?.name === "AbortError" ? "请求超时" : String(err?.message || err),
      checkedAt: now
    };
  } finally {
    clearTimeout(timer);
  }
}