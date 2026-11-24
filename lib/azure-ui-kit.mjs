/**
 * Azure UI Kit — 零依赖原生前端增强工具库（自动注入 Sidecar HTML）
 * 提供：
 * 1. 高饱和毛玻璃 + 全局统一缓动曲线 + reduced-motion 支持
 * 2. AzureTone: 基于图片或种子自动生成 --tone-deep/line/soft/glow 氛围色
 * 3. AzureOverlayHost: 窄屏 Sheet / 宽屏 Dialog / 锚定 Popover 三档自适应浮层
 * 4. AzureScrollAnchor: ResizeObserver 实测高度 + 上方变动 scrollBy 锚定防跳动
 * 5. AzureTabStore: 支持置顶段、相邻插入、最近 10 条关闭栈恢复的多标签工作台状态机
 */

export function injectAzureUiKit(html, pluginId) {
  if (!html || typeof html !== "string" || html.includes("AGY_AZURE_UI_KIT")) return html;
  const snippet = `
<!-- AGY_AZURE_UI_KIT -->
<style>
  /* ═══ Neko Glass · 黑蓝柔雾底（苍蓝为主、柔紫为辅）+ 饱满按钮 + 胶囊开关 + 全局悬停反馈 ═══ */
  :root {
    --azure-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
    --azure-dur: 0.18s;
    --azure-dur-fast: 0.13s;
    --neko-bg: #121826;
    --neko-shell: #161d2f;
    --neko-panel: rgba(21, 28, 45, 0.90);
    --neko-panel-solid: #172033;
    --neko-sub: rgba(255, 255, 255, 0.07);
    --neko-sub-hover: rgba(59, 130, 246, 0.16);
    --neko-hover: rgba(59, 130, 246, 0.14);
    --neko-outer-border: rgba(96, 165, 250, 0.36);
    --neko-border: rgba(96, 165, 250, 0.22);
    --neko-border-btn: rgba(255, 255, 255, 0.16);
    --neko-border-hi: rgba(59, 130, 246, 0.68);
    --neko-text: #f1f5f9;
    --neko-muted: #94a3b8;
    --neko-accent: #3b82f6;
    --neko-accent-2: #8b5cf6;
    --neko-grad: linear-gradient(135deg, #2563eb 0%, #3b82f6 58%, #7c3aed 100%);
    --neko-tag-bg: rgba(59, 130, 246, 0.18);
    --neko-tag-border: rgba(96, 165, 250, 0.38);
    --neko-tag-fg: #bfdbfe;
    --neko-ok: #10b981;
    --neko-sky: #38bdf8;
    --neko-warn: #f59e0b;
    --neko-danger: #f43f5e;
    --neko-switch-off: rgba(255, 255, 255, 0.18);
    --neko-switch-on: linear-gradient(135deg, #2563eb 0%, #3b82f6 68%, #7c3aed 100%);
    --neko-shadow: 0 10px 28px rgba(0, 0, 0, 0.34);
    --neko-modal-shadow: 0 22px 58px rgba(0, 0, 0, 0.54);

    /* 统一覆写各插件语义变量 */
    --bg: #121826;
    --bg-card: rgba(21, 28, 45, 0.92);
    --bg-elev: rgba(28, 37, 58, 0.94);
    --bg-hover: rgba(59, 130, 246, 0.13);
    --card: rgba(21, 28, 45, 0.92);
    --card-2: rgba(28, 37, 58, 0.92);
    --card-hover: rgba(31, 42, 66, 0.96);
    --card-muted: rgba(255, 255, 255, 0.045);
    --panel: rgba(21, 28, 45, 0.92);
    --panel-2: rgba(255, 255, 255, 0.06);
    --panel-hover: rgba(59, 130, 246, 0.14);
    --glass: rgba(18, 24, 38, 0.84);
    --border: rgba(96, 165, 250, 0.22);
    --border-active: #3b82f6;
    --border-hi: rgba(59, 130, 246, 0.62);
    --text: #f1f5f9;
    --muted: #94a3b8;
    --text-muted: #94a3b8;
    --text-sub: #cbd5e1;
    --text-dim: #94a3b8;
    --accent: #3b82f6;
    --accent-2: #8b5cf6;
    --accent-soft: rgba(59, 130, 246, 0.16);
    --accent-border: rgba(59, 130, 246, 0.42);
    --badge-bg: rgba(59, 130, 246, 0.18);
    --badge-active-bg: rgba(59, 130, 246, 0.30);
    --pill-bg: rgba(59, 130, 246, 0.16);
    --ok: #10b981;
    --green: #10b981;
    --warn: #f59e0b;
    --amber: #f59e0b;
    --danger: #f43f5e;
    --rose: #f43f5e;
    --tone-deep: rgba(59, 130, 246, 0.92);
    --tone-line: rgba(96, 165, 250, 0.38);
    --tone-soft: rgba(59, 130, 246, 0.16);
    --tone-glow: rgba(37, 99, 235, 0.18);
  }

  html[data-theme="light"], [data-theme="light"] {
    --neko-bg: #f4f7fc;
    --neko-shell: #ffffff;
    --neko-panel: rgba(255, 255, 255, 0.94);
    --neko-panel-solid: #ffffff;
    --neko-sub: rgba(15, 23, 42, 0.045);
    --neko-sub-hover: rgba(59, 130, 246, 0.10);
    --neko-hover: rgba(59, 130, 246, 0.09);
    --neko-outer-border: rgba(59, 130, 246, 0.28);
    --neko-border: rgba(59, 130, 246, 0.20);
    --neko-border-btn: rgba(15, 23, 42, 0.15);
    --neko-border-hi: rgba(37, 99, 235, 0.56);
    --neko-text: #0f172a;
    --neko-muted: #64748b;
    --neko-accent: #2563eb;
    --neko-accent-2: #7c3aed;
    --neko-grad: linear-gradient(135deg, #2563eb 0%, #3b82f6 58%, #7c3aed 100%);
    --neko-tag-bg: rgba(59, 130, 246, 0.12);
    --neko-tag-border: rgba(59, 130, 246, 0.30);
    --neko-tag-fg: #1d4ed8;
    --neko-ok: #059669;
    --neko-sky: #0284c7;
    --neko-warn: #d97706;
    --neko-danger: #e11d48;
    --neko-switch-off: #e2e8f0;
    --neko-switch-on: linear-gradient(135deg, #2563eb 0%, #3b82f6 68%, #7c3aed 100%);
    --neko-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
    --neko-modal-shadow: 0 18px 48px rgba(15, 23, 42, 0.16);

    --bg: #f4f7fc;
    --bg-card: #ffffff;
    --bg-elev: #edf2fa;
    --bg-hover: rgba(59, 130, 246, 0.07);
    --card: rgba(255, 255, 255, 0.94);
    --card-2: #edf2fa;
    --card-hover: #f2f7ff;
    --card-muted: #f0f4fa;
    --panel: rgba(255, 255, 255, 0.94);
    --panel-2: #f0f4fa;
    --panel-hover: rgba(59, 130, 246, 0.08);
    --glass: rgba(255, 255, 255, 0.88);
    --border: rgba(59, 130, 246, 0.20);
    --border-active: #2563eb;
    --border-hi: rgba(37, 99, 235, 0.50);
    --text: #0f172a;
    --muted: #64748b;
    --text-muted: #64748b;
    --text-sub: #334155;
    --text-dim: #64748b;
    --accent: #2563eb;
    --accent-2: #7c3aed;
    --accent-soft: rgba(59, 130, 246, 0.11);
    --accent-border: rgba(59, 130, 246, 0.34);
    --badge-bg: rgba(59, 130, 246, 0.11);
    --badge-active-bg: rgba(59, 130, 246, 0.20);
    --pill-bg: rgba(15, 23, 42, 0.06);
    --ok: #059669;
    --green: #059669;
    --warn: #d97706;
    --amber: #d97706;
    --danger: #e11d48;
    --rose: #e11d48;
    --tone-deep: rgba(37, 99, 235, 0.92);
    --tone-line: rgba(37, 99, 235, 0.32);
    --tone-soft: rgba(37, 99, 235, 0.11);
    --tone-glow: rgba(37, 99, 235, 0.12);
  }

  body {
    background-color: var(--neko-bg) !important;
    background-image:
      radial-gradient(780px 400px at 86% -12%, rgba(59, 130, 246, 0.16), transparent 62%),
      radial-gradient(620px 340px at 8% -10%, rgba(124, 58, 237, 0.09), transparent 60%) !important;
    color: var(--neko-text);
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
  }

  /* 顶栏与导航条：柔雾磨砂 */
  .topbar, header.topbar, header.header, body > header, .glass-bar, nav.tabs, .tabs {
    background: var(--glass) !important;
    backdrop-filter: blur(16px) saturate(165%);
    -webkit-backdrop-filter: blur(16px) saturate(165%);
    border-color: var(--neko-border) !important;
    transition: border-color var(--azure-dur) var(--azure-ease), background var(--azure-dur) var(--azure-ease);
  }

  /* 分区卡片与列表项：黑紫柔雾 + 14px 圆角 + 悬停微亮紫边 */
  .card, .preset-card, .sentinel-box, .toolbar, .panel-card, .stat-card,
  .run-card, .live-card, .provider-card, .section-card, .card-item,
  .item-row, .feed-item, .scope-box, .preset-btn, .fb-item,
  .batch-bar, .presets-bar, .starfield-box, .azure-tabbar {
    background: var(--neko-panel) !important;
    border: 1px solid var(--neko-border) !important;
    border-radius: 14px !important;
    box-shadow: var(--neko-shadow);
    backdrop-filter: blur(14px);
    transition: border-color var(--azure-dur-fast) var(--azure-ease), background var(--azure-dur-fast) var(--azure-ease), transform var(--azure-dur-fast) var(--azure-ease), box-shadow var(--azure-dur-fast) var(--azure-ease);
  }
  .presets-bar {
    padding: 11px 16px !important;
    gap: 8px !important;
  }
  .preset-card, .run-card, .card-item, .item-row, .feed-item, .preset-btn, .card-head, .switch-row {
    cursor: pointer;
  }
  .card:hover, .preset-card:hover, .run-card:hover, .live-card:hover, .provider-card:hover,
  .card-item:hover, .item-row:hover, .feed-item:hover, .preset-btn:hover, .fb-item:hover,
  .sentinel-box:hover, .toolbar:hover {
    border-color: var(--neko-border-hi) !important;
  }
  .preset-card:hover, .card-item:hover, .item-row:hover, .feed-item:hover, .preset-btn:hover {
    background: var(--card-hover) !important;
    transform: translateY(-1px);
  }
  .preset-card.active, .card.active, .card-item.selected, .preset-btn.active {
    border-color: var(--neko-accent) !important;
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.38), var(--neko-shadow) !important;
  }

  /* 主按钮：苍蓝主体→柔紫尾韵渐变 + 10px 饱满圆角 + 悬停微抬 */
  button.primary, .btn.primary, .btn-primary, button.btn-primary, .ai-btn {
    background: var(--neko-grad) !important;
    color: #ffffff !important;
    border: 1px solid transparent !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(37, 99, 235, 0.32);
    transition: filter var(--azure-dur-fast) var(--azure-ease), transform var(--azure-dur-fast) var(--azure-ease), box-shadow var(--azure-dur-fast) var(--azure-ease);
  }
  button.primary:hover, .btn.primary:hover, .btn-primary:hover, .ai-btn:hover {
    filter: brightness(1.10);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.44);
  }
  button.primary:active, .btn.primary:active, .btn-primary:active, .ai-btn:active {
    transform: translateY(0);
  }

  /* 次级按钮：柔灰磨砂底 + 细灰描边 + 10px 圆角 + 悬停紫光反馈 */
  button:not(.primary):not(.btn-primary):not(.ai-btn):not(.danger):not(.btn-danger):not(.tab):not(.link-btn):not(.seg-btn):not(.pill-filter):not(.org-mode-tab):not(.btn-active):not(.on-pin):not(.on-fav):not(.on-rev):not(.azure-tab-pill):not(.azure-tab-reopen):not(.inline-edit-btn):not(.preset-btn):not(.azure-select-trigger):not(.azure-select-opt):not(.azure-theme-card):not(.azure-swatch):not(.azure-slot-act):not(.azure-theme-close),
  .btn:not(.primary):not(.btn-primary):not(.danger):not(.btn-danger):not(.btn-active) {
    border-radius: 10px !important;
    border: 1px solid var(--neko-border-btn) !important;
    background: var(--neko-sub) !important;
    color: var(--neko-text) !important;
    font-weight: 500;
    cursor: pointer;
    transition: border-color var(--azure-dur-fast) var(--azure-ease), background var(--azure-dur-fast) var(--azure-ease), color var(--azure-dur-fast) var(--azure-ease), transform var(--azure-dur-fast) var(--azure-ease), box-shadow var(--azure-dur-fast) var(--azure-ease);
  }
  button:not(.primary):not(.btn-primary):not(.ai-btn):not(.danger):not(.btn-danger):not(.tab):not(.link-btn):not(.seg-btn):not(.pill-filter):not(.org-mode-tab):not(.btn-active):not(.on-pin):not(.on-fav):not(.on-rev):not(.azure-tab-pill):not(.azure-tab-reopen):not(.inline-edit-btn):not(.preset-btn):not(.azure-select-trigger):not(.azure-select-opt):not(.azure-theme-card):not(.azure-swatch):not(.azure-slot-act):not(.azure-theme-close):hover,
  .btn:not(.primary):not(.btn-primary):not(.danger):not(.btn-danger):not(.btn-active):hover {
    background: var(--neko-sub-hover) !important;
    border-color: var(--neko-border-hi) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.20);
  }
  button:not(:disabled):active, .btn:not(:disabled):active {
    transform: translateY(0) !important;
  }

  /* 危险按钮 */
  button.danger, .btn.danger, .btn-danger {
    border-radius: 10px !important;
    background: rgba(244, 63, 94, 0.14) !important;
    border: 1px solid rgba(244, 63, 94, 0.38) !important;
    color: #fda4af !important;
    cursor: pointer;
    transition: background var(--azure-dur-fast) var(--azure-ease), border-color var(--azure-dur-fast) var(--azure-ease), transform var(--azure-dur-fast) var(--azure-ease);
  }
  html[data-theme="light"] button.danger, html[data-theme="light"] .btn.danger, html[data-theme="light"] .btn-danger {
    color: #be123c !important;
  }
  button.danger:hover, .btn.danger:hover, .btn-danger:hover {
    background: rgba(244, 63, 94, 0.24) !important;
    border-color: rgba(244, 63, 94, 0.65) !important;
    transform: translateY(-1px);
  }

  /* Tab / 分段按钮 / 胶囊标签 / 链接按钮 统一悬停反馈 */
  .tab, button.tab, .seg-btn, .pill-filter, .chip, .star-chip, .link-btn, .inline-edit-btn, a {
    cursor: pointer;
    transition: background var(--azure-dur-fast) var(--azure-ease), color var(--azure-dur-fast) var(--azure-ease), border-color var(--azure-dur-fast) var(--azure-ease), transform var(--azure-dur-fast) var(--azure-ease);
  }
  .tab, button.tab {
    border-radius: 9px !important;
    border: 1px solid transparent !important;
    background: transparent !important;
    color: var(--neko-muted) !important;
  }
  .tab:hover, button.tab:hover, .seg-btn:hover, .pill-filter:hover {
    color: var(--neko-text) !important;
    background: var(--neko-hover) !important;
    border-color: var(--neko-border) !important;
  }
  .tab.active, button.tab.active, .seg-btn.active, .pill-filter.active {
    color: var(--neko-tag-fg) !important;
    border-color: var(--neko-tag-border) !important;
    background: var(--neko-tag-bg) !important;
  }
  .chip:hover, .star-chip:hover {
    border-color: var(--neko-border-hi) !important;
    background: var(--neko-hover) !important;
    transform: translateY(-1px);
  }

  /* 胶囊徽章：柔紫/翡翠/琥珀 */
  .badge:not(.ok):not(.warn):not(.danger):not(.err):not(.neutral):not(.badge-p1):not(.badge-p2),
  .pill:not(.ok):not(.warn):not(.danger),
  .tag-pill {
    background: var(--neko-tag-bg) !important;
    color: var(--neko-tag-fg) !important;
    border: 1px solid var(--neko-tag-border) !important;
    border-radius: 999px !important;
  }
  .badge.ok, .badge.success, .badge-run {
    background: rgba(16, 185, 129, 0.16) !important;
    color: var(--neko-ok) !important;
    border: 1px solid rgba(16, 185, 129, 0.38) !important;
    border-radius: 999px !important;
  }
  .badge.warn {
    background: rgba(245, 158, 11, 0.16) !important;
    color: var(--neko-warn) !important;
    border: 1px solid rgba(245, 158, 11, 0.40) !important;
    border-radius: 999px !important;
  }

  /* 输入框、下拉框：10px 圆角 + 悬停与聚焦紫光反馈 */
  input[type="text"], input[type="password"], input[type="number"], input[type="search"], select, textarea {
    background: var(--neko-sub) !important;
    color: var(--neko-text) !important;
    border-radius: 10px !important;
    border: 1px solid var(--neko-border-btn) !important;
    transition: border-color var(--azure-dur-fast) var(--azure-ease), box-shadow var(--azure-dur-fast) var(--azure-ease), background var(--azure-dur-fast) var(--azure-ease);
  }
  input[type="text"]:hover, input[type="password"]:hover, input[type="number"]:hover, input[type="search"]:hover, select:hover, textarea:hover {
    border-color: var(--neko-border-hi) !important;
  }
  select option {
    background: var(--neko-panel-solid);
    color: var(--neko-text);
  }
  input:focus, select:focus, textarea:focus {
    border-color: var(--neko-accent) !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.28) !important;
    outline: none;
  }
  input[type="range"] {
    accent-color: #3b82f6;
    cursor: pointer;
  }

  /* ═══ 全局统一思语同款圆角胶囊滑动开关（替代方框打勾） ═══ */
  input[type="checkbox"]:not([data-chk]):not(.run-batch-chk):not(#chk-select-all-runs) {
    -webkit-appearance: none !important;
    appearance: none !important;
    position: relative !important;
    display: inline-block !important;
    width: 38px !important;
    min-width: 38px !important;
    height: 22px !important;
    margin: 0 !important;
    padding: 0 !important;
    border-radius: 999px !important;
    border: 1px solid rgba(255, 255, 255, 0.14) !important;
    background: var(--neko-switch-off) !important;
    cursor: pointer !important;
    vertical-align: middle;
    flex-shrink: 0;
    transition: background 0.2s var(--azure-ease), border-color 0.2s var(--azure-ease), box-shadow 0.2s var(--azure-ease) !important;
  }
  html[data-theme="light"] input[type="checkbox"]:not([data-chk]):not(.run-batch-chk):not(#chk-select-all-runs) {
    border-color: rgba(15, 23, 42, 0.10) !important;
  }
  input[type="checkbox"]:not([data-chk]):not(.run-batch-chk):not(#chk-select-all-runs)::before {
    content: "" !important;
    position: absolute !important;
    top: 2px !important;
    left: 2px !important;
    width: 16px !important;
    height: 16px !important;
    border-radius: 50% !important;
    background: #ffffff !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.28) !important;
    transition: transform 0.2s var(--azure-ease) !important;
  }
  input[type="checkbox"]:not([data-chk]):not(.run-batch-chk):not(#chk-select-all-runs):checked {
    background: var(--neko-switch-on) !important;
    border-color: transparent !important;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.40) !important;
  }
  input[type="checkbox"]:not([data-chk]):not(.run-batch-chk):not(#chk-select-all-runs):checked::before {
    transform: translateX(16px) !important;
  }
  input[type="checkbox"]:not([data-chk]):not(.run-batch-chk):not(#chk-select-all-runs):hover {
    border-color: var(--neko-border-hi) !important;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.18) !important;
  }
  /* 已有 .slider 的原生滑动开关（think-zh / azure-orbit / external-orchestrator）保持隐藏并统一思语紫配色 */
  .switch:has(.slider) > input[type="checkbox"],
  .toggle:has(.slider) > input[type="checkbox"] {
    opacity: 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    height: 0 !important;
    position: absolute !important;
    pointer-events: none !important;
  }
  .switch .slider, .toggle .slider {
    background: var(--neko-switch-off) !important;
    transition: background 0.2s var(--azure-ease), box-shadow 0.2s var(--azure-ease) !important;
  }
  .switch:hover .slider, .toggle:hover .slider {
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.18);
  }
  .switch input:checked + .slider, .toggle input:checked + .slider {
    background: var(--neko-switch-on) !important;
    box-shadow: 0 0 10px rgba(124, 58, 237, 0.36);
  }
  label:has(input[type="checkbox"]) {
    cursor: pointer;
    transition: color var(--azure-dur-fast) var(--azure-ease);
  }
  label:has(input[type="checkbox"]):hover {
    color: var(--neko-text);
  }

  /* 弹窗与浮层窗口：16px 圆角 + 淡紫细边 + 黑紫柔雾 */
  .modal, .modal-card, .azure-ov-panel {
    background: var(--neko-shell) !important;
    color: var(--neko-text) !important;
    border: 1px solid var(--neko-outer-border) !important;
    border-radius: 16px !important;
    box-shadow: var(--neko-modal-shadow) !important;
    backdrop-filter: blur(16px);
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  body.azure-tone-active::before {
    content: "";
    position: fixed;
    inset: 0 0 auto 0;
    height: 180px;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(ellipse 75% 100% at 50% -20%, var(--tone-glow), transparent 72%);
    transition: background 0.38s var(--azure-ease);
  }
  /* 窄栏三档自适应弹窗（右侧窄栏自动转底部 Sheet） */
  @media (max-width: 540px) {
    .modal-mask, .modal-backdrop {
      align-items: flex-end !important;
      padding: 0 !important;
    }
    .modal-mask > .modal, .modal-backdrop > .modal, .modal-card {
      width: 100% !important;
      max-width: 100% !important;
      max-height: 86vh !important;
      border-radius: 16px 16px 0 0 !important;
      margin: 0 !important;
      animation: azureSheetUp var(--azure-dur) var(--azure-ease);
    }
  }
  @keyframes azureSheetUp {
    from { transform: translateY(18px); opacity: 0.72; }
    to { transform: translateY(0); opacity: 1; }
  }
  /* AzureOverlayHost 通用浮层 */
  .azure-ov-mask {
    position: fixed;
    inset: 0;
    z-index: 99980;
    background: rgba(8, 12, 22, 0.48);
    backdrop-filter: blur(8px) saturate(150%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .azure-ov-mask.mode-sheet {
    align-items: flex-end;
    padding: 0;
  }
  .azure-ov-mask.mode-popover {
    background: transparent;
    backdrop-filter: none;
    display: block;
    padding: 0;
  }
  .azure-ov-panel {
    background: var(--panel, var(--card, #141a2c));
    color: var(--text, #e6ecf8);
    border: 1px solid var(--tone-line, var(--border, #2a334a));
    border-radius: 14px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.42);
    max-width: 520px;
    width: 100%;
    max-height: 82vh;
    overflow: auto;
    padding: 14px 16px;
    transition: transform var(--azure-dur) var(--azure-ease), opacity var(--azure-dur) var(--azure-ease);
  }
  .azure-ov-mask.mode-sheet .azure-ov-panel {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
    animation: azureSheetUp var(--azure-dur) var(--azure-ease);
  }
  .azure-ov-mask.mode-popover .azure-ov-panel {
    position: fixed;
    width: auto;
    min-width: 240px;
    max-width: 360px;
  }
  /* 多标签工作台栏 */
  .azure-tabbar {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 8px;
    margin-bottom: 10px;
    border-radius: 10px;
    border: 1px solid var(--border, #2a334a);
    background: var(--panel-2, rgba(128, 128, 128, 0.08));
    backdrop-filter: blur(14px) saturate(170%);
    overflow-x: auto;
  }
  .azure-tab-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 7px;
    border: 1px solid transparent;
    background: rgba(128, 128, 128, 0.1);
    color: var(--muted, #94a3b8);
    font-size: 11.5px;
    cursor: pointer;
    white-space: nowrap;
    max-width: 180px;
    transition: background var(--azure-dur-fast) var(--azure-ease), border-color var(--azure-dur-fast) var(--azure-ease), color var(--azure-dur-fast) var(--azure-ease);
  }
  .azure-tab-pill:hover {
    color: var(--text, #e6ecf8);
    border-color: var(--tone-line);
  }
  .azure-tab-pill.active {
    background: var(--tone-soft);
    border-color: var(--tone-line);
    color: var(--text, #e6ecf8);
    font-weight: 600;
  }
  .azure-tab-pill .tab-txt {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .azure-tab-pill .tab-act {
    opacity: 0.65;
    font-size: 10.5px;
    padding: 0 2px;
    border-radius: 4px;
  }
  .azure-tab-pill .tab-act:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.12);
  }
  .azure-tab-reopen {
    margin-left: auto;
    flex-shrink: 0;
    padding: 3px 8px;
    border-radius: 7px;
    border: 1px dashed var(--border, #2a334a);
    background: transparent;
    color: var(--muted, #94a3b8);
    font-size: 11px;
    cursor: pointer;
  }
  .azure-tab-reopen:hover {
    color: var(--text, #e6ecf8);
    border-color: var(--tone-line);
  }

  /* ═══ 全局统一 Neko Glass 自定义下拉菜单（接管原生 select） ═══ */
  select.azure-select-native {
    display: none !important;
  }
  .azure-select-trigger {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 8px !important;
    min-height: 34px;
    padding: 6px 10px 6px 12px !important;
    border-radius: 10px !important;
    border: 1px solid var(--neko-border-btn) !important;
    background: var(--neko-sub) !important;
    color: var(--neko-text) !important;
    font-family: inherit !important;
    font-size: 13px;
    font-weight: 500 !important;
    line-height: 1.35 !important;
    text-align: left !important;
    cursor: pointer !important;
    box-sizing: border-box !important;
    max-width: 100%;
    vertical-align: middle;
    transition: border-color var(--azure-dur-fast) var(--azure-ease), background var(--azure-dur-fast) var(--azure-ease), box-shadow var(--azure-dur-fast) var(--azure-ease) !important;
  }
  .azure-select-trigger:hover:not(:disabled) {
    border-color: var(--neko-border-hi) !important;
    background: var(--neko-sub-hover) !important;
  }
  .azure-select-trigger.open,
  .azure-select-trigger:focus-visible {
    border-color: var(--neko-accent) !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.28) !important;
    outline: none !important;
  }
  .azure-select-trigger:disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
  }
  .azure-select-label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .azure-select-label.placeholder {
    color: var(--neko-muted);
  }
  .azure-select-caret {
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
    color: var(--neko-muted);
    transition: transform 0.18s var(--azure-ease), color 0.18s var(--azure-ease);
  }
  .azure-select-trigger.open .azure-select-caret {
    transform: rotate(180deg);
    color: var(--neko-accent);
  }
  .azure-select-menu {
    position: fixed;
    z-index: 100020;
    box-sizing: border-box;
    padding: 5px;
    border-radius: 12px;
    border: 1px solid rgba(96, 165, 250, 0.34);
    background: rgba(18, 25, 42, 0.96);
    backdrop-filter: blur(18px) saturate(165%);
    -webkit-backdrop-filter: blur(18px) saturate(165%);
    box-shadow: 0 16px 40px rgba(4, 8, 22, 0.64), 0 0 0 1px rgba(59, 130, 246, 0.14);
    overflow-y: auto;
    overflow-x: hidden;
    animation: azureSelectDrop 0.14s var(--azure-ease);
  }
  html[data-theme="light"] .azure-select-menu,
  body.light .azure-select-menu {
    background: rgba(255, 255, 255, 0.97);
    border-color: rgba(37, 99, 235, 0.24);
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(37, 99, 235, 0.08);
  }
  @keyframes azureSelectDrop {
    from { opacity: 0; transform: translateY(-4px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .azure-select-menu.drop-up {
    animation: azureSelectDropUp 0.14s var(--azure-ease);
  }
  @keyframes azureSelectDropUp {
    from { opacity: 0; transform: translateY(4px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .azure-select-group {
    padding: 6px 10px 3px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--neko-muted);
    user-select: none;
  }
  .azure-select-opt {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 8px !important;
    width: 100% !important;
    padding: 7px 10px !important;
    margin: 1px 0 !important;
    border: 1px solid transparent !important;
    border-radius: 8px !important;
    background: transparent !important;
    color: var(--neko-text) !important;
    font-family: inherit !important;
    font-size: 13px !important;
    font-weight: 400 !important;
    line-height: 1.35 !important;
    text-align: left !important;
    cursor: pointer !important;
    box-sizing: border-box !important;
    transition: background 0.12s var(--azure-ease), border-color 0.12s var(--azure-ease), color 0.12s var(--azure-ease) !important;
  }
  .azure-select-opt-txt {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .azure-select-opt-check {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 700;
    opacity: 0;
  }
  .azure-select-opt:hover:not(:disabled),
  .azure-select-opt.focused:not(:disabled) {
    background: rgba(59, 130, 246, 0.16) !important;
    border-color: rgba(96, 165, 250, 0.30) !important;
    color: var(--neko-text) !important;
  }
  html[data-theme="light"] .azure-select-opt:hover:not(:disabled),
  html[data-theme="light"] .azure-select-opt.focused:not(:disabled),
  body.light .azure-select-opt:hover:not(:disabled),
  body.light .azure-select-opt.focused:not(:disabled) {
    background: rgba(37, 99, 235, 0.10) !important;
    border-color: rgba(37, 99, 235, 0.24) !important;
  }
  .azure-select-opt.selected {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.92) 0%, rgba(59, 130, 246, 0.90) 60%, rgba(124, 58, 237, 0.88) 100%) !important;
    border-color: transparent !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 10px rgba(37, 99, 235, 0.30);
  }
  .azure-select-opt.selected:hover:not(:disabled),
  .azure-select-opt.selected.focused:not(:disabled) {
    filter: brightness(1.08);
    color: #ffffff !important;
  }
  .azure-select-opt.selected .azure-select-opt-check {
    opacity: 1;
  }
  .azure-select-opt:disabled {
    opacity: 0.42 !important;
    cursor: not-allowed !important;
  }

  /* ═══ 全局统一 Neko Glass 细圆角滚动条（全页面/弹窗/下拉框/代码块通用） ═══ */
  :root {
    color-scheme: dark;
  }
  html[data-theme="light"], body.light {
    color-scheme: light;
  }
  * {
    scrollbar-width: auto;
  }
  ::-webkit-scrollbar {
    width: 7px;
    height: 7px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-corner {
    background: transparent;
  }
  ::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.24);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: content-box;
    transition: background 0.16s ease;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.60);
    border: 1px solid transparent;
    background-clip: content-box;
  }
  ::-webkit-scrollbar-thumb:active {
    background: rgba(59, 130, 246, 0.85);
    border: 1px solid transparent;
    background-clip: content-box;
  }
  html[data-theme="light"] ::-webkit-scrollbar-thumb,
  body.light ::-webkit-scrollbar-thumb {
    background: rgba(100, 116, 139, 0.26);
    border: 2px solid transparent;
    background-clip: content-box;
  }
  html[data-theme="light"] ::-webkit-scrollbar-thumb:hover,
  body.light ::-webkit-scrollbar-thumb:hover {
    background: rgba(37, 99, 235, 0.52);
    border: 1px solid transparent;
    background-clip: content-box;
  }
  html[data-theme="light"] ::-webkit-scrollbar-thumb:active,
  body.light ::-webkit-scrollbar-thumb:active {
    background: rgba(37, 99, 235, 0.74);
    border: 1px solid transparent;
    background-clip: content-box;
  }

  /* ═══ 独立主题色调中心（官方预设 + 自定义 A/B 双色 + 4 个预设栏位） ═══ */
  .azure-theme-btn {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    padding: 5px 10px !important;
    font-size: 12px !important;
    line-height: 1.2 !important;
    white-space: nowrap !important;
  }
  .azure-theme-btn.floating {
    position: fixed !important;
    top: 10px !important;
    right: 12px !important;
    z-index: 99960 !important;
    backdrop-filter: blur(12px) !important;
  }
  .azure-theme-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    flex: 0 0 auto;
    background: var(--neko-grad);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.28), 0 0 8px var(--neko-accent);
  }
  .azure-theme-mask {
    position: fixed;
    inset: 0;
    z-index: 100040;
    background: rgba(6, 10, 22, 0.56);
    backdrop-filter: blur(10px) saturate(145%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: azureFadeIn 0.14s var(--azure-ease);
  }
  @keyframes azureFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .azure-theme-panel {
    width: min(500px, 100%);
    max-height: 88vh;
    overflow-y: auto;
    border-radius: 16px;
    border: 1px solid var(--neko-outer-border);
    background: var(--neko-panel-solid);
    color: var(--neko-text);
    box-shadow: var(--neko-modal-shadow);
    padding: 16px 18px 18px;
    box-sizing: border-box;
    animation: azureSelectDrop 0.16s var(--azure-ease);
  }
  .azure-theme-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
  }
  .azure-theme-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14.5px;
    font-weight: 700;
  }
  .azure-theme-sub {
    font-size: 11.5px;
    color: var(--neko-muted);
    margin-top: 2px;
  }
  .azure-theme-close {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid var(--neko-border-btn);
    background: var(--neko-sub);
    color: var(--neko-muted);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
  }
  .azure-theme-close:hover {
    background: var(--neko-sub-hover);
    color: var(--neko-text);
    border-color: var(--neko-border-hi);
  }
  .azure-theme-sec {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--neko-border);
  }
  .azure-theme-sec:first-of-type {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
  .azure-theme-sec-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: var(--neko-muted);
    margin-bottom: 9px;
  }
  .azure-theme-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }
  @media (max-width: 440px) {
    .azure-theme-grid-2 { grid-template-columns: 1fr; }
  }
  .azure-theme-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    padding: 10px 11px;
    border-radius: 12px;
    border: 1px solid var(--neko-border);
    background: var(--neko-sub);
    color: var(--neko-text);
    text-align: left;
    cursor: pointer;
    box-sizing: border-box;
    transition: border-color 0.14s ease, background 0.14s ease, transform 0.14s ease, box-shadow 0.14s ease;
  }
  .azure-theme-card:hover {
    border-color: var(--neko-border-hi);
    background: var(--neko-sub-hover);
    transform: translateY(-1px);
  }
  .azure-theme-card.active {
    border-color: var(--neko-accent);
    box-shadow: 0 0 0 1px var(--neko-accent);
    background: var(--neko-hover);
  }
  .azure-theme-card.empty {
    border-style: dashed;
    align-items: center;
    justify-content: center;
    min-height: 76px;
    color: var(--neko-muted);
    font-size: 12px;
    text-align: center;
  }
  .azure-theme-card.empty:hover {
    color: var(--neko-text);
  }
  .azure-theme-bar {
    height: 22px;
    border-radius: 7px;
    width: 100%;
    position: relative;
    overflow: hidden;
  }
  .azure-theme-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .azure-theme-card-name {
    font-size: 12.5px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .azure-theme-card-desc {
    font-size: 11px;
    color: var(--neko-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .azure-theme-pill {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 999px;
    background: var(--neko-tag-bg);
    color: var(--neko-tag-fg);
    border: 1px solid var(--neko-tag-border);
    flex: 0 0 auto;
  }
  .azure-custom-box {
    border-radius: 12px;
    border: 1px solid var(--neko-border);
    background: var(--neko-sub);
    padding: 11px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .azure-color-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 8px;
    align-items: start;
  }
  @media (max-width: 440px) {
    .azure-color-row { grid-template-columns: 1fr; }
  }
  .azure-color-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .azure-color-lbl {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--neko-text);
  }
  .azure-color-input-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .azure-color-picker {
    width: 32px !important;
    height: 30px !important;
    padding: 2px !important;
    border-radius: 8px !important;
    border: 1px solid var(--neko-border-btn) !important;
    background: transparent !important;
    cursor: pointer !important;
    flex: 0 0 auto;
  }
  .azure-color-hex {
    width: 100%;
    min-width: 0;
    height: 30px;
    padding: 0 8px !important;
    font-family: ui-monospace, Consolas, monospace !important;
    font-size: 12px !important;
    box-sizing: border-box;
  }
  .azure-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .azure-swatch {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 1.5px solid rgba(255, 255, 255, 0.28);
    padding: 0;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  .azure-swatch:hover {
    transform: scale(1.16);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.32);
  }
  .azure-swap-btn {
    align-self: center;
    margin-top: 16px;
    padding: 5px 8px !important;
    font-size: 12px !important;
  }
  .azure-preview-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 8px;
    border-top: 1px solid var(--neko-border);
  }
  .azure-slot-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }
  .azure-slot-act {
    padding: 2px 7px;
    border-radius: 6px;
    border: 1px solid var(--neko-border-btn);
    background: var(--neko-sub);
    color: var(--neko-muted);
    font-size: 10.5px;
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
  }
  .azure-slot-act:hover {
    color: var(--neko-text);
    border-color: var(--neko-border-hi);
    background: var(--neko-sub-hover);
  }
  .azure-slot-act.del:hover {
    color: #fda4af;
    border-color: rgba(244, 63, 94, 0.55);
    background: rgba(244, 63, 94, 0.16);
  }

  /* ═══ 顶栏固定按钮统一对齐（从右往左：版本号 ← 明暗 ← 主题 ← 左侧栏开关） ═══ */
  .azure-fixed-action {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 30px !important;
    min-height: 30px !important;
    box-sizing: border-box !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    vertical-align: middle !important;
  }
  #agy-upd-btn.azure-fixed-action {
    border-radius: 999px !important;
    padding: 0 10px !important;
    font-size: 11.5px !important;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace !important;
  }
</style>
<script>
(function(){
  // 1. AzureTone: HSL 氛围色派生（支持十六进制、RGB、字符串种子、图片取色）
  function hashHue(seed) {
    let h = 2166136261;
    const s = String(seed || "azure");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h) % 360;
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }
  const PRESET_HUES = {
    "standard": 176, "compact": 195, "minimal": 212,
    "creative": 288, "calm": 205, "coder": 168
  };
  const AzureTone = {
    applyHsl(h, s = 68, l = 58) {
      if (document.getElementById("azure-theme-vars")) return;
      const root = document.documentElement;
      const hue = ((Number(h) || 176) % 360 + 360) % 360;
      const sat = Math.max(36, Math.min(82, Number(s) || 68));
      const lit = Math.max(44, Math.min(68, Number(l) || 58));
      root.style.setProperty("--tone-deep", \`hsl(\${hue} \${sat}% \${lit}%)\`);
      root.style.setProperty("--tone-line", \`hsla(\${hue}, \${sat}%, \${lit}%, 0.38)\`);
      root.style.setProperty("--tone-soft", \`hsla(\${hue}, \${sat}%, \${lit}%, 0.14)\`);
      root.style.setProperty("--tone-glow", \`hsla(\${hue}, \${sat}%, \${lit}%, 0.22)\`);
      document.body.classList.add("azure-tone-active");
    },
    applySeed(seed) {
      const key = String(seed || "").trim().toLowerCase();
      for (const k of Object.keys(PRESET_HUES)) {
        if (key.includes(k)) { this.applyHsl(PRESET_HUES[k], 68, 60); return; }
      }
      this.applyHsl(hashHue(key), 64, 58);
    },
    applyFromImage(imgUrl, fallbackSeed) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const c = document.createElement("canvas");
            c.width = 16; c.height = 16;
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0, 16, 16);
            const data = ctx.getImageData(0, 0, 16, 16).data;
            let r = 0, g = 0, b = 0, n = 0;
            for (let i = 0; i < data.length; i += 4) {
              if (data[i + 3] < 80) continue;
              r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
            }
            if (n > 0) {
              const [h, s, l] = rgbToHsl(r / n, g / n, b / n);
              this.applyHsl(h, Math.max(45, s), Math.min(64, Math.max(48, l)));
              return;
            }
          } catch {}
          if (fallbackSeed) this.applySeed(fallbackSeed);
        };
        img.onerror = () => { if (fallbackSeed) this.applySeed(fallbackSeed); };
        img.src = imgUrl;
      } catch {
        if (fallbackSeed) this.applySeed(fallbackSeed);
      }
    }
  };

  // 2. AzureOverlayHost: 三档自适应浮层 (sheet / dialog / popover)
  const AzureOverlayHost = {
    open({ html = "", anchorEl = null, presentation = "auto", onClose = null } = {}) {
      this.close();
      const narrow = window.innerWidth <= 540;
      const mode = presentation === "auto"
        ? (narrow ? "sheet" : (anchorEl ? "popover" : "dialog"))
        : presentation;
      const mask = document.createElement("div");
      mask.id = "azure-overlay-mask";
      mask.className = "azure-ov-mask mode-" + mode;
      const panel = document.createElement("div");
      panel.className = "azure-ov-panel";
      panel.innerHTML = html;
      mask.appendChild(panel);
      mask.onclick = (e) => {
        if (e.target === mask) { this.close(); if (onClose) onClose(); }
      };
      document.body.appendChild(mask);
      if (mode === "popover" && anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        const top = Math.min(window.innerHeight - 120, rect.bottom + 6);
        const left = Math.max(10, Math.min(window.innerWidth - 320, rect.left));
        panel.style.top = top + "px";
        panel.style.left = left + "px";
      }
      const onKey = (e) => {
        if (e.key === "Escape") { this.close(); if (onClose) onClose(); }
      };
      mask._onKey = onKey;
      window.addEventListener("keydown", onKey);
      return panel;
    },
    close() {
      const old = document.getElementById("azure-overlay-mask");
      if (old) {
        if (old._onKey) window.removeEventListener("keydown", old._onKey);
        old.remove();
      }
    }
  };

  // 3. AzureScrollAnchor: 高度变动时若位于视口上方，自动 scrollBy(0, delta) 防跳动
  const AzureScrollAnchor = {
    attach(container, scroller) {
      if (!container || typeof ResizeObserver === "undefined") return null;
      const heights = new WeakMap();
      const targetScroller = scroller || window;
      const ro = new ResizeObserver((entries) => {
        let deltaSum = 0;
        for (const entry of entries) {
          const el = entry.target;
          const nextH = entry.contentRect.height;
          const prevH = heights.get(el);
          heights.set(el, nextH);
          if (prevH === undefined || Math.abs(nextH - prevH) < 0.5) continue;
          const rect = el.getBoundingClientRect();
          const topBound = scroller ? scroller.getBoundingClientRect().top : 0;
          if (rect.bottom < topBound + 4) {
            deltaSum += (nextH - prevH);
          }
        }
        if (Math.abs(deltaSum) >= 1) {
          if (targetScroller === window) window.scrollBy(0, deltaSum);
          else targetScroller.scrollTop += deltaSum;
        }
      });
      const observeChildren = () => {
        for (const child of container.children) {
          if (!heights.has(child)) {
            heights.set(child, child.getBoundingClientRect().height);
            ro.observe(child);
          }
        }
      };
      const mo = new MutationObserver(observeChildren);
      mo.observe(container, { childList: true });
      observeChildren();
      return {
        disconnect() { ro.disconnect(); mo.disconnect(); }
      };
    }
  };

  // 4. AzureTabStore: 多标签工作台状态机（pinned 置顶段 + opener 相邻插入 + 10 条关闭栈恢复）
  function createAzureTabStore(storageKey) {
    let state = { tabs: [], activeId: null, closed: [] };
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (saved && Array.isArray(saved.tabs)) state = saved;
    } catch {}
    function persist() {
      try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
    }
    return {
      getState() { return state; },
      open(tab, openerId) {
        if (!tab || !tab.id) return;
        const exist = state.tabs.find((t) => t.id === tab.id);
        if (exist) {
          exist.title = tab.title || exist.title;
          state.activeId = exist.id;
          persist();
          return;
        }
        const item = { id: String(tab.id), title: String(tab.title || tab.id), pinned: false, opener: openerId || null };
        const openerIdx = openerId ? state.tabs.findIndex((t) => t.id === openerId) : -1;
        if (openerIdx >= 0 && !state.tabs[openerIdx].pinned) {
          state.tabs.splice(openerIdx + 1, 0, item);
        } else {
          state.tabs.push(item);
        }
        if (state.tabs.length > 16) {
          const dropIdx = state.tabs.findIndex((t) => !t.pinned && t.id !== item.id);
          if (dropIdx >= 0) state.tabs.splice(dropIdx, 1);
        }
        state.activeId = item.id;
        persist();
      },
      togglePin(id) {
        const idx = state.tabs.findIndex((t) => t.id === id);
        if (idx < 0) return;
        const [item] = state.tabs.splice(idx, 1);
        item.pinned = !item.pinned;
        const pinnedCount = state.tabs.filter((t) => t.pinned).length;
        state.tabs.splice(item.pinned ? pinnedCount : pinnedCount, 0, item);
        persist();
      },
      close(id) {
        const idx = state.tabs.findIndex((t) => t.id === id);
        if (idx < 0) return null;
        const [removed] = state.tabs.splice(idx, 1);
        state.closed.unshift({ id: removed.id, title: removed.title });
        if (state.closed.length > 10) state.closed.length = 10;
        if (state.activeId === id) {
          const fallback = state.tabs[idx] || state.tabs[idx - 1] || null;
          state.activeId = fallback ? fallback.id : null;
        }
        persist();
        return state.activeId;
      },
      reopenLast() {
        const last = state.closed.shift();
        if (!last) return null;
        this.open(last);
        return last;
      }
    };
  }

  // 5. AzureSelect: 自动接管原生 <select> 为 Neko Glass 统一风格下拉浮层
  const AzureSelect = (() => {
    const CARET_SVG = '<svg class="azure-select-caret" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    let activeMenu = null;
    let activeSelect = null;
    let activeTrigger = null;
    let focusedIdx = -1;
    let patchedProto = false;

    function patchSelectPrototype() {
      if (patchedProto || typeof HTMLSelectElement === "undefined") return;
      patchedProto = true;
      for (const prop of ["value", "selectedIndex"]) {
        const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, prop);
        if (!desc || !desc.set || !desc.get) continue;
        Object.defineProperty(HTMLSelectElement.prototype, prop, {
          configurable: true,
          enumerable: desc.enumerable,
          get() { return desc.get.call(this); },
          set(v) {
            desc.set.call(this, v);
            if (typeof this.__azureSync === "function") this.__azureSync();
          }
        });
      }
    }

    function closeMenu(returnFocus) {
      if (activeMenu) {
        activeMenu.remove();
        activeMenu = null;
      }
      if (activeTrigger) {
        activeTrigger.classList.remove("open");
        activeTrigger.setAttribute("aria-expanded", "false");
        if (returnFocus) {
          try { activeTrigger.focus(); } catch {}
        }
      }
      activeSelect = null;
      activeTrigger = null;
      focusedIdx = -1;
    }

    function syncTrigger(sel, trig) {
      if (!sel || !trig) return;
      const opt = sel.options[sel.selectedIndex] || sel.options[0];
      const txt = opt ? (opt.textContent || "").trim() : "";
      const lbl = trig.querySelector(".azure-select-label");
      if (lbl) {
        lbl.textContent = txt || "请选择";
        lbl.classList.toggle("placeholder", !opt || opt.value === "");
      }
      trig.title = txt;
      trig.disabled = !!sel.disabled;
      const hiddenByBiz = sel.hidden || sel.style.display === "none";
      trig.style.display = hiddenByBiz ? "none" : "";
    }

    function getEnabledButtons(menu) {
      return Array.from(menu.querySelectorAll(".azure-select-opt:not(:disabled)"));
    }

    function setFocused(menu, idx) {
      const btns = getEnabledButtons(menu);
      btns.forEach((b) => b.classList.remove("focused"));
      if (!btns.length) { focusedIdx = -1; return; }
      focusedIdx = ((idx % btns.length) + btns.length) % btns.length;
      const cur = btns[focusedIdx];
      cur.classList.add("focused");
      try { cur.scrollIntoView({ block: "nearest" }); } catch {}
    }

    function openMenu(sel, trig) {
      if (sel.disabled) return;
      if (activeSelect === sel && activeMenu) {
        closeMenu(false);
        return;
      }
      closeMenu(false);

      const menu = document.createElement("div");
      menu.className = "azure-select-menu";
      menu.setAttribute("role", "listbox");

      const appendOption = (opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "azure-select-opt";
        btn.setAttribute("role", "option");
        const isSel = opt.index === sel.selectedIndex;
        if (isSel) btn.classList.add("selected");
        btn.setAttribute("aria-selected", isSel ? "true" : "false");
        btn.disabled = !!opt.disabled || (opt.parentElement && opt.parentElement.tagName === "OPTGROUP" && opt.parentElement.disabled);
        const text = (opt.textContent || "").trim();
        btn.title = text;
        const spanTxt = document.createElement("span");
        spanTxt.className = "azure-select-opt-txt";
        spanTxt.textContent = text;
        const spanChk = document.createElement("span");
        spanChk.className = "azure-select-opt-check";
        spanChk.textContent = "✓";
        btn.appendChild(spanTxt);
        btn.appendChild(spanChk);
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (btn.disabled) return;
          const prevVal = sel.value;
          const prevIdx = sel.selectedIndex;
          sel.selectedIndex = opt.index;
          syncTrigger(sel, trig);
          closeMenu(true);
          if (sel.value !== prevVal || sel.selectedIndex !== prevIdx) {
            sel.dispatchEvent(new Event("input", { bubbles: true }));
            sel.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
        menu.appendChild(btn);
      };

      for (const child of Array.from(sel.children)) {
        if (child.tagName === "OPTGROUP") {
          if (child.label) {
            const grp = document.createElement("div");
            grp.className = "azure-select-group";
            grp.textContent = child.label;
            menu.appendChild(grp);
          }
          for (const opt of Array.from(child.children)) {
            if (opt.tagName === "OPTION") appendOption(opt);
          }
        } else if (child.tagName === "OPTION") {
          appendOption(child);
        }
      }

      document.body.appendChild(menu);

      // 计算定位与上下智能展开
      const rect = trig.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = 8;
      const spaceBelow = vh - rect.bottom - pad;
      const spaceAbove = rect.top - pad;
      const minW = Math.max(rect.width, 160);
      const maxW = Math.max(minW, Math.min(vw - pad * 2, Math.max(rect.width, 340)));
      menu.style.minWidth = minW + "px";
      menu.style.maxWidth = maxW + "px";
      menu.style.width = rect.width >= 200 ? rect.width + "px" : "auto";

      const dropUp = spaceBelow < 210 && spaceAbove > spaceBelow;
      const availH = Math.max(120, Math.min(320, (dropUp ? spaceAbove : spaceBelow) - 6));
      menu.style.maxHeight = availH + "px";

      const mRect = menu.getBoundingClientRect();
      let left = rect.left;
      if (left + mRect.width > vw - pad) {
        left = Math.max(pad, vw - pad - mRect.width);
      }
      menu.style.left = left + "px";
      if (dropUp) {
        menu.classList.add("drop-up");
        menu.style.top = Math.max(pad, rect.top - mRect.height - 4) + "px";
      } else {
        menu.style.top = (rect.bottom + 4) + "px";
      }

      activeMenu = menu;
      activeSelect = sel;
      activeTrigger = trig;
      trig.classList.add("open");
      trig.setAttribute("aria-expanded", "true");

      const selBtn = menu.querySelector(".azure-select-opt.selected");
      if (selBtn) {
        const btns = getEnabledButtons(menu);
        focusedIdx = btns.indexOf(selBtn);
        try { selBtn.scrollIntoView({ block: "nearest" }); } catch {}
      }
    }

    function enhanceOne(sel) {
      if (!sel || sel.tagName !== "SELECT") return;
      if (sel.dataset.azureSelectReady === "1") return;
      if (sel.multiple || (sel.size && sel.size > 1) || sel.hasAttribute("data-native-select")) return;
      sel.dataset.azureSelectReady = "1";

      // 隐藏前采样原 select 的布局风格
      const cs = window.getComputedStyle(sel);
      const trig = document.createElement("button");
      trig.type = "button";
      trig.className = "azure-select-trigger";
      trig.setAttribute("aria-haspopup", "listbox");
      trig.setAttribute("aria-expanded", "false");
      trig.innerHTML = '<span class="azure-select-label"></span>' + CARET_SVG;

      // 继承常用尺寸/弹性布局属性，确保表单和工具栏排版不变形（兼容初始隐藏 Tab/弹窗）
      if (sel.style.width) trig.style.width = sel.style.width;
      else if (cs.width === "100%" || cs.display === "block" || (sel.parentElement && sel.offsetWidth > 0 && sel.parentElement.clientWidth > 0 && sel.offsetWidth >= sel.parentElement.clientWidth - 28)) {
        trig.style.width = "100%";
      }
      if (sel.style.minWidth) trig.style.minWidth = sel.style.minWidth;
      else if (cs.minWidth && cs.minWidth !== "0px" && cs.minWidth !== "auto") trig.style.minWidth = cs.minWidth;
      if (sel.style.maxWidth) trig.style.maxWidth = sel.style.maxWidth;
      else if (cs.maxWidth && cs.maxWidth !== "none") trig.style.maxWidth = cs.maxWidth;
      if (sel.style.flex) trig.style.flex = sel.style.flex;
      else if (cs.flexGrow && cs.flexGrow !== "0") {
        trig.style.flex = cs.flexGrow + " " + cs.flexShrink + " " + cs.flexBasis;
      }
      if (cs.fontSize) trig.style.fontSize = cs.fontSize;

      sel.classList.add("azure-select-native");
      sel.insertAdjacentElement("afterend", trig);

      const sync = () => syncTrigger(sel, trig);
      sel.__azureSync = sync;
      sel.__azureTrigger = trig;
      sync();

      trig.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(sel, trig);
      });
      trig.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (activeSelect !== sel) {
            openMenu(sel, trig);
          } else if (activeMenu) {
            if (e.key === "ArrowDown") setFocused(activeMenu, focusedIdx + 1);
            else if (e.key === "ArrowUp") setFocused(activeMenu, focusedIdx - 1);
            else if (e.key === "Enter") {
              const btns = getEnabledButtons(activeMenu);
              if (btns[focusedIdx]) btns[focusedIdx].click();
            }
          }
        } else if (e.key === "Escape" && activeSelect === sel) {
          e.preventDefault();
          closeMenu(true);
        }
      });

      sel.addEventListener("change", sync);
      const mo = new MutationObserver(sync);
      mo.observe(sel, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled", "hidden", "style", "class"] });
    }

    function scan(root) {
      const target = root && root.querySelectorAll ? root : document;
      if (target.tagName === "SELECT") enhanceOne(target);
      if (target.querySelectorAll) {
        target.querySelectorAll("select").forEach(enhanceOne);
      }
    }

    function init() {
      patchSelectPrototype();
      scan(document);
      document.addEventListener("mousedown", (e) => {
        if (!activeMenu) return;
        if (activeMenu.contains(e.target) || (activeTrigger && activeTrigger.contains(e.target))) return;
        closeMenu(false);
      }, true);
      document.addEventListener("keydown", (e) => {
        if (!activeMenu) return;
        if (e.key === "Escape") {
          e.preventDefault();
          closeMenu(true);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocused(activeMenu, focusedIdx + 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocused(activeMenu, focusedIdx - 1);
        } else if (e.key === "Enter") {
          const btns = getEnabledButtons(activeMenu);
          if (btns[focusedIdx]) {
            e.preventDefault();
            btns[focusedIdx].click();
          }
        }
      });
      window.addEventListener("resize", () => closeMenu(false));
      window.addEventListener("scroll", (e) => {
        if (!activeMenu) return;
        if (e.target && activeMenu.contains(e.target)) return;
        closeMenu(false);
      }, true);

      if (typeof MutationObserver !== "undefined" && document.body) {
        const docMo = new MutationObserver((mutations) => {
          for (const m of mutations) {
            for (const node of m.addedNodes) {
              if (node && node.nodeType === 1) scan(node);
            }
            for (const node of m.removedNodes) {
              if (node && node.nodeType === 1 && node.tagName === "SELECT" && node.__azureTrigger) {
                node.__azureTrigger.remove();
              }
            }
          }
        });
        docMo.observe(document.body, { childList: true, subtree: true });
      }
    }

    return { init, scan, enhanceOne, close: () => closeMenu(false) };
  })();

  // 6. AzureThemeStudio: 跨插件统一主题色调中心（2 个官方预设 + A/B 自定义双色 + 4 个自定义栏位）
  const AzureThemeStudio = (() => {
    const CACHE_KEY = "azure_theme_cache_v1";
    const SWATCHES = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#ec4899", "#f59e0b", "#f43f5e", "#6366f1"];
    const OFFICIAL = [
      { id: "official-azure", name: "苍蓝星辉", desc: "默认官方 · 苍蓝主体 + 柔紫尾韵", primary: "#3b82f6", secondary: "#7c3aed", badge: "默认" },
      { id: "official-violet", name: "星雾黑紫", desc: "官方经典 · 星紫主体 + 苍蓝尾韵", primary: "#8b5cf6", secondary: "#3b82f6", badge: "官方" }
    ];
    let config = {
      version: 1,
      activeId: "official-azure",
      customDraft: { primary: "#3b82f6", secondary: "#7c3aed" },
      slots: [null, null, null, null]
    };
    let modalMask = null;
    let triggerBtn = null;

    function hexToRgb(hex) {
      const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
      if (!m) return [59, 130, 246];
      const n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function rgbToHex(r, g, b) {
      const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
      return "#" + [clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
    }
    function mixHex(h1, h2, w2) {
      const a = hexToRgb(h1), b = hexToRgb(h2);
      const w1 = 1 - w2;
      return rgbToHex(a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2);
    }
    function rgba(hex, alpha) {
      const c = hexToRgb(hex);
      return "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + alpha + ")";
    }
    function normalizeHex(val, fallback) {
      const s = String(val || "").trim();
      if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
      if (/^[0-9a-fA-F]{6}$/.test(s)) return ("#" + s).toLowerCase();
      return fallback;
    }

    function resolveActiveColors(cfg) {
      const id = (cfg && cfg.activeId) || "official-azure";
      const off = OFFICIAL.find((p) => p.id === id);
      if (off) return { primary: off.primary, secondary: off.secondary, id: off.id, name: off.name };
      const sm = /^slot-([0-3])$/.exec(id);
      if (sm && cfg && Array.isArray(cfg.slots) && cfg.slots[Number(sm[1])]) {
        const sl = cfg.slots[Number(sm[1])];
        return { primary: sl.primary, secondary: sl.secondary, id: sl.id, name: sl.name };
      }
      const d = (cfg && cfg.customDraft) || { primary: "#3b82f6", secondary: "#7c3aed" };
      return { primary: normalizeHex(d.primary, "#3b82f6"), secondary: normalizeHex(d.secondary, "#7c3aed"), id: "custom", name: "自定义" };
    }

    function applyPalette(primaryHex, secondaryHex) {
      const p = normalizeHex(primaryHex, "#3b82f6");
      const s = normalizeHex(secondaryHex, "#7c3aed");
      const pDark = mixHex(p, "#0f172a", 0.18);
      const pLight = mixHex(p, "#ffffff", 0.68);
      const pBorderLight = mixHex(p, "#ffffff", 0.32);
      const pDeepLight = mixHex(p, "#0f172a", 0.28);
      const darkBg = mixHex("#101420", p, 0.06);
      const darkPanel = mixHex("#141928", p, 0.07);
      const darkPanelSolid = mixHex("#161c2c", p, 0.08);
      const lightBg = mixHex("#f6f7fb", p, 0.04);
      const lightCardHover = mixHex("#ffffff", p, 0.05);
      const grad = "linear-gradient(135deg, " + pDark + " 0%, " + p + " 58%, " + s + " 100%)";
      const switchGrad = "linear-gradient(135deg, " + pDark + " 0%, " + p + " 68%, " + s + " 100%)";
      const selGrad = "linear-gradient(135deg, " + rgba(pDark, 0.92) + " 0%, " + rgba(p, 0.90) + " 60%, " + rgba(s, 0.88) + " 100%)";

      const rootStyle = document.documentElement && document.documentElement.style;
      if (rootStyle) {
        rootStyle.removeProperty("--tone-deep");
        rootStyle.removeProperty("--tone-line");
        rootStyle.removeProperty("--tone-soft");
        rootStyle.removeProperty("--tone-glow");
      }

      const mountTarget = document.body || document.head;
      let styleEl = document.getElementById("azure-theme-vars");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "azure-theme-vars";
      }
      if (mountTarget && (styleEl.parentNode !== mountTarget || mountTarget.lastElementChild !== styleEl)) {
        mountTarget.appendChild(styleEl);
      }
      styleEl.textContent =
        ":root {" +
          "--neko-bg:" + darkBg + ";" +
          "--neko-panel:" + rgba(darkPanel, 0.90) + ";" +
          "--neko-panel-solid:" + darkPanelSolid + ";" +
          "--neko-sub-hover:" + rgba(p, 0.16) + ";" +
          "--neko-hover:" + rgba(p, 0.14) + ";" +
          "--neko-outer-border:" + rgba(pBorderLight, 0.36) + ";" +
          "--neko-border:" + rgba(pBorderLight, 0.22) + ";" +
          "--neko-border-hi:" + rgba(p, 0.68) + ";" +
          "--neko-accent:" + p + ";" +
          "--neko-accent-2:" + s + ";" +
          "--neko-grad:" + grad + ";" +
          "--neko-tag-bg:" + rgba(p, 0.18) + ";" +
          "--neko-tag-border:" + rgba(pBorderLight, 0.38) + ";" +
          "--neko-tag-fg:" + pLight + ";" +
          "--neko-switch-on:" + switchGrad + ";" +
          "--bg:" + darkBg + ";" +
          "--bg-card:" + rgba(darkPanel, 0.92) + ";" +
          "--bg-hover:" + rgba(p, 0.13) + ";" +
          "--card:" + rgba(darkPanel, 0.92) + ";" +
          "--panel:" + rgba(darkPanel, 0.92) + ";" +
          "--panel-hover:" + rgba(p, 0.14) + ";" +
          "--glass:" + rgba(darkBg, 0.84) + ";" +
          "--border:" + rgba(pBorderLight, 0.22) + ";" +
          "--border-active:" + p + ";" +
          "--border-hi:" + rgba(p, 0.62) + ";" +
          "--accent:" + p + ";" +
          "--accent-2:" + s + ";" +
          "--accent-soft:" + rgba(p, 0.16) + ";" +
          "--accent-border:" + rgba(p, 0.42) + ";" +
          "--badge-bg:" + rgba(p, 0.18) + ";" +
          "--badge-active-bg:" + rgba(p, 0.30) + ";" +
          "--pill-bg:" + rgba(p, 0.16) + ";" +
          "--tone-deep:" + rgba(p, 0.92) + ";" +
          "--tone-line:" + rgba(pBorderLight, 0.38) + ";" +
          "--tone-soft:" + rgba(p, 0.16) + ";" +
          "--tone-glow:" + rgba(pDark, 0.18) + ";" +
        "}" +
        'html[data-theme="light"], [data-theme="light"] {' +
          "--neko-bg:" + lightBg + ";" +
          "--neko-sub-hover:" + rgba(p, 0.10) + ";" +
          "--neko-hover:" + rgba(p, 0.09) + ";" +
          "--neko-outer-border:" + rgba(p, 0.28) + ";" +
          "--neko-border:" + rgba(p, 0.20) + ";" +
          "--neko-border-hi:" + rgba(pDark, 0.56) + ";" +
          "--neko-accent:" + pDark + ";" +
          "--neko-accent-2:" + s + ";" +
          "--neko-grad:" + grad + ";" +
          "--neko-tag-bg:" + rgba(p, 0.12) + ";" +
          "--neko-tag-border:" + rgba(p, 0.30) + ";" +
          "--neko-tag-fg:" + pDeepLight + ";" +
          "--neko-switch-on:" + switchGrad + ";" +
          "--bg:" + lightBg + ";" +
          "--card-hover:" + lightCardHover + ";" +
          "--border:" + rgba(p, 0.20) + ";" +
          "--border-active:" + pDark + ";" +
          "--border-hi:" + rgba(pDark, 0.50) + ";" +
          "--accent:" + pDark + ";" +
          "--accent-2:" + s + ";" +
          "--accent-soft:" + rgba(p, 0.11) + ";" +
          "--accent-border:" + rgba(p, 0.34) + ";" +
          "--tone-deep:" + rgba(pDark, 0.92) + ";" +
          "--tone-line:" + rgba(pDark, 0.32) + ";" +
          "--tone-soft:" + rgba(pDark, 0.11) + ";" +
          "--tone-glow:" + rgba(pDark, 0.12) + ";" +
        "}" +
        "body { background-image: radial-gradient(780px 400px at 86% -12%, " + rgba(p, 0.16) + ", transparent 62%), radial-gradient(620px 340px at 8% -10%, " + rgba(s, 0.09) + ", transparent 60%) !important; }" +
        ".preset-card.active, .card.active, .card-item.selected, .preset-btn.active { box-shadow: 0 0 0 1px " + rgba(p, 0.38) + ", var(--neko-shadow) !important; }" +
        "button:not(.primary):not(.btn-primary):not(.ai-btn):not(.danger):not(.btn-danger):not(.tab):not(.link-btn):not(.seg-btn):not(.pill-filter):not(.org-mode-tab):not(.btn-active):not(.on-pin):not(.on-fav):not(.on-rev):not(.azure-tab-pill):not(.azure-tab-reopen):not(.inline-edit-btn):not(.preset-btn):not(.azure-select-trigger):not(.azure-select-opt):not(.azure-theme-card):not(.azure-swatch):not(.azure-slot-act):not(.azure-theme-close):hover, .btn:not(.primary):not(.btn-primary):not(.danger):not(.btn-danger):not(.btn-active):hover { box-shadow: 0 4px 12px " + rgba(p, 0.20) + "; }" +
        "button.primary, .btn.primary, .btn-primary, button.btn-primary, .ai-btn { box-shadow: 0 3px 12px " + rgba(pDark, 0.32) + "; }" +
        "button.primary:hover, .btn.primary:hover, .btn-primary:hover, .ai-btn:hover { box-shadow: 0 6px 20px " + rgba(p, 0.44) + "; }" +
        "input:focus, select:focus, textarea:focus, .azure-select-trigger.open, .azure-select-trigger:focus-visible { box-shadow: 0 0 0 2px " + rgba(p, 0.28) + " !important; }" +
        'input[type="range"] { accent-color: ' + p + '; }' +
        'input[type="checkbox"]:not([data-chk]):not(.run-batch-chk):not(#chk-select-all-runs):checked { box-shadow: 0 0 10px ' + rgba(p, 0.40) + ' !important; }' +
        'input[type="checkbox"]:not([data-chk]):not(.run-batch-chk):not(#chk-select-all-runs):hover { box-shadow: 0 0 0 3px ' + rgba(p, 0.20) + ' !important; }' +
        ".switch:hover .slider, .toggle:hover .slider { box-shadow: 0 0 0 3px " + rgba(p, 0.20) + "; }" +
        ".switch input:checked + .slider, .toggle input:checked + .slider { box-shadow: 0 0 10px " + rgba(p, 0.38) + "; }" +
        ".azure-select-menu { border-color: " + rgba(pBorderLight, 0.34) + "; background: " + rgba(darkPanelSolid, 0.96) + "; box-shadow: 0 16px 40px rgba(4, 8, 22, 0.64), 0 0 0 1px " + rgba(p, 0.14) + "; }" +
        'html[data-theme="light"] .azure-select-menu, body.light .azure-select-menu { border-color: ' + rgba(pDark, 0.24) + "; box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14), 0 0 0 1px " + rgba(pDark, 0.08) + "; }" +
        ".azure-select-opt:hover:not(:disabled), .azure-select-opt.focused:not(:disabled) { background: " + rgba(p, 0.16) + " !important; border-color: " + rgba(pBorderLight, 0.30) + " !important; }" +
        'html[data-theme="light"] .azure-select-opt:hover:not(:disabled), html[data-theme="light"] .azure-select-opt.focused:not(:disabled), body.light .azure-select-opt:hover:not(:disabled), body.light .azure-select-opt.focused:not(:disabled) { background: ' + rgba(pDark, 0.10) + " !important; border-color: " + rgba(pDark, 0.24) + " !important; }" +
        ".azure-select-opt.selected { background: " + selGrad + " !important; box-shadow: 0 2px 10px " + rgba(pDark, 0.30) + "; }" +
        "::-webkit-scrollbar-thumb:hover { background: " + rgba(p, 0.60) + "; }" +
        "::-webkit-scrollbar-thumb:active { background: " + rgba(p, 0.85) + "; }" +
        'html[data-theme="light"] ::-webkit-scrollbar-thumb:hover, body.light ::-webkit-scrollbar-thumb:hover { background: ' + rgba(pDark, 0.52) + "; }" +
        'html[data-theme="light"] ::-webkit-scrollbar-thumb:active, body.light ::-webkit-scrollbar-thumb:active { background: ' + rgba(pDark, 0.74) + "; }";
    }

    function applyCurrent() {
      const cur = resolveActiveColors(config);
      applyPalette(cur.primary, cur.secondary);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(config)); } catch {}
    }

    function authHeaders(extra) {
      const h = Object.assign({}, extra || {});
      try {
        const tok = new URLSearchParams(window.location.search).get("token");
        if (tok) h["X-Codeium-Sidecar-Token"] = tok;
      } catch {}
      return h;
    }

    async function persistConfig(nextCfg) {
      config = nextCfg;
      applyCurrent();
      try {
        const res = await fetch("/api/azure-theme", {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ config })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.config) {
            config = data.config;
            applyCurrent();
          }
        }
      } catch {}
    }

    async function syncFromServer() {
      try {
        const res = await fetch("/api/azure-theme", { cache: "no-store", headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.config) {
          config = data.config;
          applyCurrent();
          if (modalMask) renderModalBody();
        }
      } catch {}
    }

    function closeModal() {
      if (modalMask) {
        modalMask.remove();
        modalMask = null;
      }
      applyCurrent();
    }

    function renderModalBody() {
      if (!modalMask) return;
      const panel = modalMask.querySelector(".azure-theme-panel");
      if (!panel) return;
      const draftP = normalizeHex(config.customDraft && config.customDraft.primary, "#3b82f6");
      const draftS = normalizeHex(config.customDraft && config.customDraft.secondary, "#7c3aed");
      const cur = resolveActiveColors(config);

      const officialHtml = OFFICIAL.map((p) => {
        const isAct = config.activeId === p.id;
        const grad = "linear-gradient(135deg, " + mixHex(p.primary, "#0f172a", 0.18) + " 0%, " + p.primary + " 58%, " + p.secondary + " 100%)";
        return '<button type="button" class="azure-theme-card' + (isAct ? " active" : "") + '" data-official="' + p.id + '">' +
          '<div class="azure-theme-bar" style="background:' + grad + '"></div>' +
          '<div class="azure-theme-card-top"><span class="azure-theme-card-name">' + p.name + '</span><span class="azure-theme-pill">' + (isAct ? "✓ 当前" : p.badge) + '</span></div>' +
          '<div class="azure-theme-card-desc">' + p.desc + '</div>' +
        '</button>';
      }).join("");

      const makeSwatches = (role) => SWATCHES.map((hex) =>
        '<button type="button" class="azure-swatch" data-swatch-role="' + role + '" data-swatch-hex="' + hex + '" style="background:' + hex + '" title="' + hex + '"></button>'
      ).join("");

      const slots = Array.isArray(config.slots) ? config.slots : [null, null, null, null];
      const slotsHtml = [0, 1, 2, 3].map((idx) => {
        const sl = slots[idx];
        if (!sl) {
          return '<button type="button" class="azure-theme-card empty" data-save-slot="' + idx + '">' +
            '<span>＋ 保存当前搭配到栏位 ' + (idx + 1) + '</span>' +
          '</button>';
        }
        const isAct = config.activeId === ("slot-" + idx);
        const grad = "linear-gradient(135deg, " + mixHex(sl.primary, "#0f172a", 0.18) + " 0%, " + sl.primary + " 58%, " + sl.secondary + " 100%)";
        const escT = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
        return '<div class="azure-theme-card' + (isAct ? " active" : "") + '" data-use-slot="' + idx + '">' +
          '<div class="azure-theme-bar" style="background:' + grad + '"></div>' +
          '<div class="azure-theme-card-top"><span class="azure-theme-card-name">' + escT(sl.name) + '</span>' +
            (isAct ? '<span class="azure-theme-pill">✓ 当前</span>' : '') +
          '</div>' +
          '<div class="azure-theme-card-desc">' + escT(sl.primary) + ' → ' + escT(sl.secondary) + '</div>' +
          '<div class="azure-slot-actions">' +
            '<button type="button" class="azure-slot-act" data-overwrite-slot="' + idx + '">覆盖</button>' +
            '<button type="button" class="azure-slot-act del" data-clear-slot="' + idx + '">清空</button>' +
          '</div>' +
        '</div>';
      }).join("");

      const escCurName = String(cur.name || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
      panel.innerHTML =
        '<div class="azure-theme-head">' +
          '<div><div class="azure-theme-title"><span class="azure-theme-dot"></span><span>主题色调中心</span></div>' +
          '<div class="azure-theme-sub">当前生效：' + escCurName + ' · 全 8 个苍蓝插件实时共享</div></div>' +
          '<button type="button" class="azure-theme-close" id="az-theme-close" title="关闭">×</button>' +
        '</div>' +
        '<div class="azure-theme-sec">' +
          '<div class="azure-theme-sec-hd"><span>官方预设主题</span><span>2 套内置</span></div>' +
          '<div class="azure-theme-grid-2">' + officialHtml + '</div>' +
        '</div>' +
        '<div class="azure-theme-sec">' +
          '<div class="azure-theme-sec-hd"><span>自定义双色搭配</span><span>A 主体（60%）→ B 辅助（40%）</span></div>' +
          '<div class="azure-custom-box">' +
            '<div class="azure-color-row">' +
              '<div class="azure-color-col">' +
                '<span class="azure-color-lbl">A 主体色</span>' +
                '<div class="azure-color-input-wrap">' +
                  '<input type="color" class="azure-color-picker" id="az-pick-p" value="' + draftP + '" />' +
                  '<input type="text" class="azure-color-hex" id="az-hex-p" value="' + draftP + '" maxlength="7" />' +
                '</div>' +
                '<div class="azure-swatches">' + makeSwatches("primary") + '</div>' +
              '</div>' +
              '<button type="button" class="azure-swap-btn" id="az-swap-ab" title="对调 A 与 B 的主辅占比">⇄</button>' +
              '<div class="azure-color-col">' +
                '<span class="azure-color-lbl">B 辅助色</span>' +
                '<div class="azure-color-input-wrap">' +
                  '<input type="color" class="azure-color-picker" id="az-pick-s" value="' + draftS + '" />' +
                  '<input type="text" class="azure-color-hex" id="az-hex-s" value="' + draftS + '" maxlength="7" />' +
                '</div>' +
                '<div class="azure-swatches">' + makeSwatches("secondary") + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="azure-preview-strip">' +
              '<div style="display:flex;align-items:center;gap:8px;flex:1;min-width:160px;">' +
                '<input type="text" id="az-slot-name" placeholder="自定义预设名称（选填）" maxlength="18" style="flex:1;height:30px;padding:0 9px;font-size:12px;" />' +
              '</div>' +
              '<button type="button" class="primary" id="az-apply-custom" style="padding:6px 12px;font-size:12px;">应用当前自定义</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="azure-theme-sec">' +
          '<div class="azure-theme-sec-hd"><span>自定义预设栏位</span><span>4 个可存槽位</span></div>' +
          '<div class="azure-theme-grid-2">' + slotsHtml + '</div>' +
        '</div>';

      const pickP = panel.querySelector("#az-pick-p");
      const pickS = panel.querySelector("#az-pick-s");
      const hexP = panel.querySelector("#az-hex-p");
      const hexS = panel.querySelector("#az-hex-s");
      const nameInp = panel.querySelector("#az-slot-name");

      const updateDraftPreview = (p, s) => {
        const np = normalizeHex(p, draftP);
        const ns = normalizeHex(s, draftS);
        config.customDraft = { primary: np, secondary: ns };
        pickP.value = np;
        hexP.value = np;
        pickS.value = ns;
        hexS.value = ns;
        applyPalette(np, ns);
      };

      panel.querySelector("#az-theme-close").addEventListener("click", closeModal);
      pickP.addEventListener("input", () => updateDraftPreview(pickP.value, pickS.value));
      pickS.addEventListener("input", () => updateDraftPreview(pickP.value, pickS.value));
      hexP.addEventListener("change", () => updateDraftPreview(hexP.value, pickS.value));
      hexS.addEventListener("change", () => updateDraftPreview(pickP.value, hexS.value));

      panel.querySelectorAll("[data-swatch-role]").forEach((sw) => {
        sw.addEventListener("click", () => {
          const role = sw.getAttribute("data-swatch-role");
          const hex = sw.getAttribute("data-swatch-hex");
          if (role === "primary") updateDraftPreview(hex, pickS.value);
          else updateDraftPreview(pickP.value, hex);
        });
      });

      panel.querySelector("#az-swap-ab").addEventListener("click", () => {
        updateDraftPreview(pickS.value, pickP.value);
      });

      panel.querySelector("#az-apply-custom").addEventListener("click", async () => {
        const next = { ...config, activeId: "custom", customDraft: { primary: pickP.value, secondary: pickS.value } };
        await persistConfig(next);
        renderModalBody();
      });

      panel.querySelectorAll("[data-official]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const oid = btn.getAttribute("data-official");
          const off = OFFICIAL.find((x) => x.id === oid);
          const next = {
            ...config,
            activeId: oid,
            customDraft: off ? { primary: off.primary, secondary: off.secondary } : config.customDraft
          };
          await persistConfig(next);
          renderModalBody();
        });
      });

      panel.querySelectorAll("[data-save-slot]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const idx = Number(btn.getAttribute("data-save-slot"));
          const nextSlots = Array.from({ length: 4 }, (_, i) => (config.slots && config.slots[i]) || null);
          const customName = (nameInp.value || "").trim() || ("自定义 " + (idx + 1));
          nextSlots[idx] = { id: "slot-" + idx, name: customName, primary: pickP.value, secondary: pickS.value };
          await persistConfig({ ...config, activeId: "slot-" + idx, customDraft: { primary: pickP.value, secondary: pickS.value }, slots: nextSlots });
          renderModalBody();
        });
      });

      panel.querySelectorAll("[data-use-slot]").forEach((card) => {
        card.addEventListener("click", async (e) => {
          if (e.target && e.target.closest(".azure-slot-act")) return;
          const idx = Number(card.getAttribute("data-use-slot"));
          const sl = config.slots && config.slots[idx];
          if (!sl) return;
          await persistConfig({ ...config, activeId: "slot-" + idx, customDraft: { primary: sl.primary, secondary: sl.secondary } });
          renderModalBody();
        });
      });

      panel.querySelectorAll("[data-overwrite-slot]").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const idx = Number(btn.getAttribute("data-overwrite-slot"));
          const nextSlots = Array.from({ length: 4 }, (_, i) => (config.slots && config.slots[i]) || null);
          const prev = nextSlots[idx];
          const customName = (nameInp.value || "").trim() || (prev && prev.name) || ("自定义 " + (idx + 1));
          nextSlots[idx] = { id: "slot-" + idx, name: customName, primary: pickP.value, secondary: pickS.value };
          await persistConfig({ ...config, activeId: "slot-" + idx, customDraft: { primary: pickP.value, secondary: pickS.value }, slots: nextSlots });
          renderModalBody();
        });
      });

      panel.querySelectorAll("[data-clear-slot]").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const idx = Number(btn.getAttribute("data-clear-slot"));
          const nextSlots = Array.from({ length: 4 }, (_, i) => (config.slots && config.slots[i]) || null);
          nextSlots[idx] = null;
          const nextActive = config.activeId === ("slot-" + idx) ? "official-azure" : config.activeId;
          await persistConfig({ ...config, activeId: nextActive, slots: nextSlots });
          renderModalBody();
        });
      });
    }

    function openModal() {
      if (modalMask) { closeModal(); return; }
      const mask = document.createElement("div");
      mask.className = "azure-theme-mask";
      const panel = document.createElement("div");
      panel.className = "azure-theme-panel";
      mask.appendChild(panel);
      mask.addEventListener("mousedown", (e) => {
        if (e.target === mask) closeModal();
      });
      document.body.appendChild(mask);
      modalMask = mask;
      renderModalBody();
    }

    function mountButton() {
      if (triggerBtn && document.body.contains(triggerBtn)) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "btn-azure-theme-studio";
      btn.className = "azure-theme-btn";
      btn.title = "打开主题色调中心（官方预设 / 自定义双色 / 预设栏位）";
      btn.innerHTML = '<span class="azure-theme-dot"></span><span>主题</span>';
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      });

      const anchor =
        document.getElementById("btnThemeToggle") ||
        document.getElementById("btn-theme") ||
        document.getElementById("btn-sidebar-nav") ||
        document.getElementById("sidebar-nav-btn") ||
        document.querySelector(".top-actions button, .controls button, .header-actions button, .hdr-actions button, header button");

      if (anchor && anchor.parentElement) {
        anchor.parentElement.insertBefore(btn, anchor);
      } else {
        btn.classList.add("floating");
        document.body.appendChild(btn);
      }
      triggerBtn = btn;
    }

    function init() {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        if (cached && typeof cached === "object") config = cached;
      } catch {}
      applyCurrent();
      mountButton();
      syncFromServer();
      window.addEventListener("focus", syncFromServer);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalMask) closeModal();
      });
    }

    return { init, open: openModal, close: closeModal, sync: syncFromServer, applyPalette };
  })();

  // 7. AzureTopbarAlign: 统一 7 个 Sidecar 顶栏右侧固定按钮顺序
  // 从右往左固定为：版本号 ← 明暗 ← 主题 ← 左侧栏开关 ← Web UI
  const AzureTopbarAlign = (() => {
    let aligning = false;

    function ensureWebPageBtn() {
      // 隐藏原有的「复制全屏地址 / 全屏地址」旧按钮，避免重复
      document.querySelectorAll('button#btnCopyUrl, button[onclick*="copyWebUrl"]').forEach((old) => {
        old.style.display = "none";
      });
      document.querySelectorAll("button").forEach((b) => {
        if (b.id === "btn-azure-open-web") return;
        const txt = (b.textContent || "").trim();
        if (txt === "全屏地址" || txt === "复制全屏地址") {
          b.style.display = "none";
        }
      });

      let webBtn = document.getElementById("btn-azure-open-web");
      if (!webBtn) {
        webBtn = document.createElement("button");
        webBtn.type = "button";
        webBtn.id = "btn-azure-open-web";
        webBtn.title = "在系统默认浏览器中打开独立 Web 页面";
        webBtn.textContent = "Web UI";
        webBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const targetUrl = window.location.href;
          const headers = { "Content-Type": "application/json" };
          let tok = "";
          try {
            tok = new URLSearchParams(window.location.search).get("token") || "";
            if (tok) headers["X-Codeium-Sidecar-Token"] = tok;
          } catch {}
          const oldText = webBtn.textContent;
          try {
            const r = await fetch("/api/azure-open-web", {
              method: "POST",
              headers,
              body: JSON.stringify({ url: targetUrl, token: tok })
            });
            const j = await r.json().catch(() => null);
            if (r.ok && j && j.ok) {
              webBtn.textContent = "已打开 ✓";
              setTimeout(() => { webBtn.textContent = oldText; }, 1200);
              return;
            }
          } catch {}
          try { window.open(targetUrl, "_blank", "noopener"); } catch {}
        });
      }
      return webBtn;
    }

    function align() {
      if (aligning) return;
      aligning = true;
      try {
        const refBtn = document.querySelector("#btnRefresh, #refresh-btn, #btn-refresh");
        const webBtn = ensureWebPageBtn();
        const sbBtn = document.querySelector(".agy-sb-btn, #btn-sidebar-nav");
        const thBtn = document.getElementById("btn-azure-theme-studio");
        const ldBtn = document.querySelector("#btnTheme, #theme-btn, #btnThemeToggle");
        const verBtn = document.getElementById("agy-upd-btn");

        const container =
          (ldBtn && ldBtn.parentElement) ||
          (thBtn && !thBtn.classList.contains("floating") && thBtn.parentElement) ||
          (verBtn && verBtn.parentElement) ||
          (sbBtn && sbBtn.parentElement);

        if (!container) return;

        // 刷新按钮统一靠操作区最左
        if (refBtn && refBtn.parentElement === container) {
          refBtn.classList.add("azure-fixed-action");
          if (container.firstElementChild !== refBtn) {
            container.insertBefore(refBtn, container.firstChild);
          }
        }

        // 严格顺序（从左到右追加到操作栏最右侧，即从右往左固定为：版本号 ← 明暗 ← 主题 ← 左侧栏 ← Web UI）
        const ordered = [webBtn, sbBtn, thBtn, ldBtn, verBtn].filter(Boolean);
        if (!ordered.length) return;

        // 检查是否已经位于末尾且顺序一致，避免无谓重排
        const tail = Array.from(container.children).slice(-ordered.length);
        const alreadyAligned =
          tail.length === ordered.length &&
          ordered.every((el, i) => tail[i] === el && el.classList.contains("azure-fixed-action"));
        if (alreadyAligned) return;

        for (const el of ordered) {
          el.classList.remove("floating");
          el.classList.add("azure-fixed-action");
          if (el.style && el.style.position === "fixed") el.style.position = "";
          container.appendChild(el);
        }
      } finally {
        aligning = false;
      }
    }

    function init() {
      align();
      setTimeout(align, 120);
      setTimeout(align, 450);
      setTimeout(align, 1000);
      if (typeof MutationObserver !== "undefined" && document.body) {
        let t = null;
        const mo = new MutationObserver(() => {
          if (aligning) return;
          if (t) clearTimeout(t);
          t = setTimeout(align, 60);
        });
        mo.observe(document.body, { childList: true, subtree: true });
      }
    }

    return { init, align };
  })();

  window.AzureTone = AzureTone;
  window.AzureOverlayHost = AzureOverlayHost;
  window.AzureScrollAnchor = AzureScrollAnchor;
  window.createAzureTabStore = createAzureTabStore;
  window.AzureSelect = AzureSelect;
  window.AzureThemeStudio = AzureThemeStudio;
  window.AzureTopbarAlign = AzureTopbarAlign;
  // 默认按插件 ID 轻柔初始化氛围色
  try { AzureTone.applySeed(${JSON.stringify(pluginId)}); } catch {}
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      try { AzureSelect.init(); } catch {}
      try { AzureThemeStudio.init(); } catch {}
      try { AzureTopbarAlign.init(); } catch {}
    });
  } else {
    try { AzureSelect.init(); } catch {}
    try { AzureThemeStudio.init(); } catch {}
    try { AzureTopbarAlign.init(); } catch {}
  }
})();
</script>`;
  const idx = html.lastIndexOf("</body>");
  if (idx !== -1) {
    return html.slice(0, idx) + snippet + "\n" + html.slice(idx);
  }
  return html + "\n" + snippet;
}
