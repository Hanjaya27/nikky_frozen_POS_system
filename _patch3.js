const fs = require("fs");
const path = "C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js";
let content = fs.readFileSync(path, "utf-8");

// Fix duplicate exportOwnerReports in api object - keep only one
const lines = content.split("\n");
const apiObjectLines = [];
let inApiObject = false;
let exportCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const api = {")) inApiObject = true;
  if (inApiObject && lines[i].includes("exportOwnerReports,")) {
    exportCount++;
    if (exportCount > 1) continue; // skip duplicates
  }
  apiObjectLines.push(lines[i]);
}
content = apiObjectLines.join("\n");

// Add exportOwnerReports function before getOwnerStocks
const exportFuncCode = `

export async function exportOwnerReports(params = {}) {
  const qs = buildQueryParams({ ...params, format: "csv" });
  const url = qs
    ? API_BASE_URL + "/owner/reports/export?" + qs
    : API_BASE_URL + "/owner/reports/export";
  return requestBlob(url, { method: "GET" }, "Gagal export laporan.");
}

`;

// Only add if the function definition doesn't exist yet
if (!content.includes("export async function exportOwnerReports")) {
  const marker = "export async function getOwnerStocks";
  const idx = content.indexOf(marker);
  if (idx >= 0) {
    content = content.slice(0, idx) + exportFuncCode + content.slice(idx);
    console.log("exportOwnerReports function added");
  } else {
    console.log("ERROR: Could not find getOwnerStocks marker");
  }
} else {
  console.log("exportOwnerReports function already exists");
}

fs.writeFileSync(path, content, "utf-8");
console.log("Final check:");
console.log("  requestBlob function:", content.includes("async function requestBlob"));
console.log("  exportOwnerReports function:", content.includes("export async function exportOwnerReports"));
console.log("  api object has exportOwnerReports:", (content.match(/exportOwnerReports,/g) || []).length === 1);
