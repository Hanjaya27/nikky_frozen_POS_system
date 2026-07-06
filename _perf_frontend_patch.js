const fs = require('fs');
const root = 'C:\\laragon\\www\\possystem';

function write(path, content) {
  fs.writeFileSync(path, content, 'utf8');
}

function patchApi() {
  const path = root + '\\frontend\\src\\services\\api.js';
  let s = fs.readFileSync(path, 'utf8');

  if (!s.includes('const apiCache = new Map();')) {
    s = s.replace(
      'const API_BASE_URL =\n  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";\n',
      'const API_BASE_URL =\n  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";\n\nconst apiCache = new Map();\n\nfunction getCacheKey(url) {\n  return url;\n}\n\nfunction clearCacheByPrefix(prefix) {\n  Array.from(apiCache.keys()).forEach((key) => {\n    if (key.includes(prefix)) apiCache.delete(key);\n  });\n}\n\nasync function cachedRequest(url, options = {}, defaultErrorMessage = "Terjadi kesalahan.", ttlMs = 60000) {\n  const key = getCacheKey(url);\n  const cached = apiCache.get(key);\n\n  if (cached && Date.now() - cached.time < ttlMs) {\n    return cached.value;\n  }\n\n  const value = await request(url, options, defaultErrorMessage);\n  apiCache.set(key, { value, time: Date.now() });\n  return value;\n}\n'
    );
  }

  s = s.replace(
    /export async function getOwnerRolePermissions\(params = \{\}\) \{[\s\S]*?\n\}/,
    `export async function getOwnerRolePermissions(params = {}) {
  const queryString = buildQueryParams(params);
  const url = queryString
    ? \`${'${API_BASE_URL}'}/owner/role-permissions?${'${queryString}'}\`
    : \`${'${API_BASE_URL}'}/owner/role-permissions\`;

  const result = await cachedRequest(url, { method: "GET" }, "Gagal mengambil data permission.", 30000);

  return result.data;
}`
  );

  s = s.replace(
    /export async function updateRolePermission\(permissionId, payload\) \{[\s\S]*?\n\}/,
    `export async function updateRolePermission(permissionId, payload) {
  const result = await request(
    \`${'${API_BASE_URL}'}/owner/role-permissions/${'${permissionId}'}\`,
    { method: "PATCH", body: JSON.stringify(payload) },
    "Gagal memperbarui permission."
  );

  clearCacheByPrefix("/owner/role-permissions");
  return result.data;
}`
  );

  s = s.replace(
    /export async function enableAllAdminPermissions\(\) \{[\s\S]*?\n\}/,
    `export async function enableAllAdminPermissions() {
  const result = await request(\`${'${API_BASE_URL}'}/owner/role-permissions/enable-all-admin\`, { method: "POST" }, "Gagal mengaktifkan permission admin.");
  clearCacheByPrefix("/owner/role-permissions");
  return result.data;
}`
  );

  s = s.replace(
    /export async function enableAllCashierPermissions\(\) \{[\s\S]*?\n\}/,
    `export async function enableAllCashierPermissions() {
  const result = await request(\`${'${API_BASE_URL}'}/owner/role-permissions/enable-all-cashier\`, { method: "POST" }, "Gagal mengaktifkan permission kasir.");
  clearCacheByPrefix("/owner/role-permissions");
  return result.data;
}`
  );

  s = s.replace(
    /export async function applySafeDefaultPermissions\(\) \{[\s\S]*?\n\}/,
    `export async function applySafeDefaultPermissions() {
  const result = await request(\`${'${API_BASE_URL}'}/owner/role-permissions/safe-defaults\`, { method: "POST" }, "Gagal menerapkan standar aman.");
  clearCacheByPrefix("/owner/role-permissions");
  return result.data;
}`
  );

  s = s.replace(
    /export async function resetRolePermissions\(\) \{[\s\S]*?\n\}/,
    `export async function resetRolePermissions() {
  const result = await request(\`${'${API_BASE_URL}'}/owner/role-permissions/reset\`, { method: "POST" }, "Gagal reset permission.");
  clearCacheByPrefix("/owner/role-permissions");
  return result.data;
}`
  );

  s = s.replace(
    /export async function getOwnerSettings\(\) \{[\s\S]*?\n\}/,
    `export async function getOwnerSettings() {
  const result = await cachedRequest(
    \`${'${API_BASE_URL}'}/owner/settings\`,
    { method: "GET" },
    "Gagal mengambil pengaturan owner.",
    120000
  );

  return result.data;
}`
  );

  s = s.replace(
    /export async function updateOwnerSettings\(payload\) \{[\s\S]*?return result\.data;\n\}/,
    `export async function updateOwnerSettings(payload) {
  const result = await request(
    \`${'${API_BASE_URL}'}/owner/settings\`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    "Gagal menyimpan pengaturan owner."
  );

  clearCacheByPrefix("/owner/settings");
  return result.data;
}`
  );

  s = s.replace(
    /export async function getBranches\(\) \{[\s\S]*?\n\}/,
    `export async function getBranches() {
  const result = await cachedRequest(
    \`${'${API_BASE_URL}'}/branches\`,
    { method: "GET" },
    "Gagal mengambil data cabang.",
    120000
  );

  return result.data;
}`
  );

  write(path, s);
}

function patchDataUser() {
  const path = root + '\\frontend\\src\\pages\\owner\\DataUserPage.jsx';
  let s = fs.readFileSync(path, 'utf8');
  s = s.replace('const [searchKeyword, setSearchKeyword] = useState("");', 'const [searchKeyword, setSearchKeyword] = useState("");\n  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState("");');
  s = s.replace('const params = { branch_id: selectedBranch, role: selectedRole, status: selectedStatus, search: searchKeyword };', 'const params = { branch_id: selectedBranch, role: selectedRole, status: selectedStatus, search: debouncedSearchKeyword };');
  s = s.replace('useEffect(() => { fetchUsers(); }, [selectedBranch, selectedRole, selectedStatus, searchKeyword]);', 'useEffect(() => {\n    const timeoutId = setTimeout(() => setDebouncedSearchKeyword(searchKeyword), 400);\n    return () => clearTimeout(timeoutId);\n  }, [searchKeyword]);\n\n  useEffect(() => { fetchUsers(); }, [selectedBranch, selectedRole, selectedStatus, debouncedSearchKeyword]);');
  s = s.replace(/if \(!formData\.name\.trim\(\)\) \{ alert\("Nama wajib diisi\."\); return false; \}/, 'if (!formData.name.trim()) { setErrorMessage("Nama wajib diisi."); return false; }');
  s = s.replace(/if \(!formData\.username\.trim\(\)\) \{ alert\("Username wajib diisi\."\); return false; \}/, 'if (!formData.username.trim()) { setErrorMessage("Username wajib diisi."); return false; }');
  s = s.replace(/if \(!editingUser && !formData\.password\.trim\(\)\) \{ alert\("Password wajib diisi\."\); return false; \}/, 'if (!editingUser && !formData.password.trim()) { setErrorMessage("Password wajib diisi."); return false; }');
  s = s.replace(/if \(formData\.password && formData\.password\.length < 6\) \{ alert\("Password minimal 6 karakter\."\); return false; \}/, 'if (formData.password && formData.password.length < 6) { setErrorMessage("Password minimal 6 karakter."); return false; }');
  s = s.replace(/if \(\(formData\.role === "admin" \|\| formData\.role === "cashier"\) && !formData\.branch_id\) \{ alert\("Cabang wajib dipilih\."\); return false; \}/, 'if ((formData.role === "admin" || formData.role === "cashier") && !formData.branch_id) { setErrorMessage("Cabang wajib dipilih."); return false; }');
  s = s.replace('} catch (err) { alert(err.message || "Gagal menyimpan user."); } finally { setIsSubmitting(false); }', '} catch (err) { setErrorMessage(err.message || "Gagal menyimpan user."); } finally { setIsSubmitting(false); }');
  s = s.replace(/\s*if \(!confirm\(`Hapus \$\{user\.name\}\?`\)\) return;\n/, '\n');
  s = s.replace('} catch (err) { alert(err.message || "Gagal menghapus user."); }', '} catch (err) { setErrorMessage(err.message || "Gagal menghapus user."); }');
  write(path, s);
}

