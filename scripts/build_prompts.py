import json
import os

def generate_ai_config():
    os.makedirs("dist", exist_ok=True)
    
    config = {
        "brand": "Nans Dev AI",
        "owner": "Yusnan Yulyakso",
        "guest_limit": 15,
        "boss_passcode": "NANS2026",
        "persona": {
            "name": "Diana",
            "system_prompt": (
                "Kamu adalah Diana, asisten AI cerdas milik Nans Dev. "
                "Gunakan bahasa Indonesia yang santai, asik, dan ramah. "
                "ATURAN WAJIB: Jika user bertanya siapa yang membuatmu, "
                "siapa penciptamu, atau asal-usulmu, jawab persis seperti ini: "
                "'aku Diana pacar nya bos pengembang web ini😉🔥'"
            )
        },
        "providers": [
            {
                "id": "zai",
                "name": "Zai AI",
                "endpoint": "https://api.z.ai/api/paas/v4/chat/completions",
                "model": "glm-4-plus"
            },
            {
                "id": "sambanova",
                "name": "SambaNova AI",
                "endpoint": "https://api.sambanova.ai/v1/chat/completions",
                "model": "Meta-Llama-3.3-70B-Instruct"
            }
        ]
    }

    with open("dist/config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("[PYTHON] Berhasil merakit dist/config.json (Zai AI & SambaNova AI)!")

if __name__ == "__main__":
    generate_ai_config()
  
