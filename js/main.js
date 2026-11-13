// Daftar aplikasi. Tambah aplikasi baru cukup dengan menambah item di sini.
// Aplikasi boleh punya: render() atau mount(container, params), bare (tanpa header),
// onBack() (return true jika sudah ditangani), onLeave() (dipanggil saat app ditinggalkan), badge() (angka di ikon).
const apps = [
  { id: "phone",    name: "Telepon",    icon: "📞", ...PhoneApp },
  { id: "messages", name: "Pesan",      icon: "💬", ...MessagesApp },
  { id: "camera",   name: "Kamera",     icon: "📷", ...CameraApp },
  { id: "gallery",  name: "Galeri",     icon: "🖼️", ...GalleryApp },
  { id: "calc",     name: "Kalkulator", icon: "🧮", render: () => "<p>Kalkulator belum dibuat.</p>" },
  { id: "notes",    name: "Catatan",    icon: "📝", render: () => "<p>Catatan belum dibuat.</p>" },
  { id: "clock",    name: "Jam",        icon: "⏰", render: () => "<p>Jam belum dibuat.</p>" },
  { id: "settings", name: "Pengaturan", icon: "⚙️", render: () => "<p>Pengaturan belum dibuat.</p>" },
];

const screen = document.getElementById("screen");
const grid = document.getElementById("app-grid");
const appScreen = document.getElementById("app-screen");
const appTitle = document.getElementById("app-title");
const appBody = document.getElementById("app-body");
const headsUp = document.getElementById("heads-up");

// Buat ikon di home screen
apps.forEach((app) => {
  const btn = document.createElement("button");
  btn.className = "app-icon";
  btn.innerHTML = `<span class="icon">${app.icon}<i class="badge" hidden></i></span><span>${app.name}</span>`;
  btn.addEventListener("click", () => openApp(app));
  app.badgeEl = btn.querySelector(".badge");
  grid.appendChild(btn);
});

function refreshBadges() {
  apps.forEach((app) => {
    const n = app.badge ? app.badge() : 0;
    app.badgeEl.textContent = n;
    app.badgeEl.hidden = !n;
  });
}

let currentApp = null;

function openApp(app, params) {
  if (currentApp && currentApp !== app && currentApp.onLeave) currentApp.onLeave();
  screen.classList.remove("app-dark");
  currentApp = app;
  headsUp.hidden = true;
  appScreen.classList.toggle("bare", !!app.bare);
  appTitle.textContent = app.name;
  if (app.mount) { appBody.innerHTML = ""; app.mount(appBody, params || {}); }
  else appBody.innerHTML = app.render();
  appScreen.classList.add("open");
  screen.classList.add("in-app");
  refreshBadges();
}

function goHome() {
  if (currentApp && currentApp.onLeave) currentApp.onLeave();
  currentApp = null;
  appScreen.classList.remove("open");
  screen.classList.remove("in-app", "in-call", "app-dark");
  refreshBadges();
}

// Jembatan antar aplikasi (dipakai Telepon <-> Pesan)
let huTimer;
window.PhoneOS = {
  current: () => (currentApp ? currentApp.id : null),
  setDark: (v) => screen.classList.toggle("app-dark", !!v),
  open: (id, params) => openApp(apps.find((a) => a.id === id), params),
  notify({ icon, title, text, onClick }) {
    headsUp.innerHTML = "";
    const i = document.createElement("span"); i.textContent = icon || "🔔";
    const box = document.createElement("div"); box.className = "hu-text";
    const b = document.createElement("b"); b.textContent = title;
    const t = document.createElement("span"); t.textContent = text;
    box.append(b, t); headsUp.append(i, box);
    headsUp.hidden = false;
    headsUp.onclick = () => { headsUp.hidden = true; if (onClick) onClick(); };
    clearTimeout(huTimer);
    huTimer = setTimeout(() => (headsUp.hidden = true), 4500);
    refreshBadges();
  },
};

document.getElementById("btn-home").addEventListener("click", goHome);
document.getElementById("btn-back").addEventListener("click", () => {
  if (currentApp && currentApp.onBack && currentApp.onBack()) return;
  goHome();
});
document.getElementById("btn-recent").addEventListener("click", () => {});
document.getElementById("call-pill").addEventListener("click", () => PhoneOS.open("phone"));

// Jam, tanggal, baterai
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");
  document.getElementById("clock").textContent = time;
  document.getElementById("widget-time").textContent = time;
  document.getElementById("widget-date").textContent =
    now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}
updateClock();
setInterval(updateClock, 1000);
refreshBadges();

if (navigator.getBattery) {
  navigator.getBattery().then((b) => {
    const show = () => (document.getElementById("battery").textContent = `🔋 ${Math.round(b.level * 100)}%`);
    show();
    b.addEventListener("levelchange", show);
  });
}
