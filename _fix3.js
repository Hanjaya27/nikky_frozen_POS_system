const fs = require("fs");
const path = "C:\\laragon\\www\\possystem\\frontend\\src\\pages\\laporan\\LaporanPage.jsx";
let content = fs.readFileSync(path, "utf-8");

// Replace the duplicate button problem
content = content.replace(
  /<button\s+type="button"\s*\n\s*<button\s+type="button"/g,
  '<button type="button"'
);

// Also ensure no empty button tags remain
content = content.replace(
  /<button\s+type="button"\s*>\s*\n\s*<\/button>\s*\n/g,
  ""
);

fs.writeFileSync(path, content, "utf-8");
console.log("Duplicate button cleanup done");
