# Makefile pour Bogart Bot v2
# Gestion complète : Docker, Dev, Prod, Deploy, Monitoring
# Usage: make help

.PHONY: help
.DEFAULT_GOAL := help

# Configuration
DOCKER_COMPOSE = docker compose
SERVICE_NAME = bogart
OLLAMA_CONTAINER = bogart-ollama
CHROMADB_CONTAINER = bogart-chromadb
OLLAMA_MODEL = llama3.2:3b-instruct
EMBED_MODEL = nomic-embed-text

# Couleurs
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;36m
NC = \033[0m # No Color

#
# 🆘 HELP
#

help: ## 📚 Affiche cette aide
	@echo ""
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║          🤖 Bogart Bot v2 - Makefile                    ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)📦 Installation & Setup:$(NC)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## 📦.*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)🐳 Docker:$(NC)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## 🐳.*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)🚀 Production:$(NC)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## 🚀.*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)🔧 Développement:$(NC)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## 🔧.*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)📊 Monitoring:$(NC)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## 📊.*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)🛠️  Maintenance:$(NC)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## 🛠️.*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)💡 Quick start:$(NC)"
	@echo "  $(BLUE)make setup$(NC)       # Premier déploiement (installe tout)"
	@echo "  $(BLUE)make start$(NC)       # Démarrer le bot"
	@echo "  $(BLUE)make logs$(NC)        # Voir les logs"
	@echo "  $(BLUE)make health$(NC)      # Vérifier la santé"
	@echo ""

#
# 📦 INSTALLATION & SETUP
#

check-docker: ## 📦 Vérifie si Docker est installé
	@command -v docker >/dev/null 2>&1 || { \
		echo "$(RED)❌ Docker n'est pas installé$(NC)"; \
		echo "$(YELLOW)Installez avec: make docker-install$(NC)"; \
		exit 1; \
	}
	@echo "$(GREEN)✅ Docker est installé$(NC)"

check-docker-compose: ## 📦 Vérifie si Docker Compose est installé
	@docker compose version >/dev/null 2>&1 || { \
		echo "$(RED)❌ Docker Compose n'est pas installé$(NC)"; \
		echo "$(YELLOW)Installez avec: sudo apt install docker-compose-plugin$(NC)"; \
		exit 1; \
	}
	@echo "$(GREEN)✅ Docker Compose est installé$(NC)"

check-env: ## 📦 Vérifie si .env est configuré
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)⚠️  Fichier .env manquant$(NC)"; \
		if [ -f .env.dist ]; then \
			cp .env.dist .env; \
			echo "$(GREEN)✅ Fichier .env créé depuis .env.dist$(NC)"; \
			echo "$(RED)⚠️  IMPORTANT: Configurez vos tokens Discord dans .env$(NC)"; \
			exit 1; \
		else \
			echo "$(RED)❌ .env.dist non trouvé$(NC)"; \
			exit 1; \
		fi; \
	fi
	@if grep -q "your_token_here\|your_app_id" .env 2>/dev/null; then \
		echo "$(RED)❌ .env contient encore des placeholders$(NC)"; \
		echo "$(YELLOW)Éditez .env avec vos vrais tokens Discord$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ .env est configuré$(NC)"

docker-install: ## 📦 Installe Docker et Docker Compose (Linux)
	@echo "$(BLUE)🐳 Installation de Docker...$(NC)"
	@if command -v docker >/dev/null 2>&1; then \
		echo "$(YELLOW)⚠️  Docker est déjà installé$(NC)"; \
		docker --version; \
	else \
		curl -fsSL https://get.docker.com -o get-docker.sh; \
		sudo sh get-docker.sh; \
		sudo usermod -aG docker $$USER; \
		rm get-docker.sh; \
		echo "$(GREEN)✅ Docker installé$(NC)"; \
	fi
	@if docker compose version >/dev/null 2>&1; then \
		echo "$(YELLOW)⚠️  Docker Compose est déjà installé$(NC)"; \
	else \
		sudo apt update; \
		sudo apt install -y docker-compose-plugin; \
		echo "$(GREEN)✅ Docker Compose installé$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)⚠️  IMPORTANT: Déconnectez-vous et reconnectez-vous pour que les groupes prennent effet$(NC)"
	@echo "$(YELLOW)Ensuite, lancez: make setup-docker$(NC)"

