# TAKIDOC-DOCKERFILE-V3
# ============================================================
# TakiDoc — Générateur de documents (PDF / Word)
# Image prévue pour Render (ou tout hébergeur Docker).
#
# - Node 22 sur Debian « bookworm » (exigé par Puppeteer 25 et supabase-js)
# - bibliothèques système exigées par Chromium + polices
# - Chromium téléchargé par Puppeteer dans /app/.cache/puppeteer
#   (dossier défini par .puppeteerrc.cjs : il reste dans l'image)
# - exécution sous l'utilisateur « node » (pas root)
# ============================================================
FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=10000 \
    PUPPETEER_CACHE_DIR=/app/.cache/puppeteer \
    MAX_CONCURRENT_RENDERS=1 \
    BROWSER_RECYCLE_AFTER=40 \
    PREWARM_BROWSER=false

# Bibliothèques système de Chromium, polices, et « unzip »
# (indispensable : sans lui, Puppeteer ne peut pas décompresser Chrome après l'avoir téléchargé)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      fonts-liberation \
      fonts-noto-color-emoji \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libexpat1 \
      libgbm1 \
      libglib2.0-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libx11-6 \
      libxcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxkbcommon0 \
      libxrandr2 \
      unzip \
      xdg-utils \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown node:node /app
USER node

# 1) Dépendances d'abord (meilleur cache de build)
#    .puppeteerrc.cjs doit être présent AVANT npm install : c'est lui qui
#    place Chromium dans /app/.cache/puppeteer
COPY --chown=node:node package*.json .puppeteerrc.cjs ./

# npm install (et non npm ci) : fonctionne même si package-lock.json n'est pas à jour
RUN npm install --omit=dev --no-audit --no-fund

# Chrome : on repart d'un dossier propre, on l'installe, puis on VÉRIFIE que le
# programme existe vraiment. Si ce n'est pas le cas, le build échoue ICI
# avec un message clair (au lieu d'un serveur qui plante plus tard).
RUN rm -rf /app/.cache/puppeteer \
 && npx puppeteer browsers install chrome \
 && node -e "const p=require('puppeteer').executablePath(); require('fs').accessSync(p); console.log('Chrome OK :', p)"

# 2) Code de l'application
COPY --chown=node:node . .

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||10000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
