#!/bin/bash
# Script de déploiement distant pour Bogart Bot v2
# Usage: ./deploy-remote.sh user@host:/path/to/bogart

set -e

if [ -z "$1" ]; then
    echo "Usage: ./deploy-remote.sh user@host:/path/to/bogart"
    exit 1
fi

REMOTE=$1
SERVER=$(echo $REMOTE | cut -d: -f1)
REMOTE_PATH=$(echo $REMOTE | cut -d: -f2)

echo "🚀 Déploiement vers $SERVER:$REMOTE_PATH"
echo "========================================="
echo ""

# Build en local
echo "🔨 Build local..."
yarn build

# Créer archive
echo "📦 Création de l'archive..."
tar -czf bogart-dist.tar.gz \
    dist/ \
    package.json \
    yarn.lock \
    docker-compose.yml \
    scripts/ \
    .env.dist

# Envoyer sur le serveur
echo "📤 Upload vers le serveur..."
scp bogart-dist.tar.gz $SERVER:$REMOTE_PATH/

# Déployer sur le serveur
echo "🚀 Déploiement sur le serveur..."
ssh $SERVER << EOF
    cd $REMOTE_PATH

    # Backup si existe
    if [ -d dist ]; then
        echo "💾 Backup de l'ancienne version..."
        tar -czf backup-\$(date +%Y%m%d-%H%M%S).tar.gz dist/ 2>/dev/null || true
    fi

    # Extraire
    echo "📦 Extraction..."
    tar -xzf bogart-dist.tar.gz
    rm bogart-dist.tar.gz

    # Installer deps (si besoin)
    if [ ! -d node_modules ]; then
        echo "📚 Installation des dépendances..."
        yarn install --production
    fi

    # Vérifier .env
    if [ ! -f .env ]; then
        echo "⚠️  Création de .env depuis .env.dist"
        cp .env.dist .env
        echo "❗ IMPORTANT: Éditez .env avec vos tokens Discord !"
    fi

    # Démarrer Docker si pas déjà fait
    echo "🐳 Vérification Docker..."
    docker-compose up -d || true

    # Indexer RAG
    echo "📚 Indexation RAG..."
    yarn tsx scripts/reindex-rag.ts

    # Redémarrer le bot
    echo "🔄 Redémarrage du bot..."
    pkill -f "node.*dist/index.js" || true
    sleep 2
    nohup yarn start > bot.log 2>&1 &

    echo "✅ Déploiement terminé !"
    echo "PID: \$(pgrep -f 'node.*dist/index.js')"
EOF

# Cleanup local
rm bogart-dist.tar.gz

echo ""
echo "✅ Déploiement distant terminé !"
echo ""
echo "Vérifier les logs :"
echo "  ssh $SERVER 'tail -f $REMOTE_PATH/bot.log'"
