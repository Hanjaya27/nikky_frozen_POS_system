import { useEffect, useMemo, useState } from "react";

import { getExpenses, getProducts, getTransactions } from "../../services/api";

const initialCashiers = [
  {
    id: 1,
    name: "Kasir Cabang 1",
    username: "kasir1",
    branch: "Cabang 1",
    shift: "Shift Pagi",
    status: "Aktif",
    lastLogin: "2026-05-24 08:00",
  },
  {
    id: 2,
    name: "Kasir Cabang 2",
    username: "kasir2",
    branch: "Cabang 2",
    shift: "Shift Sore",
    status: "Aktif",
    lastLogin: "2026-05-24 15:00",
  },
];

const initialLoginActivities = [
  {
    id: 1,
    name: "Kasir Cabang 1",
    username: "kasir1",
    role: "Kasir",
    branch: "Cabang 1",
    shift: "Shift Pagi",
    loginTime: "2026-05-24 08:00:00",
    logoutTime: "-",
    status: "Login",
    device: "Chrome - Windows",
  },
  {
    id: 2,
    name: "Kasir Cabang 2",
    username: "kasir2",
    role: "Kasir",
    branch: "Cabang 2",
    shift: "Shift Sore",
    loginTime: "2026-05-24 15:00:00",
    logoutTime: "-",
    status: "Login",
    device: "Chrome - Windows",
  },
];

const initialPermissions = [
  { id: "pos", kasirAccess: true },
  { id: "barang", kasirAccess: true },
  { id: "transaksi", kasirAccess: true },
  { id: "pengeluaran", kasirAccess: false },
  { id: "laporan", kasirAccess: false },
  { id: "data_kasir", kasirAccess: false },
  { id: "aktivitas_login", kasirAccess: false },
  { id: "role_permission", kasirAccess: false },
  { id: "pengaturan", kasirAccess: false },
];

const branches = ["Cabang 1", "Cabang 2"];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
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

function getBranchNameById(branchId) {
  if (Number(branchId) === 1) return "Cabang 1";
  if (Number(branchId) === 2) return "Cabang 2";

  return "-";
}

function getDaysUntilExpired(expiredDate) {
  if (!expiredDate) return null;

  const today = new Date();
  const expired = new Date(`${String(expiredDate).slice(0, 10)}T00:00:00`);

  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(expired.getTime())) return null;

  const diffTime = expired.getTime() - today.getTime();

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function normalizeProduct(product) {
  return {
    id: product.id,
    branch_id: product.branch_id,
    branch: product.branch?.name || getBranchNameById(product.branch_id),
    code: product.code,
    name: product.name,
    category: product.category,
    stock: Number(product.stock || 0),
    minStock: Number(product.min_stock || 0),
    price: Number(product.price || 0),
    expiredDate: product.expired_date,
    storageLocation: product.storage_location || "-",
    status: product.status || "Aktif",
  };
}

function normalizeTransaction(transaction) {
  return {
    id: transaction.id,
    invoiceNumber: transaction.invoice_number,
    transactionDate: transaction.transaction_date,
    branch_id: transaction.branch_id,
    branch: transaction.branch?.name || getBranchNameById(transaction.branch_id),
    cashierName: transaction.cashier_name || "-",
    username: transaction.username || "-",
    shift: transaction.shift_name || "-",
    paymentMethod: transaction.payment_method || "-",
    status: transaction.status || "-",
    totalItem: Number(transaction.total_item || 0),
    subtotal: Number(transaction.subtotal || 0),
    tax: Number(transaction.tax || 0),
    discount: Number(transaction.discount || 0),
    grandTotal: Number(transaction.grand_total || 0),
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
    branch_id: expense.branch_id,
    branch: expense.branch?.name || getBranchNameById(expense.branch_id),
    expenseDate: expense.expense_date,
    category: expense.category || "-",
    description: expense.description || "-",
    amount: Number(expense.amount || 0),
    userName: expense.user_name || "-",
    username: expense.username || "-",
    status: expense.status || "Aktif",
  };
}

function getBestSeller(transactions) {
  const productMap = {};

  transactions.forEach((transaction) => {
    transaction.items.forEach((item) => {
      if (!productMap[item.name]) {
        productMap[item.name] = {
          name: item.name,
          quantity: 0,
        };
      }

      productMap[item.name].quantity += Number(item.quantity || 0);
    });
  });

  const sortedProducts = Object.values(productMap).sort(
    (a, b) => b.quantity - a.quantity
  );

  return sortedProducts[0]?.name || "-";
}

