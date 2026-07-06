const fs = require('fs');
const path = 'C:\\laragon\\www\\possystem\\frontend\\src\\pages\\laporan\\LaporanPage.jsx';
let content = fs.readFileSync(path, 'utf-8');
if (!content.includes('exportError && (')) {
  content = content.replace(
    '      </div>\n\n      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">',
    '      </div>\n\n      {exportError && (\n        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">\n          {exportError}\n        </div>\n      )}\n\n      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">'
  );
}
fs.writeFileSync(path, content, 'utf-8');
console.log('error banner ensured');
