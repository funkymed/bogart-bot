# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bogart Bot is a Discord bot with conversational AI capabilities using local LLM (Ollama) and RAG (Retrieval Augmented Generation). Originally coded in 2002 for IRC, it evolved through PHP/Slack (2016), JavaScript/Discord (2023), and now TypeScript with AI (2024).

## Development Commands

**Installation:**
```bash
yarn install
```

**Setup:**
- Copy `.env.dist` to `.env` and configure:
  - `DISCORD_TOKEN` and `DISCORD_APPID` (required)
  - `DISCORD_GUILDID`, `OMB_API_KEY`, `OPENWEATHER_API_KEY`, `STABLE_DIFFUSION_KEY` (optional)
- Customize bot personality by editing `src/assets/texts/personality.yml`:
  - System prompts (main, small talk, detailed)
  - Temperature and token limits
  - Mood detection keywords
  - Reaction thresholds

**Development:**
```bash
yarn dev        # Watch mode with tsx
```

**Production:**
```bash
yarn build      # Compile TypeScript with tsup and copy assets
yarn start      # Run compiled code
```

**RAG Indexing:**
```bash
yarn tsx scripts/reindex-rag.ts  # Reindex ChromaDB knowledge base
```

## Architecture

### Core Components

**Entry Point** ([src/index.ts](src/index.ts))
- Initializes Discord.js client with guild, message, and DM intents
- Handles Discord events:
  1. `ClientReady` - Bot initialization, creates AI services
  2. `MessageCreate` - Routes messages through MessageOrchestrator

**MessageOrchestrator** ([src/core/message.orchestrator.ts](src/core/message.orchestrator.ts))
- Routes messages to appropriate handlers:
  1. **KeywordEngine** - Detects keywords for spontaneous reactions
  2. **SmallTalkHandler** - Quick conversational responses
  3. **DeepQuestionHandler** - Complex questions with RAG
  4. **WebSearchHandler** - Web searches via MCP

**AI Services Architecture**
- **PersonalityEngine** ([src/ai/prompts/personality.engine.ts](src/ai/prompts/personality.engine.ts))
  - Configurable personality via `personality.yml`
  - Manages prompt construction and LLM interaction
  - Handles small talk, deep questions, spontaneous reactions

- **RAGService** ([src/ai/rag/rag.service.ts](src/ai/rag/rag.service.ts))
  - ChromaDB vector database
  - Embeddings with `nomic-embed-text`
  - Retrieves relevant knowledge chunks

- **OllamaLLMService** ([src/ai/llm/ollama.service.ts](src/ai/llm/ollama.service.ts))
  - Local LLM inference (llama3.2:3b)
  - Streaming and non-streaming responses
  - Configurable temperature/tokens

### RAG System

**Knowledge Base:**
- YAML files in `src/assets/texts/` (demoscene, dev-web, droit-travail, politique)
- Indexed into ChromaDB via `scripts/reindex-rag.ts`
- Vector embeddings for semantic search
- Top-K retrieval (default: 3-5 chunks)

**Indexing Workflow:**
1. Edit YAML files in `src/assets/texts/`
2. Run `yarn tsx scripts/reindex-rag.ts`
3. ChromaDB automatically updates embeddings

### Utilities ([src/utils.ts](src/utils.ts))

**Key Functions:**
- `getDictionnary()` - Lazy-loads YAML text files from `src/assets/texts/`
- `getRandom(obj)` - Returns random value from object/array
- `addNickToMessage()` - Replaces `%user_name` with Discord mention, `%text` with input
- `getStorage()` / `setStorage()` - JSON persistence using `node-storage` (stored in `./storage/`)
- `getStaticPath()` - Returns `src/assets` or `dist/assets` path

### Build System

**TypeScript Configuration:**
- Target: ES2020, CommonJS modules
- Strict mode enabled with null checks
- Output: `dist/` directory

**Build Process:**
- Uses `tsup` for minified compilation of `src/index.ts` and `scripts/reindex-rag.ts`
- Custom script copies `src/assets/` to `dist/src/assets/`
- Assets must be copied because runtime code references them via `getStaticPath()`

### Assets Structure

- `src/assets/texts/*.yml` - YAML configuration and knowledge files
  - `personality.yml` - AI personality configuration (prompts, parameters, keywords)
  - `keywords.yml` - Keyword triggers for spontaneous reactions
  - `demoscene.yml`, `dev-web.yml`, `droit-travail.yml`, `politique.yml` - RAG knowledge base

## Important Notes

- Node version requirement: >=18
- Docker required for Ollama (LLM) and ChromaDB (vector database)
- Assets directory must be in `dist/src/assets/` (matching `__dirname` structure)
- Build process: `yarn build` compiles code AND copies assets to correct location
- RAG knowledge must be reindexed after modifying YAML files in `src/assets/texts/`
