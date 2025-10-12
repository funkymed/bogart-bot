# 🎨 Bogart Bot Customization

Complete guide to customize bot behavior, personality, and knowledge.

## 📋 Table of Contents

- [LLM Models](#llm-models)
- [Personality and Behavior](#personality-and-behavior)
- [RAG Knowledge Base](#rag-knowledge-base)
- [Keywords and Reactions](#keywords-and-reactions)
- [Practical Examples](#practical-examples)

---

## LLM Models

Bogart uses Ollama for local LLM inference. You can easily switch between models or use external APIs.

### Ollama Models (Local)

#### Default Model: llama3.2:3b

**Current configuration:**
```bash
# .env
OLLAMA_MODEL=llama3.2:3b
```

**Specs:**
- Size: ~2GB
- RAM: ~2.5GB during inference
- Speed: ~30 tokens/sec (on M1)
- Quality: Good for general conversation

#### Upgrade to Larger Models

**1. llama3.2:7b (Recommended)**

Better quality, still reasonably fast.

```bash
# Pull model
docker exec bogart-ollama ollama pull llama3.2:7b

# Update .env
OLLAMA_MODEL=llama3.2:7b

# Update docker-compose.yml memory limit
services:
  ollama:
    deploy:
      resources:
        limits:
          memory: 8G  # 7b needs ~6GB
        reservations:
          memory: 4G
```

**Specs:**
- Size: ~4.7GB
- RAM: ~6GB during inference
- Speed: ~15 tokens/sec
- Quality: Significantly better reasoning

**2. llama3.1:8b**

Latest Llama 3.1, excellent quality.

```bash
docker exec bogart-ollama ollama pull llama3.1:8b

# .env
OLLAMA_MODEL=llama3.1:8b
```

**Specs:**
- Size: ~4.7GB
- RAM: ~6GB
- Quality: Superior to 3.2:7b

**3. DeepSeek R1 (Best for code)**

Specialized for coding and technical questions.

```bash
docker exec bogart-ollama ollama pull deepseek-r1:7b

# .env
OLLAMA_MODEL=deepseek-r1:7b
```

**Specs:**
- Size: ~4.7GB
- RAM: ~6GB
- Quality: Excellent for dev/tech questions

**4. Mistral 7B**

Alternative to Llama, faster inference.

```bash
docker exec bogart-ollama ollama pull mistral:7b

# .env
OLLAMA_MODEL=mistral:7b
```

**5. Gemma 2:9b**

Google's model, balanced quality/speed.

```bash
docker exec bogart-ollama ollama pull gemma2:9b

# .env
OLLAMA_MODEL=gemma2:9b
```

**Specs:**
- Size: ~5.4GB
- RAM: ~7GB
- Quality: Very good, competitive with Llama

#### Available Models Comparison

| Model | Size | RAM | Speed | Quality | Best For |
|-------|------|-----|-------|---------|----------|
| llama3.2:1b | 1.3GB | 1.5GB | ⚡⚡⚡ | ⭐⭐ | Testing, low resource |
| llama3.2:3b | 2GB | 2.5GB | ⚡⚡ | ⭐⭐⭐ | Default, balanced |
| llama3.2:7b | 4.7GB | 6GB | ⚡ | ⭐⭐⭐⭐ | Better quality |
| llama3.1:8b | 4.7GB | 6GB | ⚡ | ⭐⭐⭐⭐⭐ | Best Llama |
| deepseek-r1:7b | 4.7GB | 6GB | ⚡ | ⭐⭐⭐⭐⭐ | Code/Tech |
| mistral:7b | 4.1GB | 5GB | ⚡⚡ | ⭐⭐⭐⭐ | Fast inference |
| gemma2:9b | 5.4GB | 7GB | ⚡ | ⭐⭐⭐⭐⭐ | Google quality |

**View all available models:**
```bash
docker exec bogart-ollama ollama list
```

**Search models on Ollama:**
https://ollama.com/library

#### Switching Models

```bash
# 1. Pull new model
docker exec bogart-ollama ollama pull <model-name>

# 2. Update .env
OLLAMA_MODEL=<model-name>

# 3. Restart bot
make restart  # or ./scripts/prod/restart.sh
```

**Example: Switch to DeepSeek R1**
```bash
docker exec bogart-ollama ollama pull deepseek-r1:7b
echo "OLLAMA_MODEL=deepseek-r1:7b" >> .env
make restart
```

### External API Models

You can also use external APIs instead of Ollama.

#### OpenAI GPT (ChatGPT)

**1. Install OpenAI SDK:**
```bash
yarn add openai
```

**2. Create `src/ai/llm/openai.service.ts`:**
```typescript
import OpenAI from 'openai';

export class OpenAILLMService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generate(prompt: string, options: any): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 300
    });

    return completion.choices[0].message.content || '';
  }
}
```

**3. Update `.env`:**
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o, gpt-4-turbo
```

**4. Replace in `src/index.ts`:**
```typescript
// Replace OllamaLLMService with OpenAILLMService
import { OpenAILLMService } from './ai/llm/openai.service';
```

**Models:**
- `gpt-4o-mini` - Fast, cheap ($0.15/1M tokens)
- `gpt-4o` - Best quality ($5/1M tokens)
- `gpt-4-turbo` - Good balance ($10/1M tokens)

#### Anthropic Claude

**1. Install SDK:**
```bash
yarn add @anthropic-ai/sdk
```

**2. Create `src/ai/llm/claude.service.ts`:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeLLMService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async generate(prompt: string, options: any): Promise<string> {
    const message = await this.client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
      max_tokens: options.maxTokens || 300,
      temperature: options.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    return message.content[0].text;
  }
}
```

**3. Update `.env`:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

**Models:**
- `claude-3-5-haiku-20241022` - Fast, cheap
- `claude-3-5-sonnet-20241022` - Best quality
- `claude-3-opus-20240229` - Maximum capability

#### Google Gemini

**1. Install SDK:**
```bash
yarn add @google/generative-ai
```

**2. Create `src/ai/llm/gemini.service.ts`:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiLLMService {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generate(prompt: string, options: any): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
```

**3. Update `.env`:**
```bash
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash-exp
```

**Models:**
- `gemini-2.0-flash-exp` - Very fast, free
- `gemini-1.5-pro` - High quality
- `gemini-1.5-flash` - Balanced

### Model Selection Guide

**Choose based on your needs:**

**💰 Budget Priority (Free/Cheap)**
- Ollama llama3.2:3b (local, free)
- Gemini Flash (free tier)
- GPT-4o-mini ($0.15/1M tokens)

**⚡ Speed Priority**
- Ollama mistral:7b (local, fast)
- Gemini 2.0 Flash (fastest API)
- GPT-4o-mini

**🧠 Quality Priority**
- Claude 3.5 Sonnet (best reasoning)
- GPT-4o (excellent all-around)
- Ollama llama3.1:8b (best local)

**💻 Code/Tech Priority**
- DeepSeek R1 (local, specialized)
- Claude 3.5 Sonnet (excellent code)
- GPT-4o

**🔒 Privacy Priority**
- Ollama (100% local)
- Self-hosted LLM

### Performance Tuning

#### Reduce Latency

```yaml
# src/assets/texts/personality.yml
timeout:
  small_talk: 10000    # 10s instead of 15s
  deep_question: 60000 # 60s instead of 90s

max_tokens:
  small_talk: 50       # Shorter responses
  deep_question: 200
```

#### Improve Quality

```yaml
temperature:
  small_talk: 0.7      # Less creative, more consistent
  deep_question: 0.5   # More factual

max_tokens:
  deep_question: 500   # Longer, detailed answers
```

#### Save Memory (Ollama)

Use quantized models:
```bash
# 4-bit quantization (smaller, faster, slightly lower quality)
docker exec bogart-ollama ollama pull llama3.2:3b-q4_0

# .env
OLLAMA_MODEL=llama3.2:3b-q4_0
```

---

## Personality and Behavior

### File: `src/assets/texts/personality.yml`

#### Complete Structure

```yaml
# Main prompt (full personality)
system_prompt: |
  You are Bogart, technical assistant expert in demoscene, web dev,
  thick client, labor law and FR/US politics.

  Answer DIRECTLY and CONCISELY. No intro, no fluff, straight to the point.

  IMPORTANT: Your answer must fit in 250 words max. Structure in bullet points
  or short paragraphs to maximize clarity.

# Short prompt for small talk
small_talk_prompt: "You are Bogart. Answer in 1-2 sentences max (20-30 words), direct and friendly."

# Instructions for detailed responses
detailed_instructions: "Be DIRECT and PRECISE. Complete answer but LIMITED TO 250 WORDS MAX."

# Temperature (creativity)
temperature:
  small_talk: 0.9      # More creative for small talk
  deep_question: 0.7   # More factual for questions
  spontaneous: 1.0     # Maximum for spontaneous reactions

# Max tokens per response
max_tokens:
  small_talk: 100      # ~25 words
  deep_question: 300   # ~75 words
  spontaneous: 50      # ~12 words

# Timeouts (milliseconds)
timeout:
  small_talk: 15000    # 15 seconds
  deep_question: 90000 # 90 seconds
  spontaneous: 20000   # 20 seconds

# Mood detection
mood_keywords:
  positive:
    - "great"
    - "awesome"
    - "cool"
    - "thanks"
    - ":)"
    - "😊"
  negative:
    - "bad"
    - "damn"
    - "problem"
    - "bug"
    - ":("
    - "😡"

# Spontaneous reaction thresholds (0.0-1.0)
reaction_thresholds:
  high_relevance: 0.85  # Always react above
  low_relevance: 0.6    # Never react below
```

#### Customization

**1. Change base personality**

```yaml
system_prompt: |
  You are Alfred, British butler expert in etiquette and tea.

  You speak with elegance and a hint of dry British humor.
  Always polite and precise in your answers.
```

**2. Adjust response length**

```yaml
max_tokens:
  small_talk: 50       # Shorter responses
  deep_question: 500   # Longer responses
```

**3. Modify creativity**

```yaml
temperature:
  small_talk: 0.5      # Less creative, more predictable
  deep_question: 0.3   # Very factual
  spontaneous: 1.2     # Very creative (max 1.5)
```

**4. Adapt timeouts**

```yaml
timeout:
  small_talk: 10000    # 10s - quick response
  deep_question: 120000 # 120s - complex questions
```

---

## RAG Knowledge Base

YAML files in `src/assets/texts/` feed the ChromaDB vector database.

### Available Files

- `demoscene.yml` - Demoscene culture, demos, Amiga/C64
- `dev-web.yml` - Web development, frameworks
- `droit-travail.yml` - French labor law
- `politique.yml` - FR/US politics

### RAG File Structure

```yaml
category_name:
  title: "Category Title"
  items:
    - "Fact or knowledge 1"
    - "Fact or knowledge 2"
    - "Fact or knowledge 3"

another_category:
  title: "Another Topic"
  items:
    - "Information A"
    - "Information B"
```

### Practical Examples

#### Example 1: Add React knowledge

Edit `src/assets/texts/dev-web.yml`:

```yaml
react:
  title: "React - UI Library"
  items:
    - "React is a JavaScript library for building user interfaces with reusable components"
    - "Developed by Meta (Facebook) in 2013, open-source"
    - "Uses JSX (syntax mixing JavaScript and HTML)"
    - "Virtual DOM for optimized performance"
    - "Hooks since React 16.8: useState, useEffect, useContext, etc."
    - "Next.js is the most popular React framework for SSR and SSG"

react_hooks:
  title: "React Hooks"
  items:
    - "useState: manage component local state"
    - "useEffect: side effects (API calls, subscriptions, DOM manipulation)"
    - "useContext: consume Context without wrapper"
    - "useReducer: alternative to useState for complex state"
    - "useMemo: memoize expensive values"
    - "useCallback: memoize functions"
    - "useRef: DOM reference or persistent value"
```

#### Example 2: Create new expertise domain

Create `src/assets/texts/cooking.yml`:

```yaml
cooking_basics:
  title: "Cooking Basics"
  items:
    - "Mise en place: prepare all ingredients before starting"
    - "Sear: high heat cooking to create crust"
    - "Deglaze: add liquid to recover cooking juices"
    - "Emulsify: mix two immiscible liquids (e.g., vinaigrette)"
    - "Reduce: evaporate liquid to concentrate flavors"

pro_techniques:
  title: "Professional Techniques"
  items:
    - "Brunoise: 2mm x 2mm dice (very fine)"
    - "Julienne: 3mm x 3cm sticks"
    - "Mirepoix: carrot/celery/onion dice mix"
    - "Fumet: concentrated fish or shellfish stock"
    - "Blanching: boiling salted water then ice water"
```

#### Example 3: Add specific knowledge

Edit `src/assets/texts/demoscene.yml`:

```yaml
demoscene_2024:
  title: "Demoscene News 2024"
  items:
    - "Revision 2024 in Saarbrücken: largest European demoparty (Easter)"
    - "Evoke 2024 in Cologne: focus on digital art and music (August)"
    - "Lovebyte 2024: sizecoding competition (February)"
    - "Inércia 2024: French demoparty in Lyon"
    - "Breakpoint revival: legendary demoparty returns"

modern_tools:
  title: "Modern Demoscene Tools"
  items:
    - "Shadertoy: web platform for real-time GLSL shaders"
    - "Bonzomatic: live coding tool for audiovisual demos"
    - "Rocket: timeline editor to sync music and effects"
    - "Crinkler: executable compressor for 4k/8k Windows intros"
    - "GLSL Sandbox: Shadertoy alternative for experiments"
```

### Update Workflow

1. **Edit** YAML files in `src/assets/texts/`
2. **Rebuild** project: `make build`
3. **Reindex** ChromaDB: `make reindex`
4. **Restart** bot: `make restart` (dev) or `make start` (prod)

```bash
# Quick commands
vim src/assets/texts/dev-web.yml  # Edit
make build                         # Rebuild
make reindex                       # Reindex RAG
make restart                       # Restart
```

### Best Practices

✅ **DO:**
- Short factual sentences (one idea = one line)
- Verifiable and up-to-date information
- Use domain vocabulary
- Group by coherent theme

❌ **DON'T:**
- Long sentences with multiple ideas
- Personal opinions or bias
- Outdated information
- Mix multiple domains

---

## Keywords and Reactions

### File: `src/assets/texts/keywords.yml`

Structure for bot spontaneous reactions.

#### Format

```yaml
category_name:
  keywords: ["word1", "word2", "expression"]
  responses:
    - "Example response 1"
    - "Example response 2"
  useFixed: false  # true = fixed response, false = LLM generates
```

#### Examples

**1. Demoscene reactions (LLM generates)**

```yaml
demoscene:
  keywords: ["amiga", "atari", "c64", "demo", "demoparty", "revision"]
  responses:
    - "Amiga 500, legendary machine! 🎨"
    - "Atari ST demos had incredible charm"
    - "C64: 320x200 pixels, 16 colors, pure magic"
    - "Revision, Europe's biggest demoparty"
  useFixed: false  # LLM generates natural response based on examples
```

**2. Web dev reactions (LLM generates)**

```yaml
frameworks:
  keywords: ["react", "vue", "angular", "svelte", "next.js"]
  responses:
    - "React still rules UI frameworks"
    - "Vue 3 with Composition API is clean"
    - "Svelte compiles everything, zero runtime"
    - "Next.js + Vercel = winning combo"
  useFixed: false
```

**3. Fixed responses (no LLM)**

```yaml
greetings:
  keywords: ["hi", "hello", "hey", "sup"]
  responses:
    - "Yo! 🤖"
    - "Hello there!"
    - "Hello World!"
  useFixed: true  # Randomly picks from list
```

**4. Encouragement (LLM generates)**

```yaml
motivation:
  keywords: ["tired", "struggling", "annoying", "difficult", "bug"]
  responses:
    - "Hang in there! 💪"
    - "Take a coffee break, always helps"
    - "Bugs are just undocumented features"
    - "Take a breath, you'll figure it out"
  useFixed: false
```

#### Advanced Configuration

**Control reaction frequency**

In `personality.yml`:

```yaml
reaction_thresholds:
  high_relevance: 0.85  # RAG score > 0.85: automatic reaction
  low_relevance: 0.6    # RAG score < 0.6: never react
  # Between 0.6 and 0.85: proportional probability
```

**Example:**
- RAG score = 0.9 → Guaranteed reaction
- RAG score = 0.7 → 50% chance to react
- RAG score = 0.5 → No reaction

---

## Practical Examples

### Use Case 1: Cybersecurity Specialized Bot

**1. Modify personality**

```yaml
# src/assets/texts/personality.yml
system_prompt: |
  You are CyberBot, cybersecurity and pentesting expert.

  You answer with technical precision but in an accessible way.
  Focus: OWASP, exploitation, hardening, forensics.

temperature:
  small_talk: 0.7
  deep_question: 0.5  # More factual for security
```

**2. Create knowledge base**

```yaml
# src/assets/texts/cybersecurity.yml
owasp_top10:
  title: "OWASP Top 10 2023"
  items:
    - "A01 Broken Access Control: 34% of vulnerable applications"
    - "A02 Cryptographic Failures: sensitive data exposure"
    - "A03 Injection: SQL, NoSQL, OS command, LDAP"
    - "A04 Insecure Design: architectural flaws from conception"
    - "A05 Security Misconfiguration: insecure default config"

pentest_tools:
  title: "Pentesting Tools"
  items:
    - "Burp Suite: proxy for web application testing"
    - "Metasploit: vulnerability exploitation framework"
    - "Nmap: network port and service scanner"
    - "Wireshark: network packet analyzer"
    - "John the Ripper: password cracker"
```

**3. Specialized keywords**

```yaml
# src/assets/texts/keywords.yml
security:
  keywords: ["exploit", "vuln", "CVE", "pentesting", "breach"]
  responses:
    - "Security first! 🔒"
    - "Patch, patch, patch!"
    - "Zero-day? Time to patch ⚡"
  useFixed: false
```

### Use Case 2: DevOps Assistant Bot

**1. DevOps personality**

```yaml
# src/assets/texts/personality.yml
system_prompt: |
  You are DevOpsBot, expert in CI/CD, containers and infrastructure as code.

  Pragmatic answers focusing on automation and reliability.
  Stack: Docker, Kubernetes, Terraform, GitLab CI, Prometheus.

temperature:
  deep_question: 0.4  # Very factual for infrastructure
```

**2. Knowledge base**

```yaml
# src/assets/texts/devops.yml
docker_best_practices:
  title: "Docker Best Practices"
  items:
    - "Multi-stage builds: reduce image size"
    - "Don't run as root: USER 1000 in Dockerfile"
    - ".dockerignore: exclude node_modules, .git"
    - "Health checks: HEALTHCHECK CMD curl localhost:8080/health"
    - "One process per container: Unix principle"

kubernetes_concepts:
  title: "Kubernetes Core"
  items:
    - "Pod: basic unit, one or more containers"
    - "Deployment: manages replication and rolling updates"
    - "Service: stable endpoint to access pods"
    - "ConfigMap: external application configuration"
    - "Secret: sensitive data base64 encoded"
```

### Use Case 3: Code Trainer Bot

**1. Pedagogical personality**

```yaml
# src/assets/texts/personality.yml
system_prompt: |
  You are CodeMentor, patient and pedagogical trainer.

  Explain concepts simply with concrete examples.
  Provide commented code when possible.
  Always encourage progressive learning.

temperature:
  small_talk: 0.8
  deep_question: 0.6

max_tokens:
  deep_question: 500  # Longer for explanations
```

**2. Knowledge base**

```yaml
# src/assets/texts/learning.yml
fundamental_concepts:
  title: "Basic Concepts"
  items:
    - "Variable: named memory space that stores a value"
    - "Function: reusable code block with inputs and output"
    - "Loop: repeat instructions while condition is true"
    - "Condition: execute code if expression is true (if/else)"
    - "Array: ordered collection of same-type elements"

best_practices:
  title: "Code Best Practices"
  items:
    - "Naming: explicit variables (getUserById vs getUBI)"
    - "DRY: Don't Repeat Yourself, factor duplicated code"
    - "KISS: Keep It Simple Stupid, favor simplicity"
    - "Comments: explain WHY, not HOW"
    - "Tests: write unit tests from start"
```

---

## 🔄 Complete Workflow

```bash
# 1. Modify files
vim src/assets/texts/personality.yml
vim src/assets/texts/dev-web.yml
vim src/assets/texts/keywords.yml

# 2. Rebuild + Reindex
make build
make reindex

# 3. Test in dev
make dev

# 4. Deploy to prod
make start
make logs  # Verify
```

---

## 📚 Resources

- [personality.yml](../src/assets/texts/personality.yml) - Personality configuration
- [keywords.yml](../src/assets/texts/keywords.yml) - Keywords reactions
- [demoscene.yml](../src/assets/texts/demoscene.yml) - RAG base example
- [CLAUDE.md](../CLAUDE.md) - Technical documentation

---

**Need help?** Open an issue on the repo! 🚀
