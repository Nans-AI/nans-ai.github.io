interface AppConfig {
  guest_limit: number;
  reset_hours: number;
  worker_url: string;
  persona: { name: string; system_prompt: string };
}

let cfg: AppConfig;
let chatHistory: { role: string; content: string }[] = [];

const chatBox = document.getElementById("chat-messages") as HTMLDivElement;
const heroEl = document.getElementById("hero-welcome") as HTMLDivElement;
const inputEl = document.getElementById("user-input") as HTMLInputElement;
const drawer = document.getElementById("nav-drawer") as HTMLElement;
const backdrop = document.getElementById("drawer-backdrop") as HTMLDivElement;
const bossStatus = document.getElementById("boss-status") as HTMLDivElement;

const SPARK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3l1.9 5.8a2 2 0 001.3 1.3L21 12l-5.8 1.9a2 2 0 00-1.3 1.3L12 21l-1.9-5.8a2 2 0 00-1.3-1.3L3 12l5.8-1.9a2 2 0 001.3-1.3L12 3z"/></svg>`;
const SHIELD_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`;

function setBossBadge(active: boolean, label: string) {
  bossStatus.classList.toggle("boss-active", active);
  bossStatus.innerHTML = `${active ? SHIELD_SVG : ""}<span>${label}</span>`;
}

function formatJam(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
}

function getQuotaState() {
  const now = Date.now();
  let startTs = Number(localStorage.getItem("nans_cycle_start") || "0");
  let count = Number(localStorage.getItem("nans_msg_count") || "0");
  const resetMs = (cfg?.reset_hours || 24) * 3600 * 1000;

  if (startTs && now - startTs >= resetMs) {
    startTs = 0;
    count = 0;
    localStorage.removeItem("nans_cycle_start");
    localStorage.setItem("nans_msg_count", "0");
  }
  return { startTs, count };
}

function addMessage(sender: "user" | "diana", text: string) {
  heroEl.classList.add("hidden");
  const row = document.createElement("div");
  row.className = `msg-row ${sender}`;

  if (sender === "diana") {
    const avatar = document.createElement("div");
    avatar.className = "ai-avatar";
    avatar.innerHTML = SPARK_SVG;
    row.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;
  row.appendChild(bubble);
  chatBox.appendChild(row);
  chatBox.parentElement!.scrollTop = chatBox.parentElement!.scrollHeight;
  return bubble;
}

function applyTheme(theme: string) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("nans_theme", theme);
  document.querySelectorAll(".theme-chip").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-set-theme") === theme);
  });
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  const bossCode = localStorage.getItem("nans_boss_code") || "";
  const isBoss = Boolean(bossCode);
  const quota = getQuotaState();

  if (!isBoss && quota.count >= cfg.guest_limit) {
    const jamReset = formatJam(quota.startTs || Date.now());
    addMessage("user", text);
    inputEl.value = "";
    addMessage("diana", `Maaf, batas penggunaan sudah tercapai dan akan direset pada pukul ${jamReset}`);
    return;
  }

  addMessage("user", text);
  inputEl.value = "";

  if (!isBoss) {
    const startTs = quota.startTs || Date.now();
    localStorage.setItem("nans_cycle_start", String(startTs));
    localStorage.setItem("nans_msg_count", String(quota.count + 1));
  }

  const lower = text.toLowerCase();
  if (lower.includes("siapa yang buat") || lower.includes("siapa pencipta") || lower.includes("siapa yang bikin")) {
    addMessage("diana", "aku Diana pacar nya bos pengembang web ini😉🔥");
    return;
  }

  chatHistory.push({ role: "user", content: text });
  const thinking = addMessage("diana", "•••");

  try {
    const res = await fetch(cfg.worker_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bossCode,
        systemPrompt: cfg.persona.system_prompt,
        messages: chatHistory.slice(-10)
      })
    });
    const data = await res.json();
    thinking.textContent = data.reply;
    historyPush(data.reply);
  } catch {
    thinking.textContent = "Maaf bro, koneksi ke server lagi gangguan.";
  }
}

function historyPush(reply: string) {
  chatHistory.push({ role: "assistant", content: reply });
}

async function init() {
  const res = await fetch("./config.json");
  cfg = await res.json();

  applyTheme(localStorage.getItem("nans_theme") || "obsidian");
  if (localStorage.getItem("nans_boss_code")) {
    setBossBadge(true, "Mode Bos Aktif (Unlimited)");
  }

  document.getElementById("menu-btn")?.addEventListener("click", () => {
    drawer.classList.add("open");
    backdrop.classList.remove("hidden");
  });
  const closeDrawer = () => {
    drawer.classList.remove("open");
    backdrop.classList.add("hidden");
  };
  document.getElementById("close-drawer")?.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);

  document.querySelectorAll(".theme-chip").forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn.getAttribute("data-set-theme") || "obsidian"));
  });

  document.getElementById("verify-boss-btn")?.addEventListener("click", async () => {
    const code = (document.getElementById("boss-code-input") as HTMLInputElement).value.trim();
    if (!code) return;
    setBossBadge(false, "Memverifikasi ke server...");
    try {
      const r = await fetch(cfg.worker_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_boss", passcode: code })
      });
      const d = await r.json();
      if (d.valid) {
        localStorage.setItem("nans_boss_code", code);
        setBossBadge(true, "Mode Bos Aktif (Unlimited)");
      } else {
        setBossBadge(false, "Kode Bos tidak valid");
      }
    } catch {
      setBossBadge(false, "Gagal terhubung ke server");
    }
  });

  document.getElementById("new-chat-btn")?.addEventListener("click", () => {
    chatHistory = [];
    chatBox.innerHTML = "";
    heroEl.classList.remove("hidden");
  });

  document.getElementById("clear-history-btn")?.addEventListener("click", () => {
    chatHistory = [];
    chatBox.innerHTML = "";
    heroEl.classList.remove("hidden");
    closeDrawer();
  });

  document.getElementById("send-btn")?.addEventListener("click", sendMessage);
  inputEl.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
}

init();
