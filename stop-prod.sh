#!/bin/bash
# Script d'arrêt production pour Bogart Bot v2
# Usage: ./stop-prod.sh

echo "🛑 Arrêt Bogart Bot v2"
echo "====================="
echo ""

# Arrêter PM2
if command -v pm2 &> /dev/null; then
    echo "🛑 Arrêt du bot PM2..."
    pm2 stop bogart 2>/dev/null || true
    pm2 delete bogart 2>/dev/null || true
    pm2 save
    echo "✅ Bot arrêté"
else
    echo "⚠️  PM2 non trouvé, recherche du processus..."
    pkill -f "node.*dist/index.js" && echo "✅ Bot arrêté" || echo "⚠️  Aucun processus trouvé"
fi

echo ""

# Optionnel : Arrêter Docker (décommentez si vous voulez)
# echo "🐳 Arrêt des services Docker..."
# docker compose down
# echo "✅ Docker arrêté"

echo ""
echo "✅ Arrêt terminé"
echo ""
echo "Pour redémarrer :"
echo "  ./start-prod.sh"
