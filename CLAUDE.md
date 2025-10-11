# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bogart Bot is a Discord bot with conversational AI capabilities using NLP (Natural Language Processing). Originally coded in 2002 for IRC, it evolved through PHP/Slack (2016), JavaScript/Discord (2023), and now TypeScript (2024).

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

**NLP Training:**
```bash
yarn train      # Train NLP model from src/model-train.json
yarn test       # Test NLP model
```

## Architecture

### Core Components

**Entry Point** ([src/index.ts](src/index.ts))
- Initializes Discord.js client with guild, message, and DM intents
- Handles three event types:
  1. `ClientReady` - Bot initialization
  2. `GuildCreate` - Auto-deploys slash commands to new guilds
  3. `InteractionCreate` - Routes slash commands
  4. `MessageCreate` - Processes natural language messages through Services

**Services Architecture** ([src/services/](src/services/))
- All services extend `ServiceAbstract` base class
- Services are processed sequentially; first matching service responds and breaks the loop
- Two service types:
  1. **Command-based** (e.g., `ServiceLol` with `!lol` trigger) - Matches command prefix
  2. **NLP-based** (e.g., `ServiceQr`) - Always processes messages using node-nlp

**Service System:**
- Each service has a `getMessage(text: string)` method returning a response or undefined
- Services can load YAML dictionaries from `src/assets/texts/` via `loadDictionnary()`
- Responses are sent to Discord channel; loop exits after first non-empty response
- Add new services to [src/services/index.ts](src/services/index.ts) exports array

**Slash Commands** ([src/commands/](src/commands/))
- Organized in subdirectories: `fun/`, `utility/`
- Each command exports `data` (SlashCommandBuilder) and `execute(interaction)` function
- Auto-deployed to guilds on bot join via [src/deploy-commands.ts](src/deploy-commands.ts)
- Register new commands in [src/commands/index.ts](src/commands/index.ts)

### NLP System

**Context-Aware Conversations:**
- Powered by `node-nlp` with French language support
- Training data: `src/model-train.json` with context-based intent trees
- Model outputs: `src/assets/models/model.nlp` and `contexts-info.json`
- Conversation flow:
  1. User context tracked per `userId` (default: "default")
  2. Intent must match current context prefix (e.g., `default.greeting`)
  3. On match, context updates to `nextContext` from training data
  4. Non-matching intents return empty response
- Sentiment analysis adds emoji to responses (😁 positive, 😭 negative)

**Training Workflow:**
1. Edit `src/model-train.json` with contexts/intents/sentences/answers/nextContext
2. Run `yarn train` to generate model files
3. Model auto-loads at runtime from `src/assets/models/model.nlp`

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
- Uses `tsup` for minified compilation of `src/index.ts`
- Custom script copies `src/assets/` to `dist/assets/` (fonts, images, texts, models)
- Assets must be copied because runtime code references them via `getStaticPath()`

### Assets Structure

- `src/assets/fonts/` - Custom fonts for image generation
- `src/assets/images/` - Source images for meme generation
- `src/assets/texts/*.yml` - YAML dictionaries for random text generation
  - `personality.yml` - AI personality configuration (prompts, parameters, keywords)
  - `keywords.yml` - Keyword triggers for spontaneous reactions
- `src/assets/models/` - NLP model files (generated, git-ignored)

## Important Notes

- Node version requirement: >=18 <19
- Message processing stops at first non-empty service response
- NLP context resets to "default" only when user restarts conversation flow
- Slash commands are guild-specific, not global
- Assets directory must exist in both src and dist for production builds
