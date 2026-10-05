/* C-Quest Portal — front-end (vanilla JS, no build step) */
"use strict";

// ── Icons ──────────────────────────────────────────────────────────────────
const P = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.2A6.5 6.5 0 0 1 21.5 20"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16a3.4 3.4 0 0 1 6.4 0M14.5 10h3.5M14.5 13.5h3.5"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v-3M11 15V8M15 15v-5M19 15V6"/>',
  calc: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  building: '<rect x="4" y="3" width="11" height="18" rx="1"/><path d="M15 9h4a1 1 0 0 1 1 1v11M8 7h3M8 11h3M8 15h3M2.5 21h19"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11h6M9 15h4"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2M3 12.5h18"/>',
  database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  unlock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 7.7-1.5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14.5 8.5l2 2"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M4 20h16"/>', upload: '<path d="M12 16V5M7 9.5l5-5 5 5M4 20h16"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6z"/>', trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', apps: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  activity: '<path d="M3 12h4l3 8 4-16 3 8h4"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  devices: '<rect x="2" y="5" width="14" height="10" rx="1.5"/><path d="M5 19h8M9 15v4"/><rect x="17" y="9" width="5" height="10" rx="1"/>',
};
const APP_ICONS = ["mail", "users", "idcard", "calendar", "file", "chart", "calc", "folder", "layers", "ruler", "building", "clipboard", "briefcase", "database", "pie", "book", "globe", "grid"];
const icon = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.grid}</svg>`;
const MS_LOGO = '<svg viewBox="0 0 21 21" aria-hidden="true"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>';

// ── Helpers ────────────────────────────────────────────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const initials = n => (n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const fmtN = n => Number(n || 0).toLocaleString("en-GB");
const ROLE_LABEL = { admin: "Admin", superuser: "Super user", user: "General user" };
function ago(isoStr) {
  if (!isoStr) return "Never";
  const s = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(isoStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
const when = isoStr => isoStr ? new Date(isoStr).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const EVENT_LABEL = { sign_in: "Signed in", sign_in_failed: "Failed sign-in", sign_out: "Signed out", app_launch: "Opened", launch_denied: "Access refused", password_changed: "Changed password", password_set: "Set password", account_locked: "Account locked" };

const S = { me: null, csrf: "", apps: [], cfg: {}, users: [], catalogue: [], sel: new Set(), sort: ["name", 1], f: { q: "", role: "", status: "", app: "" }, days: 30 };

async function api(path, { method = "GET", json } = {}) {
  const opt = { method, headers: { "X-CSRF-Token": S.csrf }, credentials: "same-origin" };
  if (json !== undefined) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(json); }
  const r = await fetch(path, opt);
  let data = {};
  try { data = await r.json(); } catch (e) { /* non-JSON */ }
  if (r.status === 401 && S.me && !path.startsWith("/api/auth")) { S.me = null; boot(); }
  if (!r.ok) throw Object.assign(new Error(data.error || `Request failed (${r.status})`), { status: r.status, data });
  return data;
}

function toast(msg, { err = false } = {}) {
  const t = document.createElement("div");
  t.className = "toast" + (err ? " err" : "");
  t.innerHTML = `${icon(err ? "x" : "check")}<span>${esc(msg)}</span>`;
  $("#toasts").append(t);
  setTimeout(() => t.remove(), err ? 6000 : 3200);
}

async function copy(text, label = "Copied") {
  try { await navigator.clipboard.writeText(text); toast(label); }
  catch (e) { toast("Copy failed. Select the text and copy it manually.", { err: true }); }
}

function download(name, text) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type: "text/csv" })), download: name });
  document.body.append(a); a.click(); a.remove();
}

// ── Theme ──────────────────────────────────────────────────────────────────
function getTheme() { try { return localStorage.getItem("cq-theme") || "system"; } catch (e) { return "system"; } }
function setTheme(t) {
  try { localStorage.setItem("cq-theme", t); } catch (e) { /* ignore */ }
  const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $$(".brand-swap").forEach(img => { img.src = img.dataset[dark ? "dark" : "light"]; });
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => getTheme() === "system" && setTheme("system"));
const isDark = () => document.documentElement.dataset.theme === "dark";
const logo = (kind, cls) => {
  const l = `/static/brand/cquest-${kind}.svg`, d = `/static/brand/cquest-${kind}-white.svg`;
  return `<img class="${cls} brand-swap" src="${isDark() ? d : l}" data-light="${l}" data-dark="${d}" alt="C-Quest">`;
};

// ── Dialog ─────────────────────────────────────────────────────────────────
function openDlg(html, { wide = false, onOpen } = {}) {
  const d = $("#dlg");
  d.innerHTML = `<div class="dlg${wide ? " wide" : ""}">${html}</div>`;
  if (!d.open) d.showModal();
  $$("[data-close]", d).forEach(b => b.onclick = () => d.close());
  onOpen && onOpen(d);
  return d;
}
const closeDlg = () => $("#dlg").open && $("#dlg").close();
$("#dlg").addEventListener("click", e => { if (e.target.id === "dlg") e.target.close(); });
const dlgHead = t => `<div class="dlg-h"><h2>${esc(t)}</h2><button class="iconbtn" data-close aria-label="Close">${icon("x")}</button></div>`;

function confirmDlg({ title, body, ok = "Confirm", danger = false }) {
  return new Promise(res => {
    const d = openDlg(`${dlgHead(title)}<div class="dlg-b"><p>${body}</p></div>
      <div class="dlg-f"><button class="btn" data-close>Cancel</button><button class="btn ${danger ? "danger" : "primary"}" id="ok">${esc(ok)}</button></div>`);
    let done = false;
    $("#ok", d).onclick = () => { done = true; d.close(); res(true); };
    d.addEventListener("close", () => !done && res(false), { once: true });
  });
}

function showCredentials(u, data) {
  if (!data.link && !data.temp_password) return;
  const isLink = !!data.link;
  openDlg(`${dlgHead(isLink ? "Set-password link" : "Temporary password")}
    <div class="dlg-b"><p>Send this to <b>${esc(u.name)}</b> (${esc(u.email)}). It's shown once only${isLink ? ` and expires in ${data.link_hours} hours` : "; they'll choose their own password at first sign-in"}.</p>
    <div class="secret"><code id="sec">${esc(isLink ? data.link : data.temp_password)}</code><button class="btn sm" id="cp">${icon("copy")}Copy</button></div></div>
    <div class="dlg-f"><button class="btn primary" data-close>Done</button></div>`,
    { onOpen: d => { $("#cp", d).onclick = () => copy(isLink ? data.link : data.temp_password); } });
}

// ── Boot & routing ─────────────────────────────────────────────────────────
const NOTICES = { denied: "You don't have access to that app. Ask a portal admin.", maintenance: "That app is under maintenance. Try again later.",
  "no-access": "Your Microsoft account isn't set up in the portal. Ask a portal admin.", "sso-failed": "Microsoft sign-in didn't complete. Try again.", "sso-off": "Microsoft sign-in isn't set up yet." };

async function boot() {
  const h = location.hash.slice(1);
  if (h.startsWith("set-password=")) return renderSetPassword(h.split("=")[1]);
  let s;
  try { s = await api("/api/session"); } catch (e) { $("#root").innerHTML = `<div class="auth"><div class="login-card"><p class="form-error">The portal can't be reached. Reload the page.</p></div></div>`; return; }
  S.cfg = s;
  if (NOTICES[h]) { setTimeout(() => toast(NOTICES[h], { err: true }), 50); history.replaceState(null, "", location.pathname + location.search); }
  if (!s.signed_in) return renderLogin();
  S.me = s.user; S.csrf = s.csrf; S.apps = s.apps;
  if (S.me.must_change_pw) return renderForcedChange();
  const next = new URLSearchParams(location.search).get("next");
  if (next && next.startsWith("/launch/")) { history.replaceState(null, "", "/"); location.href = next; return; }
  renderShell();
}

const isMgr = () => ["admin", "superuser"].includes(S.me?.role);
const isAdmin = () => S.me?.role === "admin";
function routes() {
  const r = [{ id: "apps", label: "Apps", icon: "apps" }];
  if (isMgr()) r.push({ id: "users", label: "Users", icon: "users" });
  if (isAdmin()) r.push({ id: "catalogue", label: "App catalogue", icon: "layers" });
  if (isMgr()) r.push({ id: "usage", label: "Usage", icon: "chart" });
  if (isAdmin()) r.push({ id: "audit", label: "Audit log", icon: "list" }, { id: "settings", label: "Settings", icon: "cog" });
  return r;
}
window.addEventListener("hashchange", () => { if (S.me && !S.me.must_change_pw) { if (location.hash.startsWith("#set-password=")) return boot(); route(); } });

function renderShell() {
  $("#root").innerHTML = `<div class="app">
    <header class="topbar">
      <a class="brand" href="#apps">${logo("mark", "brand-mark")}<span class="brand-divider"></span><span class="brand-product">Portal</span></a>
      <nav class="nav" id="nav"></nav>
      <span class="spacer"></span>
      <button class="me-btn" id="me" aria-label="Account menu"><span class="avatar">${esc(initials(S.me.name))}</span></button>
    </header>
    <main class="main" id="main"></main></div>`;
  $("#me").onclick = e => accountMenu(e.currentTarget);
  route();
}

function route() {
  const rs = routes();
  let id = location.hash.slice(1) || "apps";
  if (!rs.find(r => r.id === id)) id = "apps";
  $("#nav").innerHTML = rs.map(r => `<a href="#${r.id}" ${r.id === id ? 'aria-current="page"' : ""}>${icon(r.icon)}<span class="lbl">${r.label}</span></a>`).join("");
  closeDrawer();
  ({ apps: viewApps, users: viewUsers, catalogue: viewCatalogue, usage: viewUsage, audit: viewAudit, settings: viewSettings })[id]();
  document.title = `${rs.find(r => r.id === id).label} · C-Quest Portal`.replace(" · ", " – ");
}

// ── Sign-in screens ────────────────────────────────────────────────────────
function authCard(inner) {
  $("#root").innerHTML = `<div class="auth"><div class="login-card"><div class="brand">${logo("logo", "brand-full")}</div>${inner}</div></div>`;
}

function renderLogin() {
  const c = S.cfg, next = new URLSearchParams(location.search).get("next") || "/";
  authCard(`<h1>Sign in</h1><p class="sub">C-Quest Portal</p>
    <div id="err" class="form-error" hidden></div>
    ${c.microsoft_login ? `<a class="btn block lg ms-btn" href="/auth/microsoft?next=${encodeURIComponent(next)}">${MS_LOGO}Sign in with Microsoft</a>${c.password_login ? '<div class="or">or</div>' : ""}` : ""}
    ${c.password_login ? `<form id="f" novalidate>
      <div class="field"><label for="em">Email</label><input id="em" type="email" autocomplete="username" required autofocus></div>
      <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required></div>
      <button class="btn primary block lg" id="go">Sign in</button></form>` : ""}
    <div class="auth-foot">Forgotten your password? Ask a portal admin to send a reset link.</div>`);
  const f = $("#f");
  if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault();
    const b = $("#go"); b.disabled = true; $("#err").hidden = true;
    try {
      await api("/api/auth/login", { method: "POST", json: { email: $("#em").value, password: $("#pw").value } });
      boot();
    } catch (ex) { $("#err").textContent = ex.message; $("#err").hidden = false; b.disabled = false; $("#pw").select(); }
  };
}

function pwFields(withCurrent) {
  const min = S.cfg.password_min || 12;
  return `${withCurrent ? '<div class="field"><label for="cur">Current password</label><input id="cur" type="password" autocomplete="current-password"></div>' : ""}
    <div class="field"><label for="np">New password</label><input id="np" type="password" autocomplete="new-password"><span class="hint">At least ${min} characters. A short phrase works well.</span></div>
    <div class="field"><label for="np2">Confirm new password</label><input id="np2" type="password" autocomplete="new-password"></div>`;
}
function pwMismatch() { return $("#np").value !== $("#np2").value ? "The two passwords don't match." : null; }

function renderSetPassword(token) {
  api("/api/session").then(s => { S.cfg = s; draw(); }).catch(draw);
  function draw() {
    authCard(`<h1>Choose your password</h1><p class="sub">You'll use it to sign in to the C-Quest Portal.</p>
      <div id="err" class="form-error" hidden></div><form id="f" novalidate>${pwFields(false)}<button class="btn primary block lg" id="go">Set password</button></form>`);
    $("#f").onsubmit = async e => {
      e.preventDefault();
      const m = pwMismatch(); if (m) { $("#err").textContent = m; $("#err").hidden = false; return; }
      $("#go").disabled = true;
      try {
        const r = await api("/api/auth/set-password", { method: "POST", json: { token, password: $("#np").value } });
        history.replaceState(null, "", "/");
        toast("Password set. Sign in to continue.");
        S.me = null; await boot();
        const em = $("#em"); if (em) { em.value = r.email; $("#pw").focus(); }
      } catch (ex) { $("#err").textContent = ex.message; $("#err").hidden = false; $("#go").disabled = false; }
    };
  }
}

function renderForcedChange() {
  authCard(`<h1>Set a new password</h1><p class="sub">Replace your temporary password to continue.</p>
    <div id="err" class="form-error" hidden></div><form id="f" novalidate>${pwFields(true)}<button class="btn primary block lg" id="go">Save password</button></form>
    <div class="auth-foot"><button class="btn ghost sm" id="out">Sign out</button></div>`);
  $("#out").onclick = signOut;
  $("#f").onsubmit = async e => {
    e.preventDefault();
    const m = pwMismatch(); if (m) { $("#err").textContent = m; $("#err").hidden = false; return; }
    $("#go").disabled = true;
    try { await api("/api/me/password", { method: "POST", json: { current: $("#cur").value, new: $("#np").value } }); toast("Password saved"); boot(); }
    catch (ex) { $("#err").textContent = ex.message; $("#err").hidden = false; $("#go").disabled = false; }
  };
}

async function signOut() {
  try { await api("/api/auth/logout", { method: "POST" }); } catch (e) { /* already gone */ }
  S.me = null; S.csrf = ""; location.hash = ""; boot();
}

// ── Account menu ───────────────────────────────────────────────────────────
function accountMenu(anchor) {
  const ex = $(".menu"); if (ex) { ex.remove(); return; }
  const m = document.createElement("div");
  m.className = "menu"; m.setAttribute("role", "menu");
  const t = getTheme();
  m.innerHTML = `<div class="mhead"><strong>${esc(S.me.name)}</strong><span>${esc(S.me.email)}</span><div style="margin-top:6px"><span class="chip">${ROLE_LABEL[S.me.role]}</span></div></div>
    <div class="mlabel">Theme</div>
    <div class="theme-seg">${[["system", "monitor", "System"], ["light", "sun", "Light"], ["dark", "moon", "Dark"]].map(([k, i, l]) => `<button data-t="${k}" aria-pressed="${t === k}">${icon(i)}${l}</button>`).join("")}</div>
    <div class="msep"></div>
    <button class="mi" data-a="pw">${icon("key")}Change password</button>
    <button class="mi" data-a="dev">${icon("devices")}Signed-in devices</button>
    <div class="msep"></div>
    <button class="mi" data-a="out">${icon("logout")}Sign out</button>`;
  document.body.append(m);
  const r = anchor.getBoundingClientRect();
  m.style.top = `${r.bottom + 8}px`; m.style.right = `${Math.max(8, innerWidth - r.right)}px`;
  $$("[data-t]", m).forEach(b => b.onclick = () => { setTheme(b.dataset.t); $$("[data-t]", m).forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $$("[data-a]", m).forEach(b => b.onclick = () => { m.remove(); ({ pw: changePwDlg, dev: devicesDlg, out: signOut })[b.dataset.a](); });
  setTimeout(() => document.addEventListener("click", function h(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener("click", h); } }), 0);
}

function changePwDlg() {
  const d = openDlg(`${dlgHead("Change password")}<div class="dlg-b"><div id="err" class="form-error" hidden></div>${pwFields(S.me.has_password)}<p class="faint" style="font-size:12.5px">Other devices will be signed out.</p></div>
    <div class="dlg-f"><button class="btn" data-close>Cancel</button><button class="btn primary" id="ok">Save password</button></div>`);
  $("#ok", d).onclick = async () => {
    const m = pwMismatch(); if (m) { $("#err", d).textContent = m; $("#err", d).hidden = false; return; }
    try { await api("/api/me/password", { method: "POST", json: { current: $("#cur", d)?.value || "", new: $("#np", d).value } }); d.close(); toast("Password saved"); }
    catch (ex) { $("#err", d).textContent = ex.message; $("#err", d).hidden = false; }
  };
}

async function devicesDlg() {
  const { sessions } = await api("/api/me/sessions");
  const d = openDlg(`${dlgHead("Signed-in devices")}<div class="dlg-b"><div class="list">${sessions.map(s => `<div class="li">${icon("devices")}<div><b>${esc(s.device)}</b>${s.current ? ' <span class="chip green">This device</span>' : ""}<div class="faint" style="font-size:12.5px">${s.method === "microsoft" ? "Microsoft" : "Password"} · ${esc(s.network || "")}</div></div><span class="t">${ago(s.last_seen)}</span></div>`).join("")}</div></div>
    <div class="dlg-f"><button class="btn" data-close>Close</button><button class="btn danger" id="ok" ${sessions.length < 2 ? "disabled" : ""}>Sign out other devices</button></div>`);
  $("#ok", d).onclick = async () => { const r = await api("/api/me/sessions/end-others", { method: "POST" }); d.close(); toast(`Signed out ${r.ended} other device${r.ended === 1 ? "" : "s"}`); };
}

// ── Launcher ───────────────────────────────────────────────────────────────
async function viewApps() {
  try { const s = await api("/api/session"); S.apps = s.apps; S.me = s.user; } catch (e) { /* keep cached */ }
  const many = S.apps.length > 8;
  $("#main").innerHTML = `<div class="page-head"><h1>Apps</h1><span class="spacer"></span>
      ${many ? `<div class="search">${icon("search")}<input id="q" placeholder="Find an app" aria-label="Find an app"></div>` : ""}</div>
    <div id="cards"></div>`;
  const draw = (q = "") => {
    const list = S.apps.filter(a => !q || (a.name + " " + a.description).toLowerCase().includes(q.toLowerCase()));
    $("#cards").innerHTML = !S.apps.length
      ? `<div class="empty">${icon("apps")}<h3>No apps assigned yet</h3><p>Ask a portal admin to give you access.</p></div>`
      : !list.length ? `<div class="empty">${icon("search")}<h3>No apps match "${esc(q)}"</h3></div>`
      : `<div class="cards">${list.map(card).join("")}</div>`;
  };
  draw();
  $("#q")?.addEventListener("input", e => draw(e.target.value));
}

function card(a) {
  const off = a.status === "maintenance";
  return `<a class="card${off ? " off" : ""}" href="/launch/${encodeURIComponent(a.slug)}" target="_blank" rel="noopener" ${off ? 'aria-disabled="true" tabindex="-1"' : ""}>
    <div class="tile">${icon(a.icon)}</div>
    <div><h3>${esc(a.name)}</h3>${a.description ? `<p>${esc(a.description)}</p>` : ""}</div>
    <div class="foot">${off ? '<span class="chip amber">Under maintenance</span>' : a.app_role ? `<span class="chip outline">${esc(a.app_role)}</span>` : ""}
      ${off ? "" : `<span class="go">Open${icon("ext")}</span>`}</div></a>`;
}

// ── Users ──────────────────────────────────────────────────────────────────
async function loadUsers() {
  const [u, a] = await Promise.all([api("/api/admin/users"), api("/api/admin/apps")]);
  S.users = u.users; S.catalogue = a.apps;
}
const appName = id => S.catalogue.find(a => a.id === id)?.name || "App";

async function viewUsers() {
  $("#main").innerHTML = `<div class="loading"><div class="spin"></div></div>`;
  await loadUsers();
  S.sel.clear();
  $("#main").innerHTML = `<div class="page-head"><h1>Users<span class="count num" id="cnt"></span></h1><span class="spacer"></span>
      <div class="tools"><button class="btn" id="imp">${icon("upload")}Import</button><a class="btn" href="/api/admin/users/export.csv">${icon("download")}Export</a>
      <button class="btn primary" id="new">${icon("plus")}New user</button></div></div>
    <div class="filters">
      <div class="search">${icon("search")}<input id="q" placeholder="Search name, email or department" aria-label="Search users" value="${esc(S.f.q)}"></div>
      <select class="input" id="fr" aria-label="Role"><option value="">All roles</option>${Object.entries(ROLE_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
      <select class="input" id="fs" aria-label="Status"><option value="">Any status</option><option value="active">Active</option><option value="disabled">Disabled</option><option value="locked">Locked</option><option value="never">Never signed in</option><option value="dormant">No sign-in for 30 days</option></select>
      <select class="input" id="fa" aria-label="App access"><option value="">Any app access</option><option value="none">No apps</option>${S.catalogue.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select>
    </div>
    <div id="bulk"></div>
    <div class="panel"><div class="tbl-wrap"><table class="tbl" id="tbl"></table></div></div>`;
  $("#fr").value = S.f.role; $("#fs").value = S.f.status; $("#fa").value = S.f.app;
  $("#q").oninput = e => { S.f.q = e.target.value; drawUsers(); };
  [["#fr", "role"], ["#fs", "status"], ["#fa", "app"]].forEach(([s, k]) => $(s).onchange = e => { S.f[k] = e.target.value; drawUsers(); });
  $("#new").onclick = () => userDlg();
  $("#imp").onclick = importDlg;
  drawUsers();
}

function filteredUsers() {
  const q = S.f.q.trim().toLowerCase(), month = Date.now() - 30 * 864e5;
  let l = S.users.filter(u => {
    if (q && !`${u.name} ${u.email} ${u.department} ${u.job_title}`.toLowerCase().includes(q)) return false;
    if (S.f.role && u.role !== S.f.role) return false;
    const st = S.f.status;
    if (st === "active" && u.status !== "active") return false;
    if (st === "disabled" && u.status !== "disabled") return false;
    if (st === "locked" && !u.locked) return false;
    if (st === "never" && u.last_login_at) return false;
    if (st === "dormant" && !(u.last_login_at && new Date(u.last_login_at) < month)) return false;
    if (S.f.app === "none" && u.apps.length) return false;
    if (S.f.app && S.f.app !== "none" && !u.apps.some(a => String(a.app_id) === S.f.app)) return false;
    return true;
  });
  const [k, dir] = S.sort, rank = { admin: 0, superuser: 1, user: 2 };
  l.sort((a, b) => {
    let x = a[k] ?? "", y = b[k] ?? "";
    if (k === "role") { x = rank[a.role]; y = rank[b.role]; }
    if (k === "last_login_at") { x = x ? new Date(x).getTime() : 0; y = y ? new Date(y).getTime() : 0; }
    if (k === "apps") { x = a.apps.length; y = b.apps.length; }
    return (x > y ? 1 : x < y ? -1 : 0) * dir || a.name.localeCompare(b.name);
  });
  return l;
}

function statusChip(u) {
  if (u.status === "disabled") return '<span class="chip">Disabled</span>';
  if (u.locked) return `<span class="chip red">${icon("lock")}Locked</span>`;
  if (!u.last_login_at) return '<span class="chip amber">Invited</span>';
  return '<span class="chip green"><span class="dot"></span>Active</span>';
}

function drawUsers() {
  const l = filteredUsers();
  $("#cnt").textContent = l.length === S.users.length ? S.users.length : `${l.length} of ${S.users.length}`;
  const th = (k, label, cls = "") => `<th class="sortable ${cls}" data-k="${k}">${label}${S.sort[0] === k ? `<span class="arr">${S.sort[1] > 0 ? "↑" : "↓"}</span>` : ""}</th>`;
  const vis = l.filter(u => u.manageable);
  const all = vis.length && vis.every(u => S.sel.has(u.id));
  $("#tbl").innerHTML = `<thead><tr><th class="w-cb"><input type="checkbox" class="cb" id="all" aria-label="Select all" ${all ? "checked" : ""}></th>
    ${th("name", "Name")}${th("role", "Role")}${th("apps", "Apps", "hide-sm")}${th("department", "Department", "hide-md")}${th("last_login_at", "Last sign-in", "hide-sm")}<th>Status</th></tr></thead>
    <tbody>${l.length ? l.map(u => `<tr class="click ${S.sel.has(u.id) ? "sel" : ""}" data-id="${u.id}">
      <td class="w-cb">${u.manageable ? `<input type="checkbox" class="cb" data-cb="${u.id}" aria-label="Select ${esc(u.name)}" ${S.sel.has(u.id) ? "checked" : ""}>` : ""}</td>
      <td><div class="person"><span class="avatar">${esc(initials(u.name))}</span><div style="min-width:0"><b>${esc(u.name)}${u.id === S.me.id ? ' <span class="faint" style="font-weight:400">(you)</span>' : ""}</b><span>${esc(u.email)}</span></div></div></td>
      <td>${u.role === "user" ? '<span class="muted">General user</span>' : `<span class="chip ${u.role === "admin" ? "red" : ""}">${ROLE_LABEL[u.role]}</span>`}</td>
      <td class="hide-sm"><div class="chips">${u.apps.slice(0, 3).map(a => `<span class="chip outline">${esc(appName(a.app_id))}</span>`).join("")}${u.apps.length > 3 ? `<span class="chip">+${u.apps.length - 3}</span>` : ""}${!u.apps.length ? '<span class="faint">None</span>' : ""}</div></td>
      <td class="hide-md">${esc(u.department) || '<span class="faint">—</span>'}</td>
      <td class="hide-sm num">${ago(u.last_login_at)}</td><td>${statusChip(u)}</td></tr>`).join("")
      : `<tr><td colspan="7"><div class="empty" style="border:0">${icon("search")}<h3>No users match these filters</h3></div></td></tr>`}</tbody>`;
  $$("th.sortable").forEach(h => h.onclick = () => { const k = h.dataset.k; S.sort = [k, S.sort[0] === k ? -S.sort[1] : 1]; drawUsers(); });
  $("#all").onchange = e => { vis.forEach(u => e.target.checked ? S.sel.add(u.id) : S.sel.delete(u.id)); drawUsers(); };
  $$("[data-cb]").forEach(c => { c.onclick = e => e.stopPropagation(); c.onchange = () => { const id = +c.dataset.cb; c.checked ? S.sel.add(id) : S.sel.delete(id); drawUsers(); }; });
  $$("tr[data-id]").forEach(r => r.onclick = () => openUser(+r.dataset.id));
  drawBulk();
}

function drawBulk() {
  const n = S.sel.size, b = $("#bulk");
  if (!n) { b.innerHTML = ""; return; }
  b.innerHTML = `<div class="bulkbar"><b>${n} selected</b>
    <button class="btn sm" data-b="grant">${icon("plus")}Give app access</button><button class="btn sm" data-b="revoke">Remove app access</button>
    <button class="btn sm" data-b="enable">Enable</button><button class="btn sm" data-b="disable">Disable</button>
    ${isAdmin() ? `<button class="btn sm" data-b="delete">${icon("trash")}Delete</button>` : ""}
    <span class="spacer"></span><button class="btn sm" data-b="clear">Clear selection</button></div>`;
  $$("[data-b]", b).forEach(x => x.onclick = () => bulkAction(x.dataset.b));
}

async function bulkAction(action) {
  if (action === "clear") { S.sel.clear(); return drawUsers(); }
  const ids = [...S.sel], n = ids.length, payload = { action, ids };
  if (action === "grant" || action === "revoke") {
    const d = openDlg(`${dlgHead(action === "grant" ? "Give app access" : "Remove app access")}<div class="dlg-b">
      <div class="field"><label for="ba">App</label><select id="ba">${S.catalogue.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select></div>
      ${action === "grant" ? '<div class="field" id="brw"><label for="br">Role in the app</label><select id="br"></select></div>' : ""}</div>
      <div class="dlg-f"><button class="btn" data-close>Cancel</button><button class="btn primary" id="ok">${action === "grant" ? `Give access to ${n}` : `Remove from ${n}`}</button></div>`);
    const roles = () => { if (action !== "grant") return; const a = S.catalogue.find(x => x.id === +$("#ba", d).value), rs = (a.app_roles || "").split(",").filter(Boolean);
      $("#brw", d).hidden = !rs.length; $("#br", d).innerHTML = rs.map(r => `<option ${r === rs[rs.length - 1] ? "selected" : ""}>${esc(r)}</option>`).join(""); };
    $("#ba", d).onchange = roles; roles();
    $("#ok", d).onclick = async () => { payload.app_id = +$("#ba", d).value; payload.app_role = $("#br", d)?.value || ""; d.close(); await runBulk(payload); };
    return;
  }
  const words = { enable: ["Enable", "They'll be able to sign in again."], disable: ["Disable", "They'll be signed out and can't sign in until enabled."], delete: ["Delete", "Accounts are removed permanently. Usage history is kept only as anonymous totals."] }[action];
  if (await confirmDlg({ title: `${words[0]} ${n} user${n === 1 ? "" : "s"}?`, body: words[1], ok: words[0], danger: action !== "enable" })) runBulk(payload);
}
async function runBulk(p) {
  try { const r = await api("/api/admin/users/bulk", { method: "POST", json: p }); toast(`Updated ${r.done} user${r.done === 1 ? "" : "s"}${r.skipped ? ` · ${r.skipped} skipped` : ""}`); S.sel.clear(); await loadUsers(); drawUsers(); }
  catch (ex) { toast(ex.message, { err: true }); }
}

function roleOptions(current) {
  const allowed = isAdmin() ? ["admin", "superuser", "user"] : ["user"];
  const list = allowed.includes(current) || !current ? allowed : [current, ...allowed];
  return list.map(r => `<option value="${r}" ${r === current ? "selected" : ""}>${ROLE_LABEL[r]}</option>`).join("");
}

function accessEditor(grants, disabled = false) {
  const has = new Map(grants.map(g => [g.app_id, g.app_role]));
  if (!S.catalogue.length) return '<p class="faint">No apps in the catalogue yet.</p>';
  return `<div class="access">${S.catalogue.map(a => {
    const rs = (a.app_roles || "").split(",").filter(Boolean), on = has.has(a.id);
    return `<label class="access-row ${a.status === "hidden" ? "offrow" : ""}"><input type="checkbox" class="cb" data-app="${a.id}" ${on ? "checked" : ""} ${disabled ? "disabled" : ""}>
      <span class="nm"><span class="mini">${icon(a.icon)}</span><span><b>${esc(a.name)}</b>${a.status !== "live" ? ` <span class="chip ${a.status === "maintenance" ? "amber" : ""}">${a.status === "hidden" ? "Hidden" : "Maintenance"}</span>` : ""}</span></span>
      ${rs.length ? `<select data-role="${a.id}" aria-label="Role in ${esc(a.name)}" ${disabled || !on ? "disabled" : ""}>${rs.map(r => `<option ${r === (has.get(a.id) || rs[rs.length - 1]) ? "selected" : ""}>${esc(r)}</option>`).join("")}</select>` : ""}</label>`;
  }).join("")}</div>`;
}
function wireAccess(root) { $$("[data-app]", root).forEach(c => c.onchange = () => { const s = $(`[data-role="${c.dataset.app}"]`, root); if (s) s.disabled = !c.checked; }); }
function readAccess(root) { return $$("[data-app]", root).filter(c => c.checked).map(c => ({ app_id: +c.dataset.app, app_role: $(`[data-role="${c.dataset.app}"]`, root)?.value || "" })); }

function userDlg() {
  const d = openDlg(`${dlgHead("New user")}<div class="dlg-b"><div id="err" class="form-error" hidden></div>
    <div class="row2"><div class="field"><label for="un">Full name</label><input id="un" autocomplete="off"></div>
    <div class="field"><label for="ue">Work email</label><input id="ue" type="email" autocomplete="off"></div></div>
    <div class="row2"><div class="field"><label for="ud">Department</label><input id="ud" list="depts"></div>
    <div class="field"><label for="uj">Job title</label><input id="uj"></div></div>
    <datalist id="depts">${[...new Set(S.users.map(u => u.department).filter(Boolean))].map(x => `<option value="${esc(x)}">`).join("")}</datalist>
    <div class="field"><label for="ur">Portal role</label><select id="ur">${roleOptions("user")}</select></div>
    <div class="field"><span class="lbl">App access</span>${accessEditor([])}</div>
    <div class="field"><span class="lbl">First sign-in</span><div class="radio-cards">
      <label class="radio-card"><input type="radio" name="pm" value="link" checked><div><b>Set-password link</b><span>You send them a one-time link; they choose their own password.</span></div></label>
      <label class="radio-card"><input type="radio" name="pm" value="temp"><div><b>Temporary password</b><span>They must change it at first sign-in.</span></div></label>
      ${S.cfg.microsoft_login ? '<label class="radio-card"><input type="radio" name="pm" value="none"><div><b>Microsoft sign-in only</b><span>No portal password; they use their C-Quest Microsoft account.</span></div></label>' : ""}
    </div></div></div>
    <div class="dlg-f"><button class="btn" data-close>Cancel</button><button class="btn primary" id="ok">Create user</button></div>`, { wide: true });
  wireAccess(d);
  $("#un", d).focus();
  $("#ok", d).onclick = async () => {
    const body = { name: $("#un", d).value, email: $("#ue", d).value, department: $("#ud", d).value, job_title: $("#uj", d).value,
      role: $("#ur", d).value, apps: readAccess(d), password_mode: $('input[name="pm"]:checked', d).value };
    try {
      const r = await api("/api/admin/users", { method: "POST", json: body });
      d.close(); toast("User created"); await loadUsers(); drawUsers(); showCredentials(r.user, r);
    } catch (ex) { $("#err", d).textContent = ex.message; $("#err", d).hidden = false; $(".dlg-b", d).scrollTop = 0; }
  };
}

// user drawer
function closeDrawer() { $(".drawer")?.remove(); $(".drawer-scrim")?.remove(); }
document.addEventListener("keydown", e => { if (e.key === "Escape" && $(".drawer") && !$("#dlg").open) closeDrawer(); });

async function openUser(id) {
  closeDrawer();
  const scrim = Object.assign(document.createElement("div"), { className: "drawer-scrim" });
  const dr = Object.assign(document.createElement("aside"), { className: "drawer" });
  dr.setAttribute("aria-label", "User details");
  dr.innerHTML = `<div class="loading"><div class="spin"></div></div>`;
  scrim.onclick = closeDrawer;
  document.body.append(scrim, dr);
  let r;
  try { r = await api(`/api/admin/users/${id}`); } catch (ex) { closeDrawer(); return toast(ex.message, { err: true }); }
  const u = r.user, self = u.id === S.me.id, can = u.manageable || self, roOnly = !can;
  const accessLocked = roOnly || (self && !isAdmin());
  dr.innerHTML = `<div class="drawer-h"><span class="avatar lg">${esc(initials(u.name))}</span><div class="who"><b>${esc(u.name)}</b><span>${esc(u.email)}</span><div class="chips" style="margin-top:6px">${statusChip(u)}<span class="chip">${ROLE_LABEL[u.role]}</span>${u.sso_linked ? '<span class="chip outline">Microsoft linked</span>' : ""}</div></div>
      <button class="iconbtn" id="x" aria-label="Close">${icon("x")}</button></div>
    <div class="drawer-b"><div id="err" class="form-error" hidden></div>
      ${roOnly ? `<p class="faint" style="margin-top:0">Only Admins can change ${ROLE_LABEL[u.role]} accounts.</p>` : ""}
      <div class="sec"><h3>Details</h3>
        <div class="row2"><div class="field"><label for="dn">Full name</label><input id="dn" value="${esc(u.name)}" ${roOnly ? "disabled" : ""}></div>
        <div class="field"><label for="de">Work email</label><input id="de" type="email" value="${esc(u.email)}" ${roOnly ? "disabled" : ""}></div></div>
        <div class="row2"><div class="field"><label for="dd">Department</label><input id="dd" value="${esc(u.department)}" ${roOnly ? "disabled" : ""}></div>
        <div class="field"><label for="dj">Job title</label><input id="dj" value="${esc(u.job_title)}" ${roOnly ? "disabled" : ""}></div></div>
        <div class="field"><label for="dr">Portal role</label><select id="dr" ${roOnly || self ? "disabled" : ""}>${roleOptions(u.role)}</select></div></div>
      <div class="sec"><h3>App access</h3>${accessEditor(u.apps, accessLocked)}</div>
      ${!self && can ? `<div class="sec"><h3>Security</h3><div class="acts">
        <button class="btn sm" data-x="reset">${icon("key")}Reset password</button>
        ${u.locked ? `<button class="btn sm" data-x="unlock">${icon("unlock")}Unlock</button>` : ""}
        <button class="btn sm" data-x="signout" ${r.sessions.length ? "" : "disabled"}>${icon("logout")}Sign out everywhere</button>
        <button class="btn sm ${u.status === "active" ? "danger" : ""}" data-x="toggle">${u.status === "active" ? "Disable account" : "Enable account"}</button>
        ${isAdmin() ? `<button class="btn sm danger" data-x="delete">${icon("trash")}Delete</button>` : ""}</div></div>` : ""}
      <div class="sec"><h3>Overview</h3><dl class="kv">
        <dt>Last sign-in</dt><dd>${when(u.last_login_at)}</dd><dt>App opens (30 days)</dt><dd class="num">${fmtN(r.launches_30d)}</dd>
        <dt>Signed in on</dt><dd>${r.sessions.length ? r.sessions.map(s => esc(s.device)).join(", ") : "No active sessions"}</dd>
        <dt>Account created</dt><dd>${when(u.created_at)}</dd></dl></div>
      <div class="sec"><h3>Recent activity</h3>${r.activity.length ? `<div class="list">${r.activity.map(e => `<div class="li"><span>${EVENT_LABEL[e.kind] || esc(e.kind)} ${e.app ? `<b>${esc(e.app)}</b>` : ""}</span><span class="t">${ago(e.ts)}</span></div>`).join("")}</div>` : '<p class="faint">No activity yet.</p>'}</div>
    </div>
    ${roOnly ? "" : `<div class="drawer-f"><button class="btn" id="cancel">Close</button><button class="btn primary" id="save">Save changes</button></div>`}`;
  $("#x", dr).onclick = closeDrawer;
  $("#cancel", dr) && ($("#cancel", dr).onclick = closeDrawer);
  wireAccess(dr);
  const showErr = m => { $("#err", dr).textContent = m; $("#err", dr).hidden = false; $(".drawer-b", dr).scrollTop = 0; };
  const refresh = async () => { await loadUsers(); drawUsers(); openUser(id); };
  $("#save", dr) && ($("#save", dr).onclick = async () => {
    const body = { name: $("#dn", dr).value, email: $("#de", dr).value, department: $("#dd", dr).value, job_title: $("#dj", dr).value };
    if (!self) body.role = $("#dr", dr).value;
    if (!accessLocked) body.apps = readAccess(dr);
    try { await api(`/api/admin/users/${id}`, { method: "PATCH", json: body }); toast("Changes saved"); await loadUsers(); drawUsers(); closeDrawer(); }
    catch (ex) { showErr(ex.message); }
  });
  $$("[data-x]", dr).forEach(b => b.onclick = async () => {
    const x = b.dataset.x;
    try {
      if (x === "reset") return resetDlg(u);
      if (x === "unlock") { await api(`/api/admin/users/${id}/unlock`, { method: "POST" }); toast("Account unlocked"); return refresh(); }
      if (x === "signout") { const k = await api(`/api/admin/users/${id}/sign-out`, { method: "POST" }); toast(`Signed out of ${k.ended} session${k.ended === 1 ? "" : "s"}`); return refresh(); }
      if (x === "toggle") {
        const dis = u.status === "active";
        if (dis && !await confirmDlg({ title: `Disable ${u.name}?`, body: "They'll be signed out and can't sign in until the account is enabled again.", ok: "Disable", danger: true })) return;
        await api(`/api/admin/users/${id}`, { method: "PATCH", json: { status: dis ? "disabled" : "active" } }); toast(dis ? "Account disabled" : "Account enabled"); return refresh();
      }
      if (x === "delete") {
        if (!await confirmDlg({ title: `Delete ${u.name}?`, body: "The account and its app access are removed permanently. Usage history is kept only as anonymous totals.", ok: "Delete user", danger: true })) return;
        await api(`/api/admin/users/${id}`, { method: "DELETE" }); toast("User deleted"); closeDrawer(); await loadUsers(); drawUsers();
      }
    } catch (ex) { showErr(ex.message); }
  });
}

function resetDlg(u) {
  const d = openDlg(`${dlgHead("Reset password")}<div class="dlg-b"><p>${esc(u.name)} will be signed out of all devices.</p><div class="radio-cards">
    <label class="radio-card"><input type="radio" name="rm" value="link" checked><div><b>Set-password link</b><span>One-time link; they choose a new password.</span></div></label>
    <label class="radio-card"><input type="radio" name="rm" value="temp"><div><b>Temporary password</b><span>They must change it at next sign-in.</span></div></label></div></div>
    <div class="dlg-f"><button class="btn" data-close>Cancel</button><button class="btn primary" id="ok">Reset password</button></div>`);
  $("#ok", d).onclick = async () => {
    try { const r = await api(`/api/admin/users/${u.id}/reset`, { method: "POST", json: { mode: $('input[name="rm"]:checked', d).value } }); d.close(); showCredentials(u, r); }
    catch (ex) { toast(ex.message, { err: true }); }
  };
}

function importDlg() {
  const tmpl = "name,email,role,department,job_title,apps\nJane Smith,jane.smith@c-quest.com,user,Quantity Surveying,Senior QS," + (S.catalogue[0] ? `${S.catalogue[0].slug}${S.catalogue[0].app_roles ? ":" + S.catalogue[0].app_roles.split(",").pop() : ""}` : "") + "\n";
  const d = openDlg(`${dlgHead("Import users")}<div class="dlg-b"><div id="err" class="form-error" hidden></div>
    <p>Upload a CSV with the columns <span class="code">name, email, role, department, job_title, apps</span>. Role is <span class="code">admin</span>, <span class="code">superuser</span> or <span class="code">user</span>. List apps by short name separated by <span class="code">;</span>, with an optional app role after a colon.</p>
    <label class="dropzone" id="dz">${icon("upload")}<div>Drop a CSV file here or click to choose</div><input type="file" accept=".csv,text/csv" id="file" hidden></label>
    <div class="field" style="margin-top:12px"><label for="csv">Or paste the rows</label><textarea id="csv" spellcheck="false"></textarea></div>
    <div class="field"><label for="pm">First sign-in</label><select id="pm"><option value="link">Set-password links</option><option value="temp">Temporary passwords</option>${S.cfg.microsoft_login ? '<option value="none">Microsoft sign-in only</option>' : ""}</select></div>
    <div id="res"></div></div>
    <div class="dlg-f"><button class="btn ghost" id="tpl">${icon("download")}Download template</button><span style="flex:1"></span><button class="btn" data-close>Close</button><button class="btn primary" id="ok">Import</button></div>`, { wide: true });
  const dz = $("#dz", d), read = f => f && f.text().then(t => { $("#csv", d).value = t; });
  $("#file", d).onchange = e => read(e.target.files[0]);
  dz.ondragover = e => { e.preventDefault(); dz.classList.add("over"); };
  dz.ondragleave = () => dz.classList.remove("over");
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove("over"); read(e.dataTransfer.files[0]); };
  $("#tpl", d).onclick = () => download("portal-users-template.csv", tmpl);
  $("#ok", d).onclick = async () => {
    $("#err", d).hidden = true;
    try {
      const r = await api("/api/admin/users/import", { method: "POST", json: { csv: $("#csv", d).value, password_mode: $("#pm", d).value } });
      const creds = r.results.filter(x => x.link || x.temp_password);
      $("#res", d).innerHTML = `<div class="sec"><h3>${r.created} created</h3><div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Line</th><th>Email</th><th>Result</th></tr></thead><tbody>
        ${r.results.map(x => `<tr><td class="num">${x.line}</td><td>${esc(x.email)}</td><td><span class="chip ${x.status === "created" ? "green" : x.status === "error" ? "red" : ""}">${x.status === "created" ? "Created" : x.status === "error" ? "Error" : "Skipped"}</span> <span class="faint">${esc(x.message || "")}</span></td></tr>`).join("")}</tbody></table></div></div>
        ${creds.length ? `<p style="margin-top:12px">Sign-in details are shown once. <button class="btn sm" id="dl">${icon("download")}Download sign-in details</button></p>` : ""}</div>`;
      $("#dl", d) && ($("#dl", d).onclick = () => download("portal-sign-in-details.csv", "name,email,link_or_temporary_password\n" + creds.map(x => [x.name, x.email, x.link || x.temp_password].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")));
      $("#ok", d).disabled = true;
      await loadUsers(); drawUsers();
    } catch (ex) { $("#err", d).textContent = ex.message; $("#err", d).hidden = false; }
  };
}

// ── App catalogue (Admins) ─────────────────────────────────────────────────
async function viewCatalogue() {
  $("#main").innerHTML = `<div class="loading"><div class="spin"></div></div>`;
  S.catalogue = (await api("/api/admin/apps")).apps;
  const st = { live: '<span class="chip green"><span class="dot"></span>Live</span>', maintenance: '<span class="chip amber">Maintenance</span>', hidden: '<span class="chip">Hidden</span>' };
  $("#main").innerHTML = `<div class="page-head"><h1>App catalogue<span class="count num">${S.catalogue.length}</span></h1><span class="spacer"></span>
      <button class="btn primary" id="new">${icon("plus")}Add app</button></div>
    <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>App</th><th>Status</th><th class="hide-sm">Sign-in handoff</th><th class="hide-md">App roles</th><th class="r">Users</th><th class="r">Order</th></tr></thead><tbody>
    ${S.catalogue.length ? S.catalogue.map((a, i) => `<tr class="click" data-id="${a.id}"><td><div class="app-row"><span class="mini">${icon(a.icon)}</span><div style="min-width:0"><b>${esc(a.name)}</b><span>${esc(a.url)}</span></div></div></td>
      <td>${st[a.status]}</td><td class="hide-sm">${a.sso ? "Automatic" : '<span class="faint">Off</span>'}</td>
      <td class="hide-md">${a.app_roles ? a.app_roles.split(",").map(r => `<span class="chip outline">${esc(r)}</span>`).join(" ") : '<span class="faint">—</span>'}</td>
      <td class="r num">${fmtN(a.users)}</td>
      <td class="r" style="white-space:nowrap"><button class="iconbtn" data-mv="-1" data-i="${i}" aria-label="Move up" ${i === 0 ? "disabled" : ""}>${icon("up")}</button><button class="iconbtn" data-mv="1" data-i="${i}" aria-label="Move down" ${i === S.catalogue.length - 1 ? "disabled" : ""}>${icon("down")}</button></td></tr>`).join("")
      : `<tr><td colspan="6"><div class="empty" style="border:0">${icon("layers")}<h3>No apps yet</h3><p>Add the first app so users can see it on their Apps page.</p></div></td></tr>`}
    </tbody></table></div></div>`;
  $("#new").onclick = () => appDlg();
  $$("tr[data-id]").forEach(r => r.onclick = e => { if (!e.target.closest("[data-mv]")) appDlg(S.catalogue.find(a => a.id === +r.dataset.id)); });
  $$("[data-mv]").forEach(b => b.onclick = async e => {
    e.stopPropagation();
    const i = +b.dataset.i, j = i + +b.dataset.mv, ids = S.catalogue.map(a => a.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await api("/api/admin/apps/order", { method: "POST", json: { ids } }); viewCatalogue();
  });
}

function appDlg(a) {
  const ed = !!a; a = a || { name: "", slug: "", description: "", url: "https://", icon: "grid", status: "live", sso: true, app_roles: "" };
  let ic = a.icon;
  const d = openDlg(`${dlgHead(ed ? `Edit ${a.name}` : "Add app")}<div class="dlg-b"><div id="err" class="form-error" hidden></div>
    <div class="row2"><div class="field"><label for="an">Name</label><input id="an" value="${esc(a.name)}" maxlength="80"></div>
    <div class="field"><label for="as">Short name</label><input id="as" value="${esc(a.slug)}" maxlength="46" placeholder="Made from the name"><span class="hint">Used in links and launch tokens. Lowercase, numbers, hyphens.</span></div></div>
    <div class="field"><label for="ad">Description</label><input id="ad" value="${esc(a.description)}" maxlength="200"><span class="hint">One line shown on the card.</span></div>
    <div class="field"><label for="au">App address</label><input id="au" type="url" value="${esc(a.url)}"></div>
    <div class="field"><span class="lbl">Icon</span><div class="icon-pick">${APP_ICONS.map(n => `<button type="button" data-ic="${n}" aria-label="${n}" aria-pressed="${n === ic}">${icon(n)}</button>`).join("")}</div></div>
    <div class="row2"><div class="field"><label for="ar">Roles inside the app</label><input id="ar" value="${esc(a.app_roles)}" placeholder="e.g. Administrator, Reviewer"><span class="hint">Optional. Comma separated; the last is the default.</span></div>
    <div class="field"><label for="ast">Status</label><select id="ast"><option value="live">Live</option><option value="maintenance">Under maintenance</option><option value="hidden">Hidden</option></select></div></div>
    <div class="setting-row"><div class="t"><b>Sign users in automatically</b><span>Passes a 60-second signed launch token so the app knows who opened it. The app must support it.</span></div><label class="switch"><input type="checkbox" id="asso" ${a.sso ? "checked" : ""}><i></i></label></div>
    </div><div class="dlg-f">${ed ? `<button class="btn danger" id="del">${icon("trash")}Delete app</button><span style="flex:1"></span>` : ""}<button class="btn" data-close>Cancel</button><button class="btn primary" id="ok">${ed ? "Save changes" : "Add app"}</button></div>`, { wide: true });
  $("#ast", d).value = a.status;
  $$("[data-ic]", d).forEach(b => b.onclick = () => { ic = b.dataset.ic; $$("[data-ic]", d).forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $("#ok", d).onclick = async () => {
    const body = { name: $("#an", d).value, slug: $("#as", d).value, description: $("#ad", d).value, url: $("#au", d).value, icon: ic, status: $("#ast", d).value, sso: $("#asso", d).checked, app_roles: $("#ar", d).value };
    try { await api(ed ? `/api/admin/apps/${a.id}` : "/api/admin/apps", { method: ed ? "PATCH" : "POST", json: body }); d.close(); toast(ed ? "Changes saved" : "App added"); viewCatalogue(); }
    catch (ex) { $("#err", d).textContent = ex.message; $("#err", d).hidden = false; $(".dlg-b", d).scrollTop = 0; }
  };
  $("#del", d) && ($("#del", d).onclick = async () => {
    if (!await confirmDlg({ title: `Delete ${a.name}?`, body: `It disappears from the portal and ${a.users} user${a.users === 1 ? " loses" : "s lose"} access. Usage totals are kept.`, ok: "Delete app", danger: true })) return;
    try { await api(`/api/admin/apps/${a.id}`, { method: "DELETE" }); toast("App deleted"); viewCatalogue(); } catch (ex) { toast(ex.message, { err: true }); }
  });
}

// ── Usage statistics ───────────────────────────────────────────────────────
async function viewUsage() {
  $("#main").innerHTML = `<div class="page-head"><h1>Usage</h1><span class="spacer"></span>
    <div class="tools"><div class="seg" id="rng">${[7, 30, 90, 365].map(n => `<button data-d="${n}" aria-pressed="${n === S.days}">${n === 365 ? "12 months" : `${n} days`}</button>`).join("")}</div>
    <a class="btn" id="exp" href="/api/admin/stats/export.csv?days=${S.days}">${icon("download")}Export</a></div></div><div id="st"><div class="loading"><div class="spin"></div></div></div>`;
  $$("#rng button").forEach(b => b.onclick = () => { S.days = +b.dataset.d; viewUsage(); });
  const s = await api(`/api/admin/stats?days=${S.days}`);
  const delta = (k) => {
    const c = s.kpis[k], p = s.previous[k];
    if (!p) return `<div class="delta">No earlier data</div>`;
    const pc = Math.round((c - p) / p * 100), good = k === "failed" ? pc <= 0 : pc >= 0;
    return `<div class="delta ${pc === 0 ? "" : good ? "up" : "down"}">${pc > 0 ? "+" : ""}${pc}% vs previous ${S.days === 365 ? "12 months" : `${S.days} days`}</div>`;
  };
  const K = [["active_users", "Active people"], ["sign_ins", "Sign-ins"], ["launches", "App opens"], ["failed", "Failed sign-ins"]];
  const maxApp = Math.max(1, ...s.by_app.map(a => a.launches)), maxDept = Math.max(1, ...s.by_department.map(a => a.launches)), maxH = Math.max(1, ...s.hours_utc);
  const ac = s.accounts;
  $("#st").innerHTML = `<div class="kpis">${K.map(([k, l]) => `<div class="panel kpi"><div class="lbl">${l}</div><div class="val">${fmtN(s.kpis[k])}</div>${delta(k)}</div>`).join("")}</div>
    <div class="grid2">
      <div class="panel"><div class="panel-h"><h2>Daily activity</h2><span class="spacer"></span><div class="legend"><span><i style="background:var(--red)"></i>App opens</span><span><i style="background:var(--cer-strong)"></i>Active people</span></div></div><div class="panel-b">${chartSVG(s.series)}</div></div>
      <div class="panel"><div class="panel-h"><h2>Accounts</h2></div><div class="panel-b stat-list">
        <div class="row"><span>Active accounts</span><b>${fmtN(ac.active)}</b></div>
        <div class="row"><span>Admins / Super users / General</span><b>${ac.by_role.admin} / ${ac.by_role.superuser} / ${ac.by_role.user}</b></div>
        <div class="row"><span>Never signed in</span><b>${fmtN(ac.never_signed_in)}</b></div>
        <div class="row"><span>No sign-in for 30 days</span><b>${fmtN(ac.dormant_30d)}</b></div>
        <div class="row"><span>Locked now</span><b>${fmtN(ac.locked)}</b></div>
        <div class="row"><span>Disabled</span><b>${fmtN(ac.disabled)}</b></div></div></div>
    </div>
    <div class="panel" style="margin-bottom:16px"><div class="panel-h"><h2>Apps</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>App</th><th class="r">Opens</th><th class="r">People</th><th class="r hide-sm">With access</th><th class="r hide-sm">Adoption</th><th class="hide-md" style="width:28%"></th><th class="hide-sm">Last opened</th></tr></thead><tbody>
      ${s.by_app.map(a => `<tr><td><div class="app-row"><span class="mini">${icon(a.icon)}</span><b>${esc(a.name)}</b></div></td><td class="r num">${fmtN(a.launches)}</td><td class="r num">${fmtN(a.users)}</td><td class="r num hide-sm">${fmtN(a.granted)}</td>
        <td class="r num hide-sm">${a.granted ? Math.round(a.users / a.granted * 100) + "%" : "—"}</td><td class="hide-md"><div class="hbar" style="margin:0"><div class="track"><i style="width:${a.launches / maxApp * 100}%"></i></div></div></td><td class="hide-sm">${ago(a.last)}</td></tr>`).join("") || '<tr><td colspan="7" class="faint">No apps yet.</td></tr>'}
    </tbody></table></div></div>
    <div class="grid3">
      <div class="panel"><div class="panel-h"><h2>Most active people</h2></div><div class="panel-b stat-list">${s.top_users.length ? s.top_users.map(u => `<div class="row"><span>${esc(u.name)}${u.department ? ` <span class="faint">${esc(u.department)}</span>` : ""}</span><b>${fmtN(u.launches)}</b></div>`).join("") : '<p class="faint" style="margin:0">No app opens in this period.</p>'}</div></div>
      <div class="panel"><div class="panel-h"><h2>By department</h2></div><div class="panel-b">${s.by_department.length ? s.by_department.map(x => `<div class="hbar"><span>${esc(x.name)}</span><b class="num">${fmtN(x.launches)}</b><div class="track"><i style="width:${x.launches / maxDept * 100}%"></i></div></div>`).join("") : '<p class="faint" style="margin:0">No app opens in this period.</p>'}</div></div>
      <div class="panel"><div class="panel-h"><h2>Busiest hours</h2><span class="spacer"></span><span class="faint" style="font-size:12px">UTC</span></div><div class="panel-b"><div class="hours">${s.hours_utc.map((h, i) => `<i title="${String(i).padStart(2, "0")}:00 · ${h} opens" style="height:${Math.max(2, h / maxH * 100)}%"></i>`).join("")}</div><div class="hours-x"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div></div></div>
    </div>`;
}

function chartSVG(series) {
  const W = 760, H = 240, L = 34, R = 10, T = 12, B = 26, n = series.length;
  const max = Math.max(4, ...series.map(d => Math.max(d.launches, d.users)));
  const step = Math.pow(10, Math.floor(Math.log10(max))) / (max / Math.pow(10, Math.floor(Math.log10(max))) > 5 ? 0.5 : max / Math.pow(10, Math.floor(Math.log10(max))) > 2 ? 1 : 2);
  const top = Math.ceil(max / step) * step, y = v => T + (H - T - B) * (1 - v / top), cw = (W - L - R) / n, bw = Math.max(1.5, cw * 0.62);
  let g = "";
  for (let v = 0; v <= top + 1e-9; v += step) g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${fmtN(v)}</text>`;
  const every = Math.ceil(n / 8);
  const bars = series.map((d, i) => { const x = L + i * cw + (cw - bw) / 2; return `<rect class="bar" x="${x}" y="${y(d.launches)}" width="${bw}" height="${Math.max(0, H - B - y(d.launches))}" rx="${Math.min(3, bw / 3)}"><title>${new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${d.launches} opens, ${d.users} people</title></rect>`; }).join("");
  const line = series.map((d, i) => `${i ? "L" : "M"}${(L + i * cw + cw / 2).toFixed(1)} ${y(d.users).toFixed(1)}`).join(" ");
  const xl = series.map((d, i) => i % every === 0 ? `<text x="${L + i * cw + cw / 2}" y="${H - 8}" text-anchor="middle">${new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</text>` : "").join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily app opens and active people">${g}${bars}<path class="ln" d="${line}"/>${xl}</svg>`;
}

// ── Audit log (Admins) ─────────────────────────────────────────────────────
const AUDIT_LABEL = { "user.create": "Created user", "user.update": "Updated user", "user.delete": "Deleted user", "user.reset_password": "Reset password", "user.unlock": "Unlocked account", "user.sign_out_everywhere": "Signed user out", "user.import": "Imported users", "user.export": "Exported users", "app.create": "Added app", "app.update": "Updated app", "app.delete": "Deleted app", "settings.update": "Changed settings" };
async function viewAudit() {
  $("#main").innerHTML = `<div class="loading"><div class="spin"></div></div>`;
  const { entries } = await api("/api/admin/audit?limit=1000");
  $("#main").innerHTML = `<div class="page-head"><h1>Audit log</h1><span class="spacer"></span><div class="search">${icon("search")}<input id="q" placeholder="Search who, what or target" aria-label="Search audit log"></div></div>
    <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Target</th><th class="hide-md">Details</th></tr></thead><tbody id="ab"></tbody></table></div></div>`;
  const fmtDetail = s => { try { const o = JSON.parse(s); return Object.entries(o).filter(([, v]) => v !== null && !(Array.isArray(v) && !v.length)).map(([k, v]) => `${k.replace(/_/g, " ")}: ${Array.isArray(v) ? v.map(x => Array.isArray(x) ? x.join(" → ") : x).join(" → ") : v}`).join("; "); } catch (e) { return s; } };
  const draw = q => {
    const l = entries.filter(e => !q || `${e.actor} ${e.action} ${AUDIT_LABEL[e.action] || ""} ${e.target} ${e.detail}`.toLowerCase().includes(q));
    $("#ab").innerHTML = l.map(e => `<tr><td class="num" style="white-space:nowrap">${when(e.ts)}</td><td>${esc(e.actor)}</td><td>${esc(AUDIT_LABEL[e.action] || e.action.replace("bulk.", "Bulk ").replace(/[._]/g, " "))}</td><td>${esc(e.target)}</td><td class="hide-md muted" style="max-width:420px">${esc(fmtDetail(e.detail))}</td></tr>`).join("") || `<tr><td colspan="5" class="faint">Nothing recorded yet.</td></tr>`;
  };
  draw("");
  $("#q").oninput = e => draw(e.target.value.toLowerCase());
}

// ── Settings (Admins) ──────────────────────────────────────────────────────
async function viewSettings() {
  $("#main").innerHTML = `<div class="loading"><div class="spin"></div></div>`;
  const { settings: s, microsoft } = await api("/api/admin/settings");
  const num = (k, t, h, unit) => `<div class="setting-row"><div class="t"><b>${t}</b><span>${h}</span></div><input type="number" data-k="${k}" value="${s[k]}" aria-label="${t}"><span class="faint" style="width:52px">${unit}</span></div>`;
  $("#main").innerHTML = `<div class="page-head"><h1>Settings</h1><span class="spacer"></span><button class="btn primary" id="save">Save changes</button></div>
    <div id="err" class="form-error" hidden></div>
    <div class="settings-grid">
      <div class="panel"><div class="panel-h"><h2>Sign-in</h2></div><div class="panel-b">
        <div class="setting-row"><div class="t"><b>Email and password</b><span>Turn off once everyone uses Microsoft sign-in.</span></div><label class="switch"><input type="checkbox" data-k="password_login" ${s.password_login ? "checked" : ""}><i></i></label></div>
        <div class="setting-row"><div class="t"><b>Microsoft sign-in</b><span>${microsoft.configured ? "Connected to your Microsoft Entra tenant." : "Not set up. Add the Entra app details to the server settings."}</span>
          <div style="margin-top:6px;font-size:12px" class="faint">Redirect address: <span class="code">${esc(microsoft.redirect_uri)}</span></div></div>${microsoft.configured ? '<span class="chip green">On</span>' : '<span class="chip">Off</span>'}</div></div></div>
      <div class="panel"><div class="panel-h"><h2>Sessions</h2></div><div class="panel-b">
        ${num("session_hours", "Session length", "Everyone signs in again after this.", "hours")}
        ${num("idle_minutes", "Idle sign-out", "Signed out after this much inactivity.", "minutes")}</div></div>
      <div class="panel"><div class="panel-h"><h2>Passwords and lockout</h2></div><div class="panel-b">
        ${num("password_min", "Minimum password length", "Longer is stronger; 12+ recommended.", "chars")}
        ${num("lockout_attempts", "Failed attempts before lock", "The account locks temporarily.", "tries")}
        ${num("lockout_minutes", "Lock duration", "Admins can unlock sooner.", "minutes")}
        ${num("link_hours", "Set-password link validity", "Applies to new links.", "hours")}</div></div>
      <div class="panel"><div class="panel-h"><h2>Data retention</h2></div><div class="panel-b">
        ${num("retention_days", "Keep usage and audit data", "Older records are deleted automatically (UK GDPR storage limitation).", "days")}
        <p class="faint" style="font-size:12.5px;margin:10px 0 0">Usage records hold the user, app, time and a shortened network address only.</p></div></div>
    </div>`;
  $("#save").onclick = async () => {
    const body = {};
    $$("[data-k]").forEach(i => body[i.dataset.k] = i.type === "checkbox" ? i.checked : i.value);
    try { await api("/api/admin/settings", { method: "PATCH", json: body }); $("#err").hidden = true; toast("Settings saved"); }
    catch (ex) { $("#err").textContent = ex.message; $("#err").hidden = false; }
  };
}

boot();
