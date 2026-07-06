import re, os
path = 'C:\\laragon\\www\\possystem\\frontend\\src\\services\\api.js'
with open(path, 'r', encoding='utf-8') as f:
    s = f.read()

if 'export async function getActiveShift' not in s:
    getCurrentShiftEnd = '  return result.data;\n}\n\nexport async function openShift(shiftData) {'
    replacement = '  return result.data;\n}\n\n' + \
        'export async function getActiveShift(params = {}) {\n' + \
        '  const queryString = buildQueryParams(params);\n' + \
        '  const url = queryString\n' + \
        '    ? ${API_BASE_URL}/shifts/active?\n' + \
        '    : ${API_BASE_URL}/shifts/active;\n\n' + \
        '  const result = await request(\n' + \
        '    url,\n' + \
        '    { method: "GET" },\n' + \
        '    "Gagal mengambil status shift."\n' + \
        '  );\n\n' + \
        '  return result.data;\n' + \
        '}\n\n' + \
        'export async function openShift(shiftData) {'
    s = s.replace(getCurrentShiftEnd, replacement)

if 'getActiveShift,' not in s:
    s = s.replace('  getCurrentShift,\n  openShift,', '  getCurrentShift,\n  getActiveShift,\n  openShift,')

with open(path, 'w', encoding='utf-8') as f:
    f.write(s)

print('getActiveShift function:', 'export async function getActiveShift' in s)
print('getActiveShift in api obj:', 'getActiveShift,' in s)
