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
const bossStatus = document.getElementById("boss-status") as HTMLParagraphElement;

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
    chatHistory.push({ role: "assistant", content: data.reply });
  } catch {
    thinking.textContent = "Maaf bro, koneksi ke server lagi gangguan.";
  }
}

async function init() {
  const res = await fetch("./config.json");
  cfg = await res.json();

  applyTheme(localStorage.getItem("nans_theme") || "obsidian");
  if (localStorage.getItem("nans_boss_code")) {
    bossStatus.textContent = "Status: 👑 Mode Bos Aktif (Unlimited)";
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
    bossStatus.textContent = "Memverifikasi ke server...";
    try {
      const r = await fetch(cfg.worker_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_boss", passcode: code })
      });
      const d = await r.json();
      if (d.valid) {
        localStorage.setItem("nans_boss_code", code);
        bossStatus.textContent = "Status: 👑 Mode Bos Aktif (Unlimited)";
      } else {
        bossStatus.textContent = "Status: ❌ Kode Bos salah!";
      }
    } catch {
      bossStatus.textContent = "Status: Gagal terhubung ke Worker.";
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
    
