const fs = require("fs");
const path = "C:\\laragon\\www\\possystem\\frontend\\src\\pages\\laporan\\LaporanPage.jsx";
let content = fs.readFileSync(path, "utf-8");
content = content.replace('const [exportError, setExportError] = useState(");', 'const [exportError, setExportError] = useState("");');

if (!content.includes('exportError && (')) {
  const insertAfter = '      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">';
  const idx = content.indexOf(insertAfter);
  if (idx >= 0) {
    const anchorEnd = content.indexOf('      </div>', idx);
    if (anchorEnd >= 0) {
      const insertPos = anchorEnd + '      </div>'.length;
      const banner = '\n\n      {exportError && (\n        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">\n          {exportError}\n        </div>\n      )}';
      content = content.slice(0, insertPos) + banner + content.slice(insertPos);
    }
  }
}
fs.writeFileSync(path, content, 'utf-8');
console.log('patched LaporanPage');
