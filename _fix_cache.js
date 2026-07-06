const fs = require('fs');
const path = 'C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js';
let s = fs.readFileSync(path, 'utf8');

const cacheBlock = `

const apiCache = new Map();

function clearCacheByPrefix(prefix) {
  Array.from(apiCache.keys()).forEach((key) => {
    if (key.includes(prefix)) apiCache.delete(key);
  });
}

async function cachedRequest(url, options = {}, defaultErrorMessage = "Terjadi kesalahan.", ttlMs = 60000) {
  const cached = apiCache.get(url);
  if (cached && Date.now() - cached.time < ttlMs) {
    return cached.value;
  }
  const value = await request(url, options, defaultErrorMessage);
  apiCache.set(url, { value, time: Date.now() });
  return value;
}

`;

// Insert after the first line (const API_BASE_URL)
const marker = 'const API_BASE_URL =';
const idx = s.indexOf(marker);
const lineEnd = s.indexOf('\n', idx);
s = s.slice(0, lineEnd + 1) + cacheBlock + s.slice(lineEnd + 1);

fs.writeFileSync(path, s, 'utf8');
console.log('cache functions injected');
