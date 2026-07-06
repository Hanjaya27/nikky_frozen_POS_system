import re
path = 'C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js'
with open(path, 'r', encoding='utf-8') as f:
    s = f.read()

# Insert helper functions before PRODUCTS API section
helpers = '''

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

'''

s = s.replace('/* =========================\n   PRODUCTS API\n========================= */', helpers + '/* =========================\n   PRODUCTS API\n========================= */')

export_func = '''


export async function exportOwnerReports(params = {}) {
  const qs = buildQueryParams({ ...params, format: "csv" });
  const url = qs
    ? API_BASE_URL + "/owner/reports/export?" + qs
    : API_BASE_URL + "/owner/reports/export";
  return requestBlob(url, { method: "GET" }, "Gagal export laporan.");
}
'''

s = s.replace('export async function getOwnerStocks(params = {})', export_func + '\nexport async function getOwnerStocks(params = {})')

s = s.replace('  getOwnerReports,\n  getOwnerStocks,', '  getOwnerReports,\n  exportOwnerReports,\n  getOwnerStocks,')

with open(path, 'w', encoding='utf-8') as f:
    f.write(s)

print('OK - requestBlob:', 'requestBlob' in s)
print('OK - exportOwnerReports:', 'exportOwnerReports' in s)
