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

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }
      throw new Error(result?.message || defaultErrorMessage);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    let filename = "laporan-owner.csv";

    if (disposition) {
      const match = disposition.match(/filename="?([^";]+)"?/i);
      if (match?.[1]) filename = match[1];
    }

    return { blob, filename };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Tidak bisa terhubung ke backend. Pastikan Laravel berjalan di http://127.0.0.1:8000"
    );
  }
}
`;

// Insert requestBlob before PRODUCTS API section
content = content.replace(
  /(\n\/\* ===== PRODUCTS API =====)/,
  requestBlobCode + "$1"
);

// Add exportOwnerReports function entry to api object
content = content.replace(
  /(  getOwnerReports,)/,
  "$1\n  exportOwnerReports,"
);

fs.writeFileSync(path, content, "utf-8");
console.log("api.js patched OK");
console.log("requestBlob:", content.includes("requestBlob"));
console.log("exportOwnerReports:", content.includes("exportOwnerReports"));
