const fs = require('fs');
const path = 'C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js';
let s = fs.readFileSync(path, 'utf8');

function crlf(str) { return str.replace(/\n/g, '\r\n'); }

const helpers = crlf(`

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

`);

// Insert helpers before PRODUCTS API
s = s.replace(/\/\* =========================[\r\n]+   PRODUCTS API[\r\n]+========================= \*/, helpers + '/* =========================\r\n   PRODUCTS API\r\n========================= */');

// Patch getProducts return
if (!s.includes('normalizePaginationResponse')) {
  s = s.replace(
    /(  return result\.data;\r?\n}\r?\n\r?\nexport async function getProductById\()/,
    '  return normalizePaginationResponse(result.data);\r\n}\r\n\r\nexport async function getProductById('
  );

  // Patch getTransactions return
  s = s.replace(
    /(  return result\.data;\r?\n}\r?\n\r?\n\/\* =========================\r?\n   EXPENSES API)/,
    '  return normalizePaginationResponse(result.data);\r\n}\r\n\r\n/* =========================\r\n   EXPENSES API'
  );

  // Patch getExpenses return
  s = s.replace(
    /(  return result\.data;\r?\n}\r?\n\r?\nexport async function getExpenseById\()/,
    '  return normalizePaginationResponse(result.data);\r\n}\r\n\r\nexport async function getExpenseById('
  );

  // Patch getOwnerUsers return
  s = s.replace(
    /(  return result\.data;\r?\n}\r?\n\r?\n\/\* =========================\r?\n   OWNER DASHBOARD API)/,
    '  return normalizePaginationResponse(result.data);\r\n}\r\n\r\n/* =========================\r\n   OWNER DASHBOARD API'
  );

  // Patch getOwnerRolePermissions to use caching
  s = s.replace(
    /export async function getOwnerRolePermissions\(params = \{\}\) {[\s\S]*?return result\.data;\r?\n}/,
    `export async function getOwnerRolePermissions(params = {}) {
  const queryString = buildQueryParams(params);
  const url = queryString
    ? \`\${API_BASE_URL}/owner/role-permissions?\${queryString}\`
    : \`\${API_BASE_URL}/owner/role-permissions\`;
  const result = await cachedRequest(url, { method: "GET" }, "Gagal mengambil data permission.", 30000);
  clearCacheByPrefix("/owner/role-permissions");
  return result.data;
}`
  );

  // Patch getOwnerSettings to use caching
  s = s.replace(
    /export async function getOwnerSettings\(\) {[\s\S]*?return result\.data;\r?\n}/,
    `export async function getOwnerSettings() {
  const result = await cachedRequest(
    \`\${API_BASE_URL}/owner/settings\`,
    { method: "GET" },
    "Gagal mengambil pengaturan owner.",
    120000
  );
  return result.data;
}`
  );

  // Patch getBranches to use caching
  s = s.replace(
    /export async function getBranches\(\) {[\s\S]*?return result\.data;\r?\n}/,
    `export async function getBranches() {
  const result = await cachedRequest(
    \`\${API_BASE_URL}/branches\`,
    { method: "GET" },
    "Gagal mengambil data cabang.",
    120000
  );
  return result.data;
}`
  );
}

fs.writeFileSync(path, s, 'utf8');
console.log('CRLF-aware patch applied');
console.log('apiCache:', s.includes('apiCache'));
console.log('normalizePaginationResponse:', s.includes('normalizePaginationResponse'));
console.log('cachedRequest:', s.includes('cachedRequest'));
console.log('requestBlob:', s.includes('requestBlob'));
