// Penyimpanan foto bersama (IndexedDB) untuk aplikasi Kamera & Galeri.
// Foto disimpan sebagai Blob, jadi muat jauh lebih banyak daripada localStorage.
const PhotoStore = (() => {
  "use strict";
  let dbp = null, seeding = null;
  const urls = new Map();

  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open("mobilephone", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("photos", { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  async function tx(mode, fn) {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction("photos", mode);
      const req = fn(t.objectStore("photos"));
      t.oncomplete = () => res(req.result);
      t.onerror = t.onabort = () => rej(t.error);
    });
  }

  // Foto contoh (digambar dengan canvas) supaya galeri tidak kosong di awal
  const NAMES = ["Senja", "Pantai", "Pagi", "Langit", "Taman", "Hutan"];
  const PAL = [["#ffb88c", "#de6262", "#3b2f4a"], ["#74ebd5", "#9face6", "#2c3e50"], ["#f6d365", "#fda085", "#5d4157"],
    ["#a1c4fd", "#c2e9fb", "#34495e"], ["#fbc2eb", "#a6c1ee", "#4a4e69"], ["#84fab0", "#8fd3f4", "#1e3a34"]];
  function drawSample(i) {
    const p = PAL[i % 6], c = document.createElement("canvas");
    c.width = 800; c.height = 600;
    const g = c.getContext("2d"), sky = g.createLinearGradient(0, 0, 0, 600);
    sky.addColorStop(0, p[0]); sky.addColorStop(1, p[1]);
    g.fillStyle = sky; g.fillRect(0, 0, 800, 600);
    g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc(150 + i * 110, 150 + (i % 3) * 40, 52, 0, 7); g.fill();
    g.fillStyle = p[2]; g.globalAlpha = .6;
    g.beginPath(); g.moveTo(-50, 600); g.lineTo(180 + i * 40, 280 + i * 12); g.lineTo(520, 600); g.fill();
    g.globalAlpha = 1;
    g.beginPath(); g.moveTo(250, 600); g.lineTo(560 - i * 25, 230 + (i % 2) * 50); g.lineTo(900, 600); g.fill();
    g.fillRect(0, 520, 800, 80);
    return c;
  }

  const api = {
    all: async () => (await tx("readonly", (s) => s.getAll())).sort((a, b) => b.ts - a.ts),
    put: (rec) => tx("readwrite", (s) => s.put(rec)),
    remove(id) {
      const u = urls.get(id);
      if (u) { URL.revokeObjectURL(u); urls.delete(id); }
      return tx("readwrite", (s) => s.delete(id));
    },
    url(rec) {
      let u = urls.get(rec.id);
      if (!u) { u = URL.createObjectURL(rec.blob); urls.set(rec.id, u); }
      return u;
    },
    newId: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    fileName(d = new Date()) {
      const z = (n) => String(n).padStart(2, "0");
      return `IMG_${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}.jpg`;
    },
    seedOnce() {
      if (seeding) return seeding;
      seeding = (async () => {
        if (localStorage.getItem("photos.seeded")) return;
        localStorage.setItem("photos.seeded", "1");
        const now = Date.now(), h = 36e5, ago = [h, 5 * h, 26 * h, 50 * h, 74 * h, 220 * h];
        for (let i = 0; i < 6; i++) {
          const blob = await new Promise((r) => drawSample(i).toBlob(r, "image/jpeg", 0.85));
          if (!blob) continue;
          await api.put({ id: api.newId(), blob, ts: now - ago[i], fav: i === 1, w: 800, h: 600, size: blob.size, name: `Contoh_${NAMES[i]}.jpg`, src: "Contoh" });
        }
      })().catch(() => {});
      return seeding;
    },
  };
  return api;
})();
