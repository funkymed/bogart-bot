# Makefile pour Bogart Bot v2
# Usage: make help

.PHONY: help
.DEFAULT_GOAL := help

# Configuration
DOCKER_COMPOSE = docker compose
SERVICE_NAME = bogart
SCRIPTS_DIR = ./scripts/prod

# Couleurs
GREEN = \033[0;32m
BLUE = \033[0;36m
YELLOW = \033[1;33m
NC = \033[0m

#
# 🆘 HELP
#

help: ## 📚 Affiche l'aide
	@echo ""
	@echo "$(BLUE)╔═══════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║      🤖 Bogart Bot v2 - Makefile              ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)📦 Installation:$(NC)"
	@echo "  $(BLUE)make install$(NC)        - Install Node.js dependencies"
	@echo "  $(BLUE)make build$(NC)          - Build TypeScript project"
	@echo "  $(BLUE)make setup$(NC)          - Full setup (Docker + deps + build)"
	@echo ""
	@echo "$(GREEN)🐳 Docker:$(NC)"
	@echo "  $(BLUE)make docker-up$(NC)      - Start Docker services"
	@echo "  $(BLUE)make docker-down$(NC)    - Stop Docker services"
	@echo "  $(BLUE)make docker-logs$(NC)    - Show Docker logs"
	@echo "  $(BLUE)make docker-ps$(NC)      - Show Docker status"
	@echo ""
	@echo "$(GREEN)🚀 Production:$(NC)"
	@echo "  $(BLUE)make start$(NC)          - Start bot (production)"
	@echo "  $(BLUE)make stop$(NC)           - Stop bot"
	@echo "  $(BLUE)make restart$(NC)        - Restart bot"
	@echo ""
	@echo "$(GREEN)🔧 Development:$(NC)"
	@echo "  $(BLUE)make dev$(NC)            - Start in dev mode (watch)"
	@echo ""
	@echo "$(GREEN)📊 Monitoring:$(NC)"
	@echo "  $(BLUE)make health$(NC)         - Check services health"
	@echo "  $(BLUE)make logs$(NC)           - Show bot logs (PM2)"
	@echo ""
	@echo "$(GREEN)🛠️  Maintenance:$(NC)"
	@echo "  $(BLUE)make clean$(NC)          - Clean build files"
	@echo "  $(BLUE)make reindex$(NC)        - Reindex RAG knowledge base"
	@echo ""

#
# 📦 INSTALLATION
#

install: ## Install Node.js dependencies
	@echo "$(BLUE)📦 Installing dependencies...$(NC)"
	@yarn install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

build: ## Build TypeScript project
	@echo "$(BLUE)🔨 Building...$(NC)"
	@yarn build
	@echo "$(GREEN)✅ Build complete$(NC)"

setup: docker-up install build ## Full setup
	@echo ""
	@echo "$(GREEN)✅ Setup complete!$(NC)"
	@echo "$(YELLOW)Next: make start$(NC)"
	@echo ""

#
# 🐳 DOCKER
#

docker-up: ## Start Docker services
	@echo "$(BLUE)🐳 Starting Docker services...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@sleep 5
	@echo "$(GREEN)✅ Docker services started$(NC)"

docker-down: ## Stop Docker services
	@echo "$(YELLOW)🛑 Stopping Docker services...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Docker services stopped$(NC)"

docker-restart: ## Restart Docker services
	@$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✅ Docker services restarted$(NC)"

docker-logs: ## Show Docker logs
	@$(DOCKER_COMPOSE) logs -f

docker-ps: ## Show Docker status
	@$(DOCKER_COMPOSE) ps

#
# 🚀 PRODUCTION
#

start: ## Start bot (production via PM2)
	@$(SCRIPTS_DIR)/start-prod.sh

stop: ## Stop bot
	@$(SCRIPTS_DIR)/stop-prod.sh

restart: ## Restart bot (dev mode)
	@$(SCRIPTS_DIR)/restart.sh

#
# 🔧 DEVELOPMENT
#

dev: ## Start in dev mode
	@echo "$(BLUE)🚀 Starting in dev mode...$(NC)"
	@yarn dev

#
# 📊 MONITORING
#

health: ## Check services health
	@echo "$(BLUE)🏥 Health Check$(NC)"
	@echo ""
	@echo "$(GREEN)🐳 Docker:$(NC)"
	@$(DOCKER_COMPOSE) ps 2>/dev/null || echo "  ❌ Docker not running"
	@echo ""
	@echo "$(GREEN)🤖 Ollama:$(NC)"
	@curl -s http://localhost:11434/api/tags >/dev/null 2>&1 && echo "  ✅ OK" || echo "  ❌ KO"
	@echo ""
	@echo "$(GREEN)🔍 ChromaDB:$(NC)"
	@curl -s http://localhost:8000/api/v1/heartbeat >/dev/null 2>&1 && echo "  ✅ OK" || echo "  ❌ KO"
	@echo ""

logs: ## Show bot logs (PM2)
	@command -v pm2 >/dev/null 2>&1 && pm2 logs bogart || echo "$(YELLOW)PM2 not installed$(NC)"

monitor: ## Show PM2 monitoring
	@command -v pm2 >/dev/null 2>&1 && pm2 monit || echo "$(YELLOW)PM2 not installed$(NC)"

#
# 🛠️ MAINTENANCE
#

clean: ## Clean build files
	@echo "$(BLUE)🧹 Cleaning...$(NC)"
	@rm -rf dist/
	@rm -rf node_modules/
	@rm -f *.log
	@echo "$(GREEN)✅ Cleaned$(NC)"

reindex: ## Reindex RAG knowledge base
	@echo "$(BLUE)📚 Reindexing RAG...$(NC)"
	@yarn tsx scripts/reindex-rag.ts
	@echo "$(GREEN)✅ Reindex complete$(NC)"

#
# 📋 INFO
#

version: ## Show Bogart version
	@echo "$(BLUE)🤖 Bogart Bot v2.0$(NC)"
	@echo "Architecture: LLM + RAG + Discord"
	@echo "Stack: Node.js + TypeScript + Ollama + ChromaDB"
