import fs from "node:fs";
import path from "node:path";

const CACHE_TTL_MS = 10 * 60 * 1000;
const ERR_CACHE_TTL_MS = 60 * 1000;
let cached = null;

function parseSemver(v) {
  const raw = String(v || "").trim().replace(/^v/i, "");
  const dashIdx = raw.indexOf("-");
  const core = dashIdx >= 0 ? raw.slice(0, dashIdx) : raw;
  const pre = dashIdx >= 0 ? raw.slice(dashIdx + 1).trim() : "";
  const parts = core.split(".").map((n) => {
    const num = Number.parseInt(n, 10);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  });
  return {
    nums: [parts[0] || 0, parts[1] || 0, parts[2] || 0],
    pre
  };
}

export function compareVersions(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (pa.nums[i] !== pb.nums[i]) return pa.nums[i] > pb.nums[i] ? 1 : -1;
  }
  if (pa.pre === pb.pre) return 0;
  if (!pa.pre && pb.pre) return 1;
  if (pa.pre && !pb.pre) return -1;
  const aIds = pa.pre.split(".");
  const bIds = pb.pre.split(".");
  const len = Math.max(aIds.length, bIds.length);
  for (let i = 0; i < len; i++) {
    if (i >= aIds.length) return -1;
    if (i >= bIds.length) return 1;
    const x = aIds[i];
    const y = bIds[i];
    if (x === y) continue;
    const xn = /^\d+$/.test(x) ? Number(x) : null;
    const yn = /^\d+$/.test(y) ? Number(y) : null;
    if (xn !== null && yn !== null) return xn > yn ? 1 : -1;
    if (xn !== null) return -1;
    if (yn !== null) return 1;
    return x > y ? 1 : -1;
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

async function fetchWithTimeout(url, options, timeoutMs = 5500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLatestViaRedirect(repo) {
  const res = await fetchWithTimeout(
    `https://github.com/${repo}/releases/latest`,
    {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "antigravity-plugin-updater" }
    },
    5500
  );
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
  if (!force && cached && cached.repo === repo) {
    const ttl = cached.data.ok ? CACHE_TTL_MS : ERR_CACHE_TTL_MS;
    if (now - cached.checkedAt < ttl) {
      return {
        ...cached.data,
        currentVersion,
        hasUpdate: cached.data.ok ? compareVersions(cached.data.latestVersion, currentVersion) > 0 : false,
        fromCache: true
      };
    }
  }

  try {
    // 优先走网页 releases/latest 重定向（无 GitHub API 匿名限流），失败再以独立超时回退 API
    let info = null;
    try {
      info = await fetchLatestViaRedirect(repo);
    } catch {}

    if (!info) {
      const res = await fetchWithTimeout(
        `https://api.github.com/repos/${repo}/releases/latest`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": `antigravity-plugin-updater/${currentVersion}`
          }
        },
        5500
      );
      if (!res.ok) {
        const failData = {
          ok: false,
          currentVersion,
          latestVersion: currentVersion,
          hasUpdate: false,
          releaseUrl: `https://github.com/${repo}/releases`,
          error: `HTTP ${res.status}`,
          checkedAt: now
        };
        cached = { repo, checkedAt: now, data: failData };
        return failData;
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
    const failData = {
      ok: false,
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      releaseUrl: `https://github.com/${repo}/releases`,
      error: err?.name === "AbortError" ? "请求超时" : String(err?.message || err),
      checkedAt: now
    };
    cached = { repo, checkedAt: now, data: failData };
    return failData;
  }
}
