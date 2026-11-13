// Aplikasi Kamera: kamera sungguhan (webcam/kamera HP) dengan cadangan kamera simulasi.
// Fitur: shutter, timer, flash layar, garis bantu, zoom digital, filter, ganti kamera.
const CameraApp = (() => {
  "use strict";
  const FILTERS = [["Normal", "none"], ["Mono", "grayscale(1) contrast(1.1)"], ["Sepia", "sepia(.85)"],
    ["Vivid", "saturate(1.6) contrast(1.1)"], ["Dingin", "hue-rotate(-15deg) saturate(1.2) brightness(1.05)"], ["Hangat", "sepia(.3) saturate(1.3) hue-rotate(-10deg)"]];
  const TIMERS = [0, 3, 10], ZOOMS = [1, 2, 3];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  let root = null, video = null, sim = null, view = null, stream = null, simId = 0;
  let facing = "environment", session = 0, gen = 0, toastId = null;
  const st = { flash: false, timer: 0, grid: false, filter: 0, zoom: 1, busy: false };
  const mirrored = () => !!stream && facing === "user";

  function mount(container) {
    root = container; session++;
    stopCamera();
    PhoneOS.setDark(true);
    root.innerHTML = `<div class="cm">
      <div class="cm-top"></div>
      <div class="cm-view"><video playsinline muted autoplay></video><canvas class="cm-sim" hidden></canvas>
        <div class="cm-grid" hidden></div><div class="cm-count" hidden></div><div class="cm-flash"></div><div class="cm-note" hidden></div>
        <div class="cm-zoom"></div></div>
      <div class="cm-filters"></div>
      <div class="cm-bottom"><button class="cm-thumb" data-act="gallery" aria-label="Buka galeri"></button>
        <button class="cm-shutter" data-act="shutter" aria-label="Ambil foto"></button>
        <button class="cm-flip" data-act="flip" aria-label="Ganti kamera">🔄</button></div>
      <div class="cm-toast" hidden></div></div>`;
    video = root.querySelector("video"); sim = root.querySelector(".cm-sim"); view = root.querySelector(".cm-view");
    root.querySelector(".cm").addEventListener("click", onClick);
    renderTop(); renderFilters(); renderZoom(); updateThumb(); startCamera();
  }

  function renderTop() {
    root.querySelector(".cm-top").innerHTML =
      `<button class="${st.flash ? "on" : ""}" data-act="flash"><b>⚡</b><span>Flash ${st.flash ? "nyala" : "mati"}</span></button>
       <button class="${st.timer ? "on" : ""}" data-act="timer"><b>⏱</b><span>${st.timer ? st.timer + " detik" : "Timer"}</span></button>
       <button class="${st.grid ? "on" : ""}" data-act="grid"><b>▦</b><span>Garis</span></button>`;
    root.querySelector(".cm-grid").hidden = !st.grid;
  }
  function renderFilters() {
    root.querySelector(".cm-filters").innerHTML = FILTERS.map((f, i) => `<button class="${st.filter === i ? "on" : ""}" data-act="filter" data-i="${i}">${f[0]}</button>`).join("");
  }
  function renderZoom() {
    root.querySelector(".cm-zoom").innerHTML = ZOOMS.map((z) => `<button class="${st.zoom === z ? "on" : ""}" data-act="zoom" data-z="${z}">${z}x</button>`).join("");
  }
  function applyPreview() {
    [video, sim].forEach((el) => {
      el.style.filter = FILTERS[st.filter][1];
      el.style.transform = `${mirrored() ? "scaleX(-1) " : ""}scale(${st.zoom})`;
    });
  }

  function toast(t) {
    const el = root && root.querySelector(".cm-toast"); if (!el) return;
    el.textContent = t; el.hidden = false; clearTimeout(toastId); toastId = setTimeout(() => (el.hidden = true), 2000);
  }
  function note(t) {
    const el = root.querySelector(".cm-note"); el.hidden = !t; el.textContent = t || "";
  }

  async function updateThumb() {
    try {
      const all = await PhotoStore.all(), th = root && root.querySelector(".cm-thumb");
      if (th) th.style.backgroundImage = all[0] ? `url(${PhotoStore.url(all[0])})` : "";
    } catch {}
  }

  /* ---------- Sumber gambar ---------- */
  async function startCamera() {
    stopCamera();
    const token = ++gen;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("unsupported");
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (token !== gen) { s.getTracks().forEach((t) => t.stop()); return; }
      stream = s; video.srcObject = s;
      await video.play().catch(() => {});
      video.hidden = false; sim.hidden = true; note(""); applyPreview();
    } catch (err) {
      if (token !== gen) return;
      startSim(err && err.name === "NotAllowedError" ? "Izin kamera ditolak" : "Kamera tidak ditemukan");
    }
  }
  function stopCamera() {
    gen++;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null; cancelAnimationFrame(simId);
    if (video) video.srcObject = null;
  }
  function startSim(reason) {
    video.hidden = true; sim.hidden = false;
    sim.width = view.clientWidth || 336; sim.height = view.clientHeight || 440;
    note(reason + " · memakai kamera simulasi"); applyPreview();
    const g = sim.getContext("2d");
    const loop = (t) => {
      const w = sim.width, h = sim.height, hue = (t / 40) % 360;
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, `hsl(${hue} 60% 40%)`); gr.addColorStop(1, `hsl(${(hue + 80) % 360} 60% 22%)`);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) {
        g.fillStyle = `hsla(${(hue + i * 50) % 360} 80% 70% / .35)`;
        g.beginPath(); g.arc(w / 2 + Math.cos(t / 900 + i * 1.3) * w * .3, h / 2 + Math.sin(t / 700 + i) * h * .25, 30 + i * 14, 0, 7); g.fill();
      }
      g.fillStyle = "rgba(255,255,255,.8)"; g.font = "13px sans-serif"; g.textAlign = "center"; g.fillText("Kamera simulasi", w / 2, h - 18);
      simId = requestAnimationFrame(loop);
    };
    simId = requestAnimationFrame(loop);
  }

  /* ---------- Ambil foto ---------- */
  function cropRect(sw, sh, aspect, zoom) {
    let cw = sw, ch = sw / aspect;
    if (ch > sh) { ch = sh; cw = sh * aspect; }
    cw /= zoom; ch /= zoom;
    return [(sw - cw) / 2, (sh - ch) / 2, cw, ch];
  }

  async function capture() {
    const useVideo = stream && video.videoWidth, src = useVideo ? video : sim;
    const sw = useVideo ? video.videoWidth : sim.width, sh = useVideo ? video.videoHeight : sim.height;
    const aspect = view.clientWidth && view.clientHeight ? view.clientWidth / view.clientHeight : 3 / 4;
    const [sx, sy, cw, ch] = cropRect(sw, sh, aspect, st.zoom);
    const scale = Math.min(1, 1280 / Math.max(cw, ch));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(cw * scale)); c.height = Math.max(1, Math.round(ch * scale));
    const g = c.getContext("2d");
    g.filter = FILTERS[st.filter][1];
    if (mirrored()) { g.translate(c.width, 0); g.scale(-1, 1); }
    g.drawImage(src, sx, sy, cw, ch, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.9));
    if (!blob) throw new Error("capture");
    await PhotoStore.put({ id: PhotoStore.newId(), blob, ts: Date.now(), fav: false, w: c.width, h: c.height, size: blob.size, name: PhotoStore.fileName(), src: "Kamera" });
  }

  async function shutter() {
    if (st.busy) return;
    const s = session; st.busy = true;
    const count = root.querySelector(".cm-count"), flash = root.querySelector(".cm-flash");
    try {
      if (st.timer) {
        count.hidden = false;
        for (let i = st.timer; i > 0; i--) { count.textContent = i; await wait(1000); if (s !== session) return; }
        count.hidden = true;
      }
      if (st.flash) { flash.classList.add("on"); await wait(180); }
      await capture();
      flash.classList.remove("on");
      view.classList.remove("blink"); void view.offsetWidth; view.classList.add("blink");
      toast("Foto disimpan"); updateThumb();
    } catch { toast("Gagal menyimpan foto"); }
    finally { if (s === session) { count.hidden = true; flash.classList.remove("on"); } st.busy = false; }
  }

  function onClick(e) {
    const el = e.target.closest("[data-act]"); if (!el) return;
    const a = el.dataset.act, d = el.dataset;
    switch (a) {
      case "shutter": shutter(); break;
      case "flash": st.flash = !st.flash; renderTop(); break;
      case "timer": st.timer = TIMERS[(TIMERS.indexOf(st.timer) + 1) % TIMERS.length]; renderTop(); break;
      case "grid": st.grid = !st.grid; renderTop(); break;
      case "filter": st.filter = +d.i; renderFilters(); applyPreview(); break;
      case "zoom": st.zoom = +d.z; renderZoom(); applyPreview(); break;
      case "flip":
        if (!stream) return toast("Hanya tersedia satu kamera");
        facing = facing === "user" ? "environment" : "user"; startCamera(); break;
      case "gallery": PhoneOS.open("gallery", { latest: true }); break;
    }
  }

  return {
    bare: true,
    mount,
    onLeave() { session++; stopCamera(); PhoneOS.setDark(false); },
  };
})();
