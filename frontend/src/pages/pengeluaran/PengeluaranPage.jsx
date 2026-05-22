import { useMemo, useState } from "react";

const initialExpenses = [
  {
    id: "EXP-001",
    date: "2026-05-21",
    category: "Operasional",
    description: "Pembelian plastik kemasan",
    amount: 150000,
    paymentMethod: "Tunai",
    createdBy: "Ahmad Baihaqi",
  },
  {
    id: "EXP-002",
    date: "2026-05-21",
    category: "Listrik",
    description: "Pembayaran listrik toko",
    amount: 350000,
    paymentMethod: "Transfer",
    createdBy: "Danang Wijayanto",
  },
  {
    id: "EXP-003",
    date: "2026-05-20",
    category: "Transportasi",
    description: "Biaya pengiriman stok cabang",
    amount: 120000,
    paymentMethod: "Tunai",
    createdBy: "Nafal Lauza",
  },
  {
    id: "EXP-004",
    date: "2026-05-20",
    category: "Perawatan",
    description: "Servis freezer toko",
    amount: 500000,
    paymentMethod: "Transfer",
    createdBy: "Samuel Jari",
  },
  {
    id: "EXP-005",
    date: "2026-05-19",
    category: "Operasional",
    description: "Pembelian nota dan alat tulis",
    amount: 80000,
    paymentMethod: "Tunai",
    createdBy: "Hanjaya Hartono",
  },
];

const categories = [
  "Semua",
  "Operasional",
  "Listrik",
  "Transportasi",
  "Perawatan",
  "Lainnya",
];

const paymentMethods = ["Tunai", "Transfer", "E-Wallet"];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function PengeluaranPage() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    category: "Operasional",
    description: "",
    amount: "",
    paymentMethod: "Tunai",
    createdBy: "",
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchSearch =
        expense.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        expense.createdBy.toLowerCase().includes(searchKeyword.toLowerCase());

      const matchCategory =
        selectedCategory === "Semua" || expense.category === selectedCategory;

      const matchDate = selectedDate === "" || expense.date === selectedDate;

      return matchSearch && matchCategory && matchDate;
    });
  }, [expenses, searchKeyword, selectedCategory, selectedDate]);

  const totalExpense = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const totalData = filteredExpenses.length;

  const highestExpense =
    filteredExpenses.length > 0
      ? Math.max(...filteredExpenses.map((expense) => expense.amount))
      : 0;

  const operationalExpense = filteredExpenses
    .filter((expense) => expense.category === "Operasional")
    .reduce((total, expense) => total + expense.amount, 0);

  const categorySummary = categories
    .filter((category) => category !== "Semua")
    .map((category) => {
      const total = filteredExpenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const percentage = totalExpense
        ? Math.round((total / totalExpense) * 100)
        : 0;

      return {
        category,
        total,
        percentage,
      };
    });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      date: "",
      category: "Operasional",
      description: "",
      amount: "",
      paymentMethod: "Tunai",
      createdBy: "",
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !formData.date ||
      !formData.category ||
      !formData.description ||
      !formData.amount ||
      !formData.paymentMethod ||
      !formData.createdBy
    ) {
      alert("Lengkapi semua data pengeluaran terlebih dahulu.");
      return;
    }

    const newExpense = {
      id: `EXP-${String(expenses.length + 1).padStart(3, "0")}`,
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      createdBy: formData.createdBy,
    };

    setExpenses([newExpense, ...expenses]);
    resetForm();
    setShowModal(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
    }, 2500);
  };

  const handleDelete = (expenseId) => {
    const confirmDelete = confirm("Yakin ingin menghapus data pengeluaran ini?");

    if (confirmDelete) {
      setExpenses(expenses.filter((expense) => expense.id !== expenseId));
    }
  };

  const handlePrint = () => {
    alert("Data pengeluaran berhasil dicetak.");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Pengeluaran Toko
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Catat dan pantau pengeluaran operasional Nikky Frozen.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cetak Pengeluaran
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Tambah Pengeluaran
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          Data pengeluaran berhasil ditambahkan.
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Pengeluaran</p>
          <h3 className="mt-2 text-2xl font-bold text-red-600">
            {formatRupiah(totalExpense)}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Berdasarkan filter aktif
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Jumlah Data</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {totalData}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Catatan pengeluaran toko
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pengeluaran Tertinggi</p>
          <h3 className="mt-2 text-2xl font-bold text-orange-600">
            {formatRupiah(highestExpense)}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Nominal terbesar dalam daftar
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Operasional</p>
          <h3 className="mt-2 text-2xl font-bold text-blue-600">
            {formatRupiah(operationalExpense)}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Total kategori operasional
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-800">
              Daftar Pengeluaran
            </h3>
            <p className="text-sm text-slate-500">
              Filter berdasarkan tanggal, kategori, atau kata kunci.
            </p>
          </div>

          <div className="mb-5 grid gap-3 lg:grid-cols-3">
            <input
              type="text"
              placeholder="Cari ID / keterangan / pembuat..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                  <th className="px-4 py-4 font-semibold">ID</th>
                  <th className="px-4 py-4 font-semibold">Tanggal</th>
                  <th className="px-4 py-4 font-semibold">Kategori</th>
                  <th className="px-4 py-4 font-semibold">Keterangan</th>
                  <th className="px-4 py-4 font-semibold">Metode</th>
                  <th className="px-4 py-4 font-semibold">Nominal</th>
                  <th className="px-4 py-4 font-semibold">Dibuat Oleh</th>
                  <th className="px-4 py-4 font-semibold">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-100 text-sm hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {expense.id}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {expense.date}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                        {expense.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {expense.description}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {expense.paymentMethod}
                    </td>

                    <td className="px-4 py-4 font-semibold text-red-600">
                      {formatRupiah(expense.amount)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {expense.createdBy}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Data pengeluaran tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-800">
              Kategori Pengeluaran
            </h3>
            <p className="text-sm text-slate-500">
              Ringkasan pengeluaran berdasarkan kategori.
            </p>
          </div>

          <div className="space-y-5">
            {categorySummary.map((item) => (
              <div key={item.category}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    {item.category}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {item.percentage}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {formatRupiah(item.total)}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Tambah Pengeluaran Baru
                </h3>
                <p className="text-sm text-slate-500">
                  Masukkan data pengeluaran operasional toko.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tanggal
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Kategori
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Operasional">Operasional</option>
                  <option value="Listrik">Listrik</option>
                  <option value="Transportasi">Transportasi</option>
                  <option value="Perawatan">Perawatan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Keterangan
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Contoh: Pembelian plastik kemasan"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nominal
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Masukkan nominal"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Metode Pembayaran
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Dibuat Oleh
                </label>
                <input
                  type="text"
                  name="createdBy"
                  value={formData.createdBy}
                  onChange={handleChange}
                  placeholder="Nama admin/karyawan"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-2 flex gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Simpan Pengeluaran
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