function OwnerDashboard() {
  const [currentUser, setCurrentUser] = useState(null);

  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [cashiers, setCashiers] = useState(initialCashiers);
  const [loginActivities, setLoginActivities] = useState(
    initialLoginActivities
  );
  const [permissions, setPermissions] = useState(initialPermissions);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [productData, transactionData, expenseData] = await Promise.all([
        getProducts(),
        getTransactions(),
        getExpenses(),
      ]);

      setProducts(productData.map(normalizeProduct));
      setTransactions(transactionData.map(normalizeTransaction));
      setExpenses(expenseData.map(normalizeExpense));
      setLastUpdated(new Date());
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data dashboard dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("nikky_user");

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        setCurrentUser(null);
      }
    }

    setCashiers(getSavedData("nikky_cashiers", initialCashiers));
    setLoginActivities(
      getSavedData("nikky_login_activities", initialLoginActivities)
    );
    setPermissions(getSavedData("nikky_permissions", initialPermissions));

    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const successfulTransactions = useMemo(() => {
    return transactions.filter((transaction) => transaction.status === "Berhasil");
  }, [transactions]);

  const activeExpenses = useMemo(() => {
    return expenses.filter((expense) => expense.status === "Aktif");
  }, [expenses]);

  const stockAlerts = useMemo(() => {
    return products
      .filter((product) => product.stock <= product.minStock)
      .sort((a, b) => a.stock - b.stock);
  }, [products]);

  const expiredAlerts = useMemo(() => {
    return products
      .map((product) => ({
        ...product,
        daysLeft: getDaysUntilExpired(product.expiredDate),
      }))
      .filter(
        (product) =>
          product.daysLeft !== null &&
          product.daysLeft >= 0 &&
          product.daysLeft <= 60
      )
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [products]);

  const dashboardSummary = useMemo(() => {
    const totalRevenue = successfulTransactions.reduce(
      (total, transaction) => total + Number(transaction.grandTotal || 0),
      0
    );

    const totalExpenses = activeExpenses.reduce(
      (total, expense) => total + Number(expense.amount || 0),
      0
    );

    const totalTransactions = successfulTransactions.length;
    const totalProfit = totalRevenue - totalExpenses;

    const activeCashiers = cashiers.filter(
      (cashier) => cashier.status === "Aktif"
    ).length;

    const activeLogin = loginActivities.filter(
      (activity) => activity.status === "Login"
    ).length;

    const activeKasirPermission = permissions.filter(
      (permission) => permission.kasirAccess
    ).length;

    return {
      totalRevenue,
      totalExpenses,
      totalTransactions,
      totalProfit,
      activeCashiers,
      activeLogin,
      activeKasirPermission,
      totalProducts: products.length,
      stockLow: stockAlerts.length,
      expiredWarning: expiredAlerts.length,
    };
  }, [
    successfulTransactions,
    activeExpenses,
    cashiers,
    loginActivities,
    permissions,
    products,
    stockAlerts,
    expiredAlerts,
  ]);

  const branchSummaries = useMemo(() => {
    return branches.map((branch) => {
      const branchTransactions = successfulTransactions.filter(
        (transaction) => transaction.branch === branch
      );

      const branchExpenses = activeExpenses.filter(
        (expense) => expense.branch === branch
      );

      const branchProducts = products.filter(
        (product) => product.branch === branch
      );

      const revenue = branchTransactions.reduce(
        (total, transaction) => total + Number(transaction.grandTotal || 0),
        0
      );

      const expense = branchExpenses.reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      );

      const stockLow = branchProducts.filter(
        (product) => product.stock <= product.minStock
      ).length;

      return {
        branch,
        revenue,
        expenses: expense,
        transactions: branchTransactions.length,
        stockLow,
        products: branchProducts.length,
        bestSeller: getBestSeller(branchTransactions),
        profit: revenue - expense,
      };
    });
  }, [successfulTransactions, activeExpenses, products]);

  const recentTransactions = useMemo(() => {
    return [...successfulTransactions]
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, 5);
  }, [successfulTransactions]);

  const recentExpenses = useMemo(() => {
    return [...activeExpenses]
      .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
      .slice(0, 5);
  }, [activeExpenses]);

  const recentActivities = useMemo(() => {
    return [...loginActivities].slice(0, 5);
  }, [loginActivities]);

  const cashierByBranch = useMemo(() => {
    return {
      branchOne: cashiers.filter((cashier) => cashier.branch === "Cabang 1")
        .length,
      branchTwo: cashiers.filter((cashier) => cashier.branch === "Cabang 2")
        .length,
    };
  }, [cashiers]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Dashboard Owner
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitoring performa toko, transaksi, pengeluaran, stok, dan
            aktivitas Cabang 1 serta Cabang 2 dari backend.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50"
          >
            Refresh Data
          </button>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <p className="text-xs text-slate-500">Login sebagai</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {currentUser?.name || "Owner Nikky Frozen"}
            </p>
            <p className="text-xs text-slate-500">
              {currentUser?.branch || "Semua Cabang"} •{" "}
              {currentUser?.shift || "Monitoring Owner"}
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-sm font-bold text-slate-700">
            Status Sinkronisasi Backend
          </p>
          <p className="text-xs text-slate-500">
            Dashboard otomatis mengambil ulang data setiap 3 detik.
          </p>
        </div>

        <div className="text-right">
          <p
            className={`text-sm font-bold ${
              isLoading ? "text-yellow-600" : "text-green-600"
            }`}
          >
            {isLoading ? "Mengambil data..." : "Terhubung"}
          </p>
          <p className="text-xs text-slate-500">
            Update terakhir: {lastUpdated ? formatDateTime(lastUpdated) : "-"}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Pendapatan</p>
            <span className="rounded-xl bg-green-50 px-3 py-2 text-xl">
              💰
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-bold text-green-600">
            {formatRupiah(dashboardSummary.totalRevenue)}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Dari transaksi Cabang 1 dan Cabang 2
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Pengeluaran</p>
            <span className="rounded-xl bg-red-50 px-3 py-2 text-xl">💸</span>
          </div>
          <h3 className="mt-3 text-2xl font-bold text-red-600">
            {formatRupiah(dashboardSummary.totalExpenses)}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Dari data expenses backend
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Laba Kotor</p>
            <span className="rounded-xl bg-blue-50 px-3 py-2 text-xl">📈</span>
          </div>
          <h3
            className={`mt-3 text-2xl font-bold ${
              dashboardSummary.totalProfit >= 0
                ? "text-blue-600"
                : "text-red-600"
            }`}
          >
            {formatRupiah(dashboardSummary.totalProfit)}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Pendapatan dikurangi pengeluaran
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Transaksi</p>
            <span className="rounded-xl bg-purple-50 px-3 py-2 text-xl">
              🧾
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-bold text-purple-600">
            {dashboardSummary.totalTransactions}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Transaksi berhasil dari backend
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Kasir Aktif</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {dashboardSummary.activeCashiers}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Dari {cashiers.length} data kasir
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Sedang Login</p>
          <h3 className="mt-2 text-2xl font-bold text-green-600">
            {dashboardSummary.activeLogin}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Aktivitas user yang masih login
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Stok Menipis</p>
          <h3 className="mt-2 text-2xl font-bold text-yellow-600">
            {dashboardSummary.stockLow}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Produk perlu dipantau/restock
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Mendekati Expired</p>
          <h3 className="mt-2 text-2xl font-bold text-orange-600">
            {dashboardSummary.expiredWarning}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Produk perlu dicek tanggal kedaluwarsa
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-2">
        {branchSummaries.map((branch) => (
          <div key={branch.branch} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {branch.branch}
                </h3>
                <p className="text-sm text-slate-500">
                  Ringkasan performa cabang dari backend
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  branch.branch === "Cabang 1"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                Aktif
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Pendapatan</p>
                <p className="mt-1 text-lg font-bold text-green-600">
                  {formatRupiah(branch.revenue)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Pengeluaran</p>
                <p className="mt-1 text-lg font-bold text-red-600">
                  {formatRupiah(branch.expenses)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Laba</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    branch.profit >= 0 ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {formatRupiah(branch.profit)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Transaksi</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {branch.transactions}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500">Produk terlaris</span>
                <span className="font-bold text-slate-800">
                  {branch.bestSeller}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500">Total produk</span>
                <span className="font-bold text-slate-800">
                  {branch.products} produk
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500">Stok menipis</span>
                <span className="font-bold text-yellow-600">
                  {branch.stockLow} produk
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">
              Transaksi Terbaru
            </h3>
            <p className="text-sm text-slate-500">
              Transaksi terbaru dari Cabang 1 dan Cabang 2.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                  <th className="px-4 py-4 font-semibold">Invoice</th>
                  <th className="px-4 py-4 font-semibold">Cabang</th>
                  <th className="px-4 py-4 font-semibold">Kasir</th>
                  <th className="px-4 py-4 font-semibold">Waktu</th>
                  <th className="px-4 py-4 text-right font-semibold">Total</th>
                </tr>
              </thead>

              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-slate-100 text-sm hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-bold text-slate-800">
                        {transaction.invoiceNumber}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            transaction.branch === "Cabang 1"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {transaction.branch}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {transaction.cashierName}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {formatDateTime(transaction.transactionDate)}
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-green-600">
                        {formatRupiah(transaction.grandTotal)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Belum ada transaksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">
            Pengeluaran Terbaru
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            Data expenses terbaru.
          </p>

          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="rounded-2xl border border-slate-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">
                      {expense.category}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {expense.branch} • {formatDateOnly(expense.expenseDate)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {expense.description}
                    </p>
                  </div>

                  <p className="text-sm font-bold text-red-600">
                    {formatRupiah(expense.amount)}
                  </p>
                </div>
              </div>
            ))}

            {recentExpenses.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Belum ada pengeluaran.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">
              Aktivitas Login Terbaru
            </h3>
            <p className="text-sm text-slate-500">
              Aktivitas login masih membaca data lokal sampai backend user login
              dibuat.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                  <th className="px-4 py-4 font-semibold">Pengguna</th>
                  <th className="px-4 py-4 font-semibold">Cabang</th>
                  <th className="px-4 py-4 font-semibold">Shift</th>
                  <th className="px-4 py-4 font-semibold">Login</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-b border-slate-100 text-sm hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">
                          {activity.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          @{activity.username}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {activity.branch}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {activity.shift}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {activity.loginTime}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            activity.status === "Login"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Belum ada aktivitas login.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">
              Distribusi Kasir
            </h3>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-blue-700">Cabang 1</p>
                  <span className="text-xl font-bold text-blue-700">
                    {cashierByBranch.branchOne}
                  </span>
                </div>
                <p className="mt-1 text-sm text-blue-600">
                  Kasir terdaftar di Cabang 1
                </p>
              </div>

              <div className="rounded-2xl bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-purple-700">Cabang 2</p>
                  <span className="text-xl font-bold text-purple-700">
                    {cashierByBranch.branchTwo}
                  </span>
                </div>
                <p className="mt-1 text-sm text-purple-600">
                  Kasir terdaftar di Cabang 2
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">
              Permission Kasir Aktif
            </h3>

            <h3 className="mt-3 text-2xl font-bold text-blue-600">
              {dashboardSummary.activeKasirPermission}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Akses kasir yang diizinkan owner.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-800">
            Peringatan Stok
          </h3>
          <p className="text-sm text-slate-500">
            Produk yang stoknya berada di bawah atau sama dengan minimum stok.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stockAlerts.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.branch} • {item.code}
                  </p>
                </div>

                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                  Stok Menipis
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-slate-400">Stok Saat Ini</p>
                  <p className="mt-1 font-bold text-red-600">{item.stock}</p>
                </div>

                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-slate-400">Minimal Stok</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {item.minStock}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {stockAlerts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              Tidak ada produk dengan stok menipis.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-800">
            Barang Mendekati Kedaluwarsa
          </h3>
          <p className="text-sm text-slate-500">
            Produk yang tanggal kedaluwarsanya kurang dari atau sama dengan 60
            hari.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {expiredAlerts.map((item) => (
            <div key={item.id} className="rounded-2xl bg-orange-50 p-4">
              <p className="font-bold text-orange-700">{item.name}</p>
              <p className="mt-1 text-sm text-orange-600">
                {item.branch} • Exp: {formatDateOnly(item.expiredDate)}
              </p>
              <span className="mt-2 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                {item.daysLeft} hari lagi
              </span>
            </div>
          ))}

          {expiredAlerts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              Tidak ada barang yang mendekati kedaluwarsa.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;