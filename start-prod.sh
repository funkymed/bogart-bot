#!/bin/bash
# Script de démarrage production pour Bogart Bot v2
# Usage: ./start-prod.sh

set -e

echo "🤖 Démarrage Bogart Bot v2 (Production)"
echo "========================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Démarrer Docker
echo "🐳 Démarrage des services Docker..."
docker compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services (20s)..."
sleep 20

# Vérifier Ollama
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama opérationnel${NC}"
else
    echo -e "${RED}❌ Ollama ne répond pas${NC}"
    echo "Vérifiez avec: docker logs ollama"
    exit 1
fi

# Vérifier ChromaDB
if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ChromaDB opérationnel${NC}"
else
    echo -e "${RED}❌ ChromaDB ne répond pas${NC}"
    echo "Vérifiez avec: docker logs chromadb"
    exit 1
fi

echo ""

# 2. Vérifier et télécharger les modèles Ollama
echo "🤖 Vérification des modèles Ollama..."

# Modèle embeddings (RAG)
if docker exec bogart-ollama ollama list 2>/dev/null | grep -q "nomic-embed-text"; then
    echo -e "${GREEN}✅ nomic-embed-text (embeddings) déjà présent${NC}"
else
    echo -e "${YELLOW}📥 Téléchargement de nomic-embed-text (~274MB)...${NC}"
    docker exec bogart-ollama ollama pull nomic-embed-text
    echo -e "${GREEN}✅ nomic-embed-text téléchargé${NC}"
fi

# Modèle LLM principal
if docker exec bogart-ollama ollama list 2>/dev/null | grep -q "llama3.2:3b"; then
    echo -e "${GREEN}✅ llama3.2:3b (LLM) déjà présent${NC}"
else
    echo -e "${YELLOW}📥 Téléchargement de llama3.2:3b (~2GB)...${NC}"
    docker exec bogart-ollama ollama pull llama3.2:3b
    echo -e "${GREEN}✅ llama3.2:3b téléchargé${NC}"
fi

echo ""

# 3. Indexer RAG
echo "📚 Indexation de la base de connaissances..."
tsx scripts/reindex-rag.js

echo ""

# 4. Démarrer avec PM2
echo "🚀 Démarrage du bot avec PM2..."

# Vérifier si PM2 est installé
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 n'est pas installé${NC}"
    echo "Installez PM2 avec: npm install -g pm2"
    echo ""
    echo "Alternative sans PM2:"
    echo "  nohup yarn start > bot.log 2>&1 &"
    exit 1
fi

# Arrêter l'instance existante si elle existe
pm2 stop bogart 2>/dev/null || true
pm2 delete bogart 2>/dev/null || true

# Démarrer le bot
pm2 start dist/index.js --name bogart

# Sauvegarder la config PM2
pm2 save

echo ""
echo -e "${GREEN}=============================="
echo "✅ Bot démarré avec succès !"
echo -e "==============================${NC}"
echo ""
echo "Commandes utiles :"
echo "  pm2 status              # Voir l'état"
echo "  pm2 logs bogart         # Voir les logs"
echo "  pm2 restart bogart      # Redémarrer"
echo "  pm2 stop bogart         # Arrêter"
echo "  pm2 monit               # Monitoring"
echo ""
echo "Services Docker :"
echo "  docker compose ps       # État des containers"
echo "  docker logs ollama      # Logs Ollama"
echo "  docker logs chromadb    # Logs ChromaDB"
echo ""
