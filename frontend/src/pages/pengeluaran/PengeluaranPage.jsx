import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../../services/api";

const categories = [
  "Semua",
  "Listrik",
  "Gaji",
  "Perlengkapan",
  "Sewa",
  "Operasional",
  "Lainnya",
];

const branchOptions = [
  { id: 1, name: "Cabang 1" },
  { id: 2, name: "Cabang 2" },
];

const initialForm = {
  branch_id: 1,
  expense_date: new Date().toISOString().slice(0, 10),
  category: "Operasional",
  description: "",
  amount: "",
};

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${String(dateString).slice(0, 10)}T00:00:00`);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getSavedData(key, fallbackData) {
  const savedData = localStorage.getItem(key);

  if (!savedData) {
    return fallbackData;
  }

  try {
    return JSON.parse(savedData);
  } catch (error) {
    localStorage.removeItem(key);
    return fallbackData;
  }
}

function getBranchIdByName(branchName) {
  if (branchName === "Cabang 1") return 1;
  if (branchName === "Cabang 2") return 2;

  return 1;
}

function getBranchNameById(branchId) {
  if (Number(branchId) === 1) return "Cabang 1";
  if (Number(branchId) === 2) return "Cabang 2";

  return "-";
}

function normalizeExpense(expense) {
  return {
    id: expense.id,
    branch_id: expense.branch_id,
    branch: expense.branch?.name || getBranchNameById(expense.branch_id),
    expense_date: expense.expense_date,
    category: expense.category,
    description: expense.description,
    amount: Number(expense.amount || 0),
    user_name: expense.user_name || "-",
    username: expense.username || "-",
    status: expense.status || "Aktif",
    created_at: expense.created_at,
    updated_at: expense.updated_at,
  };
}

function PengeluaranPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [expenses, setExpenses] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [formData, setFormData] = useState(initialForm);
  const [editingExpense, setEditingExpense] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedUser = getSavedData("nikky_user", null);

    if (savedUser) {
      setCurrentUser(savedUser);

      if (savedUser.role === "kasir") {
        const branchId = getBranchIdByName(savedUser.branch);

        setSelectedBranch(savedUser.branch || "Cabang 1");
        setFormData((prevData) => ({
          ...prevData,
          branch_id: branchId,
        }));
      }
    }
  }, []);

  const isOwner = currentUser?.role === "owner";

  const activeBranchId = useMemo(() => {
    if (currentUser?.role === "kasir") {
      return getBranchIdByName(currentUser.branch);
    }

    if (selectedBranch !== "Semua") {
      return getBranchIdByName(selectedBranch);
    }

    return null;
  }, [currentUser, selectedBranch]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const params = {};

      if (activeBranchId) {
        params.branch_id = activeBranchId;
      }

      if (selectedCategory !== "Semua") {
        params.category = selectedCategory;
      }

      if (searchKeyword.trim()) {
        params.search = searchKeyword.trim();
      }

      const expenseData = await getExpenses(params);
      const normalizedExpenses = expenseData.map(normalizeExpense);

      setExpenses(normalizedExpenses);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data pengeluaran dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    fetchExpenses();
  }, [currentUser, activeBranchId, selectedCategory]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const keyword = searchKeyword.toLowerCase();

      return (
        expense.description?.toLowerCase().includes(keyword) ||
        expense.category?.toLowerCase().includes(keyword) ||
        expense.branch?.toLowerCase().includes(keyword) ||
        expense.user_name?.toLowerCase().includes(keyword) ||
        expense.username?.toLowerCase().includes(keyword)
      );
    });
  }, [expenses, searchKeyword]);

  const totalExpense = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const activeExpenses = filteredExpenses.filter(
    (expense) => expense.status === "Aktif"
  );

  const todayExpense = filteredExpenses
    .filter((expense) => {
      const today = new Date().toISOString().slice(0, 10);

      return String(expense.expense_date).slice(0, 10) === today;
    })
    .reduce((total, expense) => total + Number(expense.amount || 0), 0);

  const highestExpense = filteredExpenses.reduce((highest, expense) => {
    return Number(expense.amount || 0) > Number(highest.amount || 0)
      ? expense
      : highest;
  }, { amount: 0 });

  const categorySummary = categories
    .filter((category) => category !== "Semua")
    .map((category) => {
      const categoryExpenses = filteredExpenses.filter(
        (expense) => expense.category === category
      );

      const total = categoryExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
      );

      return {
        category,
        count: categoryExpenses.length,
        total,
      };
    })
    .filter((item) => item.count > 0 || item.total > 0);

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  const resetForm = () => {
    const defaultBranchId =
      currentUser?.role === "kasir"
        ? getBranchIdByName(currentUser.branch)
        : 1;

    setFormData({
      ...initialForm,
      branch_id: defaultBranchId,
      expense_date: new Date().toISOString().slice(0, 10),
    });

    setEditingExpense(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);

    setFormData({
      branch_id: expense.branch_id,
      expense_date: String(expense.expense_date).slice(0, 10),
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
    });

    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "branch_id" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.description.trim()) {
      alert("Deskripsi pengeluaran wajib diisi.");
      return;
    }

    if (Number(formData.amount || 0) <= 0) {
      alert("Nominal pengeluaran harus lebih dari 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const payload = {
        branch_id:
          currentUser?.role === "kasir"
            ? getBranchIdByName(currentUser.branch)
            : Number(formData.branch_id),
        expense_date: formData.expense_date,
        category: formData.category,
        description: formData.description,
        amount: Number(formData.amount),
        user_name: currentUser?.name || "User",
        username: currentUser?.username || "-",
        status: "Aktif",
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
        showSuccess("Pengeluaran berhasil diperbarui.");
      } else {
        await createExpense(payload);
        showSuccess("Pengeluaran berhasil ditambahkan.");
      }

      closeFormModal();
      await fetchExpenses();
    } catch (error) {
      alert(error.message || "Gagal menyimpan pengeluaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expense) => {
    const confirmDelete = confirm(
      `Yakin ingin menghapus pengeluaran "${expense.description}"?`
    );

    if (!confirmDelete) return;

    try {
      setErrorMessage("");
      await deleteExpense(expense.id);
      showSuccess("Pengeluaran berhasil dihapus.");
      await fetchExpenses();
    } catch (error) {
      alert(error.message || "Gagal menghapus pengeluaran.");
    }
  };

  const handleRefresh = async () => {
    await fetchExpenses();
    showSuccess("Data pengeluaran berhasil diperbarui dari backend.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title="Pengeluaran Toko"
        description="Catat dan kelola pengeluaran operasional berdasarkan cabang dari backend."
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
          onClick={handlePrint}
          className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
        >
          Cetak Pengeluaran
        </button>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + Tambah Pengeluaran
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

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Pengeluaran</p>
          <h3 className="mt-2 text-2xl font-bold text-red-600">
            {formatRupiah(totalExpense)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pengeluaran Aktif</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {activeExpenses.length}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pengeluaran Hari Ini</p>
          <h3 className="mt-2 text-2xl font-bold text-orange-600">
            {formatRupiah(todayExpense)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Nominal Terbesar</p>
          <h3 className="mt-2 text-2xl font-bold text-purple-600">
            {formatRupiah(highestExpense.amount)}
          </h3>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <select
            value={selectedBranch}
            disabled={!isOwner}
            onChange={(event) => setSelectedBranch(event.target.value)}
            className={`rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 ${
              !isOwner ? "bg-slate-100 text-slate-400" : ""
            }`}
          >
            <option value="Semua">Semua Cabang</option>
            <option value="Cabang 1">Cabang 1</option>
            <option value="Cabang 2">Cabang 2</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "Semua" ? "Semua Kategori" : category}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Cari deskripsi / kategori / pengguna..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <section className="xl:col-span-3 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">
              Daftar Pengeluaran
            </h3>
            <p className="text-sm text-slate-500">
              Data pengeluaran tersimpan ke database backend.
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              Mengambil data pengeluaran dari backend...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                    <th className="px-4 py-4 font-semibold">Tanggal</th>
                    <th className="px-4 py-4 font-semibold">Cabang</th>
                    <th className="px-4 py-4 font-semibold">Kategori</th>
                    <th className="px-4 py-4 font-semibold">Deskripsi</th>
                    <th className="px-4 py-4 font-semibold">Pengguna</th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Nominal
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-slate-100 text-sm hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(expense.expense_date)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            expense.branch === "Cabang 1"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {expense.branch}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                          {expense.category}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {expense.description}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <p>{expense.user_name}</p>
                        <p className="text-xs text-slate-400">
                          {expense.username}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-red-600">
                        {formatRupiah(expense.amount)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(expense)}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(expense)}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        Belum ada data pengeluaran.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-sm text-slate-500">
            Menampilkan {filteredExpenses.length} data pengeluaran.
          </p>
        </section>

        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">
            Ringkasan Kategori
          </h3>
          <p className="mb-5 text-sm text-slate-500">
            Total pengeluaran per kategori.
          </p>

          <div className="space-y-3">
            {categorySummary.map((item) => (
              <div
                key={item.category}
                className="rounded-2xl border border-slate-100 p-4"
              >
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-bold text-slate-800">
                    {item.category}
                  </span>
                  <span className="text-slate-500">
                    {item.count} data
                  </span>
                </div>

                <p className="text-lg font-bold text-red-600">
                  {formatRupiah(item.total)}
                </p>
              </div>
            ))}

            {categorySummary.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                Belum ada ringkasan kategori.
              </div>
            )}
          </div>
        </aside>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingExpense
                    ? "Edit Pengeluaran"
                    : "Tambah Pengeluaran"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Data akan disimpan ke backend database.
                </p>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Cabang
                </label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  disabled={!isOwner}
                  onChange={handleChange}
                  className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                    !isOwner ? "bg-slate-100 text-slate-400" : ""
                  }`}
                >
                  {branchOptions.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Tanggal Pengeluaran
                </label>
                <input
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Kategori
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  {categories
                    .filter((category) => category !== "Semua")
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Contoh: Bayar listrik bulan ini"
                  rows="3"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Nominal
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Contoh: 850000"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="rounded-xl border border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-xl py-3 font-bold text-white ${
                    isSubmitting
                      ? "bg-slate-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingExpense
                    ? "Simpan Perubahan"
                    : "Tambah Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PengeluaranPage;