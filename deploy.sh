#!/bin/bash
# Script de déploiement simplifié pour Bogart Bot v2

set -e

echo "🚀 Déploiement Bogart Bot v2"
echo "=============================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Vérifier Yarn
if ! command -v yarn &> /dev/null; then
    echo -e "${RED}❌ Yarn n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Yarn $(yarn -v)${NC}"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker $(docker -v | cut -d' ' -f3 | tr -d ',')${NC}"

# Vérifier docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ docker-compose $(docker-compose -v | cut -d' ' -f4 | tr -d ',')${NC}"

echo ""
echo "📦 Installation des dépendances..."
yarn install --frozen-lockfile

echo ""
echo "🔨 Build du projet..."
yarn build

echo ""
echo "🐳 Démarrage des services Docker..."
docker-compose up -d

# Attendre que les services soient prêts
echo ""
echo "⏳ Attente du démarrage des services (30s)..."
sleep 30

# Vérifier Ollama
echo ""
echo "🔍 Vérification d'Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama opérationnel${NC}"
else
    echo -e "${YELLOW}⚠️  Ollama ne répond pas, vérifiez docker logs ollama${NC}"
fi

# Vérifier ChromaDB
echo ""
echo "🔍 Vérification de ChromaDB..."
if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ChromaDB opérationnel${NC}"
else
    echo -e "${YELLOW}⚠️  ChromaDB ne répond pas, vérifiez docker logs chromadb${NC}"
fi

# Vérifier les modèles Ollama
echo ""
echo "🤖 Vérification des modèles LLM..."
if docker exec bogart-ollama ollama list | grep -q "llama3.2:1b"; then
    echo -e "${GREEN}✅ llama3.2:1b installé${NC}"
else
    echo -e "${YELLOW}⚠️  llama3.2:1b manquant, téléchargement...${NC}"
    docker exec bogart-ollama ollama pull llama3.2:1b
fi

if docker exec bogart-ollama ollama list | grep -q "nomic-embed-text"; then
    echo -e "${GREEN}✅ nomic-embed-text installé${NC}"
else
    echo -e "${YELLOW}⚠️  nomic-embed-text manquant, téléchargement...${NC}"
    docker exec bogart-ollama ollama pull nomic-embed-text
fi

# Vérifier .env
echo ""
echo "🔐 Vérification de la configuration..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Fichier .env manquant, création depuis .env.dist...${NC}"
    cp .env.dist .env
    echo -e "${RED}⚠️  IMPORTANT: Éditez .env avec vos tokens Discord !${NC}"
    echo -e "${RED}   nano .env${NC}"
else
    echo -e "${GREEN}✅ Fichier .env présent${NC}"
fi

# Indexer RAG
echo ""
echo "📚 Indexation de la base de connaissances..."
yarn tsx scripts/reindex-rag.ts

echo ""
echo -e "${GREEN}=============================="
echo "✅ Déploiement terminé !"
echo -e "==============================${NC}"
echo ""
echo "Pour démarrer le bot :"
echo "  yarn start"
echo ""
echo "Ou avec PM2 :"
echo "  pm2 start dist/index.js --name bogart"
echo ""
echo "Ou avec systemd :"
echo "  sudo systemctl start bogart"
echo ""
echo "Logs :"
echo "  tail -f bot.log"
echo "  docker logs ollama"
echo "  docker logs chromadb"
echo ""
