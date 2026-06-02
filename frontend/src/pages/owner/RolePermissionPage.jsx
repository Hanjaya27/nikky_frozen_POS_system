import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import {
  getPermissionsApi,
  resetPermissionsApi,
  updatePermissionsApi,
  updateSinglePermissionApi,
} from "../../services/api";

const permissionDescriptions = {
  pos: "Akses halaman kasir untuk melakukan transaksi penjualan.",
  shift: "Akses kasir untuk membuka dan menutup shift kerja.",
  barang: "Akses data produk, stok, cabang, dan lokasi penyimpanan.",
  transaksi: "Akses daftar transaksi penjualan dan detail struk.",
  laporan: "Akses laporan pendapatan, pengeluaran, dan laba toko.",
  pengeluaran: "Akses pencatatan dan pengelolaan pengeluaran toko.",
  data_kasir: "Akses owner untuk mengelola data akun kasir.",
  aktivitas_login: "Akses owner untuk memantau riwayat login kasir dan owner.",
  role_permission: "Akses owner untuk mengatur izin menu kasir.",
  pengaturan: "Akses pengaturan toko, struk, pajak, dan pengguna.",
};

function normalizePermission(permission) {
  return {
    id: permission.permission_id,
    databaseId: permission.id,
    featureName: permission.menu_name,
    description:
      permissionDescriptions[permission.permission_id] ||
      "Permission menu sistem Nikky Frozen POS.",
    menuGroup: permission.menu_group,
    path: permission.path,
    icon: permission.icon,
    ownerAccess: true,
    kasirAccess: Boolean(permission.kasir_access),
    sortOrder: Number(permission.sort_order || 0),
    status: permission.status || "Aktif",
    createdAt: permission.created_at,
    updatedAt: permission.updated_at,
  };
}

