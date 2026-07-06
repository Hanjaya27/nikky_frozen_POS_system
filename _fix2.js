const fs = require("fs");
const pathApi = "C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js";
let apiContent = fs.readFileSync(pathApi, "utf-8");
apiContent = apiContent.replace("Accept: 'text/csv,*/*'", "Accept: '*/*'");
fs.writeFileSync(pathApi, apiContent, "utf-8");

const pathPage = "C:\\laragon\\www\\possystem\\frontend\\src\\pages\\laporan\\LaporanPage.jsx";
let pageContent = fs.readFileSync(pathPage, "utf-8");
pageContent = pageContent.replace(/<button\s+type="button"\s+onClick=\{handleExport\}\s+disabled=\{exporting\}\s+className="flex items-center justify-center gap-2 rounded-2xl border border-#EBCDB8 bg-#FFFDF8 px-4 py-3 text-sm font-black text-#C80503 shadow-sm transition hover:bg-#FFF6EA hover:border-#C80503 disabled:opacity-50 disabled:cursor-not-allowed"/g, 
  '<button type="button" onClick={handleExport} disabled={exporting} className="flex items-center justify-center gap-2 rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#C80503] shadow-sm transition hover:bg-[#FFF6EA] hover:border-[#C80503] disabled:opacity-50 disabled:cursor-not-allowed"');

// Actually, the button is failing because it likely still has # symbols in the className instead of brackets for the variables/colors.
// Replacing the whole button tag with a known working version
const newButton = `<button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#C80503] shadow-sm transition hover:bg-[#FFF6EA] hover:border-[#C80503] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className={\`h-4 w-4 \${exporting ? "animate-bounce" : ""}\`} />
            {exporting ? "Mengekspor..." : "Export"}
          </button>`;

// Regex to find and replace the problematic button tag.
pageContent = pageContent.replace(/<button\s+type="button"\s+onClick=\{handleExport\}[\s\S]*?<\/button>/, newButton);

fs.writeFileSync(pathPage, pageContent, "utf-8");
console.log("Fixed API header and LaporanPage button manually");
