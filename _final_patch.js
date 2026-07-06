const fs = require('fs');
const path = 'C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js';
let s = fs.readFileSync(path, 'utf8');

// 1. Add clearCacheByPrefix calls to role permission update functions
s = s.replace(
  'export async function enableAllAdminPermissions() {',
  'export async function enableAllAdminPermissions() {\n  clearCacheByPrefix("/owner/role-permissions");'
);
s = s.replace(
  'export async function enableAllCashierPermissions() {',
  'export async function enableAllCashierPermissions() {\n  clearCacheByPrefix("/owner/role-permissions");'
);
s = s.replace(
  'export async function applySafeDefaultPermissions() {',
  'export async function applySafeDefaultPermissions() {\n  clearCacheByPrefix("/owner/role-permissions");'
);
s = s.replace(
  'export async function resetRolePermissions() {',
  'export async function resetRolePermissions() {\n  clearCacheByPrefix("/owner/role-permissions");'
);

// Add clearCacheByPrefix to updateRolePermission
s = s.replace(
  'return result.data;\n}\n\nexport async function enableAllAdminPermissions',
  'clearCacheByPrefix("/owner/role-permissions");\n  return result.data;\n}\n\nexport async function enableAllAdminPermissions'
);

// 2. Add clearCacheByPrefix to updateOwnerSettings
s = s.replace(
  'return result.data;\n}\n\nconst api = {',
  'clearCacheByPrefix("/owner/settings");\n  return result.data;\n}\n\nconst api = {'
);

// 3. Add exportOwnerReports function and api reference
const exportOwnerFunc = `

export async function exportOwnerReports(params = {}) {
  const qs = buildQueryParams({ ...params, format: "csv" });
  const url = qs
    ? API_BASE_URL + "/owner/reports/export?" + qs
    : API_BASE_URL + "/owner/reports/export";
  return requestBlob(url, { method: "GET" }, "Gagal export laporan.");
}
`;

// Insert after getOwnerReports
s = s.replace(
  'export async function getOwnerStocks(params = {})',
  exportOwnerFunc + '\nexport async function getOwnerStocks(params = {})'
);

// Add to api object
s = s.replace(
  '  getOwnerReports,\n  getOwnerStocks,',
  '  getOwnerReports,\n  exportOwnerReports,\n  getOwnerStocks,'
);

fs.writeFileSync(path, s, 'utf8');
console.log('final api.js patches applied');
console.log('exportOwnerReports exists:', s.includes('exportOwnerReports'));
console.log('clearCacheByPrefix exists:', s.includes('clearCacheByPrefix'));