function RolePermissionPage() {
  const [permissions, setPermissions] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPermissions = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const permissionData = await getPermissionsApi();
      const normalizedPermissions = permissionData.map(normalizePermission);

      setPermissions(normalizedPermissions);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data permission dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const filteredPermissions = useMemo(() => {
    return permissions.filter((permission) => {
      const keyword = searchKeyword.toLowerCase();

      return (
        permission.featureName?.toLowerCase().includes(keyword) ||
        permission.description?.toLowerCase().includes(keyword) ||
        permission.id?.toLowerCase().includes(keyword) ||
        permission.menuGroup?.toLowerCase().includes(keyword)
      );
    });
  }, [permissions, searchKeyword]);

  const totalFeature = permissions.length;

  const kasirAllowed = permissions.filter(
    (permission) => permission.kasirAccess
  ).length;

  const kasirBlocked = permissions.filter(
    (permission) => !permission.kasirAccess
  ).length;

  const ownerMenuCount = permissions.filter(
    (permission) => permission.menuGroup === "owner"
  ).length;

  const kasirMenuCount = permissions.filter(
    (permission) => permission.menuGroup === "kasir"
  ).length;

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  const handleRefresh = async () => {
    await fetchPermissions();
    showSuccess("Data permission berhasil diperbarui dari backend.");
  };

  const handleToggleKasirAccess = async (permission) => {
    try {
      setIsSaving(true);
      setErrorMessage("");

      const newAccess = !permission.kasirAccess;

      await updateSinglePermissionApi(permission.id, newAccess);

      setPermissions((prevPermissions) =>
        prevPermissions.map((item) =>
          item.id === permission.id
            ? {
                ...item,
                kasirAccess: newAccess,
              }
            : item
        )
      );

      showSuccess(
        `Permission ${permission.featureName} berhasil ${
          newAccess ? "diaktifkan" : "dinonaktifkan"
        } untuk kasir.`
      );
    } catch (error) {
      alert(error.message || "Gagal memperbarui permission.");
    } finally {
      setIsSaving(false);
    }
  };

  const allowAllKasirAccess = async () => {
    const confirmAllow = confirm(
      "Yakin ingin memberikan semua akses menu kepada kasir?"
    );

    if (!confirmAllow) return;

    try {
      setIsSaving(true);
      setErrorMessage("");

      const payload = permissions.map((permission) => ({
        permission_id: permission.id,
        kasir_access: true,
      }));

      const updatedPermissionData = await updatePermissionsApi(payload);
      const normalizedPermissions =
        updatedPermissionData.map(normalizePermission);

      setPermissions(normalizedPermissions);

      showSuccess("Semua akses kasir berhasil diaktifkan di backend.");
    } catch (error) {
      alert(error.message || "Gagal mengaktifkan semua permission.");
    } finally {
      setIsSaving(false);
    }
  };

  const disableRestrictedKasirAccess = async () => {
    const confirmDisable = confirm(
      "Yakin ingin mengembalikan akses kasir ke standar aman?"
    );

    if (!confirmDisable) return;

    try {
      setIsSaving(true);
      setErrorMessage("");

      const restrictedIds = [
        "laporan",
        "pengeluaran",
        "data_kasir",
        "aktivitas_login",
        "role_permission",
        "pengaturan",
      ];

      const payload = permissions.map((permission) => ({
        permission_id: permission.id,
        kasir_access: !restrictedIds.includes(permission.id),
      }));

      const updatedPermissionData = await updatePermissionsApi(payload);
      const normalizedPermissions =
        updatedPermissionData.map(normalizePermission);

      setPermissions(normalizedPermissions);

      showSuccess("Permission kasir berhasil dikembalikan ke standar aman.");
    } catch (error) {
      alert(error.message || "Gagal memperbarui permission.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetPermissions = async () => {
    const confirmReset = confirm(
      "Yakin ingin mengembalikan permission ke pengaturan awal backend?"
    );

    if (!confirmReset) return;

    try {
      setIsSaving(true);
      setErrorMessage("");

      const resetPermissionData = await resetPermissionsApi();
      const normalizedPermissions = resetPermissionData.map(normalizePermission);

      setPermissions(normalizedPermissions);

      showSuccess("Permission berhasil direset ke pengaturan awal backend.");
    } catch (error) {
      alert(error.message || "Gagal reset permission.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title="Role & Permission"
        description="Atur hak akses menu untuk role Owner dan Kasir berdasarkan data permission dari backend."
      />

      <div className="mb-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm hover:bg-green-50"
        >
          Refresh Data
        </button>

        <button
          type="button"
          onClick={allowAllKasirAccess}
          disabled={isSaving}
          className={`rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold shadow-sm ${
            isSaving
              ? "bg-slate-100 text-slate-400"
              : "bg-white text-blue-700 hover:bg-blue-50"
          }`}
        >
          Aktifkan Semua Kasir
        </button>

        <button
          type="button"
          onClick={disableRestrictedKasirAccess}
          disabled={isSaving}
          className={`rounded-xl border border-yellow-200 px-4 py-2 text-sm font-semibold shadow-sm ${
            isSaving
              ? "bg-slate-100 text-slate-400"
              : "bg-white text-yellow-700 hover:bg-yellow-50"
          }`}
        >
          Standar Aman
        </button>

        <button
          type="button"
          onClick={resetPermissions}
          disabled={isSaving}
          className={`rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold shadow-sm ${
            isSaving
              ? "bg-slate-100 text-slate-400"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Reset Permission
        </button>
      </div>

      {successMessage && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {isSaving && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
          Menyimpan perubahan permission ke backend...
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Fitur</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {totalFeature}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Akses Kasir Aktif</p>
          <h3 className="mt-2 text-2xl font-bold text-green-600">
            {kasirAllowed}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Akses Kasir Nonaktif</p>
          <h3 className="mt-2 text-2xl font-bold text-red-600">
            {kasirBlocked}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Menu Kasir</p>
          <h3 className="mt-2 text-2xl font-bold text-blue-600">
            {kasirMenuCount}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Menu Owner</p>
          <h3 className="mt-2 text-2xl font-bold text-purple-600">
            {ownerMenuCount}
          </h3>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Daftar Permission
            </h3>
            <p className="text-sm text-slate-500">
              Owner selalu memiliki seluruh akses. Permission kasir akan
              tersimpan ke tabel role_permissions backend.
            </p>
          </div>

          <input
            type="text"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="Cari fitur..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 lg:w-80"
          />
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            Mengambil data permission dari backend...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                  <th className="px-4 py-4 font-semibold">Fitur</th>
                  <th className="px-4 py-4 font-semibold">Permission ID</th>
                  <th className="px-4 py-4 font-semibold">Group</th>
                  <th className="px-4 py-4 text-center font-semibold">
                    Owner
                  </th>
                  <th className="px-4 py-4 text-center font-semibold">
                    Kasir
                  </th>
                  <th className="px-4 py-4 text-center font-semibold">
                    Status Kasir
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPermissions.map((permission) => (
                  <tr
                    key={permission.id}
                    className="border-b border-slate-100 text-sm hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                          {permission.icon}
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            {permission.featureName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {permission.description}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Path: {permission.path || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {permission.id}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          permission.menuGroup === "owner"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {permission.menuGroup}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        Aktif
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleToggleKasirAccess(permission)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                          permission.kasirAccess
                            ? "bg-blue-600"
                            : "bg-slate-300"
                        } ${isSaving ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                            permission.kasirAccess
                              ? "translate-x-8"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          permission.kasirAccess
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {permission.kasirAccess ? "Diizinkan" : "Dibatasi"}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredPermissions.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Data permission tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-500">
          Menampilkan {filteredPermissions.length} dari {permissions.length}{" "}
          permission.
        </p>
      </div>
    </div>
  );
}

export default RolePermissionPage;