from pathlib import Path
path = Path(r'C:\laragon\www\possystem\frontend\src\services\api.js')
text = path.read_text(encoding='utf-8')
lines = text.splitlines()
start = next(i for i, l in enumerate(lines) if l.startswith('export async function getActiveShift'))
end = start
while end < len(lines) and not lines[end].startswith('export async function openShift'):
    end += 1
new_block = [
    'export async function getActiveShift(params = {}) {',
    '  const queryString = buildQueryParams(params);',
    '  const url = queryString',
    '    ? `${API_BASE_URL}/shifts/active?${queryString}`',
    '    : `${API_BASE_URL}/shifts/active`;',
    '',
    '  const result = await request(',
    '    url,',
    '    { method: "GET" },',
    '    "Gagal mengambil status shift."',
    '  );',
    '',
    '  return result.data;',
    '}',
    ''
]
lines = lines[:start] + new_block + lines[end:]
for i, l in enumerate(lines):
    if l.strip() == 'getCurrentShift,':
        if i + 1 < len(lines) and lines[i + 1].strip() != 'getActiveShift,':
            lines.insert(i + 1, '  getActiveShift,')
        break
path.write_text('\r\n'.join(lines) + '\r\n', encoding='utf-8')
print('rewrote getActiveShift block')
