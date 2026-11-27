(() => {
  if (window.AzureOnboarding) return;
  const cfg = window.__AZURE_ONBOARDING_CONFIG__ || {};
  const pluginId = String(cfg.pluginId || "").trim();
  const guide = cfg.guide || {};
  const steps = Array.isArray(guide.steps) ? guide.steps : [];
  if (!pluginId || steps.length === 0) return;

  const guideVersion = String(guide.version || "1").trim();
  let curIdx = 0;
  let backdropEl = null;
  let returnBarEl = null;
  let spotlightEl = null;
  let spotlightTimer = null;

  function getTok() {
    try {
      return new URLSearchParams(location.search).get("token") || "";
    } catch {
      return "";
    }
  }

  function apiUrl(qsObj = {}) {
    const qs = new URLSearchParams(qsObj);
    const tok = getTok();
    if (tok) qs.set("token", tok);
    return "/api/azure-onboarding" + (qs.toString() ? "?" + qs.toString() : "");
  }

  function apiHeaders(isJson = false) {
    const h = {};
    const tok = getTok();
    if (tok) h["X-Codeium-Sidecar-Token"] = tok;
    if (isJson) h["Content-Type"] = "application/json";
    return h;
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clearSpotlight() {
    if (spotlightTimer) {
      clearTimeout(spotlightTimer);
      spotlightTimer = null;
    }
    if (spotlightEl) {
      spotlightEl.classList.remove("az-ob-spotlight");
      spotlightEl = null;
    }
    if (returnBarEl) returnBarEl.classList.remove("show");
  }

  function ensureReturnBar() {
    if (returnBarEl && document.body.contains(returnBarEl)) return returnBarEl;
    const bar = document.createElement("div");
    bar.className = "az-ob-return-bar";
    bar.innerHTML = `
      <span class="az-ob-return-text">已定位到对应区域</span>
      <button type="button" class="btn btn-sm btn-primary az-ob-return-back">回到教程</button>
      <button type="button" class="btn btn-sm az-ob-return-close">知道了</button>
    `;
    bar.querySelector(".az-ob-return-back").addEventListener("click", () => {
      clearSpotlight();
      openModal(curIdx);
    });
    bar.querySelector(".az-ob-return-close").addEventListener("click", () => {
      clearSpotlight();
    });
    document.body.appendChild(bar);
    returnBarEl = bar;
    return bar;
  }

  function trySpotlight(step) {
    if (!step || !step.spotlight) return;
    const sp = step.spotlight;
    if (sp.clickBefore) {
      const pre = document.querySelector(sp.clickBefore);
      if (pre) try { pre.click(); } catch {}
    }
    if (backdropEl) backdropEl.classList.remove("show");
    clearSpotlight();

    setTimeout(() => {
      const target = document.querySelector(sp.selector);
      if (target) {
        spotlightEl = target;
        target.classList.add("az-ob-spotlight");
        try { target.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
        if (sp.focus && typeof target.focus === "function") {
          try { target.focus(); } catch {}
        }
      }
      const bar = ensureReturnBar();
      bar.querySelector(".az-ob-return-text").textContent = sp.hint || `已为你高亮「${step.navTitle || step.title}」`;
      bar.classList.add("show");
      spotlightTimer = setTimeout(() => {
        if (spotlightEl) spotlightEl.classList.remove("az-ob-spotlight");
      }, 9000);
    }, 80);
  }

  function ensureModal() {
    if (backdropEl && document.body.contains(backdropEl)) return backdropEl;
    const bd = document.createElement("div");
    bd.className = "az-ob-backdrop";
    bd.id = "azure-onboarding-modal";
    bd.innerHTML = `
      <div class="az-ob-dialog" role="dialog" aria-modal="true" aria-label="新手使用指南">
        <div class="az-ob-head">
          <div class="az-ob-head-row">
            <div class="az-ob-brand">
              <div class="az-ob-badge-icon">${esc(guide.icon || "✨")}</div>
              <div class="az-ob-title-wrap">
                <h3 class="az-ob-title">
                  <span>${esc(guide.title || "欢迎使用")}</span>
                  <span class="az-ob-pill" id="azObProgress">1 / ${steps.length}</span>
                </h3>
                <p class="az-ob-subtitle">${esc(guide.subtitle || "一分钟快速上手核心功能")}</p>
              </div>
            </div>
            <button type="button" class="btn az-ob-close" id="azObClose" title="关闭教程 (Esc)">✕</button>
          </div>
        </div>
        <div class="az-ob-nav" id="azObNav"></div>
        <div class="az-ob-body" id="azObBody"></div>
        <div class="az-ob-foot">
          <label class="az-ob-check">
            <input type="checkbox" id="azObDontShow" checked />
            <span>下次不再自动弹出（随时可点顶栏 ? 重看）</span>
          </label>
          <div class="az-ob-actions">
            <button type="button" class="btn az-ob-btn" id="azObPrev">上一步</button>
            <button type="button" class="btn btn-primary az-ob-btn" id="azObNext">下一步 →</button>
          </div>
        </div>
      </div>
    `;

    bd.addEventListener("click", (e) => {
      if (e.target === bd) closeModal(true);
    });
    bd.querySelector("#azObClose").addEventListener("click", () => closeModal(true));
    bd.querySelector("#azObPrev").addEventListener("click", () => {
      if (curIdx > 0) renderStep(curIdx - 1);
      else closeModal(true);
    });
    bd.querySelector("#azObNext").addEventListener("click", () => {
      if (curIdx < steps.length - 1) renderStep(curIdx + 1);
      else closeModal(true);
    });

    document.body.appendChild(bd);
    backdropEl = bd;
    return bd;
  }

  function renderStep(index) {
    curIdx = Math.max(0, Math.min(steps.length - 1, Number(index) || 0));
    const bd = ensureModal();
    const step = steps[curIdx];

    bd.querySelector("#azObProgress").textContent = `${curIdx + 1} / ${steps.length}`;

    const nav = bd.querySelector("#azObNav");
    nav.innerHTML = steps.map((s, i) => `
      <button type="button" class="az-ob-nav-item seg-btn ${i === curIdx ? "active btn-active" : ""}" data-idx="${i}">
        <span>${esc(s.icon || `${i + 1}.`)}</span>
        <span>${esc(s.navTitle || s.title)}</span>
      </button>
    `).join("");
    nav.querySelectorAll(".az-ob-nav-item").forEach((btn) => {
      btn.addEventListener("click", () => renderStep(Number(btn.dataset.idx)));
    });
    const activeBtn = nav.querySelector(".az-ob-nav-item.active");
    if (activeBtn && typeof activeBtn.scrollIntoView === "function") {
      try { activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); } catch {}
    }

    const cardsHtml = (step.items || []).map((it) => `
      <div class="az-ob-card">
        <div class="az-ob-card-ico">${esc(it.icon || "✦")}</div>
        <div class="az-ob-card-main">
          <div class="az-ob-card-title">${esc(it.title || "")}</div>
          <div class="az-ob-card-text">${esc(it.text || "")}</div>
        </div>
      </div>
    `).join("");

    const tryBtnHtml = step.spotlight && step.spotlight.selector
      ? `<button type="button" class="az-ob-try-btn btn-active" id="azObTryBtn">🎯 ${esc(step.spotlight.buttonText || "在界面上定位")}</button>`
      : "";

    const tipHtml = step.tip
      ? `<div class="az-ob-tip">💡 ${esc(step.tip)}</div>`
      : "";

    const body = bd.querySelector("#azObBody");
    body.innerHTML = `
      <div class="az-ob-step-head">
        <div>
          <h4 class="az-ob-step-title"><span>${esc(step.icon || "✨")}</span><span>${esc(step.title || "")}</span></h4>
          <p class="az-ob-step-desc">${esc(step.desc || "")}</p>
        </div>
        ${tryBtnHtml}
      </div>
      <div class="az-ob-cards">${cardsHtml}</div>
      ${tipHtml}
    `;
    const tryBtn = body.querySelector("#azObTryBtn");
    if (tryBtn) tryBtn.addEventListener("click", () => trySpotlight(step));

    const prevBtn = bd.querySelector("#azObPrev");
    const nextBtn = bd.querySelector("#azObNext");
    prevBtn.textContent = curIdx === 0 ? "跳过引导" : "← 上一步";
    nextBtn.textContent = curIdx === steps.length - 1 ? "开始使用 ✨" : "下一步 →";
  }

  async function persistDismiss(shouldDismiss) {
    try {
      const bridge = window.__AZURE_ONBOARDING_BRIDGE__;
      if (bridge && typeof bridge.set === "function") {
        await bridge.set(shouldDismiss ? "dismiss" : "reset", guideVersion);
        return;
      }
      await fetch(apiUrl(), {
        method: "POST",
        headers: apiHeaders(true),
        body: JSON.stringify({
          action: shouldDismiss ? "dismiss" : "reset",
          guideVersion
        })
      });
    } catch {}
  }

  function openModal(startIndex = 0) {
    clearSpotlight();
    const bd = ensureModal();
    renderStep(startIndex);
    bd.classList.add("show");
  }

  function closeModal(savePref = true) {
    if (!backdropEl) return;
    const dontShow = Boolean(backdropEl.querySelector("#azObDontShow")?.checked);
    backdropEl.classList.remove("show");
    if (savePref) persistDismiss(dontShow);
  }

  function mountHeaderButton() {
    if (document.getElementById("btn-azure-guide")) return;
    const refBtn = document.querySelector(
      "#btnRefresh, #refresh-btn, #btn-refresh, #btn-reinject, #btn-selftest, #btn-azure-theme-studio, #btn-theme-studio, #theme-btn, #btnTheme, #btnThemeToggle, #btn-theme"
    );
    const container =
      (refBtn && refBtn.parentElement) ||
      document.querySelector(".top-actions, .topbar-actions, .header-actions, .actions, .controls, .header-top, .topbar");
    if (!container) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btn-azure-guide";
    btn.className = "btn btn-sm";
    btn.title = "打开新手引导与功能教程";
    btn.innerHTML = `<span class="az-ob-qmark">?</span><span>指南</span>`;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(0);
    });

    if (refBtn && refBtn.parentElement === container) {
      container.insertBefore(btn, refBtn);
    } else {
      container.appendChild(btn);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (!backdropEl || !backdropEl.classList.contains("show")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal(true);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (curIdx < steps.length - 1) renderStep(curIdx + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (curIdx > 0) renderStep(curIdx - 1);
    }
  });

  async function init() {
    mountHeaderButton();
    setTimeout(mountHeaderButton, 500);
    try {
      const bridge = window.__AZURE_ONBOARDING_BRIDGE__;
      let d = null;
      if (bridge && typeof bridge.get === "function") {
        d = await bridge.get(guideVersion);
      } else {
        const r = await fetch(apiUrl({ v: guideVersion }), { headers: apiHeaders(false) });
        if (r.ok) d = await r.json();
      }
      if (d && d.shouldShow) {
        setTimeout(() => openModal(0), 380);
      }
    } catch {}
  }

  window.AzureOnboarding = {
    open: openModal,
    close: closeModal,
    reset: () => persistDismiss(false),
    spotlight: (idx) => trySpotlight(steps[idx] || steps[curIdx])
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