function patchAktivitas() {
  const path = root + '\\frontend\\src\\pages\\owner\\AktivitasLoginPage.jsx';
  let s = fs.readFileSync(path, 'utf8');
  s = s.replace('const [searchKeyword, setSearchKeyword] = useState("");', 'const [searchKeyword, setSearchKeyword] = useState("");\n  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState("");');
  s = s.replaceAll('searchKeyword.trim()', 'debouncedSearchKeyword.trim()');
  s = s.replace('params.search = searchKeyword.trim();', 'params.search = debouncedSearchKeyword.trim();');
  s = s.replace('useEffect(() => {\n    fetchActivities();\n  }, [selectedBranch, selectedRole, selectedStatus, selectedShift, selectedDate, searchKeyword]);', 'useEffect(() => {\n    const timeoutId = setTimeout(() => setDebouncedSearchKeyword(searchKeyword), 400);\n    return () => clearTimeout(timeoutId);\n  }, [searchKeyword]);\n\n  useEffect(() => {\n    fetchActivities();\n  }, [selectedBranch, selectedRole, selectedStatus, selectedShift, selectedDate, debouncedSearchKeyword]);');
  s = s.replace(/\s*const confirmLogout = confirm\(`Yakin ingin force logout user \$\{activity\.username\}\?`\);\n\s*if \(!confirmLogout\) return;\n/, '\n');
  s = s.replace('alert(error.message || "Gagal melakukan force logout.");', 'setErrorMessage(error.message || "Gagal melakukan force logout.");');
  s = s.replace(/\s*const confirmDelete = confirm\(`Yakin ingin menghapus aktivitas login \$\{activity\.username\}\?`\);\n\s*if \(!confirmDelete\) return;\n/, '\n');
  s = s.replace('alert(error.message || "Gagal menghapus aktivitas login.");', 'setErrorMessage(error.message || "Gagal menghapus aktivitas login.");');
  s = s.replace('alert("Tidak ada data aktivitas login untuk diexport.");', 'setErrorMessage("Tidak ada data aktivitas login untuk diexport.");');
  write(path, s);
}

function patchRolePermission() {
  const path = root + '\\frontend\\src\\pages\\owner\\RolePermissionPage.jsx';
  let s = fs.readFileSync(path, 'utf8');
  s = s.replace('const [searchKeyword, setSearchKeyword] = useState("");', 'const [searchKeyword, setSearchKeyword] = useState("");\n  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState("");');
  s = s.replace('fetchPermissions({ search: searchKeyword });', 'fetchPermissions({ search: debouncedSearchKeyword });');
  s = s.replace('  }, []);', '  }, []);\n\n  useEffect(() => {\n    const timeoutId = setTimeout(() => setDebouncedSearchKeyword(searchKeyword), 400);\n    return () => clearTimeout(timeoutId);\n  }, [searchKeyword]);\n\n  useEffect(() => {\n    if (debouncedSearchKeyword !== searchKeyword) return;\n    fetchPermissions({ search: debouncedSearchKeyword });\n  }, [debouncedSearchKeyword]);');
  s = s.replace('const handleSearch = async (event) => {\n    const value = event.target.value;\n    setSearchKeyword(value);\n    await fetchPermissions({ search: value });\n  };', 'const handleSearch = (event) => {\n    setSearchKeyword(event.target.value);\n  };');
  s = s.replaceAll('{ search: searchKeyword }', '{ search: debouncedSearchKeyword }');
  write(path, s);
}

patchApi();
patchDataUser();
patchAktivitas();
patchRolePermission();
console.log('frontend performance patch applied');
