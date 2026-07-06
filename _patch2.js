const fs = require("fs");
const path = "C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js";
let content = fs.readFileSync(path, "utf-8");

const requestBlobCode = `

async function requestBlob(url, options = {}, defaultErrorMessage = "Terjadi kesalahan.") {
  try {
    const isFormData = options.body instanceof FormData;
    const headers = {
      Accept: "text/csv,*/*",
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

const exportFuncCode = `

export async function exportOwnerReports(params = {}) {
  const qs = buildQueryParams({ ...params, format: "csv" });
  const url = qs
    ? API_BASE_URL + "/owner/reports/export?" + qs
    : API_BASE_URL + "/owner/reports/export";
  return requestBlob(url, { method: "GET" }, "Gagal export laporan.");
}
`;

// Check if requestBlob already exists
if (content.includes("requestBlob")) {
  console.log("requestBlob already exists, skipping");
} else {
  // Insert after the request function (before PRODUCTS API section)
  const marker = "/* =========================\n   PRODUCTS API\n========================= */";
  const idx = content.indexOf(marker);
  if (idx >= 0) {
    content = content.slice(0, idx) + requestBlobCode + content.slice(idx);
    console.log("requestBlob inserted");
  } else {
    console.log("Marker not found, trying alternate approach");
    const idx2 = content.indexOf("PRODUCTS API");
    if (idx2 >= 0) {
      content = content.slice(0, idx2) + requestBlobCode + content.slice(idx2);
      console.log("requestBlob inserted (alt marker)");
    } else {
      console.log("ERROR: Could not find insertion point");
      process.exit(1);
    }
  }
}

// Check if exportOwnerReports already exists
if (content.includes("exportOwnerReports")) {
  console.log("exportOwnerReports already exists, skipping");
}

fs.writeFileSync(path, content, "utf-8");
console.log("Done patching api.js");
