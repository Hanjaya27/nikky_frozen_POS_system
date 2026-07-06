const fs = require('fs');
const path = 'C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js';
let content = fs.readFileSync(path, 'utf8');
const marker = '/* =========================\n   PRODUCTS API\n========================= */';
const insert = `

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

async function requestBlob(url, options = {}, defaultErrorMessage = "Terjadi kesalahan.") {
  try {
    const isFormData = options.body instanceof FormData;
    const headers = {
      Accept: "text/csv",
      ...(!isFormData && options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let result = null;
      try { result = await response.json(); } catch (e) { result = null; }
      throw new Error(result?.message || defaultErrorMessage);
    }
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    let filename = "laporan-owner.csv";
    if (disposition) {
      const m = disposition.match(/filename="?([^";]+)"?/i);
      if (m?.[1]) filename = m[1];
    }
    return { blob, filename };
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Tidak bisa terhubung ke backend. Pastikan Laravel berjalan di http://127.0.0.1:8000");
  }
}

`;
if (!content.includes('const apiCache = new Map();')) {
  content = content.replace(marker, insert + marker);
}
fs.writeFileSync(path, content, 'utf8');
console.log('api.js helpers injected');
