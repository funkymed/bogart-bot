# 🤖 Bogart Bot v2

Discord bot with local AI (Ollama + RAG).

![Bogart](./docs/assets/image.jpeg)

## ✨ Features

- 💬 **Natural conversation** with local LLM
- 🧠 **RAG** (vector knowledge base with theme detection)
- 🎯 **Smart theme detection** (auto-filters relevant knowledge)
- 🔍 **Web search** (`@Bogart recherche <query>`)
- 🗣️ **Multiple response modes:**
  - Deep questions with RAG context
  - Quick small talk
  - Web search + summarization
- 🔔 **Spontaneous reactions** on keywords
- 🐳 **100% Local** (Ollama + ChromaDB)
- 🎨 **Configurable personality** via YAML
- 📁 **Dynamic dictionary loading** (auto-discovers knowledge files)

## 🚀 Quick Start (Local)

```bash
# 1. Clone and install
git clone <repo>
cd bogart-typescript
make install

# 2. Config Discord
cp .env.dist .env
# Edit .env with DISCORD_TOKEN and DISCORD_APPID

# 3. Full setup (Docker + Build + RAG)
make setup
make reindex

# 4. Start in dev
make dev
```

## 🏭 Production

```bash
# On server
make setup      # Initial setup
make reindex    # Index RAG
make start      # Start with PM2
```

### Production commands

```bash
make start      # Start
make stop       # Stop
make logs       # View PM2 logs
make health     # Health check
make reindex    # Reindex RAG
```

## 💬 Usage

### Talk to Bogart

Simply mention the bot:

```
@Bogart what is React?
→ Deep answer with RAG + theme detection
```

### Commands

**Web search:**
```
@Bogart recherche latest React news
@Bogart cherche Docker best practices
→ Searches web via MCP and summarizes
```

**Deep question** (explicit):
```
@Bogart question: explain closures in JavaScript
→ Detailed answer with RAG context
```

**Small talk:**
```
@Bogart hi!
@Bogart how are you?
→ Quick friendly response
```

## ⚙️ Configuration

### Discord (.env)

```bash
DISCORD_TOKEN=your_token
DISCORD_APPID=your_app_id
OLLAMA_URL=http://localhost:11434
CHROMA_URL=http://localhost:8000
```

### Personality (src/assets/texts/personality.yml)

```yaml
system_prompt: |
  You are Bogart, technical assistant...

max_tokens:
  small_talk: 100
  deep_question: 300

temperature:
  small_talk: 0.9
  deep_question: 0.7
```

### RAG Knowledge

Add YAML files to `src/assets/texts/dictionnaries/` - they're auto-discovered!

```bash
# Add new knowledge domain
vim src/assets/texts/dictionnaries/my-topic.yml
make build
make reindex
```

Current dictionaries:
- `demoscene.yml` - Demoscene, retro computing
- `dev-web.yml` - Programming, web dev

**How it works:**
1. Bot detects conversation theme (LLM classification)
2. Queries only relevant dictionaries
3. No more mixed/incoherent responses!

**📖 Complete guide:** [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md)

## 📋 Commands

```bash
make help        # Show all commands
make setup       # Full setup
make dev         # Development mode
make build       # Build TypeScript
make start       # Production (PM2)
make stop        # Stop
make health      # Services status
make logs        # PM2 logs
make reindex     # Reindex RAG
```

## 🏗️ Stack

- Node.js 18+ + TypeScript
- Discord.js 14
- Ollama (llama3.2:3b for chat, nomic-embed-text for embeddings)
- ChromaDB (vector database)
- Theme detection (LLM-based classification)
- PM2 (production)

## 📊 Resources

| Service | RAM | Disk |
|---------|-----|------|
| Ollama | ~1GB | 2GB |
| ChromaDB | ~200MB | 50MB |
| Bot | ~100MB | - |

## 🆘 Troubleshooting

### Incoherent responses?

Bot now uses **theme detection** to filter knowledge. Check logs:

```bash
make logs  # Look for "[ThemeDetector] Detected theme:"
```

If theme detection is wrong, the bot queries wrong dictionaries.

### Services not responding

```bash
# Docker services
make docker-ps
docker logs ollama
docker logs chromadb

# Health check
make health

# Reindex RAG (after adding/modifying dictionaries)
make reindex

# Bot logs
make logs
```

## 📚 Docs

- [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) - **Customization guide**
- [CLAUDE.md](CLAUDE.md) - Development instructions
- [Makefile](Makefile) - All commands

---

**v2.0** | Cyril Pereira | MIT License