install: ## 📦 Installe les dépendances Node.js
	@echo "$(BLUE)📦 Installation des dépendances Node.js...$(NC)"
	@yarn install
	@echo "$(GREEN)✅ Dépendances installées$(NC)"

build: ## 📦 Build le projet TypeScript
	@echo "$(BLUE)🔨 Build du bot...$(NC)"
	@yarn build
	@echo "$(GREEN)✅ Build terminé$(NC)"

setup: check-docker check-docker-compose check-env docker-up docker-wait docker-pull-models install build ## 📦 Installation complète (tout automatique)
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║          ✅ Setup complet terminé !                      ║$(NC)"
	@echo "$(GREEN)╚══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)🚀 Prochaines étapes:$(NC)"
	@echo "  1. Vérifier la santé : $(YELLOW)make health$(NC)"
	@echo "  2. Démarrer le bot   : $(YELLOW)make start$(NC)"
	@echo "  3. Voir les logs     : $(YELLOW)make logs$(NC)"
	@echo ""

setup-docker: check-docker check-docker-compose docker-up docker-wait docker-pull-models ## 📦 Setup Docker uniquement
	@echo ""
	@echo "$(GREEN)✅ Setup Docker terminé !$(NC)"
	@echo "$(YELLOW)Lancez ensuite: make install build$(NC)"
	@echo ""

quick-start: check-docker-compose docker-up docker-wait install build ## 📦 Démarrage rapide (Docker déjà installé)
	@echo ""
	@echo "$(GREEN)✅ Quick start terminé !$(NC)"
	@echo "$(YELLOW)Lancez le bot: make start$(NC)"
	@echo ""

#
# 🐳 DOCKER
#

docker-up: check-docker-compose ## 🐳 Démarre les services Docker
	@echo "$(BLUE)🐳 Démarrage des services Docker...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Services Docker démarrés$(NC)"

docker-wait: ## 🐳 Attend que les services soient prêts
	@echo "$(BLUE)⏳ Attente que les services soient prêts...$(NC)"
	@sleep 10
	@$(DOCKER_COMPOSE) ps

docker-down: ## 🐳 Arrête les services Docker
	@echo "$(YELLOW)🛑 Arrêt des services Docker...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Services Docker arrêtés$(NC)"

docker-restart: ## 🐳 Redémarre les services Docker
	@echo "$(BLUE)🔄 Redémarrage des services Docker...$(NC)"
	@$(DOCKER_COMPOSE) restart
	@sleep 5
	@echo "$(GREEN)✅ Services Docker redémarrés$(NC)"

docker-logs: ## 🐳 Affiche les logs Docker en temps réel
	@$(DOCKER_COMPOSE) logs -f

docker-logs-ollama: ## 🐳 Logs Ollama uniquement
	@$(DOCKER_COMPOSE) logs -f ollama

docker-logs-chromadb: ## 🐳 Logs ChromaDB uniquement
	@$(DOCKER_COMPOSE) logs -f chromadb

docker-ps: ## 🐳 Affiche le statut des services Docker
	@$(DOCKER_COMPOSE) ps

docker-pull-models: ## 🐳 Télécharge les modèles Ollama
	@echo "$(BLUE)📥 Vérification des modèles Ollama...$(NC)"
	@if docker exec $(OLLAMA_CONTAINER) ollama list 2>/dev/null | grep -q "$(OLLAMA_MODEL)"; then \
		echo "$(GREEN)✅ Modèle $(OLLAMA_MODEL) déjà présent$(NC)"; \
	else \
		echo "$(YELLOW)📥 Téléchargement de $(OLLAMA_MODEL) (1.9GB)...$(NC)"; \
		docker exec $(OLLAMA_CONTAINER) ollama pull $(OLLAMA_MODEL); \
		echo "$(GREEN)✅ Modèle $(OLLAMA_MODEL) téléchargé$(NC)"; \
	fi
	@if docker exec $(OLLAMA_CONTAINER) ollama list 2>/dev/null | grep -q "$(EMBED_MODEL)"; then \
		echo "$(GREEN)✅ Modèle $(EMBED_MODEL) déjà présent$(NC)"; \
	else \
		echo "$(YELLOW)📥 Téléchargement de $(EMBED_MODEL) (274MB)...$(NC)"; \
		docker exec $(OLLAMA_CONTAINER) ollama pull $(EMBED_MODEL); \
		echo "$(GREEN)✅ Modèle $(EMBED_MODEL) téléchargé$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)📋 Modèles installés:$(NC)"
	@docker exec $(OLLAMA_CONTAINER) ollama list

