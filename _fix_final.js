const fs = require('fs');

const apiPath = 'C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js';
let api = fs.readFileSync(apiPath, 'utf-8');
api = api.replace(/Accept:\s*'\*\/\*'/, 'Accept: "text/csv"');
fs.writeFileSync(apiPath, api, 'utf-8');

const pagePath = 'C:\\laragon\\www\\possystem\\frontend\\src\\pages\\laporan\\LaporanPage.jsx';
let page = fs.readFileSync(pagePath, 'utf-8');
page = page.replace(/\n\s*\{exportError && \([\s\S]*?\)\}\n\n\s*<div className="flex flex-col gap-3 lg:flex-row lg:items-center">/, '\n\n        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">');
page = page.replace(/<button type="button"\s*\n\s*onClick=\{handleExport\}\s*\n\s*disabled=\{exporting\}\s*\n\s*className="flex items-center justify-center gap-2 rounded-2xl border border-\[#EBCDB8\] bg-\[#FFFDF8\] px-4 py-3 text-sm font-black text-\[#C80503\] shadow-sm transition hover:bg-\[#FFF6EA\] hover:border-\[#C80503\] disabled:opacity-50 disabled:cursor-not-allowed"\s*\n\s*>[\s\S]*?<\/button>/, `<button\n            type="button"\n            onClick={handleExport}\n            disabled={exporting}\n            className="flex items-center justify-center gap-2 rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#C80503] shadow-sm transition hover:bg-[#FFF6EA] hover:border-[#C80503] disabled:opacity-50 disabled:cursor-not-allowed"\n          >\n            <Download className={\`h-4 w-4 ${exporting ? "animate-bounce" : ""}\`} />\n            {exporting ? "Mengekspor..." : "Export"}\n          </button>`);
fs.writeFileSync(pagePath, page, 'utf-8');
console.log('simplified fixes applied');
