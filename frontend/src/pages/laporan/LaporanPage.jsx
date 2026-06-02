import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import { getExpenses, getTransactions } from "../../services/api";

const branches = ["Semua", "Cabang 1", "Cabang 2"];

const periods = [
  { value: "all", label: "Semua Periode" },
  { value: "today", label: "Hari Ini" },
  { value: "7days", label: "7 Hari Terakhir" },
  { value: "30days", label: "30 Hari Terakhir" },
  { value: "custom", label: "Custom Tanggal" },
];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
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

  return null;
}

function getBranchNameById(branchId) {
  if (Number(branchId) === 1) return "Cabang 1";
  if (Number(branchId) === 2) return "Cabang 2";

  return "-";
}

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDateBefore(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date.toISOString().slice(0, 10);
}

function formatDateKey(dateString) {
  if (!dateString) return "";

  return String(dateString).slice(0, 10);
}

function formatDateLabel(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${String(dateString).slice(0, 10)}T00:00:00`);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isDateInRange(dateKey, startDate, endDate) {
  if (!dateKey) return false;

  if (startDate && dateKey < startDate) {
    return false;
  }

  if (endDate && dateKey > endDate) {
    return false;
  }

  return true;
}

function normalizeTransaction(transaction) {
  return {
    id: transaction.id,
    invoiceNumber: transaction.invoice_number,
    transactionDate: transaction.transaction_date,
    dateKey: formatDateKey(transaction.transaction_date),
    cashierName: transaction.cashier_name,
    username: transaction.username,
    branch_id: transaction.branch_id,
    branch: transaction.branch?.name || getBranchNameById(transaction.branch_id),
    shift: transaction.shift_name || "-",
    paymentMethod: transaction.payment_method,
    status: transaction.status,
    totalItem: Number(transaction.total_item || 0),
    subtotal: Number(transaction.subtotal || 0),
    discount: Number(transaction.discount || 0),
    tax: Number(transaction.tax || 0),
    taxRate: Number(transaction.tax_rate || 0),
    grandTotal: Number(transaction.grand_total || 0),
    paidAmount: Number(transaction.paid_amount || 0),
    changeAmount: Number(transaction.change_amount || 0),
    items: (transaction.items || []).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      code: item.product_code,
      name: item.product_name,
      category: item.category,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
      subtotal: Number(item.subtotal || 0),
    })),
  };
}

function normalizeExpense(expense) {
  return {
    id: expense.id,
    date: expense.expense_date,
    dateKey: formatDateKey(expense.expense_date),
    branch_id: expense.branch_id,
    branch: expense.branch?.name || getBranchNameById(expense.branch_id),
    category: expense.category || "Operasional",
    description: expense.description || "-",
    amount: Number(expense.amount || 0),
    user: expense.user_name || expense.username || "User",
    username: expense.username || "-",
    status: expense.status || "Aktif",
  };
}

function LaporanPage() {
  const [currentUser, setCurrentUser] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [startDate, setStartDate] = useState(getDateBefore(7));
  const [endDate, setEndDate] = useState(getTodayDateKey());
  const [activeTab, setActiveTab] = useState("pendapatan");

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedUser = getSavedData("nikky_user", null);

    if (savedUser) {
      setCurrentUser(savedUser);

      if (savedUser.role === "kasir") {
        setSelectedBranch(savedUser.branch || "Cabang 1");
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

  const dateRange = useMemo(() => {
    const today = getTodayDateKey();

    if (selectedPeriod === "today") {
      return {
        start: today,
        end: today,
      };
    }

    if (selectedPeriod === "7days") {
      return {
        start: getDateBefore(6),
        end: today,
      };
    }

    if (selectedPeriod === "30days") {
      return {
        start: getDateBefore(29),
        end: today,
      };
    }

    if (selectedPeriod === "custom") {
      return {
        start: startDate || null,
        end: endDate || null,
      };
    }

    return {
      start: null,
      end: null,
    };
  }, [selectedPeriod, startDate, endDate]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const transactionParams = {};
      const expenseParams = {};

      if (activeBranchId) {
        transactionParams.branch_id = activeBranchId;
        expenseParams.branch_id = activeBranchId;
      }

      const [transactionData, expenseData] = await Promise.all([
        getTransactions(transactionParams),
        getExpenses(expenseParams),
      ]);

      const normalizedTransactions = transactionData.map(normalizeTransaction);
      const normalizedExpenses = expenseData.map(normalizeExpense);

      setTransactions(normalizedTransactions);
      setExpenses(normalizedExpenses);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data laporan dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    fetchReportData();
  }, [currentUser, activeBranchId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchDate = isDateInRange(
        transaction.dateKey,
        dateRange.start,
        dateRange.end
      );

      const matchStatus = transaction.status === "Berhasil";

      return matchDate && matchStatus;
    });
  }, [transactions, dateRange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchDate = isDateInRange(
        expense.dateKey,
        dateRange.start,
        dateRange.end
      );

      const matchStatus = expense.status === "Aktif";

      return matchDate && matchStatus;
    });
  }, [expenses, dateRange]);

  const totalTransactions = filteredTransactions.length;

  const totalIncome = filteredTransactions.reduce(
    (total, transaction) => total + Number(transaction.grandTotal || 0),
    0
  );

  const totalSubtotal = filteredTransactions.reduce(
    (total, transaction) => total + Number(transaction.subtotal || 0),
    0
  );

  const totalTax = filteredTransactions.reduce(
    (total, transaction) => total + Number(transaction.tax || 0),
    0
  );

  const totalDiscount = filteredTransactions.reduce(
    (total, transaction) => total + Number(transaction.discount || 0),
    0
  );

  const totalItemsSold = filteredTransactions.reduce(
    (total, transaction) => total + Number(transaction.totalItem || 0),
    0
  );

  const totalExpense = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const grossProfit = totalIncome - totalExpense;

  const averageTransaction =
    totalTransactions > 0 ? Math.round(totalIncome / totalTransactions) : 0;

  const paymentSummary = useMemo(() => {
    const methods = ["Tunai", "QRIS", "Debit", "Transfer"];

    return methods.map((method) => {
      const methodTransactions = filteredTransactions.filter(
        (transaction) => transaction.paymentMethod === method
      );

      const total = methodTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.grandTotal || 0),
        0
      );

      return {
        method,
        count: methodTransactions.length,
        total,
        percentage:
          totalIncome > 0 ? Math.round((total / totalIncome) * 100) : 0,
      };
    });
  }, [filteredTransactions, totalIncome]);

  const branchSummary = useMemo(() => {
    return ["Cabang 1", "Cabang 2"].map((branch) => {
      const branchTransactions = filteredTransactions.filter(
        (transaction) => transaction.branch === branch
      );

      const branchExpenses = filteredExpenses.filter(
        (expense) => expense.branch === branch
      );

      const income = branchTransactions.reduce(
        (total, transaction) => total + Number(transaction.grandTotal || 0),
        0
      );

      const expense = branchExpenses.reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      );

      return {
        branch,
        transactions: branchTransactions.length,
        income,
        expense,
        profit: income - expense,
      };
    });
  }, [filteredTransactions, filteredExpenses]);

  const dailyReports = useMemo(() => {
    const dateKeys = new Set();

    filteredTransactions.forEach((transaction) => {
      dateKeys.add(transaction.dateKey);
    });

    filteredExpenses.forEach((expense) => {
      dateKeys.add(expense.dateKey);
    });

    const sortedDates = Array.from(dateKeys).sort();

    return sortedDates.map((dateKey) => {
      const income = filteredTransactions
        .filter((transaction) => transaction.dateKey === dateKey)
        .reduce(
          (total, transaction) => total + Number(transaction.grandTotal || 0),
          0
        );

      const expense = filteredExpenses
        .filter((item) => item.dateKey === dateKey)
        .reduce((total, item) => total + Number(item.amount || 0), 0);

      return {
        dateKey,
        income,
        expense,
        profit: income - expense,
      };
    });
  }, [filteredTransactions, filteredExpenses]);

  const latestTransactions = filteredTransactions.slice(0, 5);
  const latestExpenses = filteredExpenses.slice(0, 5);

  const maxDailyValue = Math.max(
    ...dailyReports.map((item) => Math.max(item.income, item.expense)),
    1
  );

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  const handleRefresh = async () => {
    await fetchReportData();
    showSuccess("Data laporan berhasil diperbarui dari backend.");
  };

  const handlePrintReport = () => {
    window.print();
  };

  const periodLabel =
    periods.find((period) => period.value === selectedPeriod)?.label ||
    "Semua Periode";

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title="Laporan"
        description="Analisis pendapatan, pengeluaran, transaksi, dan performa cabang berdasarkan data backend."
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
          onClick={handlePrintReport}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Cetak Laporan
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

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800">Filter Laporan</h3>
          <p className="text-sm text-slate-500">
            Periode aktif: {periodLabel}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Cabang
            </label>
            <select
              value={selectedBranch}
              disabled={!isOwner}
              onChange={(event) => setSelectedBranch(event.target.value)}
              className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                !isOwner ? "bg-slate-100 text-slate-400" : ""
              }`}
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Periode
            </label>
            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              disabled={selectedPeriod !== "custom"}
              onChange={(event) => setStartDate(event.target.value)}
              className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                selectedPeriod !== "custom" ? "bg-slate-100 text-slate-400" : ""
              }`}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              disabled={selectedPeriod !== "custom"}
              onChange={(event) => setEndDate(event.target.value)}
              className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                selectedPeriod !== "custom" ? "bg-slate-100 text-slate-400" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Mengambil data laporan dari backend...
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Transaksi</p>
              <h3 className="mt-2 text-2xl font-bold text-purple-600">
                {formatNumber(totalTransactions)}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Transaksi berhasil
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Pendapatan</p>
              <h3 className="mt-2 text-2xl font-bold text-blue-600">
                {formatRupiah(totalIncome)}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Dari /api/transactions
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Pengeluaran</p>
              <h3 className="mt-2 text-2xl font-bold text-red-600">
                {formatRupiah(totalExpense)}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Dari /api/expenses
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Laba Kotor</p>
              <h3
                className={`mt-2 text-2xl font-bold ${
                  grossProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatRupiah(grossProfit)}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Pendapatan - pengeluaran
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Subtotal</p>
              <h3 className="mt-2 text-xl font-bold text-slate-800">
                {formatRupiah(totalSubtotal)}
              </h3>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total PPN</p>
              <h3 className="mt-2 text-xl font-bold text-purple-600">
                {formatRupiah(totalTax)}
              </h3>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Diskon</p>
              <h3 className="mt-2 text-xl font-bold text-orange-600">
                {formatRupiah(totalDiscount)}
              </h3>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Rata-rata Transaksi</p>
              <h3 className="mt-2 text-xl font-bold text-slate-800">
                {formatRupiah(averageTransaction)}
              </h3>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("pendapatan")}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                activeTab === "pendapatan"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Pendapatan
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pengeluaran")}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                activeTab === "pengeluaran"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Pengeluaran
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("perbandingan")}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                activeTab === "perbandingan"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Perbandingan
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ringkasan")}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                activeTab === "ringkasan"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Ringkasan Cabang
            </button>
          </div>

          {activeTab === "pendapatan" && (
            <div className="grid gap-6 xl:grid-cols-3">
              <section className="xl:col-span-2 rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-800">
                    Pendapatan Harian
                  </h3>
                  <p className="text-sm text-slate-500">
                    Ringkasan pendapatan berdasarkan tanggal transaksi.
                  </p>
                </div>

                <div className="space-y-4">
                  {dailyReports.map((item) => (
                    <div key={item.dateKey}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-semibold text-slate-700">
                          {formatDateLabel(item.dateKey)}
                        </span>
                        <span className="font-bold text-blue-600">
                          {formatRupiah(item.income)}
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${Math.max(
                              (item.income / maxDailyValue) * 100,
                              item.income > 0 ? 5 : 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {dailyReports.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                      Belum ada data pendapatan pada periode ini.
                    </div>
                  )}
                </div>
              </section>

              <aside className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-800">
                    Metode Pembayaran
                  </h3>
                  <p className="text-sm text-slate-500">
                    Distribusi pembayaran transaksi.
                  </p>
                </div>

                <div className="space-y-4">
                  {paymentSummary.map((item) => (
                    <div
                      key={item.method}
                      className="rounded-2xl border border-slate-100 p-4"
                    >
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-bold text-slate-800">
                          {item.method}
                        </span>
                        <span className="font-semibold text-slate-500">
                          {item.count} transaksi
                        </span>
                      </div>

                      <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          {item.percentage}%
                        </span>
                        <span className="font-bold text-green-600">
                          {formatRupiah(item.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}

          {activeTab === "pengeluaran" && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-800">
                  Data Pengeluaran
                </h3>
                <p className="text-sm text-slate-500">
                  Data pengeluaran diambil langsung dari backend expenses.
                </p>
              </div>

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
                    </tr>
                  </thead>

                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-slate-100 text-sm hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 text-slate-600">
                          {formatDateLabel(expense.dateKey)}
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
                          {expense.user}
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-red-600">
                          {formatRupiah(expense.amount)}
                        </td>
                      </tr>
                    ))}

                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-4 py-10 text-center text-sm text-slate-500"
                        >
                          Belum ada data pengeluaran pada periode ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "perbandingan" && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-800">
                  Pendapatan vs Pengeluaran
                </h3>
                <p className="text-sm text-slate-500">
                  Perbandingan harian berdasarkan data backend.
                </p>
              </div>

              <div className="space-y-5">
                {dailyReports.map((item) => (
                  <div
                    key={item.dateKey}
                    className="rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="mb-3 flex justify-between text-sm">
                      <span className="font-bold text-slate-800">
                        {formatDateLabel(item.dateKey)}
                      </span>
                      <span
                        className={`font-bold ${
                          item.profit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        Laba: {formatRupiah(item.profit)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-slate-500">
                          <span>Pendapatan</span>
                          <span>{formatRupiah(item.income)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{
                              width: `${Math.max(
                                (item.income / maxDailyValue) * 100,
                                item.income > 0 ? 5 : 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-xs text-slate-500">
                          <span>Pengeluaran</span>
                          <span>{formatRupiah(item.expense)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{
                              width: `${Math.max(
                                (item.expense / maxDailyValue) * 100,
                                item.expense > 0 ? 5 : 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {dailyReports.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    Belum ada data perbandingan pada periode ini.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "ringkasan" && (
            <div className="grid gap-6 xl:grid-cols-3">
              <section className="xl:col-span-2 rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-800">
                    Ringkasan Cabang
                  </h3>
                  <p className="text-sm text-slate-500">
                    Rekap performa Cabang 1 dan Cabang 2.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {branchSummary.map((item) => (
                    <div
                      key={item.branch}
                      className="rounded-2xl border border-slate-100 p-4"
                    >
                      <div className="mb-3 flex justify-between">
                        <h4 className="font-bold text-slate-800">
                          {item.branch}
                        </h4>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {item.transactions} trx
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pendapatan</span>
                          <span className="font-bold text-green-600">
                            {formatRupiah(item.income)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Pengeluaran</span>
                          <span className="font-bold text-red-600">
                            {formatRupiah(item.expense)}
                          </span>
                        </div>

                        <div className="flex justify-between border-t border-slate-100 pt-2">
                          <span className="font-bold text-slate-700">
                            Laba
                          </span>
                          <span
                            className={`font-bold ${
                              item.profit >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatRupiah(item.profit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-800">
                    Aktivitas Terbaru
                  </h3>
                  <p className="text-sm text-slate-500">
                    Transaksi dan pengeluaran terakhir.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="mb-3 text-sm font-bold text-slate-700">
                      Transaksi Terbaru
                    </h4>

                    <div className="space-y-3">
                      {latestTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="rounded-xl border border-slate-100 p-3"
                        >
                          <p className="text-sm font-bold text-slate-800">
                            {transaction.invoiceNumber}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateLabel(transaction.dateKey)} •{" "}
                            {formatTimeOnly(transaction.transactionDate)}
                          </p>
                          <p className="mt-1 text-sm font-bold text-green-600">
                            {formatRupiah(transaction.grandTotal)}
                          </p>
                        </div>
                      ))}

                      {latestTransactions.length === 0 && (
                        <p className="text-sm text-slate-500">
                          Belum ada transaksi.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-bold text-slate-700">
                      Pengeluaran Terbaru
                    </h4>

                    <div className="space-y-3">
                      {latestExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="rounded-xl border border-slate-100 p-3"
                        >
                          <p className="text-sm font-bold text-slate-800">
                            {expense.category}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateLabel(expense.dateKey)} •{" "}
                            {expense.description}
                          </p>
                          <p className="mt-1 text-sm font-bold text-red-600">
                            {formatRupiah(expense.amount)}
                          </p>
                        </div>
                      ))}

                      {latestExpenses.length === 0 && (
                        <p className="text-sm text-slate-500">
                          Belum ada pengeluaran.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LaporanPage;