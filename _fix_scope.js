const fs = require("fs");
const path = "C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js";
let content = fs.readFileSync(path, "utf-8");

// The requestBlob function is currently trapped inside the comment block.
// We need to:
// 1. Find and remove it from inside the comment
// 2. Place it properly after the comment block

const requestBlobRE = /\/\* =========================\s*\n\s*\n\s*async function requestBlob\(/;
const match = content.match(requestBlobRE);

if (match) {
  // Remove requestBlob from inside the comment
  // Find the end of the requestBlob function (it ends with a closing brace + newline before PRODUCTS API)
  const blobStart = match.index;
  const afterOpen = content.indexOf("PRODUCTS API", blobStart);
  if (afterOpen >= 0) {
    // Remove the corrupted comment+function
    content = content.substring(0, blobStart) + "/* =========================\n   PRODUCTS API" + content.substring(afterOpen + "PRODUCTS API".length);
    
    // Find the end of the PRODUCTS API comment
    const commentEnd = "========================= */";
    const endIdx = content.indexOf(commentEnd, blobStart);
    if (endIdx >= 0) {
      const insertPos = endIdx + commentEnd.length;
      const blobFunc = `

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
      content = content.substring(0, insertPos) + blobFunc + content.substring(insertPos);
      fs.writeFileSync(path, content, "utf-8");
      console.log("requestBlob moved out of comment");
    }
  }
} else {
  console.log("requestBlob not found in comment, checking if it exists as top-level function...");
  // Check if requestBlob exists as a standalone function
  if (content.includes("async function requestBlob(url")) {
    console.log("requestBlob already exists at top level");
  } else {
    console.log("ERROR: requestBlob function doesn't exist at all");
  }
}

// Check syntax
try {
  require("child_process").execSync("node --check \"" + path + "\"", { stdio: "pipe" });
  console.log("Syntax OK");
} catch(e) {
  console.log("Syntax error found");
}