docker-pull-lightweight: ## 🐳 Télécharge le modèle léger (1B au lieu de 3B)
	@echo "$(BLUE)📥 Téléchargement du modèle léger llama3.2:1b-instruct...$(NC)"
	@docker exec $(OLLAMA_CONTAINER) ollama pull llama3.2:1b-instruct
	@echo "$(GREEN)✅ Modèle léger téléchargé$(NC)"
	@echo "$(YELLOW)⚠️  Modifiez le code pour utiliser ce modèle dans src/ai/llm/ollama.service.ts$(NC)"

docker-clean: ## 🐳 Nettoie les containers (garde les volumes)
	@echo "$(YELLOW)⚠️  Cela va arrêter et supprimer les conteneurs Docker$(NC)"
	@read -p "Continuer ? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE) down; \
		echo "$(GREEN)✅ Nettoyage terminé$(NC)"; \
	fi

docker-clean-all: ## 🐳 ⚠️  Nettoie tout (conteneurs + volumes = perte données)
	@echo "$(RED)⚠️  ATTENTION: Cela va supprimer TOUS LES CONTENEURS ET VOLUMES$(NC)"
	@echo "$(RED)Vous perdrez les modèles Ollama et la base ChromaDB$(NC)"
	@read -p "Êtes-vous VRAIMENT sûr ? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE) down -v; \
		echo "$(GREEN)✅ Nettoyage complet terminé$(NC)"; \
	fi

#
# 🚀 PRODUCTION
#

prod-systemd-install: ## 🚀 Installe le service systemd
	@echo "$(BLUE)🔧 Installation du service systemd...$(NC)"
	@if [ ! -f bogart.service ]; then \
		echo "$(RED)❌ Fichier bogart.service non trouvé$(NC)"; \
		echo "$(YELLOW)Créez-le d'abord (voir IMPLEMENTATION_PLAN.md Phase 6)$(NC)"; \
		exit 1; \
	fi
	@sudo cp bogart.service /etc/systemd/system/
	@sudo systemctl daemon-reload
	@sudo systemctl enable $(SERVICE_NAME)
	@echo "$(GREEN)✅ Service systemd installé et activé$(NC)"

prod-start: ## 🚀 Démarre le bot en production (systemd)
	@echo "$(BLUE)🚀 Démarrage du bot en production...$(NC)"
	@sudo systemctl start $(SERVICE_NAME)
	@sleep 2
	@sudo systemctl status $(SERVICE_NAME) --no-pager

prod-stop: ## 🚀 Arrête le bot en production
	@echo "$(YELLOW)🛑 Arrêt du bot...$(NC)"
	@sudo systemctl stop $(SERVICE_NAME)

prod-restart: ## 🚀 Redémarre le bot en production
	@echo "$(BLUE)🔄 Redémarrage du bot...$(NC)"
	@sudo systemctl restart $(SERVICE_NAME)
	@sleep 2
	@sudo systemctl status $(SERVICE_NAME) --no-pager

prod-logs: ## 🚀 Affiche les logs du bot (systemd)
	@sudo journalctl -u $(SERVICE_NAME) -f

prod-logs-last: ## 🚀 Affiche les 100 dernières lignes de logs
	@sudo journalctl -u $(SERVICE_NAME) -n 100

prod-status: ## 🚀 Affiche le statut du bot
	@sudo systemctl status $(SERVICE_NAME)

#
# 🔧 DÉVELOPPEMENT
#

dev: ## 🔧 Lance le bot en mode développement
	@echo "$(BLUE)🚀 Démarrage en mode développement...$(NC)"
	@yarn dev

dev-docker: docker-up docker-wait dev ## 🔧 Démarre Docker puis le bot en dev

test: ## 🔧 Lance les tests
	@echo "$(BLUE)🧪 Lancement des tests...$(NC)"
	@yarn test

