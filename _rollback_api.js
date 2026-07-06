const fs = require('fs');
const path = 'C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js';
let s = fs.readFileSync(path, 'utf8');

// Function to replace the normalization logic with the original return result.data logic
function rollback(funcName, resultVar) {
  const regex = new RegExp('export async function ' + funcName + '\\(params = \\{\\}\\) \\{[\\s\\S]*?return normalizePaginationResponse\\(result\\.data\\);\\n\\}', 'g');
  const replacement = 'export async function ' + funcName + '(params = {}) {\n  const queryString = buildQueryParams(params);\n\n  const url = queryString\n    ? \/?\\n    : \/;\n\n  const result = await request(\n    url,\n    { method: \"GET\" },\n    \"Gagal mengambil data " + (funcName === 'getOwnerUsers' ? 'user' : funcName.replace('get', '').toLowerCase()) + ".\"\n  );\n\n  return result.data;\n}';
  s = s.replace(regex, replacement);
}

rollback('getProducts', 'result.data');
rollback('getTransactions', 'result.data');
rollback('getExpenses', 'result.data');
rollback('getOwnerUsers', 'result.data');

fs.writeFileSync(path, s, 'utf8');
console.log('API rollback done');
