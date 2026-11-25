-- Skema Database Nans AI Platform
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'guest', -- 'guest' atau 'boss'
    message_count INT DEFAULT 0,
    max_limit INT DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE CASCADE,
    provider_used VARCHAR(50) NOT NULL,
    title VARCHAR(150),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(64) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL, -- 'user' atau 'diana'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed akun Bos (Unlimited)
INSERT INTO users (user_id, username, role, message_count, max_limit)
VALUES ('boss_yusnan', 'Yusnan Yulyakso', 'boss', 0, 999999);
