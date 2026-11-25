interface Provider {
  id: string;
  name: string;
  endpoint: string;
  model: string;
}

interface AppConfig {
  brand: string;
  guest_limit: number;
  boss_passcode: string;
  persona: { name: string; system_prompt: string };
  providers: Provider[];
}

let config: AppConfig;
let msgCount = Number(localStorage.getItem("nans_msg_count") || "0");
let isBoss = localStorage.getItem("nans_is_boss") === "true";

const chatBox = document.getElementById("chat-box") as HTMLDivElement;
const userInput = document.getElementById("user-input") as HTMLInputElement;
const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
const providerSelect = document.getElementById("provider-select") as HTMLSelectElement;
const quotaBadge = document.getElementById("quota-badge") as HTMLSpanElement;
const settingsModal = document.getElementById("settings-modal") as HTMLDivElement;

async function initApp() {
  const res = await fetch("./config.json");
  config = await res.json();

  config.providers.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    providerSelect.appendChild(opt);
  });

  (document.getElementById("key-zai") as HTMLInputElement).value = localStorage.getItem("key_zai") || "";
  (document.getElementById("key-sambanova") as HTMLInputElement).value = localStorage.getItem("key_sambanova") || "";
  updateQuotaUI();
}

function updateQuotaUI() {
  if (isBoss) {
    quotaBadge.textContent = "👑 Bos Mode: Unlimited";
    quotaBadge.classList.add("boss");
  } else {
    const sisa = Math.max(0, config.guest_limit - msgCount);
    quotaBadge.textContent = `Sisa Chat: ${sisa}/${config.guest_limit}`;
  }
}

function appendBubble(sender: "user" | "diana", text: string) {
  const div = document.createElement("div");
  div.className = `bubble ${sender}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  if (!isBoss && msgCount >= config.guest_limit) {
    appendBubble("diana", "Waduh, kuota 15 pesan kamu udah habis bro! Masukkin Kode Bos di pengaturan buat akses unlimited 😉");
    return;
  }

  appendBubble("user", text);
  userInput.value = "";

  if (!isBoss) {
    msgCount++;
    localStorage.setItem("nans_msg_count", String(msgCount));
    updateQuotaUI();
  }

  // Cek pertanyaan asal-usul Diana secara instan
  const lower = text.toLowerCase();
  if (lower.includes("siapa yang buat") || lower.includes("siapa pencipta") || lower.includes("siapa yang bikin") || lower.includes("asal usul")) {
    appendBubble("diana", "aku Diana pacar nya bos pengembang web ini😉🔥");
    return;
  }

  const provId = providerSelect.value;
  const provider = config.providers.find((p) => p.id === provId)!;
  const apiKey = localStorage.getItem(`key_${provId}`) || "";

  if (!apiKey) {
    appendBubble("diana", `API Key untuk ${provider.name} belum diisi nih. Klik ikon ⚙️ di atas buat masukkin key-nya dulu ya!`);
    return;
  }

  const loadingBubble = appendBubble("diana", "Diana lagi mikir...");
  try {
    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: config.persona.system_prompt },
          { role: "user", content: text }
        ]
      })
    });

    const data = await response.json();
    loadingBubble.textContent = data.choices?.[0]?.message?.content || "Maaf bro, respon dari server kosong.";
  } catch (err) {
    loadingBubble.textContent = `Gagal konek ke ${provider.name}. Cek API Key atau koneksi kamu ya!`;
  }
}

document.getElementById("open-settings")?.addEventListener("click", () => settingsModal.classList.remove("hidden"));
document.getElementById("close-settings")?.addEventListener("click", () => settingsModal.classList.add("hidden"));
document.getElementById("save-settings")?.addEventListener("click", () => {
  localStorage.setItem("key_zai", (document.getElementById("key-zai") as HTMLInputElement).value.trim());
  localStorage.setItem("key_sambanova", (document.getElementById("key-sambanova") as HTMLInputElement).value.trim());
  
  const pass = (document.getElementById("boss-pass") as HTMLInputElement).value.trim();
  if (pass === config.boss_passcode) {
    isBoss = true;
    localStorage.setItem("nans_is_boss", "true");
    updateQuotaUI();
  }
  settingsModal.classList.add("hidden");
});

sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keypress", (e) => { if (e.key === "Enter") handleSend(); });

initApp();
    
