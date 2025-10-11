# Dockerfile pour Bogart Bot (optionnel)
# Utilisez ce fichier si vous voulez containeriser le bot lui-même

FROM node:20-alpine

# Installer les dépendances système
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json yarn.lock ./

# Installer les dépendances
RUN yarn install --frozen-lockfile --production=false

# Copier le code source
COPY . .

# Build l'application
RUN yarn build

# Supprimer les devDependencies
RUN yarn install --frozen-lockfile --production=true && \
    yarn cache clean

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV OLLAMA_BASE_URL=http://ollama:11434
ENV CHROMA_URL=http://chromadb:8000

# Exposer le port (si nécessaire pour healthcheck)
# EXPOSE 3000

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Changer les permissions
RUN chown -R nodejs:nodejs /app

# Utiliser l'utilisateur non-root
USER nodejs

# Healthcheck (optionnel)
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#   CMD node -e "console.log('healthy')" || exit 1

# Commande de démarrage
CMD ["node", "dist/index.js"]
