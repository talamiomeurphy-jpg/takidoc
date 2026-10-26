'use strict';
/* Copie fidèle de splitSelectors / scopeSelector / scopeCSS de js/editor.js :
   le serveur isole le CSS du modèle exactement comme l'éditeur. */

function splitSelectors(selectorText) {
  const result = [];
  let current = '';
  let depth = 0;
  let quote = '';

  for (const char of selectorText) {
    if (quote) {
      current += char;
      if (char === quote) quote = '';
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;

    if (char === ',' && depth === 0) {
      if (current.trim()) result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) result.push(current.trim());
  return result;
}

function scopeSelector(selector) {
  const root = '#document-canvas';
  selector = selector.trim();

  if (/^(html|body|:root)(?=$|[\s.#:[>+~])/i.test(selector)) {
    selector = selector.replace(/^(html|body|:root)\b/i, root);

    return selector.replace(
      /#document-canvas\s+#document-canvas/g,
      root
    );
  }

  if (selector === '*') return `${root} *`;
  if (selector.startsWith(root)) return selector;

  return `${root} ${selector}`;
}

function scopeCSS(css) {
  css = String(css || '')
    .replace(/^\uFEFF/, '')
    .replace(/<\/?style\b[^>]*>/gi, '')
    .replace(/@import\b[^;]*;?/gi, '');

  let output = '';
  let i = 0;

  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) {
      output += css[i++];
    }

    if (i >= css.length) break;

    const open = css.indexOf('{', i);
    const semicolon = css.indexOf(';', i);

    if (open === -1 || (semicolon !== -1 && semicolon < open)) {
      output += css.slice(
        i,
        semicolon === -1 ? css.length : semicolon + 1
      );

      i = semicolon === -1 ? css.length : semicolon + 1;
      continue;
    }

    const header = css.slice(i, open).trim();

    let depth = 1;
    let j = open + 1;
    let quote = '';
    let comment = false;

    for (; j < css.length && depth > 0; j++) {
      const char = css[j];
      const next = css[j + 1];

      if (comment) {
        if (char === '*' && next === '/') {
          comment = false;
          j++;
        }
        continue;
      }

      if (!quote && char === '/' && next === '*') {
        comment = true;
        j++;
        continue;
      }

      if (quote) {
        if (char === '\\') j++;
        else if (char === quote) quote = '';
        continue;
      }

      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }

      if (char === '{') depth++;
      if (char === '}') depth--;
    }

    const body = css.slice(open + 1, j - 1);

    if (header.startsWith('@')) {
      if (/^@(media|supports|container|layer|document)\b/i.test(header)) {
        output += `${header}{${scopeCSS(body)}}`;
      } else {
        output += `${header}{${body}}`;
      }
    } else {
      output += `${splitSelectors(header)
        .map(scopeSelector)
        .join(', ')}{${body}}`;
    }

    i = j;
  }

  return output;
}


module.exports = { splitSelectors, scopeSelector, scopeCSS };
