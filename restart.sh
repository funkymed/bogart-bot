#!/bin/bash
# Script pour redémarrer Bogart Bot proprement
# Usage: ./restart.sh

echo "🛑 Arrêt des instances existantes..."
pkill -9 -f "tsx.*index" 2>/dev/null

# Attendre que les processus se terminent
sleep 2

# Vérifier qu'il n'y a plus de processus
REMAINING=$(ps aux | grep -E "tsx.*index" | grep -v grep | wc -l)
if [ $REMAINING -gt 0 ]; then
  echo "⚠️  Attention: $REMAINING processus encore actifs"
  ps aux | grep -E "tsx.*index" | grep -v grep
else
  echo "✅ Tous les processus arrêtés"
fi

echo ""
echo "🚀 Démarrage du bot en mode dev..."
yarn dev
