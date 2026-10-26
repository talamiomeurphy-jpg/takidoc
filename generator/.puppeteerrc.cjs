const { join } = require('path');

/**
 * Télécharge Chromium dans le dossier du projet (et non dans ~/.cache),
 * pour qu'il soit conservé entre le build et l'exécution sur Render.
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer')
};
