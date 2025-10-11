# 🤖 Bogart Bot v2

Bot Discord intelligent et polyvalent avec personnalité configurable, propulsé par un LLM local.

![Bogart](./docs/assets/image.jpeg)

> *A somewhat silly but useful bot developed by Cyril Pereira*

## ✨ Caractéristiques

- 💬 **Conversation naturelle** - Small talk intelligent sans commandes
- 🧠 **Expertise multi-domaines** - Demoscene, dev web, client lourd, droit du travail, politique FR/US
- 🔔 **Réactions spontanées** - Intervention basée sur des mots-clés
- 🎨 **Personnalité configurable** - Prompts et comportements personnalisables via YAML
- 🧠 **RAG (Retrieval Augmented Generation)** - Base de connaissances vectorielle
- 🐳 **100% Local** - LLM Ollama + ChromaDB, pas d'API externe
- 🔒 **Privé** - Toutes les données restent sur votre serveur

## 📜 Histoire

- **2002** - Créé en Alambik pour IRC
- **2016** - Porté en PHP pour Slack
- **2023** - Réécrit en JavaScript ES6 pour Discord
- **2024** - Version TypeScript avec IA locale (v2.0) 🎉

## 🚀 Installation

### Prérequis

- **Node.js** 18.x
- **Docker** + Docker Compose (pour Ollama et ChromaDB)
- **8GB RAM minimum** (16GB recommandé)
- **20GB espace disque**

### Installation rapide

```bash
# 1. Cloner le repo
git clone <repo-url>
cd bogart-typescript

# 2. Installer les dépendances
yarn install

# 3. Démarrer les services Docker
docker-compose up -d

# 4. Télécharger les modèles LLM (première fois)
docker exec -it ollama ollama pull llama3.2:1b
docker exec -it ollama ollama pull nomic-embed-text

# 5. Configurer l'environnement
cp .env.dist .env
# Éditez .env avec vos tokens Discord

# 6. Indexer la base de connaissances
yarn tsx scripts/reindex-rag.ts

# 7. Build et démarrer
yarn build
yarn start
```

### Configuration .env

```bash
# Discord (requis)
DISCORD_TOKEN=votre_token_ici
DISCORD_APPID=votre_app_id_ici
DISCORD_GUILDID=votre_guild_id_optionnel

# Services locaux (par défaut)
OLLAMA_URL=http://localhost:11434
CHROMA_URL=http://localhost:8000
```

## 🎮 Utilisation

### Conversation naturelle

Mentionnez simplement Bogart dans vos messages Discord :

```
User: "Bogart, c'est quoi React ?"
Bogart: "React est une bibliothèque JavaScript pour créer des interfaces
         utilisateur avec des composants réutilisables. Développée par Meta."

User: "Bogart, explique moi le CDI"
Bogart: "Le CDI (Contrat à Durée Indéterminée) est le contrat de travail
         par défaut en France sans date de fin. Protection maximale du salarié."
```

### Réactions spontanées

Bogart détecte des mots-clés et peut intervenir spontanément :

```
User1: "J'ai regardé une démo Amiga hier"
Bogart: "Amiga 500, la machine de légende ! 🎨"
```

## 🎨 Personnalisation

### Modifier la personnalité

Éditez `src/assets/texts/personality.yml` :

```yaml
system_prompt: |
  Tu es Bogart, assistant technique expert...

max_tokens:
  small_talk: 100
  deep_question: 300

temperature:
  small_talk: 0.9
  deep_question: 0.7
```

### Ajouter des connaissances RAG

Éditez les fichiers dans `src/assets/texts/` :

- `demoscene.yml` - Culture demoscene, démos, Amiga/C64
- `dev-web.yml` - Dev web, frontend, backend, frameworks
- `droit-travail.yml` - Droit du travail français
- `politique.yml` - Politique française et américaine

Après modification :

```bash
yarn build
yarn tsx scripts/reindex-rag.ts
yarn start
```

### Configurer les mots-clés

Éditez `src/assets/texts/keywords.yml` :

