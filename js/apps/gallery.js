// Aplikasi Galeri: grid per hari, penampil foto (geser), favorit, info, simpan, hapus,
// mode pilih (tahan foto) dan impor dari perangkat.
const GalleryApp = (() => {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ARROW = "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z";
  const back = `<svg class="ph-i" viewBox="0 0 24 24" aria-hidden="true"><path d="${ARROW}"/></svg>`;
  const dayDiff = (ts) => { const d = (x) => new Date(x).setHours(0, 0, 0, 0); return Math.round((d(Date.now()) - d(ts)) / 864e5); };
  const dayLabel = (ts) => { const n = dayDiff(ts); return n === 0 ? "Hari ini" : n === 1 ? "Kemarin" : new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); };
  const hhmm = (ts) => new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");
  const bytes = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

  let root = null, photos = [], loading = true, error = false;
  let nav = { screen: "grid", filter: "all", select: null, idx: 0, info: false, menu: false };
  let holdId = null, longFired = false, swipeX = null, toastId = null;

  const visible = () => (nav.filter === "fav" ? photos.filter((p) => p.fav) : photos);
  const active = () => root && PhoneOS.current() === "gallery" && root.querySelector(".gl");

  async function reload() {
    try { await PhotoStore.seedOnce(); photos = await PhotoStore.all(); error = false; }
    catch { error = true; }
    loading = false;
  }

  function render() {
    const m = active() && root.querySelector(".gl-main"); if (!m) return;
    m.innerHTML = nav.screen === "viewer" ? viewerHTML() : gridHTML();
    PhoneOS.setDark(nav.screen === "viewer");
  }

  /* ---------- Grid ---------- */
  function gridHTML() {
    const list = visible(), sel = nav.select;
    const menu = nav.menu ? `<div class="gl-menu"><button data-act="start-select">Pilih foto</button><button data-act="import">Tambah dari perangkat</button></div>` : "";
    const top = sel
      ? `<div class="gl-top"><button class="ph-ib" data-act="cancel-select" aria-label="Batal">✕</button><h2>${sel.size} dipilih</h2><span></span>
          <button class="ph-ib" data-act="sel-fav" aria-label="Favorit">♥</button><button class="ph-ib" data-act="sel-del" aria-label="Hapus">🗑</button></div>`
      : `<div class="gl-top"><div><h2>Galeri</h2><small>${photos.length} foto</small></div><span></span>
          <div class="gl-menu-wrap"><button class="ph-ib" data-act="menu" aria-label="Menu">⋮</button>${menu}</div></div>`;
    const chip = (f, t) => `<button class="gl-chip ${nav.filter === f ? "on" : ""}" data-act="filter" data-f="${f}">${t}</button>`;
    let body = "";
    if (loading) body = `<div class="gl-empty">Memuat foto…</div>`;
    else if (error) body = `<div class="gl-empty"><b>Penyimpanan foto tidak tersedia</b>Browser memblokir IndexedDB.</div>`;
    else if (!list.length) body = nav.filter === "fav"
      ? `<div class="gl-empty"><b>Belum ada favorit</b>Buka foto lalu ketuk ♥.</div>`
      : `<div class="gl-empty"><b>Belum ada foto</b>Ambil foto dengan Kamera.<br><button class="gl-btn" data-act="open-camera">Buka Kamera</button></div>`;
    else {
      let day = "", open = false;
      list.forEach((p) => {
        const dl = dayLabel(p.ts);
        if (dl !== day) { if (open) body += "</div>"; body += `<div class="gl-day">${dl}</div><div class="gl-grid">`; day = dl; open = true; }
        const on = sel && sel.has(p.id);
        body += `<button class="gl-cell ${on ? "sel" : ""}" data-act="cell" data-id="${p.id}"><img src="${PhotoStore.url(p)}" alt="" loading="lazy">${p.fav ? `<i class="fav">♥</i>` : ""}${sel ? `<i class="chk">${on ? "✓" : ""}</i>` : ""}</button>`;
      });
      if (open) body += "</div>";
    }
    return `${top}<div class="gl-chips">${chip("all", "Semua")}${chip("fav", "Favorit")}</div><div class="gl-scroll">${body}</div>`;
  }

  /* ---------- Penampil ---------- */
  function viewerHTML() {
    const list = visible(), p = list[nav.idx];
    if (!p) { nav.screen = "grid"; return gridHTML(); }
    const act = (a, g, t, on = "") => `<button class="${on}" data-act="${a}"><b>${g}</b><span>${t}</span></button>`;
    const info = nav.info ? `<div class="gl-info"><h3>Detail</h3><dl>
      <dt>Nama</dt><dd>${esc(p.name)}</dd><dt>Tanggal</dt><dd>${dayLabel(p.ts)}, ${hhmm(p.ts)}</dd>
      <dt>Resolusi</dt><dd>${p.w} × ${p.h}</dd><dt>Ukuran</dt><dd>${bytes(p.size)}</dd><dt>Sumber</dt><dd>${esc(p.src || "-")}</dd></dl>
      <button class="gl-btn" data-act="info">Tutup</button></div>` : "";
    return `<div class="gl-viewer"><div class="gl-vtop"><button class="ph-ib" data-act="close-viewer" aria-label="Kembali">${back}</button>
        <div><b>${dayLabel(p.ts)}</b><small>${hhmm(p.ts)} · ${nav.idx + 1}/${list.length}</small></div></div>
      <div class="gl-stage"><img src="${PhotoStore.url(p)}" alt="">
        ${nav.idx > 0 ? `<button class="gl-nav prev" data-act="prev" aria-label="Sebelumnya">‹</button>` : ""}
        ${nav.idx < list.length - 1 ? `<button class="gl-nav next" data-act="next" aria-label="Berikutnya">›</button>` : ""}</div>
      <div class="gl-vbar">${act("vfav", p.fav ? "♥" : "♡", "Favorit", p.fav ? "on" : "")}${act("download", "⬇", "Simpan")}${act("info", "ⓘ", "Info")}${act("vdel", "🗑", "Hapus")}</div>${info}</div>`;
  }

  /* ---------- Aksi ---------- */
  function toast(t) {
    const el = root.querySelector(".gl-toast"); if (!el) return;
    el.textContent = t; el.hidden = false; clearTimeout(toastId); toastId = setTimeout(() => (el.hidden = true), 2000);
  }
  async function removePhotos(ids) {
    for (const id of ids) await PhotoStore.remove(id);
    photos = photos.filter((p) => !ids.includes(p.id));
  }
  async function importFiles(files) {
    let n = 0;
    for (const f of files) {
      try {
        const bmp = await createImageBitmap(f);
        await PhotoStore.put({ id: PhotoStore.newId(), blob: f, ts: f.lastModified || Date.now(), fav: false, w: bmp.width, h: bmp.height, size: f.size, name: f.name, src: "Perangkat" });
        bmp.close && bmp.close(); n++;
      } catch {}
    }
    photos = await PhotoStore.all(); render();
    toast(n ? `${n} foto ditambahkan` : "Tidak ada foto yang bisa diimpor");
  }
  const save = (p) => { PhotoStore.put(p).catch(() => {}); };

  async function onClick(e) {
    const el = e.target.closest("[data-act]"), wasMenu = nav.menu;
    nav.menu = false;
    if (!el) { if (wasMenu) render(); return; }
    const a = el.dataset.act, d = el.dataset, list = visible();
    switch (a) {
      case "menu": nav.menu = !wasMenu; render(); break;
      case "filter": nav.filter = d.f; nav.select = null; render(); break;
      case "open-camera": PhoneOS.open("camera"); break;
      case "import": root.querySelector("#gl-file").click(); break;
      case "start-select": nav.select = new Set(); render(); break;
      case "cancel-select": nav.select = null; render(); break;
      case "cell": {
        if (longFired) { longFired = false; break; }
        if (nav.select) { nav.select.has(d.id) ? nav.select.delete(d.id) : nav.select.add(d.id); render(); }
        else { nav.idx = list.findIndex((p) => p.id === d.id); nav.screen = "viewer"; nav.info = false; render(); }
        break;
      }
      case "sel-fav": {
        const ps = photos.filter((p) => nav.select.has(p.id)); if (!ps.length) break;
        const to = !ps.every((p) => p.fav);
        ps.forEach((p) => { p.fav = to; save(p); }); nav.select = null; render(); break;
      }
      case "sel-del": {
        const ids = [...nav.select]; if (!ids.length) break;
        if (confirm(`Hapus ${ids.length} foto?`)) { await removePhotos(ids); nav.select = null; render(); toast("Foto dihapus"); }
        break;
      }
      case "close-viewer": nav.screen = "grid"; nav.info = false; render(); break;
      case "prev": nav.idx = Math.max(0, nav.idx - 1); render(); break;
      case "next": nav.idx = Math.min(list.length - 1, nav.idx + 1); render(); break;
      case "info": nav.info = !nav.info; render(); break;
      case "vfav": { const p = list[nav.idx]; p.fav = !p.fav; save(p); if (nav.filter === "fav" && !p.fav) nav.idx = Math.min(nav.idx, Math.max(0, visible().length - 1)); render(); break; }
      case "download": {
        const p = list[nav.idx], a2 = document.createElement("a");
        a2.href = PhotoStore.url(p); a2.download = p.name; a2.click(); toast("Foto diunduh"); break;
      }
      case "vdel":
        if (confirm("Hapus foto ini?")) {
          await removePhotos([list[nav.idx].id]);
          const n = visible().length; nav.idx = Math.min(nav.idx, n - 1);
          if (!n) nav.screen = "grid"; render(); toast("Foto dihapus");
        }
        break;
    }
  }

  function bind(el) {
    el.addEventListener("click", onClick);
    el.addEventListener("change", (e) => { if (e.target.id === "gl-file") { importFiles([...e.target.files]); e.target.value = ""; } });
    el.addEventListener("pointerdown", (e) => {
      longFired = false;
      const c = e.target.closest(".gl-cell");
      if (c && !nav.select) holdId = setTimeout(() => { longFired = true; nav.select = new Set([c.dataset.id]); render(); }, 500);
      if (e.target.closest(".gl-stage")) swipeX = e.clientX;
    });
    el.addEventListener("pointerup", (e) => {
      clearTimeout(holdId);
      if (swipeX == null) return;
      const dx = e.clientX - swipeX; swipeX = null;
      if (Math.abs(dx) > 50 && nav.screen === "viewer") {
        nav.idx = Math.max(0, Math.min(visible().length - 1, nav.idx + (dx < 0 ? 1 : -1))); render();
      }
    });
    ["pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, () => clearTimeout(holdId)));
  }

  function onBack() {
    if (nav.menu) { nav.menu = false; render(); return true; }
    if (nav.info) { nav.info = false; render(); return true; }
    if (nav.screen === "viewer") { nav.screen = "grid"; render(); return true; }
    if (nav.select) { nav.select = null; render(); return true; }
    return false;
  }

  return {
    bare: true,
    mount(container, params = {}) {
      root = container;
      root.innerHTML = `<div class="gl"><div class="gl-main"></div><input type="file" id="gl-file" accept="image/*" multiple hidden><div class="gl-toast" hidden></div></div>`;
      bind(root.querySelector(".gl"));
      nav = { screen: "grid", filter: "all", select: null, idx: 0, info: false, menu: false };
      loading = true; render();
      reload().then(() => {
        if (params.latest && photos.length) { nav.screen = "viewer"; nav.idx = 0; }
        render();
      });
    },
    onBack,
    onLeave() { PhoneOS.setDark(false); },
  };
})();
