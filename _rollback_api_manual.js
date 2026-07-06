const fs = require('fs');
const path = 'C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js';
let s = fs.readFileSync(path, 'utf8');

// Manually replace each function to ensure accuracy
s = s.replace(/export async function getProducts\(params = \{\}\) \{[\s\S]*?return normalizePaginationResponse\(result\.data\);\n\}/, 
\export async function getProducts(params = {}) {
  const queryString = buildQueryParams(params);
  const url = queryString ? \\/products?\\ : \\/products\;
  const result = await request(url, { method: \"GET\" }, \"Gagal mengambil data produk.\");
  return result.data;
}\);

s = s.replace(/export async function getTransactions\(params = \{\}\) \{[\s\S]*?return normalizePaginationResponse\(result\.data\);\n\}/, 
\export async function getTransactions(params = {}) {
  const queryString = buildQueryParams(params);
  const url = queryString ? \\/transactions?\\ : \\/transactions\;
  const result = await request(url, { method: \"GET\" }, \"Gagal mengambil data transaksi.\");
  return result.data;
}\);

s = s.replace(/export async function getExpenses\(params = \{\}\) \{[\s\S]*?return normalizePaginationResponse\(result\.data\);\n\}/, 
\export async function getExpenses(params = {}) {
  const queryString = buildQueryParams(params);
  const url = queryString ? \\/expenses?\\ : \\/expenses\;
  const result = await request(url, { method: \"GET\" }, \"Gagal mengambil data pengeluaran.\");
  return result.data;
}\);

s = s.replace(/export async function getOwnerUsers\(params = \{\}\) \{[\s\S]*?return normalizePaginationResponse\(result\.data\);\n\}/, 
\export async function getOwnerUsers(params = {}) {
  const queryString = buildQueryParams(params);
  const url = queryString ? \\/owner/users?\\ : \\/owner/users\;
  const result = await request(url, { method: \"GET\" }, \"Gagal mengambil data user.\");
  return result.data;
}\);

// Also remove normalizePaginationResponse function as it won't be needed anymore
s = s.replace(/\n\nfunction normalizePaginationResponse\(result\) \{[\s\S]*?\}\n/, '');

fs.writeFileSync(path, s, 'utf8');
console.log('Manual API rollback complete');
