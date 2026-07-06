const fs = require('fs');
const path = 'C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js';
let s = fs.readFileSync(path, 'utf8');

// 1. Add cache/helper functions after the request()
const helpers = `

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

function normalizePaginationResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) {
    const items = result.data;
    items.pagination = {
      current_page: result.current_page,
      last_page: result.last_page,
      per_page: result.per_page,
      total: result.total,
    };
    return items;
  }
  return [];
}

`;
s = s.replace('/* =========================\n   PRODUCTS API\n========================= */', helpers + '/* =========================\n   PRODUCTS API\n========================= */');

// 2. Patch getProducts to normalize
s = s.replace(
  'return result.data;\n}\n\nexport async function getProductById(',
  'return normalizePaginationResponse(result.data);\n}\n\nexport async function getProductById('
);

// 3. Patch getTransactions to normalize
s = s.replace(
  'return result.data;\n}\n\n/* =========================\n   EXPENSES API',
  'return normalizePaginationResponse(result.data);\n}\n\n/* =========================\n   EXPENSES API'
);

// 4. Patch getExpenses to normalize
s = s.replace(
  'return result.data;\n}\n\nexport async function getExpenseById(',
  'return normalizePaginationResponse(result.data);\n}\n\nexport async function getExpenseById('
);

// 5. Patch getOwnerUsers to normalize
s = s.replace(
  'return result.data;\n}\n\n/* =========================\n   OWNER DASHBOARD API',
  'return normalizePaginationResponse(result.data);\n}\n\n/* =========================\n   OWNER DASHBOARD API'
);

// 6. Cache getOwnerRolePermissions
s = s.replace(
  'return result.data;\n}\n\nexport async function updateRolePermission(',
  'return result.data;\n}\n\nexport async function updateRolePermission('
);

fs.writeFileSync(path, s, 'utf8');
console.log('api.js fully patched');