lint: ## 🔧 Lint le code
	@echo "$(BLUE)🔍 Lint du code...$(NC)"
	@yarn lint || echo "$(YELLOW)⚠️  Configurez ESLint (yarn add -D eslint)$(NC)"

format: ## 🔧 Formate le code
	@echo "$(BLUE)✨ Formatage du code...$(NC)"
	@yarn format || echo "$(YELLOW)⚠️  Configurez Prettier (yarn add -D prettier)$(NC)"

#
# 📊 MONITORING
#

health: ## 📊 Vérifie la santé de tous les services
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║          🏥 Vérification de la santé des services       ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)🐳 Docker Services:$(NC)"
	@$(DOCKER_COMPOSE) ps 2>/dev/null || echo "$(RED)  ❌ Docker Compose non disponible$(NC)"
	@echo ""
	@echo "$(GREEN)🤖 Ollama:$(NC)"
	@if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then \
		echo "  $(GREEN)✅ Ollama OK (http://localhost:11434)$(NC)"; \
	else \
		echo "  $(RED)❌ Ollama KO$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)🔍 ChromaDB:$(NC)"
	@if curl -s http://localhost:8000/api/v1/heartbeat >/dev/null 2>&1; then \
		echo "  $(GREEN)✅ ChromaDB OK (http://localhost:8000)$(NC)"; \
	else \
		echo "  $(RED)❌ ChromaDB KO$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)🤖 Bot Discord:$(NC)"
	@if systemctl is-active --quiet $(SERVICE_NAME) 2>/dev/null; then \
		echo "  $(GREEN)✅ Bot running (systemd)$(NC)"; \
	else \
		echo "  $(YELLOW)⚠️  Bot not running (systemd)$(NC)"; \
	fi
	@echo ""

monitor: ## 📊 Affiche les métriques système en temps réel
	@echo "$(BLUE)📊 Métriques système:$(NC)"
	@echo ""
	@echo "$(GREEN)🐳 Docker:$(NC)"
	@docker stats --no-stream $(OLLAMA_CONTAINER) $(CHROMADB_CONTAINER) 2>/dev/null || echo "  $(YELLOW)Services Docker non démarrés$(NC)"
	@echo ""
	@echo "$(GREEN)💾 Mémoire:$(NC)"
	@free -h
	@echo ""
	@echo "$(GREEN)💿 Disque:$(NC)"
	@df -h / | tail -1
	@echo ""
	@echo "$(GREEN)📦 Volumes Docker:$(NC)"
	@docker system df -v 2>/dev/null | grep bogart || echo "  $(YELLOW)Pas de volumes bogart$(NC)"

logs: ## 📊 Affiche tous les logs (Docker + Bot)
	@echo "$(BLUE)📊 Logs combinés (Ctrl+C pour quitter):$(NC)"
	@echo ""
	@echo "$(YELLOW)🐳 Docker logs:$(NC)"
	@$(DOCKER_COMPOSE) logs --tail=20
	@echo ""
	@echo "$(YELLOW)🤖 Bot logs:$(NC)"
	@sudo journalctl -u $(SERVICE_NAME) -n 20 --no-pager 2>/dev/null || echo "$(YELLOW)Bot systemd non configuré$(NC)"
	@echo ""
	@echo "$(BLUE)Suivre les logs en temps réel: make logs-follow$(NC)"

logs-follow: ## 📊 Suit tous les logs en temps réel
	@sudo journalctl -u $(SERVICE_NAME) -f 2>/dev/null & \
	$(DOCKER_COMPOSE) logs -f

#
# 🛠️ MAINTENANCE
#

backup: ## 🛠️ Crée un backup des données
	@echo "$(BLUE)💾 Création du backup...$(NC)"
	@if [ -f backup.sh ]; then \
		./backup.sh; \
	else \
		echo "$(YELLOW)⚠️  Script backup.sh non trouvé$(NC)"; \
		echo "$(BLUE)Backup manuel des volumes Docker:$(NC)"; \
		mkdir -p backups; \
		docker run --rm -v bogart-typescript_ollama_data:/data -v $$(pwd)/backups:/backup alpine tar czf /backup/ollama_$$(date +%Y%m%d_%H%M%S).tar.gz -C /data .; \
		docker run --rm -v bogart-typescript_chromadb_data:/data -v $$(pwd)/backups:/backup alpine tar czf /backup/chromadb_$$(date +%Y%m%d_%H%M%S).tar.gz -C /data .; \
		echo "$(GREEN)✅ Backup créé dans ./backups/$(NC)"; \
	fi

