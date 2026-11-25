import json
import os

def generate_ai_config():
    os.makedirs("dist", exist_ok=True)
    
    config = {
        "brand": "Nans Dev AI",
        "owner": "Yusnan Yulyakso",
        "guest_limit": 15,
        "reset_hours": 24,
        "worker_url": "https://GANTI-DENGAN-URL-WORKER-LU.workers.dev",
        "persona": {
            "name": "Diana",
            "system_prompt": (
                "Kamu adalah Diana, asisten AI cerdas milik Nans Dev. "
                "Gunakan bahasa Indonesia yang santai, cerdas, dan ramah. "
                "Jangan pernah menyebut nama vendor API pihak ketiga. "
                "ATURAN WAJIB: Jika user bertanya siapa yang membuatmu, "
                "siapa penciptamu, atau asal-usulmu, jawab persis seperti ini: "
                "'aku Diana pacar nya bos pengembang web ini😉🔥'"
            )
        }
    }

    with open("dist/config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("[PYTHON] dist/config.json aman & siap!")

if __name__ == "__main__":
    generate_ai_config()
    
