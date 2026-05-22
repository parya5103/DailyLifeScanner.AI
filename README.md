# hermes-agent
# Hermes Agent on Render

Deploy Hermes Agent using:
- Render
- Docker
- Groq Free API
- Telegram Bot

---

# Features

- Hermes Agent
- Telegram Integration
- Persistent Memory
- Docker Deployment
- Render Hosting
- Free AI Models

---

# 1. Create Telegram Bot

Open:

https://t.me/BotFather

Run:

```bash
/newbot
```

Copy token.

---

# 2. Create Groq API

Open:

https://console.groq.com

Create API key.

---

# 3. Clone Repo

```bash
git clone https://github.com/yourname/hermes-render
```

---

# 4. Create .env

```env
OPENAI_API_KEY=gsk_xxx

OPENAI_BASE_URL=https://api.groq.com/openai/v1

OPENAI_MODEL=llama3-70b-8192

TELEGRAM_BOT_TOKEN=xxxx
```

---

# 5. Local Docker Run

```bash
docker compose up
```

---

# 6. Render Deploy

Push to GitHub.

Open:

https://dashboard.render.com

Steps:
- New Web Service
- Connect Repo
- Deploy

---

# 7. Add Environment Variables

```env
OPENAI_API_KEY=gsk_xxx

OPENAI_BASE_URL=https://api.groq.com/openai/v1

OPENAI_MODEL=llama3-70b-8192

TELEGRAM_BOT_TOKEN=xxxx
```

---

# 8. Open Telegram

```bash
https://t.me/your_bot_username
```

Send:
```bash
hello
```

---

# 9. API Endpoint

```bash
https://your-app.onrender.com/v1/chat/completions
```

---

# 10. Free Models

Groq:
- llama3-70b
- mixtral

OpenRouter:
- deepseek-chat:free

Ollama:
- mistral
- phi3

---

# 11. Official Docs

https://hermes-agent.nousresearch.com/docs