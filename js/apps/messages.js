// Aplikasi Pesan: daftar percakapan, chat, pesan baru, balasan otomatis.
// Terhubung dengan kontak & panggilan dari aplikasi Telepon.
const MessagesApp = (() => {
  "use strict";

  /* ---------- Util ---------- */
  const P = {
    arrow: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z",
    call: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
    more: "M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    send: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
    chat: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
    person: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  };
  const icon = (n) => `<svg class="ph-i" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const isNum = (n) => /^[\d+*#\s-]+$/.test(n);
  const key = (n) => (isNum(n) ? n.replace(/[^\d+]/g, "").replace(/^\+62/, "0") : n);
  const fmt = (n) => /^0\d+$/.test(n) && n.length > 4
    ? n.replace(/^(\d{4})(\d{0,4})(\d*)$/, (_, a, b, c) => [a, b, c].filter(Boolean).join("-")) : n;
  const hhmm = (ts) => new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");
  const dayDiff = (ts) => { const d = (x) => new Date(x).setHours(0, 0, 0, 0); return Math.round((d(Date.now()) - d(ts)) / 864e5); };
  const dayLabel = (ts) => { const n = dayDiff(ts); return n === 0 ? "Hari ini" : n === 1 ? "Kemarin" : new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "long" }); };
  const listTime = (ts) => { const n = dayDiff(ts); return n === 0 ? hhmm(ts) : n === 1 ? "Kemarin" : new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short" }); };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  const contacts = () => load("phone.contacts", []);
  const contactOf = (n) => contacts().find((c) => key(c.number) === key(n));
  const nameOf = (n) => { const c = contactOf(n); return c ? c.name : isNum(n) ? fmt(n) : n; };
  function avatar(n) {
    const c = contactOf(n);
    if (!c) return `<span class="ph-av" style="background:#9aa0a6">${icon("person")}</span>`;
    const ini = c.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const hue = [...c.name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 360;
    return `<span class="ph-av" style="background:hsl(${hue} 45% 42%)">${esc(ini)}</span>`;
  }

  /* ---------- Data ---------- */
  let threads = load("msg.threads", null);
  if (!threads) {
    const now = Date.now(), m = 6e4, h = 36e5;
    const mk = (number, unread, msgs) => ({ number, unread, msgs: msgs.map(([from, text, ago]) => ({ id: uid(), from, text, ts: now - ago, st: "read" })) });
    threads = {
      "081234560002": mk("081234560002", 1, [["me", "Bu, aku pulang telat ya hari ini", 5 * h], ["them", "Iya nak, hati-hati di jalan", 5 * h - 2 * m], ["them", "Nak, sudah makan belum?", 40 * m]]),
      "081234560004": mk("081234560004", 0, [["me", "Besok jadi ketemu?", 30 * h], ["them", "Jadi, jam 10 ya di tempat biasa", 29 * h]]),
      "INFO-BANK": mk("INFO-BANK", 1, [["them", "Kode OTP Anda 482913. Berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.", 2 * h]]),
    };
    save("msg.threads", threads);
  }
  const persist = () => save("msg.threads", threads);
  const last = (t) => t.msgs[t.msgs.length - 1];

  /* ---------- State ---------- */
  let root = null;
  let nav = { screen: "list", number: null, menu: false, query: "", to: "" };
  const typing = {};

  const active = () => root && window.PhoneOS && PhoneOS.current() === "messages" && root.querySelector(".ms");

  /* ---------- Tampilan ---------- */
  function render() {
    const m = active() && root.querySelector(".ms-main"); if (!m) return;
    m.innerHTML = nav.screen === "thread" ? threadHTML() : nav.screen === "new" ? newHTML() : listHTML();
    if (nav.screen === "thread") { renderMsgs(); const i = root.querySelector("#ms-in"); if (i) i.focus(); }
    if (nav.screen === "new") root.querySelector("#ms-to").focus();
  }

  function listHTML() {
    const menu = nav.menu ? `<div class="ms-menu"><button data-act="read-all">Tandai semua dibaca</button></div>` : "";
    return `<div class="ms-top"><h2>Pesan</h2><div class="ms-menu-wrap"><button class="ph-ib" data-act="menu" aria-label="Menu">${icon("more")}</button>${menu}</div></div>
      <div class="ms-search">🔍<input type="search" placeholder="Cari percakapan" value="${esc(nav.query)}"></div>
      <div class="ms-list">${rowsHTML()}</div>
      <button class="ms-fab" data-act="new">${icon("chat")}Mulai chat</button>`;
  }
  function rowsHTML() {
    const q = nav.query.trim().toLowerCase();
    const list = Object.values(threads).filter((t) => t.msgs.length &&
      (!q || nameOf(t.number).toLowerCase().includes(q) || t.msgs.some((m) => m.text.toLowerCase().includes(q))))
      .sort((a, b) => last(b).ts - last(a).ts);
    if (!list.length) return `<div class="ms-empty"><b>${q ? "Tidak ada hasil" : "Belum ada percakapan"}</b>${q ? "Coba kata kunci lain." : "Ketuk Mulai chat untuk mengirim pesan."}</div>`;
    return list.map((t) => {
      const l = last(t);
      return `<div class="ms-row ${t.unread ? "unread" : ""}" data-act="open-thread" data-number="${esc(t.number)}">${avatar(t.number)}
        <div class="t"><b>${esc(nameOf(t.number))}</b><span>${l.from === "me" ? "Kamu: " : ""}${esc(l.text)}</span></div>
        <div class="meta"><small>${listTime(l.ts)}</small>${t.unread ? `<i>${t.unread}</i>` : ""}</div></div>`;
    }).join("");
  }

  function threadHTML() {
    const n = nav.number, ro = !isNum(n), c = contactOf(n);
    const menu = nav.menu ? `<div class="ms-menu">${!c && !ro ? `<button data-act="add-contact">Tambah ke kontak</button>` : ""}<button data-act="delete-thread">Hapus percakapan</button></div>` : "";
    return `<div class="ms-bar"><button class="ph-ib" data-act="back" aria-label="Kembali">${icon("arrow")}</button>${avatar(n)}
      <div class="t"><b>${esc(nameOf(n))}</b><small>${c || ro ? (c ? fmt(n) : "") : ""}</small></div>
      ${ro ? "" : `<button class="ph-ib" data-act="call" aria-label="Telepon">${icon("call")}</button>`}
      <div class="ms-menu-wrap"><button class="ph-ib" data-act="menu" aria-label="Menu">${icon("more")}</button>${menu}</div></div>
      <div class="ms-msgs" id="ms-msgs"></div>
      ${ro ? `<div class="ms-ro">Tidak dapat membalas pesan ini</div>`
        : `<div class="ms-compose"><input id="ms-in" placeholder="Pesan teks" autocomplete="off"><button class="ms-send" data-act="send" aria-label="Kirim">${icon("send")}</button></div>`}`;
  }
  function renderMsgs() {
    const el = root.querySelector("#ms-msgs"); if (!el) return;
    const t = threads[key(nav.number)], msgs = t ? t.msgs : [];
    let h = "", day = "", lastMe = -1;
    msgs.forEach((m, i) => { if (m.from === "me") lastMe = i; });
    msgs.forEach((m, i) => {
      const dl = dayLabel(m.ts);
      if (dl !== day) { h += `<div class="ms-day">${dl}</div>`; day = dl; }
      h += `<div class="ms-b ${m.from}">${esc(m.text)}<small>${hhmm(m.ts)}</small></div>`;
      if (i === lastMe) h += `<div class="ms-st">${{ sending: "Mengirim…", sent: "Terkirim", read: "Dibaca" }[m.st] || ""}</div>`;
    });
    if (!msgs.length) h = `<div class="ms-empty"><b>Mulai percakapan</b>Kirim pesan pertamamu ke ${esc(nameOf(nav.number))}.</div>`;
    if (typing[key(nav.number)] > 0) h += `<div class="ms-b them typing"><i></i><i></i><i></i></div>`;
    el.innerHTML = h; el.scrollTop = el.scrollHeight;
  }

  function newHTML() {
    return `<div class="ms-bar"><button class="ph-ib" data-act="back" aria-label="Kembali">${icon("arrow")}</button><div class="t"><b>Pesan baru</b></div></div>
      <div class="ms-to"><span>Kepada</span><input id="ms-to" placeholder="Nama atau nomor" autocomplete="off" value="${esc(nav.to)}"></div>
      <div class="ms-sug">${sugHTML()}</div>`;
  }
  function sugHTML() {
    const q = nav.to.trim().toLowerCase(), qd = q.replace(/\D/g, "");
    let out = "";
    if (/^[\d+]{3,}$/.test(q) && !contacts().some((c) => key(c.number) === key(q)))
      out += `<div class="ms-row" data-act="open-thread" data-number="${esc(q)}"><span class="ph-av" style="background:#d3e3fd;color:#0b57d0">＋</span><div class="t"><b>Kirim ke ${esc(fmt(q))}</b></div></div>`;
    contacts().filter((c) => !q || c.name.toLowerCase().includes(q) || (qd && key(c.number).includes(qd)))
      .sort((a, b) => a.name.localeCompare(b.name, "id")).forEach((c) => {
        out += `<div class="ms-row" data-act="open-thread" data-number="${esc(c.number)}">${avatar(c.number)}<div class="t"><b>${esc(c.name)}</b><span>${fmt(c.number)}</span></div></div>`;
      });
    return out || `<div class="ms-empty"><b>Kontak tidak ditemukan</b>Ketik nomor lengkap untuk mengirim pesan.</div>`;
  }

  function toast(t) {
    const el = root.querySelector(".ms-toast"); if (!el) return;
    el.textContent = t; el.hidden = false; clearTimeout(toast.id); toast.id = setTimeout(() => (el.hidden = true), 2000);
  }

  /* ---------- Logika pesan ---------- */
  function openThread(number) {
    const t = threads[key(number)];
    nav.number = t ? t.number : number; nav.screen = "thread"; nav.menu = false;
    if (t && t.unread) { t.unread = 0; persist(); }
    render();
  }

  function refresh(k) {
    if (!active()) return;
    if (nav.screen === "thread" && key(nav.number) === k) renderMsgs();
    else if (nav.screen === "list") { const l = root.querySelector(".ms-list"); if (l) l.innerHTML = rowsHTML(); }
  }

  function replyFor(text) {
    const s = text.toLowerCase();
    if (/\b(halo|hai|hi|hello)\b/.test(s)) return "Halo juga! 👋";
    if (/apa kabar|gimana kabar/.test(s)) return "Baik, kamu gimana?";
    if (/makasih|terima kasih|thanks/.test(s)) return "Sama-sama 😊";
    if (/kapan|jam berapa/.test(s)) return "Nanti aku kabari ya.";
    if (/dimana|di mana/.test(s)) return "Lagi di jalan, sebentar lagi sampai.";
    if (s.includes("?")) return "Hmm, aku cek dulu ya.";
    return pick(["Oke 👍", "Siap!", "Haha iya", "Sip, noted", "Oke, nanti ya"]);
  }

  function deliver(k, text) {
    const t = threads[k], open = active() && nav.screen === "thread" && key(nav.number) === k;
    t.msgs.push({ id: uid(), from: "them", text, ts: Date.now(), st: "read" });
    if (!open) {
      t.unread++;
      if (!(window.PhoneOS && PhoneOS.current() === "messages"))
        PhoneOS.notify({ icon: "💬", title: nameOf(t.number), text, onClick: () => PhoneOS.open("messages", { number: t.number }) });
    }
    persist(); refresh(k);
  }

  function send(text) {
    const number = nav.number, k = key(number);
    const t = threads[k] || (threads[k] = { number, unread: 0, msgs: [] });
    const m = { id: uid(), from: "me", text, ts: Date.now(), st: "sending" };
    t.msgs.push(m); persist(); renderMsgs();
    setTimeout(() => { m.st = "sent"; persist(); refresh(k); }, 500);
    if (!contactOf(number)) return; // hanya kontak yang membalas
    setTimeout(() => {
      m.st = "read"; typing[k] = (typing[k] || 0) + 1; persist(); refresh(k);
      setTimeout(() => { typing[k]--; deliver(k, replyFor(text)); }, 1200 + Math.random() * 1500);
    }, 1500 + Math.random() * 1500);
  }

  function goBack() {
    if (nav.menu) { nav.menu = false; render(); return true; }
    if (nav.screen !== "list") { nav.screen = "list"; nav.to = ""; render(); return true; }
    return false;
  }

  function onClick(e) {
    const el = e.target.closest("[data-act]"), wasMenu = nav.menu;
    nav.menu = false;
    if (!el) { if (wasMenu) render(); return; }
    const a = el.dataset.act, d = el.dataset;
    switch (a) {
      case "menu": nav.menu = !wasMenu; render(); break;
      case "back": goBack(); break;
      case "new": nav.screen = "new"; nav.to = ""; render(); break;
      case "open-thread": nav.to = ""; openThread(d.number); break;
      case "send": {
        const i = root.querySelector("#ms-in"), v = i.value.trim();
        if (v) { i.value = ""; send(v); }
        i.focus(); break;
      }
      case "call": PhoneOS.open("phone", { call: nav.number }); break;
      case "add-contact": PhoneOS.open("phone", { newContact: nav.number }); break;
      case "read-all": Object.values(threads).forEach((t) => (t.unread = 0)); persist(); render(); toast("Semua pesan ditandai dibaca"); break;
      case "delete-thread":
        if (confirm("Hapus percakapan ini?")) { delete threads[key(nav.number)]; persist(); nav.screen = "list"; render(); toast("Percakapan dihapus"); }
        break;
    }
  }

  function bind(el) {
    el.addEventListener("click", onClick);
    el.addEventListener("input", (e) => {
      if (e.target.matches(".ms-search input")) { nav.query = e.target.value; root.querySelector(".ms-list").innerHTML = rowsHTML(); }
      if (e.target.matches("#ms-to")) { nav.to = e.target.value; root.querySelector(".ms-sug").innerHTML = sugHTML(); }
    });
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (e.target.id === "ms-in") { e.preventDefault(); onClick({ target: root.querySelector("[data-act=send]") }); }
      if (e.target.id === "ms-to") { const q = nav.to.trim(); if (/^[\d+]{3,}$/.test(q)) openThread(q); }
    });
  }

  return {
    bare: true,
    mount(container, params = {}) {
      root = container;
      root.innerHTML = `<div class="ms"><div class="ms-main"></div><div class="ms-toast" hidden></div></div>`;
      bind(root.querySelector(".ms"));
      nav.menu = false; nav.screen = "list"; nav.query = "";
      if (params.number) { nav.number = params.number; nav.screen = "thread"; const t = threads[key(params.number)]; if (t) { nav.number = t.number; t.unread = 0; persist(); } }
      render();
    },
    onBack: goBack,
    badge: () => Object.values(threads).filter((t) => t.unread > 0).length,
  };
})();
