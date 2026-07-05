import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import {
  applySafeDefaultPermissions,
  enableAllAdminPermissions,
  enableAllCashierPermissions,
  getOwnerRolePermissions,
  resetRolePermissions,
  updateRolePermission,
} from "../../services/api";

function RolePermissionPage() {
  const [permissions, setPermissions] = useState([]);
  const [summary, setSummary] = useState({
    total_features: 0,
    admin_enabled_count: 0,
    cashier_enabled_count: 0,
    owner_menu_count: 0,
    admin_menu_count: 0,
    cashier_menu_count: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 2500);
  };

  const fetchPermissions = async (params = {}) => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const result = await getOwnerRolePermissions(params);
      if (result) {
        setPermissions(result.permissions || []);
        setSummary(result.summary || {});
        savePermissionsToStorage(result.permissions || []);
      }
      return result;
    } catch (error) {
      setErrorMessage(error.message || "Gagal mengambil data permission dari backend.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions({ search: searchKeyword });
  }, []);

  const filteredPermissions = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return permissions;

    return permissions.filter((permission) =>
      [
        permission.feature_name,
        permission.description,
        permission.permission_id,
        permission.group,
        permission.path,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [permissions, searchKeyword]);

  const savePermissionsToStorage = (perms) => {
    if (!perms || perms.length === 0) return;

    try {
      const adminPermissions = perms
        .filter((p) => p.group === 'admin')
        .map((p) => ({ id: p.permission_id, name: p.feature_name, adminAccess: Boolean(p.roles?.admin) }));
      localStorage.setItem('nikky_user_permissions_admin', JSON.stringify(adminPermissions));

      const cashierPermissions = perms
        .filter((p) => p.group === 'kasir')
        .map((p) => ({ id: p.permission_id, name: p.feature_name, kasirAccess: Boolean(p.roles?.cashier) }));
      localStorage.setItem('nikky_user_permissions_kasir', JSON.stringify(cashierPermissions));

      window.dispatchEvent(new Event('nikky_permissions_updated'));
    } catch (e) {
      console.error('Gagal menyimpan permission ke storage:', e);
    }
  };

  const applyDataset = (data) => {
    if (!data) return;
    setPermissions(data.permissions || []);
    setSummary(data.summary || {});
    savePermissionsToStorage(data.permissions || []);
  };


  const runAction = async (action, successText) => {
    try {
      setIsSaving(true);
      setErrorMessage("");
      const data = await action();
      applyDataset(data);
      showSuccess(successText);
    } catch (error) {
      setErrorMessage(error.message || "Gagal memperbarui permission.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    const result = await fetchPermissions({ search: searchKeyword });
    if (result) showSuccess("Data permission berhasil diperbarui dari backend.");
  };

  const handleSearch = async (event) => {
    const value = event.target.value;
    setSearchKeyword(value);
    await fetchPermissions({ search: value });
  };

  const handleToggleRole = async (permission, role) => {
    const currentValue = Boolean(permission.roles?.[role]);
    await runAction(
      async () => {
        await updateRolePermission(permission.permission_id, {
          role,
          allowed: !currentValue,
        });
        return await getOwnerRolePermissions({ search: searchKeyword });
      },
      `Permission ${permission.feature_name} berhasil diperbarui untuk ${role === "admin" ? "admin" : "kasir"}.`,
    );
  };

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <PageHeader
        title="Role & Permission"
        description="Atur hak akses menu untuk Owner, Admin Cabang, dan Kasir berdasarkan data permission dari backend."
      />

      <div className="mb-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={handleRefresh} className="rounded-xl border border-[#ead6c8] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#5f4b45] shadow-sm hover:bg-[#fff1f1]">
          Refresh Data
        </button>
        <button type="button" onClick={() => runAction(enableAllAdminPermissions, "Semua permission admin aman berhasil diaktifkan.")} disabled={isSaving} className={`rounded-xl border border-[#f3d6c4] px-4 py-2 text-sm font-semibold shadow-sm ${isSaving ? "bg-[#fef6ec] text-[#8a6f66]" : "bg-[#fffdf8] text-[#c40000] hover:bg-[#fff1f1]"}`}>
          Aktifkan Semua Admin
        </button>
        <button type="button" onClick={() => runAction(enableAllCashierPermissions, "Semua permission kasir aman berhasil diaktifkan.")} disabled={isSaving} className={`rounded-xl border border-[#f3d6c4] px-4 py-2 text-sm font-semibold shadow-sm ${isSaving ? "bg-[#fef6ec] text-[#8a6f66]" : "bg-[#fffdf8] text-[#c40000] hover:bg-[#fff1f1]"}`}>
          Aktifkan Semua Kasir
        </button>
        <button type="button" onClick={() => runAction(applySafeDefaultPermissions, "Standar aman berhasil diterapkan.")} disabled={isSaving} className={`rounded-xl border border-[#f1d8c8] px-4 py-2 text-sm font-semibold shadow-sm ${isSaving ? "bg-[#fef6ec] text-[#8a6f66]" : "bg-[#fffdf8] text-[#b45309] hover:bg-[#fff7ed]"}`}>
          Standar Aman
        </button>
        <button type="button" onClick={() => runAction(resetRolePermissions, "Permission berhasil direset.")} disabled={isSaving} className={`rounded-xl border border-[#ead6c8] px-4 py-2 text-sm font-semibold shadow-sm ${isSaving ? "bg-[#fef6ec] text-[#8a6f66]" : "bg-[#fffdf8] text-[#c40000] hover:bg-[#fff1f1]"}`}>
          Reset Permission
        </button>
      </div>

      {successMessage && <div className="mb-5 rounded-2xl border border-[#bbf7d0] bg-[#ecfdf5] px-5 py-4 text-sm font-semibold text-[#166534]">{successMessage}</div>}
      {errorMessage && <div className="mb-5 rounded-2xl border border-[#fecaca] bg-[#fff1f1] px-5 py-4 text-sm font-semibold text-[#b91c1c]">{errorMessage}</div>}
      {isSaving && <div className="mb-5 rounded-2xl border border-[#f3d6c4] bg-[#fff7ed] px-5 py-4 text-sm font-semibold text-[#5f4b45]">Menyimpan perubahan permission ke backend...</div>}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-[#f1d8c8] bg-[#fffdf8] p-5 shadow-sm"><p className="text-sm text-[#8a6f66]">Total Fitur</p><h3 className="mt-2 text-2xl font-bold text-[#241313]">{summary.total_features ?? 0}</h3></div>
        <div className="rounded-2xl border border-[#f1d8c8] bg-[#fffdf8] p-5 shadow-sm"><p className="text-sm text-[#8a6f66]">Akses Admin Aktif</p><h3 className="mt-2 text-2xl font-bold text-[#d50000]">{summary.admin_enabled_count ?? 0}</h3></div>
        <div className="rounded-2xl border border-[#f1d8c8] bg-[#fffdf8] p-5 shadow-sm"><p className="text-sm text-[#8a6f66]">Akses Kasir Aktif</p><h3 className="mt-2 text-2xl font-bold text-[#16a34a]">{summary.cashier_enabled_count ?? 0}</h3></div>
        <div className="rounded-2xl border border-[#f1d8c8] bg-[#fffdf8] p-5 shadow-sm"><p className="text-sm text-[#8a6f66]">Menu Owner</p><h3 className="mt-2 text-2xl font-bold text-[#241313]">{summary.owner_menu_count ?? 0}</h3></div>
        <div className="rounded-2xl border border-[#f1d8c8] bg-[#fffdf8] p-5 shadow-sm"><p className="text-sm text-[#8a6f66]">Menu Admin</p><h3 className="mt-2 text-2xl font-bold text-[#f97316]">{summary.admin_menu_count ?? 0}</h3></div>
        <div className="rounded-2xl border border-[#f1d8c8] bg-[#fffdf8] p-5 shadow-sm"><p className="text-sm text-[#8a6f66]">Menu Kasir</p><h3 className="mt-2 text-2xl font-bold text-[#c40000]">{summary.cashier_menu_count ?? 0}</h3></div>
      </div>

      <div className="rounded-2xl border border-[#f1d8c8] bg-[#fffdf8] p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#241313]">Daftar Permission</h3>
            <p className="text-sm text-[#5f4b45]">Owner selalu memiliki seluruh akses. Permission admin dan kasir akan tersimpan ke tabel role_permissions backend.</p>
          </div>

          <input
            type="text"
            value={searchKeyword}
            onChange={handleSearch}
            placeholder="Cari fitur, permission, group, path..."
            className="w-full rounded-xl border border-[#ead6c8] bg-[#fffdf8] px-4 py-3 text-sm text-[#241313] outline-none placeholder:text-[#8a6f66] focus:border-[#d50000] focus:ring-2 focus:ring-[#fee2e2] lg:w-96"
          />
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-[#ead6c8] bg-[#fffaf3] p-10 text-center text-sm text-[#8a6f66]">Mengambil data permission dari backend...</div>
        ) : filteredPermissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#ead6c8] bg-[#fffaf3] p-10 text-center text-sm text-[#8a6f66]">Data permission tidak ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1220px] border-collapse">
              <thead>
                <tr className="border-b border-[#f1d8c8] bg-[#fff7ed] text-left text-sm text-[#8a6f66]">
                  <th className="px-4 py-4 font-semibold">Fitur</th>
                  <th className="px-4 py-4 font-semibold">Permission ID</th>
                  <th className="px-4 py-4 font-semibold">Group/Menu</th>
                  <th className="px-4 py-4 text-center font-semibold">Owner</th>
                  <th className="px-4 py-4 text-center font-semibold">Admin</th>
                  <th className="px-4 py-4 text-center font-semibold">Kasir</th>
                  <th className="px-4 py-4 text-center font-semibold">Status Admin</th>
                  <th className="px-4 py-4 text-center font-semibold">Status Kasir</th>
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.map((permission) => (
                  <tr key={permission.permission_id} className="border-b border-[#f1d8c8] text-sm hover:bg-[#fffaf3]">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-bold text-[#241313]">{permission.feature_name}</p>
                        <p className="mt-1 text-xs text-[#5f4b45]">{permission.description}</p>
                        <p className="mt-1 text-xs text-[#8a6f66]">Path: {permission.path || "-"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-bold text-[#b45309]">{permission.permission_id}</span></td>
                    <td className="px-4 py-4"><span className="rounded-full bg-[#fff1f1] px-3 py-1 text-xs font-bold text-[#c40000]">{permission.group}</span></td>
                    <td className="px-4 py-4 text-center"><span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-bold text-[#166534]">Aktif</span></td>
                    <td className="px-4 py-4 text-center">
                      <button type="button" disabled={isSaving} onClick={() => handleToggleRole(permission, "admin")} className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${permission.roles?.admin ? "bg-[#d50000]" : "bg-[#ead6c8]"} ${isSaving ? "cursor-not-allowed opacity-60" : ""}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${permission.roles?.admin ? "translate-x-8" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button type="button" disabled={isSaving} onClick={() => handleToggleRole(permission, "cashier")} className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${permission.roles?.cashier ? "bg-[#16a34a]" : "bg-[#ead6c8]"} ${isSaving ? "cursor-not-allowed opacity-60" : ""}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${permission.roles?.cashier ? "translate-x-8" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center"><span className={`rounded-full px-3 py-1 text-xs font-bold ${permission.roles?.admin ? "bg-[#fff7ed] text-[#c2410c]" : "bg-[#fef2f2] text-[#b91c1c]"}`}>{permission.status?.admin || (permission.roles?.admin ? "Aktif" : "Dibatasi")}</span></td>
                    <td className="px-4 py-4 text-center"><span className={`rounded-full px-3 py-1 text-xs font-bold ${permission.roles?.cashier ? "bg-[#ecfdf5] text-[#166534]" : "bg-[#fef2f2] text-[#b91c1c]"}`}>{permission.status?.cashier || (permission.roles?.cashier ? "Aktif" : "Dibatasi")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-sm text-[#8a6f66]">Menampilkan {filteredPermissions.length} dari {permissions.length} permission.</p>
      </div>
    </div>
  );
}

export default RolePermissionPage;