```yaml
votre_categorie:
  keywords: ["mot1", "mot2"]
  responses:
    - "Réponse exemple"
  useFixed: false  # true = réponse fixe, false = LLM génère
```

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│       Bogart Bot v2 Stack           │
├─────────────────────────────────────┤
│                                     │
│  🐳 Docker Services                 │
│  ├─ Ollama (llama3.2:1b)           │
│  │  └─ LLM local rapide            │
│  └─ ChromaDB                        │
│     └─ Base vectorielle RAG        │
│                                     │
│  🤖 Bot Discord (Node.js/TS)        │
│  ├─ MessageOrchestrator             │
│  ├─ SmallTalkHandler                │
│  ├─ DeepQuestionHandler             │
│  ├─ KeywordEngine                   │
│  ├─ PersonalityEngine               │
│  └─ RAGService                      │
│                                     │
└─────────────────────────────────────┘
```

### Stack Technique

- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Discord.js 14
- **LLM:** Ollama (llama3.2:1b-instruct)
- **Embeddings:** nomic-embed-text
- **Vector DB:** ChromaDB
- **Build:** tsup + asset copying

### Consommation Ressources

| Service | RAM | Disk |
|---------|-----|------|
| Ollama (1b) | ~1GB | 1.3GB |
| ChromaDB | ~200MB | 50MB |
| Bot | ~100MB | - |
| **Total** | **~1.3GB** | **~1.4GB** |

## 🔧 Développement

### Scripts disponibles

```bash
yarn dev              # Mode watch avec tsx
yarn build            # Build TypeScript + copie assets
yarn start            # Lance le bot compilé
yarn train            # Entraîne le modèle NLP (legacy)
yarn tsx scripts/reindex-rag.ts  # Réindexe ChromaDB
```

### Structure du projet

```
src/
├── ai/
│   ├── llm/              # Service Ollama
│   ├── rag/              # Service RAG ChromaDB
│   └── prompts/          # PersonalityEngine
├── core/
│   ├── message.orchestrator.ts
│   └── memory.manager.ts
├── handlers/
│   ├── deepquestion.handler.ts
│   ├── smalltalk.handler.ts
│   └── keyword.engine.ts
├── assets/
│   └── texts/            # Config YAML (personality, RAG, keywords)
├── types/                # Types TypeScript
└── index.ts              # Entry point
```

## 🚀 Déploiement Production

### Méthode recommandée : Script automatique

Build en local et déploiement sur serveur distant :

```bash
# Depuis votre machine locale
./deploy-remote.sh user@serveur:/path/to/bogart-typescript
```

Ce script fait tout automatiquement :
- ✅ Build local
- ✅ Archive et upload via SCP
- ✅ Extraction sur le serveur
- ✅ Installation des dépendances
- ✅ Démarrage Docker
- ✅ Indexation RAG
- ✅ Redémarrage du bot

### Méthode 1 : Systemd

```bash
# Sur le serveur
git clone <repo-url>
cd bogart-typescript
yarn install
yarn build

# Démarrer les services Docker
docker-compose up -d

# Indexer RAG
yarn tsx scripts/reindex-rag.ts

# Créer service systemd
sudo nano /etc/systemd/system/bogart.service
```

**Contenu du service :**

```ini
[Unit]
Description=Bogart Discord Bot
After=network.target docker.service

[Service]
Type=simple
User=votre_user
WorkingDirectory=/path/to/bogart-typescript
Environment="NODE_ENV=production"
ExecStart=/usr/bin/yarn start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Activer et démarrer
sudo systemctl daemon-reload
sudo systemctl enable bogart
sudo systemctl start bogart
sudo systemctl status bogart
```

### Méthode 2 : PM2

```bash
# Installer PM2
npm install -g pm2

# Démarrer le bot
pm2 start dist/index.js --name bogart

# Sauvegarder la config
pm2 save
pm2 startup
```

### Méthode 3 : Script simple (./restart.sh)

```bash
#!/bin/bash
pkill -f "node.*dist/index.js"
yarn build && nohup yarn start > bot.log 2>&1 &
echo "Bot restarted. PID: $(pgrep -f 'node.*dist/index.js')"
```

## 🆘 Troubleshooting

### Bot ne répond pas

```bash
# Vérifier les logs
tail -f bot.log  # ou pm2 logs bogart

# Vérifier les services Docker
docker-compose ps
docker logs ollama
docker logs chromadb
```

### Ollama ne répond pas

```bash
# Tester Ollama
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "Hello",
  "stream": false
}'
```

### ChromaDB vide

```bash
# Réindexer
yarn tsx scripts/reindex-rag.ts
```

### Réponses coupées

Augmentez `max_tokens` dans `src/assets/texts/personality.yml` puis rebuild.

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Instructions pour Claude Code
- **[docker-compose.yml](docker-compose.yml)** - Configuration Docker
- **[Makefile](Makefile)** - Commandes utiles (si présent)

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Ajout feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

## 📝 License

MIT

## 🙏 Remerciements

- **Ollama team** - LLM local performant
- **ChromaDB** - Base vectorielle simple et efficace
- **Discord.js** - Framework Discord solide
- **Communauté demoscene** 🎨

---

**Développé avec ❤️ par Cyril Pereira**

**Version:** 2.0 | **Status:** Production Ready
