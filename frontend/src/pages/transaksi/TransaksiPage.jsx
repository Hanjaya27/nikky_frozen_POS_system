import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import { getTransactions } from "../../services/api";

const paymentMethods = ["Semua", "Tunai", "QRIS", "Debit", "Transfer"];
const statuses = ["Semua", "Berhasil", "Dibatalkan"];
const branches = ["Semua", "Cabang 1", "Cabang 2"];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
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

function formatDateOnly(dateString) {
  if (!dateString) return "-";

  return dateString.slice(0, 10);
}

function formatTimeOnly(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeTransaction(transaction) {
  return {
    id: transaction.id,
    invoiceNumber: transaction.invoice_number,
    transactionDate: transaction.transaction_date,
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

function TransaksiPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState("");

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = getSavedData("nikky_user", null);

    if (savedUser) {
      setCurrentUser(savedUser);

      if (savedUser.role === "kasir") {
        setSelectedBranch(savedUser.branch || "Cabang 1");
      }
    }
  }, []);

  const activeBranchId = useMemo(() => {
    if (currentUser?.role === "kasir") {
      return getBranchIdByName(currentUser.branch);
    }

    if (selectedBranch !== "Semua") {
      return getBranchIdByName(selectedBranch);
    }

    return null;
  }, [currentUser, selectedBranch]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const params = {};

      if (activeBranchId) {
        params.branch_id = activeBranchId;
      }

      if (selectedDate) {
        params.date = selectedDate;
      }

      if (selectedStatus !== "Semua") {
        params.status = selectedStatus;
      }

      const transactionData = await getTransactions(params);
      const normalizedTransactions = transactionData.map(normalizeTransaction);

      setTransactions(normalizedTransactions);
      setSelectedTransaction(normalizedTransactions[0] || null);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data transaksi dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    fetchTransactions();
  }, [currentUser, activeBranchId, selectedDate, selectedStatus]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const keyword = searchKeyword.toLowerCase();

      const matchSearch =
        transaction.invoiceNumber?.toLowerCase().includes(keyword) ||
        transaction.cashierName?.toLowerCase().includes(keyword) ||
        transaction.username?.toLowerCase().includes(keyword) ||
        transaction.branch?.toLowerCase().includes(keyword) ||
        transaction.items.some((item) =>
          item.name?.toLowerCase().includes(keyword)
        );

      const matchPayment =
        selectedPayment === "Semua" ||
        transaction.paymentMethod === selectedPayment;

      return matchSearch && matchPayment;
    });
  }, [transactions, searchKeyword, selectedPayment]);

  const successfulTransactions = filteredTransactions.filter(
    (transaction) => transaction.status === "Berhasil"
  );

  const totalTransaction = filteredTransactions.length;

  const totalSales = successfulTransactions.reduce(
    (total, transaction) => total + Number(transaction.grandTotal || 0),
    0
  );

  const totalSubtotal = successfulTransactions.reduce(
    (total, transaction) => total + Number(transaction.subtotal || 0),
    0
  );

  const totalTax = successfulTransactions.reduce(
    (total, transaction) => total + Number(transaction.tax || 0),
    0
  );

  const totalItemsSold = successfulTransactions.reduce(
    (total, transaction) => total + Number(transaction.totalItem || 0),
    0
  );

  const totalCash = successfulTransactions
    .filter((transaction) => transaction.paymentMethod === "Tunai")
    .reduce(
      (total, transaction) => total + Number(transaction.grandTotal || 0),
      0
    );

  const totalQris = successfulTransactions
    .filter((transaction) => transaction.paymentMethod === "QRIS")
    .reduce(
      (total, transaction) => total + Number(transaction.grandTotal || 0),
      0
    );

  const totalTransfer = successfulTransactions
    .filter((transaction) => transaction.paymentMethod === "Transfer")
    .reduce(
      (total, transaction) => total + Number(transaction.grandTotal || 0),
      0
    );

  const selectedSubtotal = selectedTransaction?.subtotal || 0;
  const selectedDiscount = selectedTransaction?.discount || 0;
  const selectedTax = selectedTransaction?.tax || 0;
  const selectedTotal = selectedTransaction?.grandTotal || 0;

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  const getStatusBadge = (status) => {
    if (status === "Berhasil") {
      return "bg-green-100 text-green-700";
    }

    return "bg-red-100 text-red-700";
  };

  const openDetailTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const closeDetailTransaction = () => {
    setShowDetailModal(false);
  };

  const handlePrint = () => {
    if (!selectedTransaction) {
      alert("Pilih transaksi terlebih dahulu.");
      return;
    }

    alert(`Cetak ulang struk ${selectedTransaction.invoiceNumber} diproses.`);
  };

  const handleCancelTransaction = () => {
    alert(
      "Fitur batal transaksi belum dihubungkan ke backend. Nanti perlu dibuat endpoint khusus untuk update status transaksi."
    );
  };

  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada data transaksi untuk diexport.");
      return;
    }

    const headers = [
      "Invoice",
      "Tanggal",
      "Jam",
      "Kasir",
      "Cabang",
      "Shift",
      "Metode",
      "Status",
      "Item",
      "Subtotal",
      "Diskon",
      "PPN",
      "Total",
    ];

    const rows = filteredTransactions.map((transaction) => [
      transaction.invoiceNumber,
      formatDateOnly(transaction.transactionDate),
      formatTimeOnly(transaction.transactionDate),
      transaction.cashierName,
      transaction.branch,
      transaction.shift,
      transaction.paymentMethod,
      transaction.status,
      transaction.totalItem,
      transaction.subtotal,
      transaction.discount,
      transaction.tax,
      transaction.grandTotal,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((item) => `"${item}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "riwayat-transaksi-nikky-frozen.csv";
    link.click();

    URL.revokeObjectURL(url);
    showSuccess("Data transaksi berhasil diexport.");
  };

  const handleRefresh = async () => {
    await fetchTransactions();
    showSuccess("Data transaksi berhasil diperbarui dari backend.");
  };

  const isOwner = currentUser?.role === "owner";

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title="Riwayat Transaksi"
        description="Lihat daftar transaksi dari backend berdasarkan cabang, kasir, shift, dan metode pembayaran."
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
          onClick={exportCSV}
          className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
        >
          Export CSV
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Cetak Ulang Struk
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

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Transaksi</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {totalTransaction}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Penjualan</p>
          <h3 className="mt-2 text-2xl font-bold text-blue-600">
            {formatRupiah(totalSales)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Subtotal</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {formatRupiah(totalSubtotal)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">PPN</p>
          <h3 className="mt-2 text-2xl font-bold text-purple-600">
            {formatRupiah(totalTax)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Produk Terjual</p>
          <h3 className="mt-2 text-2xl font-bold text-green-600">
            {totalItemsSold}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pembayaran Tunai</p>
          <h3 className="mt-2 text-2xl font-bold text-orange-600">
            {formatRupiah(totalCash)}
          </h3>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pembayaran QRIS</p>
          <h3 className="mt-2 text-2xl font-bold text-blue-600">
            {formatRupiah(totalQris)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pembayaran Transfer</p>
          <h3 className="mt-2 text-2xl font-bold text-purple-600">
            {formatRupiah(totalTransfer)}
          </h3>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-800">
                Daftar Transaksi
              </h3>
              <p className="text-sm text-slate-500">
                Data transaksi diambil langsung dari backend.
              </p>
            </div>

            <div className="mb-5 grid gap-3 lg:grid-cols-5">
              <input
                type="text"
                placeholder="Cari invoice / kasir / produk..."
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
                value={selectedBranch}
                disabled={!isOwner}
                onChange={(event) => setSelectedBranch(event.target.value)}
                className={`rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                  !isOwner ? "bg-slate-100 text-slate-400" : ""
                }`}
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>

              <select
                value={selectedPayment}
                onChange={(event) => setSelectedPayment(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
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
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                Mengambil data transaksi dari backend...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                      <th className="px-4 py-4 font-semibold">Invoice</th>
                      <th className="px-4 py-4 font-semibold">Tanggal</th>
                      <th className="px-4 py-4 font-semibold">Kasir</th>
                      <th className="px-4 py-4 font-semibold">Cabang</th>
                      <th className="px-4 py-4 font-semibold">Shift</th>
                      <th className="px-4 py-4 font-semibold">Metode</th>
                      <th className="px-4 py-4 font-semibold">Item</th>
                      <th className="px-4 py-4 font-semibold">Total</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                      <th className="px-4 py-4 text-center font-semibold">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className={`border-b border-slate-100 text-sm hover:bg-slate-50 ${
                          selectedTransaction?.id === transaction.id
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {transaction.invoiceNumber}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          <p>{formatDateOnly(transaction.transactionDate)}</p>
                          <p className="text-xs text-slate-400">
                            {formatTimeOnly(transaction.transactionDate)}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {transaction.cashierName}
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
                          {transaction.shift}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {transaction.paymentMethod}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {transaction.totalItem}
                        </td>

                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {formatRupiah(transaction.grandTotal)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDetailTransaction(transaction)}
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                            >
                              Detail
                            </button>

                            {transaction.status === "Berhasil" && (
                              <button
                                type="button"
                                onClick={handleCancelTransaction}
                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                              >
                                Batal
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td
                          colSpan="10"
                          className="px-4 py-10 text-center text-sm text-slate-500"
                        >
                          Data transaksi tidak ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-4 text-sm text-slate-500">
              Menampilkan {filteredTransactions.length} dari{" "}
              {transactions.length} transaksi.
            </p>
          </div>
        </section>

        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          {selectedTransaction ? (
            <>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Detail Transaksi
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedTransaction.invoiceNumber}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                    selectedTransaction.status
                  )}`}
                >
                  {selectedTransaction.status}
                </span>
              </div>

              <div className="mb-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-semibold text-slate-700">
                    {formatDateOnly(selectedTransaction.transactionDate)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Waktu</span>
                  <span className="font-semibold text-slate-700">
                    {formatTimeOnly(selectedTransaction.transactionDate)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Kasir</span>
                  <span className="font-semibold text-slate-700">
                    {selectedTransaction.cashierName}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cabang</span>
                  <span className="font-semibold text-slate-700">
                    {selectedTransaction.branch}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Shift</span>
                  <span className="font-semibold text-slate-700">
                    {selectedTransaction.shift}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pembayaran</span>
                  <span className="font-semibold text-slate-700">
                    {selectedTransaction.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="mb-5">
                <h4 className="mb-3 text-sm font-semibold text-slate-800">
                  Item Transaksi
                </h4>

                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {selectedTransaction.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-100 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.quantity} x {formatRupiah(item.price)}
                          </p>
                        </div>

                        <p className="text-sm font-bold text-slate-800">
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(selectedSubtotal)}</span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Diskon</span>
                  <span>- {formatRupiah(selectedDiscount)}</span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>PPN</span>
                  <span>{formatRupiah(selectedTax)}</span>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-slate-800">
                    <span>Total</span>
                    <span>{formatRupiah(selectedTotal)}</span>
                  </div>
                </div>

                {selectedTransaction.paymentMethod === "Tunai" && (
                  <>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Uang Dibayar</span>
                      <span>
                        {formatRupiah(selectedTransaction.paidAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-green-600">
                      <span>Kembalian</span>
                      <span>
                        {formatRupiah(selectedTransaction.changeAmount)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="mt-5 w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
              >
                Cetak Ulang
              </button>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Pilih transaksi untuk melihat detail.
            </div>
          )}
        </aside>
      </div>

      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Detail Transaksi
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedTransaction.invoiceNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetailTransaction}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                X
              </button>
            </div>

            <div className="mb-5 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Tanggal</span>
                <span className="font-semibold text-slate-700">
                  {formatDateOnly(selectedTransaction.transactionDate)}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Waktu</span>
                <span className="font-semibold text-slate-700">
                  {formatTimeOnly(selectedTransaction.transactionDate)}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Kasir</span>
                <span className="font-semibold text-slate-700">
                  {selectedTransaction.cashierName}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Username</span>
                <span className="font-semibold text-slate-700">
                  {selectedTransaction.username}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Cabang</span>
                <span className="font-semibold text-slate-700">
                  {selectedTransaction.branch}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Shift</span>
                <span className="font-semibold text-slate-700">
                  {selectedTransaction.shift}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Metode Bayar</span>
                <span className="font-semibold text-slate-700">
                  {selectedTransaction.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Status</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(
                    selectedTransaction.status
                  )}`}
                >
                  {selectedTransaction.status}
                </span>
              </div>
            </div>

            <div className="mb-5">
              <h4 className="mb-3 text-sm font-bold text-slate-800">
                Item Transaksi
              </h4>

              <div className="space-y-3">
                {selectedTransaction.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-800">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.code} • {item.category}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.quantity} x {formatRupiah(item.price)}
                        </p>
                      </div>

                      <p className="font-bold text-slate-800">
                        {formatRupiah(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}

                {selectedTransaction.items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Item transaksi tidak tersedia.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{formatRupiah(selectedTransaction.subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Diskon</span>
                <span>- {formatRupiah(selectedTransaction.discount)}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>PPN</span>
                <span>{formatRupiah(selectedTransaction.tax)}</span>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between text-lg font-bold text-slate-800">
                  <span>Total</span>
                  <span>{formatRupiah(selectedTransaction.grandTotal)}</span>
                </div>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Uang Dibayar</span>
                <span>{formatRupiah(selectedTransaction.paidAmount)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-green-600">
                <span>Kembalian</span>
                <span>{formatRupiah(selectedTransaction.changeAmount)}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeDetailTransaction}
                className="rounded-xl border border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
              >
                Cetak Ulang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransaksiPage;