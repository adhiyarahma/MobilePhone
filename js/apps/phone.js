// Aplikasi Telepon: keypad, panggilan, riwayat, kontak, favorit.
// Data disimpan di localStorage (kontak & riwayat).
const PhoneApp = (() => {
  "use strict";

  /* ---------- Util ---------- */
  const P = {
    call: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
    end: "M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.99.99 0 0 1 0-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z",
    star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
    history: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
    person: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    dialpad: "M12 19a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-6 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    more: "M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    arrow: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z",
    made: "M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z",
    received: "M20 5.41L18.59 4 7 15.59V9H5v10h10v-2H8.41z",
    missed: "M19.59 7L12 14.59 6.41 9H11V7H3v8h2v-4.59l7 7 9-9z",
    backspace: "M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12z",
  };
  const icon = (n, c = "") => `<svg class="ph-i ${c}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const norm = (n) => n.replace(/[^\d+]/g, "").replace(/^\+62/, "0");
  const clock = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  const hhmm = (d) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");
  const byName = (a, b) => a.name.localeCompare(b.name, "id");
  const fmt = (n) => /^0\d+$/.test(n) && n.length > 4
    ? n.replace(/^(\d{4})(\d{0,4})(\d*)$/, (_, a, b, c) => [a, b, c].filter(Boolean).join("-")) : n;

  function when(ts) {
    const d = new Date(ts), day = (x) => new Date(x).setHours(0, 0, 0, 0);
    const diff = Math.round((day(Date.now()) - day(ts)) / 864e5);
    if (diff === 0) return hhmm(d);
    if (diff === 1) return "Kemarin, " + hhmm(d);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + ", " + hhmm(d);
  }

  const KEYS = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];
  const DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], "*": [941, 1209], 0: [941, 1336], "#": [941, 1477] };
  const TYPE = { out: ["Keluar", "made"], in: ["Masuk", "received"], missed: ["Tak terjawab", "missed"], rejected: ["Ditolak", "missed"] };

  /* ---------- Data ---------- */
  let contacts = load("phone.contacts", null);
  if (!contacts) {
    const mk = (name, number, fav = false) => ({ id: uid(), name, number, fav });
    contacts = [mk("Ayah", "081234560001", true), mk("Ibu", "081234560002", true), mk("Adit", "081234560003"),
      mk("Budi Santoso", "081234560004"), mk("Citra Lestari", "081234560005", true), mk("Dewi Anggraini", "081234560006"),
      mk("Eko Prasetyo", "081234560007"), mk("Fajar Nugraha", "081234560008"), mk("Gita Permata", "081234560009")];
    save("phone.contacts", contacts);
  }
  let recents = load("phone.recents", null);
  if (!recents) {
    const now = Date.now(), m = 6e4;
    recents = [
      { type: "in", number: contacts[1].number, ts: now - 25 * m, dur: 312 },
      { type: "missed", number: contacts[3].number, ts: now - 3 * 36e5, dur: 0 },
      { type: "out", number: contacts[0].number, ts: now - 26 * 36e5, dur: 95 },
      { type: "in", number: "081299990000", ts: now - 50 * 36e5, dur: 40 },
    ].map((r) => ({ id: uid(), ...r }));
    save("phone.recents", recents);
  }
  const saveContacts = () => save("phone.contacts", contacts);
  const saveRecents = () => save("phone.recents", recents);
  const byNumber = (n) => contacts.find((c) => norm(c.number) === norm(n));
  const byId = (id) => contacts.find((c) => c.id === id);

  /* ---------- State ---------- */
  let root = null;
  let nav = { tab: "recents", screen: "main", filter: "all", query: "", contactId: null, editing: null, menu: false };
  let dial = "", call = null, timers = [], tickId = null, toastId = null, holdId = null, cleared = false, audio = null;

  /* ---------- Suara ---------- */
  function tone(freqs, ms = 120) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const g = audio.createGain(); g.gain.value = 0.06; g.connect(audio.destination);
      freqs.forEach((f) => { const o = audio.createOscillator(); o.frequency.value = f; o.connect(g); o.start(); o.stop(audio.currentTime + ms / 1000); });
    } catch {}
  }

  /* ---------- Tampilan umum ---------- */
  function avatar(c, size = "") {
    if (!c) return `<span class="ph-av ${size}" style="background:#9aa0a6">${icon("person")}</span>`;
    const ini = c.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const hue = [...c.name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 360;
    return `<span class="ph-av ${size}" style="background:hsl(${hue} 45% 42%)">${esc(ini)}</span>`;
  }
  const empty = (t, s) => `<div class="ph-empty"><b>${t}</b>${s}</div>`;

  function render() {
    const m = root && root.querySelector(".ph-main");
    if (!m) return;
    m.innerHTML = nav.screen === "keypad" ? keypadView() : nav.screen === "detail" ? detailView()
      : nav.screen === "edit" ? editView() : tabsView();
    if (nav.screen === "keypad") updateDial();
  }

  function tabsView() {
    const titles = { favorites: "Favorit", recents: "Terbaru", contacts: "Kontak" };
    const body = nav.tab === "favorites" ? favView() : nav.tab === "recents" ? recentsView() : contactsView();
    const tab = (id, ic) => `<button class="ph-tab ${nav.tab === id ? "on" : ""}" data-act="tab" data-tab="${id}"><span class="pill">${icon(ic)}</span>${titles[id]}</button>`;
    const menu = nav.menu ? `<div class="ph-menu"><button data-act="clear-recents">Hapus riwayat panggilan</button><button data-act="sim-incoming">Simulasi panggilan masuk</button></div>` : "";
    return `<div class="ph-top"><h2>${titles[nav.tab]}</h2><div class="ph-menu-wrap"><button class="ph-ib" data-act="menu" aria-label="Menu">${icon("more")}</button>${menu}</div></div>
      <div class="ph-scroll">${body}</div>
      <button class="ph-fab" data-act="open-keypad" aria-label="Keypad">${icon("dialpad")}</button>
      <nav class="ph-tabs">${tab("favorites", "star")}${tab("recents", "history")}${tab("contacts", "person")}</nav>`;
  }

  function favView() {
    const f = contacts.filter((c) => c.fav).sort(byName);
    if (!f.length) return empty("Belum ada favorit", "Buka sebuah kontak lalu ketuk Favorit.");
    return `<div class="ph-favgrid">${f.map((c) => `<button class="ph-fav" data-act="call" data-number="${esc(c.number)}">${avatar(c, "lg")}<span>${esc(c.name.split(" ")[0])}</span></button>`).join("")}</div>`;
  }

  function recentRow(r) {
    const c = byNumber(r.number), [label, ic] = TYPE[r.type], miss = r.type === "missed";
    return `<div class="ph-row ${miss ? "missed" : ""}" data-act="call" data-number="${esc(r.number)}">${avatar(c)}
      <div class="t"><b>${esc(c ? c.name : fmt(r.number))}</b><small>${icon(ic, miss ? "missed" : "")}${label}, ${when(r.ts)}${r.dur ? " · " + clock(r.dur) : ""}</small></div>
      <button class="ph-ib" data-act="${c ? "detail" : "new-contact"}" data-id="${c ? c.id : ""}" data-number="${esc(r.number)}" aria-label="${c ? "Info" : "Tambah kontak"}">${c ? "ⓘ" : "＋"}</button></div>`;
  }

  function recentsView() {
    const list = recents.filter((r) => nav.filter === "all" || r.type === "missed");
    const chip = (f, t) => `<button class="ph-chip ${nav.filter === f ? "on" : ""}" data-act="filter" data-f="${f}">${t}</button>`;
    return `<div class="ph-chips">${chip("all", "Semua")}${chip("missed", "Tak terjawab")}</div>` +
      (list.length ? list.map(recentRow).join("") : empty("Belum ada panggilan", "Riwayat panggilan akan muncul di sini."));
  }

  function contactsView() {
    return `<div class="ph-search">🔍<input type="search" placeholder="Cari kontak" value="${esc(nav.query)}"></div><div class="ph-clist">${contactsListHTML()}</div>`;
  }
  function contactsListHTML() {
    const q = nav.query.trim().toLowerCase(), qd = q.replace(/\D/g, "");
    const list = contacts.filter((c) => !q || c.name.toLowerCase().includes(q) || (qd && norm(c.number).includes(qd))).sort(byName);
    let out = `<div class="ph-row" data-act="new-contact"><span class="ph-av" style="background:#d3e3fd;color:#0b57d0">＋</span><div class="t"><b>Buat kontak baru</b></div></div>`, last = "";
    list.forEach((c) => {
      const L = /[a-z]/i.test(c.name[0]) ? c.name[0].toUpperCase() : "#";
      if (L !== last) { out += `<div class="ph-letter">${L}</div>`; last = L; }
      out += `<div class="ph-row" data-act="detail" data-id="${c.id}">${avatar(c)}<div class="t"><b>${esc(c.name)}</b></div></div>`;
    });
    return list.length ? out : out + empty("Kontak tidak ditemukan", "Coba kata kunci lain.");
  }

  /* ---------- Keypad ---------- */
  function keypadView() {
    return `<div class="ph-kp"><button class="ph-ib" data-act="back" aria-label="Kembali">${icon("arrow")}</button>
      <div class="ph-kp-display"><div class="ph-kp-sub" id="kp-sub"></div><div class="ph-kp-num" id="kp-num"></div></div>
      <div class="ph-pad">${KEYS.map(([k, l]) => `<button class="ph-key" data-act="key" data-k="${k}"><b>${k}</b><small>${l}</small></button>`).join("")}</div>
      <div class="ph-kp-actions"><span></span><button class="ph-callbtn" data-act="dial-call" aria-label="Telepon">${icon("call")}</button><button class="ph-ib" id="kp-del" data-act="del" aria-label="Hapus">${icon("backspace")}</button></div></div>`;
  }
  function updateDial() {
    const num = root.querySelector("#kp-num"); if (!num) return;
    num.textContent = fmt(dial);
    const nd = norm(dial), ex = dial && byNumber(dial);
    let h = "";
    if (ex) h = esc(ex.name);
    else if (nd.length >= 2) {
      const p = contacts.find((c) => norm(c.number).startsWith(nd));
      if (p) h = `<button data-act="fill" data-number="${esc(p.number)}">${esc(p.name)} · ${fmt(p.number)}</button>`;
      else if (nd.length >= 3) h = `<button data-act="new-contact" data-number="${esc(dial)}">Tambah ke kontak</button>`;
    }
    root.querySelector("#kp-sub").innerHTML = h;
    root.querySelector("#kp-del").style.visibility = dial ? "visible" : "hidden";
  }

  /* ---------- Detail & edit kontak ---------- */
  function detailView() {
    const c = byId(nav.contactId);
    if (!c) { nav.screen = "main"; return tabsView(); }
    const hist = recents.filter((r) => norm(r.number) === norm(c.number)).slice(0, 5);
    const act = (a, ic, t, on = "") => `<button class="${on}" data-act="${a}" data-id="${c.id}" data-number="${esc(c.number)}">${ic}<span>${t}</span></button>`;
    return `<div class="ph-det-bar"><button class="ph-ib" data-act="back" aria-label="Kembali">${icon("arrow")}</button><span></span>
      <button class="ph-ib" data-act="edit" data-id="${c.id}" aria-label="Ubah">✎</button><button class="ph-ib" data-act="delete" data-id="${c.id}" aria-label="Hapus">🗑</button></div>
      <div class="ph-scroll"><div class="ph-hero">${avatar(c, "xl")}<h2>${esc(c.name)}</h2><p>${fmt(c.number)}</p></div>
      <div class="ph-actions">${act("call", icon("call"), "Telepon")}${act("sms", "💬", "Pesan")}${act("fav", icon("star", c.fav ? "" : "outline"), "Favorit", c.fav ? "on" : "")}</div>
      <div class="ph-sec">Riwayat</div>${hist.length ? hist.map((r) => `<div class="ph-row"><div class="t"><b>${TYPE[r.type][0]}</b><small>${when(r.ts)}${r.dur ? " · " + clock(r.dur) : ""}</small></div></div>`).join("") : `<div class="ph-row"><div class="t"><small>Belum ada panggilan</small></div></div>`}</div>`;
  }

  function editView() {
    const e = nav.editing;
    return `<div class="ph-top"><h2>${e.id ? "Ubah kontak" : "Kontak baru"}</h2></div>
      <div class="ph-form"><label>Nama<input id="ed-name" value="${esc(e.name)}" autocomplete="off"></label>
      <label>Nomor telepon<input id="ed-num" type="tel" value="${esc(e.number)}" autocomplete="off"></label>
      <div class="ph-btns"><button class="ph-btn" data-act="back">Batal</button><button class="ph-btn pri" data-act="save">Simpan</button></div></div>`;
  }
  function saveContact() {
    const name = root.querySelector("#ed-name").value.trim();
    const number = root.querySelector("#ed-num").value.trim().replace(/[\s-]/g, "");
    if (!name || !number) return toast("Isi nama dan nomor");
    if (!/^[\d+*#]+$/.test(number)) return toast("Nomor tidak valid");
    const e = nav.editing;
    if (e.id) { const c = byId(e.id); c.name = name; c.number = number; }
    else { e.id = uid(); contacts.push({ id: e.id, name, number, fav: false }); }
    saveContacts();
    nav.contactId = e.id; nav.screen = "detail"; render(); toast("Kontak disimpan");
  }

  function toast(t) {
    const el = root.querySelector(".ph-toast"); if (!el) return;
    el.textContent = t; el.hidden = false;
    clearTimeout(toastId); toastId = setTimeout(() => (el.hidden = true), 2000);
  }

  /* ---------- Panggilan ---------- */
  const elapsed = () => Math.round((Date.now() - call.t0) / 1000);
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const stopAll = () => { timers.forEach(clearTimeout); timers = []; clearInterval(tickId); tickId = null; };
  const newCall = (dir, number, state) => ({ dir, number, state, startedAt: Date.now(), answered: false, muted: false, speaker: false, hold: false, pad: false, dtmf: "", t0: 0 });

  function statusText() {
    return { dialing: "Memanggil…", ringing: "Berdering…", incoming: "Panggilan masuk", noanswer: "Tidak ada jawaban" }[call.state]
      || (call.state === "active" ? (call.hold ? "Ditahan · " : "") + clock(elapsed()) : "Panggilan berakhir");
  }
  function updatePill() {
    const p = document.getElementById("call-pill"); if (!p) return;
    p.hidden = !call || call.ending;
    if (!p.hidden) p.textContent = "📞 " + (call.state === "active" ? clock(elapsed()) : statusText());
  }
  function tick() {
    const s = root && root.querySelector("#ph-status");
    if (s && call) s.textContent = statusText();
    updatePill();
  }

  function startCall(number) {
    number = (number || "").trim();
    if (!number) return;
    if (call) { toast("Sedang dalam panggilan"); return renderCall(); }
    call = newCall("out", number, "dialing"); renderCall();
    later(1400, () => {
      call.state = "ringing"; renderCall();
      if (Math.random() < 0.8) later(2500 + Math.random() * 2500, answer);
      else later(7000, () => finish("noanswer"));
    });
  }
  function simulateIncoming() {
    if (call) return toast("Sedang dalam panggilan");
    const pool = [...contacts.map((c) => c.number), "081299990000"];
    call = newCall("in", pool[Math.floor(Math.random() * pool.length)], "incoming");
    later(20000, () => finish("missed")); renderCall();
  }
  function answer() {
    if (!call || call.ending) return;
    stopAll(); call.state = "active"; call.answered = true; call.t0 = Date.now();
    tickId = setInterval(tick, 1000); renderCall();
  }
  function finish(reason) {
    if (!call || call.ending) return;
    stopAll();
    const type = call.dir === "out" ? "out" : call.answered ? "in" : reason === "missed" ? "missed" : "rejected";
    recents.unshift({ id: uid(), number: call.number, type, ts: call.startedAt, dur: call.answered ? elapsed() : 0 });
    recents = recents.slice(0, 100); saveRecents();
    call.state = reason === "noanswer" ? "noanswer" : "ended"; call.ending = true; renderCall();
    later(1200, () => { call = null; renderCall(); render(); });
  }

  function renderCall() {
    const el = root && root.querySelector(".ph-call"); if (!el) return updatePill();
    const scr = document.getElementById("screen");
    if (!call) { el.hidden = true; el.innerHTML = ""; scr.classList.remove("in-call"); return updatePill(); }
    el.hidden = false; scr.classList.add("in-call");
    const c = byNumber(call.number);
    const end = `<button class="ph-round red" data-act="end" aria-label="Akhiri">${icon("end")}</button>`;
    const ctrl = (a, g, t, on) => `<button class="ph-ctrl ${on ? "on" : ""}" data-act="${a}"><span class="c">${g}</span>${t}</button>`;
    let mid = "";
    if (call.ending) mid = "";
    else if (call.state === "incoming")
      mid = `<div class="ph-inc"><button class="ph-round red" data-act="decline" aria-label="Tolak">${icon("end")}</button><button class="ph-round green" data-act="answer" aria-label="Jawab">${icon("call")}</button></div>`;
    else if (call.pad)
      mid = `<div class="ph-dtmf" id="ph-dtmf">${esc(call.dtmf)}</div><div class="ph-pad">${KEYS.map(([k, l]) => `<button class="ph-key" data-act="ckey" data-k="${k}"><b>${k}</b><small>${l}</small></button>`).join("")}</div><button class="ph-link" data-act="hidepad">Sembunyikan</button>${end}`;
    else
      mid = `<div class="ph-ctrls">${ctrl("mute", "🔇", "Bisukan", call.muted)}${ctrl("showpad", "⌨️", "Keypad", false)}${ctrl("speaker", "🔊", "Speaker", call.speaker)}${ctrl("hold", "⏸", "Tahan", call.hold)}</div>${end}`;
    el.innerHTML = `<div class="ph-call-top">${avatar(c, "xl")}<h2>${esc(c ? c.name : fmt(call.number))}</h2><p id="ph-status">${statusText()}</p></div><div class="ph-call-mid">${mid}</div>`;
    updatePill();
  }

  /* ---------- Navigasi & event ---------- */
  function goBack() {
    if (call && call.pad) { call.pad = false; renderCall(); return true; }
    if (nav.menu) { nav.menu = false; render(); return true; }
    if (nav.screen === "edit") { nav.screen = nav.editing.id ? "detail" : "main"; render(); return true; }
    if (nav.screen !== "main") { nav.screen = "main"; render(); return true; }
    return false;
  }

  function onClick(e) {
    const el = e.target.closest("[data-act]"), wasMenu = nav.menu;
    nav.menu = false;
    if (!el) { if (wasMenu) render(); return; }
    const a = el.dataset.act, d = el.dataset;
    switch (a) {
      case "tab": nav.tab = d.tab; nav.query = ""; render(); break;
      case "menu": nav.menu = !wasMenu; render(); break;
      case "filter": nav.filter = d.f; render(); break;
      case "open-keypad": dial = ""; nav.screen = "keypad"; render(); break;
      case "back": goBack(); break;
      case "key": if (dial.length < 20) { dial += d.k; tone(DTMF[d.k]); updateDial(); } break;
      case "del": if (cleared) { cleared = false; break; } dial = dial.slice(0, -1); updateDial(); break;
      case "fill": dial = d.number; updateDial(); break;
      case "dial-call": {
        if (!dial) { const last = recents.find((r) => r.type === "out"); if (last) { dial = last.number; updateDial(); } break; }
        startCall(dial); break;
      }
      case "call": startCall(d.number); break;
      case "detail": nav.contactId = d.id; nav.screen = "detail"; render(); break;
      case "new-contact": nav.editing = { id: null, name: "", number: d.number || "" }; nav.screen = "edit"; render(); break;
      case "edit": nav.editing = { ...byId(d.id) }; nav.screen = "edit"; render(); break;
      case "save": saveContact(); break;
      case "fav": { const c = byId(d.id); c.fav = !c.fav; saveContacts(); render(); toast(c.fav ? "Ditambahkan ke favorit" : "Dihapus dari favorit"); break; }
      case "sms": PhoneOS.open("messages", { number: d.number }); break;
      case "delete": {
        const c = byId(d.id);
        if (confirm(`Hapus kontak "${c.name}"?`)) { contacts = contacts.filter((x) => x.id !== c.id); saveContacts(); nav.screen = "main"; nav.tab = "contacts"; render(); toast("Kontak dihapus"); }
        break;
      }
      case "clear-recents":
        if (confirm("Hapus semua riwayat panggilan?")) { recents = []; saveRecents(); render(); }
        break;
      case "sim-incoming": simulateIncoming(); break;
      // Layar panggilan
      case "answer": answer(); break;
      case "decline": finish("rejected"); break;
      case "end": finish("ended"); break;
      case "mute": call.muted = !call.muted; renderCall(); break;
      case "speaker": call.speaker = !call.speaker; renderCall(); break;
      case "hold": call.hold = !call.hold; renderCall(); tick(); break;
      case "showpad": call.pad = true; renderCall(); break;
      case "hidepad": call.pad = false; renderCall(); break;
      case "ckey": call.dtmf += d.k; tone(DTMF[d.k]); root.querySelector("#ph-dtmf").textContent = call.dtmf; break;
    }
  }

  function bind(el) {
    el.addEventListener("click", onClick);
    el.addEventListener("input", (e) => {
      if (e.target.matches(".ph-search input")) {
        nav.query = e.target.value;
        root.querySelector(".ph-clist").innerHTML = contactsListHTML();
      }
    });
    // Tahan tombol hapus untuk mengosongkan nomor
    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest("#kp-del")) holdId = setTimeout(() => { dial = ""; cleared = true; updateDial(); }, 600);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, () => clearTimeout(holdId)));
  }

  /* ---------- API untuk main.js ---------- */
  return {
    bare: true,
    mount(container, params = {}) {
      root = container;
      root.innerHTML = `<div class="ph"><div class="ph-main"></div><div class="ph-call" hidden></div><div class="ph-toast" hidden></div></div>`;
      bind(root.querySelector(".ph"));
      nav.menu = false; render(); renderCall();
      if (params.newContact) { nav.editing = { id: null, name: "", number: params.newContact }; nav.screen = "edit"; render(); }
      if (params.call) startCall(params.call);
    },
    onBack: goBack,
  };
})();