clean: ## 🛠️ Nettoie les fichiers temporaires
	@echo "$(BLUE)🧹 Nettoyage...$(NC)"
	@rm -rf dist/
	@rm -rf node_modules/
	@rm -rf coverage/
	@rm -rf .nyc_output/
	@rm -f *.log
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

clean-all: clean docker-clean ## 🛠️ Nettoyage complet (fichiers + Docker)
	@echo "$(GREEN)✅ Nettoyage complet terminé$(NC)"

update: ## 🛠️ Met à jour le projet depuis Git
	@echo "$(BLUE)🔄 Mise à jour depuis Git...$(NC)"
	@git pull origin main
	@make install
	@make build
	@echo "$(GREEN)✅ Mise à jour terminée$(NC)"
	@echo "$(YELLOW)Redémarrez le bot: make restart$(NC)"

deploy: ## 🛠️ Déploie sur le serveur de production
	@if [ -f deploy.sh ]; then \
		./deploy.sh; \
	else \
		echo "$(RED)❌ Script deploy.sh non trouvé$(NC)"; \
		echo "$(YELLOW)Créez-le d'abord (voir IMPLEMENTATION_PLAN.md Phase 6)$(NC)"; \
	fi

#
# 🔗 ALIAS PRATIQUES
#

start: prod-start ## 🚀 Alias pour prod-start
stop: prod-stop ## 🚀 Alias pour prod-stop
restart: prod-restart ## 🚀 Alias pour prod-restart
status: health ## 📊 Alias pour health
ps: docker-ps ## 🐳 Alias pour docker-ps

#
# 🧪 DEBUG
#

debug-ollama: ## 🧪 Test Ollama en ligne de commande
	@echo "$(BLUE)🧪 Test Ollama...$(NC)"
	@docker exec -it $(OLLAMA_CONTAINER) ollama run $(OLLAMA_MODEL) "Réponds en français: Bonjour, tu es Bogart, un bot demoscene. Réponds: Salut ça va ?"

debug-chromadb: ## 🧪 Test ChromaDB
	@echo "$(BLUE)🧪 Test ChromaDB...$(NC)"
	@curl -s http://localhost:8000/api/v1/heartbeat | python3 -m json.tool 2>/dev/null || echo "$(RED)❌ ChromaDB non accessible$(NC)"

debug-env: ## 🧪 Affiche la configuration .env (masque les secrets)
	@echo "$(BLUE)🧪 Configuration .env:$(NC)"
	@if [ -f .env ]; then \
		cat .env | sed 's/=.*/=***/' ; \
	else \
		echo "$(RED)❌ Fichier .env non trouvé$(NC)"; \
	fi

#
# 📋 INFO
#

info: ## 📋 Affiche les informations du système
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║          📋 Informations Système                        ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)🖥️  Système:$(NC)"
	@uname -a
	@echo ""
	@echo "$(GREEN)🐳 Docker:$(NC)"
	@docker --version 2>/dev/null || echo "  $(RED)Docker non installé$(NC)"
	@docker compose version 2>/dev/null || echo "  $(RED)Docker Compose non installé$(NC)"
	@echo ""
	@echo "$(GREEN)📦 Node.js:$(NC)"
	@node --version 2>/dev/null || echo "  $(RED)Node.js non installé$(NC)"
	@yarn --version 2>/dev/null || echo "  $(RED)Yarn non installé$(NC)"
	@echo ""
	@echo "$(GREEN)💾 Espace disque:$(NC)"
	@df -h / | tail -1
	@echo ""
	@echo "$(GREEN)🧠 Mémoire:$(NC)"
	@free -h | grep "Mem:"
	@echo ""

version: ## 📋 Affiche la version de Bogart
	@echo "$(BLUE)🤖 Bogart Bot v2.0$(NC)"
	@echo "Architecture: LLM Local + RAG + Demoscene Personality"
	@echo "Stack: Node.js + TypeScript + Ollama + ChromaDB + Discord.js"
	@git log -1 --oneline 2>/dev/null || echo "$(YELLOW)Git non initialisé$(NC)"
