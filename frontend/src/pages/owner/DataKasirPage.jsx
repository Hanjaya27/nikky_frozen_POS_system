import { useEffect, useMemo, useState } from "react";

import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../../services/api";

const branches = ["Semua", "Cabang 1", "Cabang 2"];
const statuses = ["Semua", "Aktif", "Nonaktif"];
const shifts = ["Shift Pagi", "Shift Sore"];

const initialFormData = {
  name: "",
  username: "",
  password: "",
  branch_id: 1,
  shift_name: "Shift Pagi",
  phone: "",
  status: "Aktif",
};

function getBranchIdByName(branchName) {
  if (branchName === "Cabang 1") return 1;
  if (branchName === "Cabang 2") return 2;

  return null;
}

function getBranchNameById(branchId) {
  if (Number(branchId) === 1) return "Cabang 1";
  if (Number(branchId) === 2) return "Cabang 2";

  return "-";
}

function formatDateTime(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeCashier(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    branch_id: user.branch_id,
    branch: user.branch?.name || getBranchNameById(user.branch_id),
    shift: user.shift_name || "-",
    phone: user.phone || "-",
    status: user.status || "Aktif",
    lastLogin: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function DataKasirPage() {
  const [cashiers, setCashiers] = useState([]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  const [showModal, setShowModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCashiers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const params = {
        role: "kasir",
      };

      if (selectedBranch !== "Semua") {
        params.branch_id = getBranchIdByName(selectedBranch);
      }

      if (selectedStatus !== "Semua") {
        params.status = selectedStatus;
      }

      if (searchKeyword.trim()) {
        params.search = searchKeyword.trim();
      }

      const userData = await getUsers(params);
      const normalizedCashiers = userData.map(normalizeCashier);

      setCashiers(normalizedCashiers);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data kasir dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, [selectedBranch, selectedStatus]);

  const filteredCashiers = useMemo(() => {
    return cashiers.filter((cashier) => {
      const keyword = searchKeyword.toLowerCase();

      const matchSearch =
        cashier.name?.toLowerCase().includes(keyword) ||
        cashier.username?.toLowerCase().includes(keyword) ||
        cashier.phone?.toLowerCase().includes(keyword) ||
        cashier.branch?.toLowerCase().includes(keyword) ||
        cashier.shift?.toLowerCase().includes(keyword);

      return matchSearch;
    });
  }, [cashiers, searchKeyword]);

  const totalCashier = cashiers.length;

  const activeCashier = cashiers.filter(
    (cashier) => cashier.status === "Aktif"
  ).length;

  const inactiveCashier = cashiers.filter(
    (cashier) => cashier.status === "Nonaktif"
  ).length;

  const branchOneCashier = cashiers.filter(
    (cashier) => cashier.branch === "Cabang 1"
  ).length;

  const branchTwoCashier = cashiers.filter(
    (cashier) => cashier.branch === "Cabang 2"
  ).length;

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCashier(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (cashier) => {
    setEditingCashier(cashier);

    setFormData({
      name: cashier.name,
      username: cashier.username,
      password: "",
      branch_id: cashier.branch_id || 1,
      shift_name: cashier.shift,
      phone: cashier.phone === "-" ? "" : cashier.phone,
      status: cashier.status,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "branch_id" ? Number(value) : value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert("Nama kasir wajib diisi.");
      return false;
    }

    if (!formData.username.trim()) {
      alert("Username kasir wajib diisi.");
      return false;
    }

    if (!editingCashier && !formData.password.trim()) {
      alert("Password wajib diisi untuk kasir baru.");
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      alert("Password minimal 6 karakter.");
      return false;
    }

    if (!formData.phone.trim()) {
      alert("Nomor telepon wajib diisi.");
      return false;
    }

    return true;
  };

  const getPayload = () => {
    const payload = {
      name: formData.name,
      username: formData.username,
      email: `${formData.username}@nikkyfrozen.test`,
      role: "kasir",
      branch_id: Number(formData.branch_id),
      shift_name: formData.shift_name,
      phone: formData.phone,
      status: formData.status,
    };

    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const payload = getPayload();

      if (editingCashier) {
        await updateUser(editingCashier.id, payload);
        showSuccess("Data kasir berhasil diperbarui ke backend.");
      } else {
        await createUser(payload);
        showSuccess("Data kasir berhasil ditambahkan ke backend.");
      }

      closeModal();
      await fetchCashiers();
    } catch (error) {
      alert(error.message || "Gagal menyimpan data kasir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cashier) => {
    const confirmDelete = confirm(
      `Yakin ingin menghapus kasir ${cashier.name}?`
    );

    if (!confirmDelete) return;

    try {
      setErrorMessage("");

      await deleteUser(cashier.id);
      await fetchCashiers();

      showSuccess("Data kasir berhasil dihapus dari backend.");
    } catch (error) {
      alert(error.message || "Gagal menghapus data kasir.");
    }
  };

  const toggleStatus = async (cashier) => {
    const newStatus = cashier.status === "Aktif" ? "Nonaktif" : "Aktif";

    const confirmToggle = confirm(
      `Yakin ingin mengubah status ${cashier.name} menjadi ${newStatus}?`
    );

    if (!confirmToggle) return;

    try {
      setErrorMessage("");

      await updateUser(cashier.id, {
        name: cashier.name,
        username: cashier.username,
        email: cashier.email || `${cashier.username}@nikkyfrozen.test`,
        role: "kasir",
        branch_id: cashier.branch_id,
        shift_name: cashier.shift,
        phone: cashier.phone === "-" ? "" : cashier.phone,
        status: newStatus,
      });

      await fetchCashiers();

      showSuccess(`Status kasir berhasil diubah menjadi ${newStatus}.`);
    } catch (error) {
      alert(error.message || "Gagal mengubah status kasir.");
    }
  };

  const handleRefresh = async () => {
    await fetchCashiers();
    showSuccess("Data kasir berhasil diperbarui dari backend.");
  };

  const exportCSV = () => {
    if (filteredCashiers.length === 0) {
      alert("Tidak ada data kasir untuk diexport.");
      return;
    }

    const headers = [
      "Nama",
      "Username",
      "Email",
      "Cabang",
      "Shift",
      "Telepon",
      "Status",
      "Login Terakhir",
      "Dibuat",
    ];

    const rows = filteredCashiers.map((cashier) => [
      cashier.name,
      cashier.username,
      cashier.email,
      cashier.branch,
      cashier.shift,
      cashier.phone,
      cashier.status,
      formatDateTime(cashier.lastLogin),
      formatDateOnly(cashier.createdAt),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((item) => `"${item || "-"}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "data-kasir-nikky-frozen.csv";
    link.click();

    URL.revokeObjectURL(url);
    showSuccess("Data kasir berhasil diexport.");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Kasir</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data kasir, cabang, shift, status akun, dan akses login dari
            backend.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm hover:bg-green-50"
          >
            Refresh Data
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Tambah Kasir
          </button>
        </div>
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

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Total Kasir" value={totalCashier} />
        <SummaryCard
          label="Kasir Aktif"
          value={activeCashier}
          valueClass="text-green-600"
        />
        <SummaryCard
          label="Kasir Nonaktif"
          value={inactiveCashier}
          valueClass="text-red-600"
        />
        <SummaryCard
          label="Cabang 1"
          value={branchOneCashier}
          valueClass="text-blue-600"
        />
        <SummaryCard
          label="Cabang 2"
          value={branchTwoCashier}
          valueClass="text-purple-600"
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Daftar Kasir</h3>
            <p className="text-sm text-slate-500">
              Data kasir diambil dari tabel users backend.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={selectedBranch}
              onChange={(event) => setSelectedBranch(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch === "Semua" ? "Semua Cabang" : branch}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "Semua" ? "Semua Status" : status}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Cari kasir..."
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            Mengambil data kasir dari backend...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                  <th className="px-4 py-4 font-semibold">Nama Kasir</th>
                  <th className="px-4 py-4 font-semibold">Username</th>
                  <th className="px-4 py-4 font-semibold">Cabang</th>
                  <th className="px-4 py-4 font-semibold">Shift Default</th>
                  <th className="px-4 py-4 font-semibold">No. Telepon</th>
                  <th className="px-4 py-4 font-semibold">Login Terakhir</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 text-center font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCashiers.map((cashier) => (
                  <tr
                    key={cashier.id}
                    className="border-b border-slate-100 text-sm hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-600">
                          {cashier.name?.charAt(0) || "K"}
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            {cashier.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Dibuat: {formatDateOnly(cashier.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      @{cashier.username}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          cashier.branch === "Cabang 1"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {cashier.branch}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {cashier.shift}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {cashier.phone}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDateTime(cashier.lastLogin)}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleStatus(cashier)}
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          cashier.status === "Aktif"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {cashier.status}
                      </button>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(cashier)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(cashier)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCashiers.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Data kasir tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-500">
          Menampilkan {filteredCashiers.length} dari {cashiers.length} data
          kasir.
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingCashier ? "Edit Data Kasir" : "Tambah Data Kasir"}
                </h3>
                <p className="text-sm text-slate-500">
                  Data kasir akan disimpan ke tabel users backend.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nama Kasir
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh: Kasir Cabang 1"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Contoh: kasir3"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      editingCashier
                        ? "Kosongkan jika tidak ingin mengubah password"
                        : "Minimal 6 karakter"
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    No. Telepon
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Contoh: 08123456789"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Cabang
                  </label>
                  <select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value={1}>Cabang 1</option>
                    <option value={2}>Cabang 2</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Shift Default
                  </label>
                  <select
                    name="shift_name"
                    value={formData.shift_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    {shifts.map((shift) => (
                      <option key={shift} value={shift}>
                        {shift}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-xl px-5 py-3 text-sm font-bold text-white ${
                    isSubmitting
                      ? "bg-slate-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingCashier
                    ? "Simpan Perubahan"
                    : "Tambah Kasir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, valueClass = "text-slate-800" }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</h3>
    </div>
  );
}

export default DataKasirPage;