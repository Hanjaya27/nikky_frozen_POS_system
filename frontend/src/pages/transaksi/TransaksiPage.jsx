import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  Eye,
  Printer,
  ReceiptText,
  Search,
  WalletCards,
  X,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
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

function todayInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeTransaction(transaction) {
  return {
    id: transaction.id,
    invoice:
      transaction.invoice_number ||
      transaction.invoice ||
      transaction.code ||
      `TRX-${transaction.id}`,
    date:
      transaction.transaction_date ||
      transaction.created_at ||
      transaction.date ||
      new Date().toISOString(),
    cashier:
      transaction.cashier_name ||
      transaction.user?.name ||
      transaction.cashier?.name ||
      "-",
    branch:
      transaction.branch?.name ||
      transaction.branch ||
      `Cabang ${transaction.branch_id || "-"}`,
    method:
      transaction.payment_method ||
      transaction.paymentMethod ||
      transaction.method ||
      "-",
    total: Number(
      transaction.grand_total ||
        transaction.total ||
        transaction.total_amount ||
        0
    ),
    status: transaction.status || "Lunas",
    items:
      transaction.items ||
      transaction.details ||
      transaction.transaction_items ||
      [],
  };
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-[22px] border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Badge({ children, variant = "gray" }) {
  const variants = {
    green: "bg-green-50 text-green-700 ring-green-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    blue: "bg-sky-50 text-[#0B7FC3] ring-sky-100",
    gray: "bg-gray-50 text-gray-600 ring-gray-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-[#0B7FC3]",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-black text-gray-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function TransactionDetailModal({ transaction, onClose }) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[520px] rounded-[28px] bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-950">
              Detail Transaksi
            </h2>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              {transaction.invoice}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition hover:bg-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
          <div className="flex justify-between gap-3">
            <span className="text-sm font-bold text-gray-500">Tanggal</span>
            <span className="text-sm font-black text-gray-950">
              {formatDateTime(transaction.date)}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-sm font-bold text-gray-500">Kasir</span>
            <span className="text-sm font-black text-gray-950">
              {transaction.cashier}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-sm font-bold text-gray-500">Cabang</span>
            <span className="text-sm font-black text-gray-950">
              {transaction.branch}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-sm font-bold text-gray-500">Metode</span>
            <span className="text-sm font-black text-gray-950">
              {transaction.method}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between gap-3">
              <span className="text-base font-black text-gray-950">Total</span>
              <span className="text-base font-black text-[#0B7FC3]">
                {formatRupiah(transaction.total)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50"
        >
          <Printer className="h-4 w-4" />
          Cetak Ulang Struk
        </button>
      </div>
    </div>
  );
}

function TransaksiPage() {
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayInputValue());
  const [selectedMethod, setSelectedMethod] = useState("Semua");
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/transactions`);
      const result = await response.json();

      const transactionList = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];

      setTransactions(transactionList.map(normalizeTransaction));
    } catch (error) {
      console.error("Gagal mengambil transaksi:", error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const keyword = searchKeyword.toLowerCase();
      const transactionDate = transaction.date?.slice(0, 10);

      const matchSearch =
        transaction.invoice.toLowerCase().includes(keyword) ||
        transaction.cashier.toLowerCase().includes(keyword) ||
        transaction.branch.toLowerCase().includes(keyword);

      const matchDate = !selectedDate || transactionDate === selectedDate;
      const matchMethod =
        selectedMethod === "Semua" || transaction.method === selectedMethod;

      return matchSearch && matchDate && matchMethod;
    });
  }, [transactions, searchKeyword, selectedDate, selectedMethod]);

  const totalSales = useMemo(() => {
    return filteredTransactions.reduce((total, item) => total + item.total, 0);
  }, [filteredTransactions]);

  const paymentSummary = useMemo(() => {
    return filteredTransactions.reduce(
      (summary, item) => {
        const method = String(item.method).toLowerCase();

        if (method.includes("tunai")) summary.tunai += item.total;
        if (method.includes("qris")) summary.qris += item.total;
        if (method.includes("transfer")) summary.transfer += item.total;

        return summary;
      },
      { tunai: 0, qris: 0, transfer: 0 }
    );
  }, [filteredTransactions]);

  const paymentMethods = useMemo(() => {
    return [
      "Semua",
      ...new Set(transactions.map((item) => item.method).filter(Boolean)),
    ];
  }, [transactions]);

  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) return;

    const rows = [
      ["Invoice", "Tanggal", "Kasir", "Cabang", "Metode", "Total", "Status"],
      ...filteredTransactions.map((item) => [
        item.invoice,
        formatDateTime(item.date),
        item.cashier,
        item.branch,
        item.method,
        item.total,
        item.status,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `riwayat-transaksi-${selectedDate || "semua"}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Transaksi"
          value={filteredTransactions.length}
          icon={ReceiptText}
          tone="blue"
        />

        <StatCard
          label="Total Penjualan"
          value={formatRupiah(totalSales)}
          icon={WalletCards}
          tone="green"
        />

        <StatCard
          label="Pembayaran Tunai"
          value={formatRupiah(paymentSummary.tunai)}
          icon={WalletCards}
          tone="orange"
        />

        <StatCard
          label="QRIS / Transfer"
          value={formatRupiah(paymentSummary.qris + paymentSummary.transfer)}
          icon={WalletCards}
          tone="purple"
        />
      </div>

      <Card className="p-5">
        <div className="mb-5">
          <h2 className="text-lg font-black text-gray-950">
            Daftar Transaksi
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Transaksi yang diproses oleh kasir.
          </p>
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_210px_190px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Cari invoice, kasir, atau cabang..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <select
            value={selectedMethod}
            onChange={(event) => setSelectedMethod(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-gray-50 text-xs font-black uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Kasir</th>
                <th className="px-4 py-3">Cabang</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="bg-white">
                  <td className="px-4 py-3 font-black text-gray-950">
                    {transaction.invoice}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-600">
                    {formatDateTime(transaction.date)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-600">
                    {transaction.cashier}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-600">
                    {transaction.branch}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-600">
                    {transaction.method}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-gray-950">
                    {formatRupiah(transaction.total)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="green">{transaction.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedTransaction(transaction)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-[#0B7FC3] transition hover:bg-sky-100"
                    >
                      <Eye className="h-4 w-4" />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-12 text-center font-semibold text-gray-500"
                  >
                    {isLoading
                      ? "Memuat transaksi..."
                      : "Data transaksi tidak ditemukan."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-500">
            Menampilkan {filteredTransactions.length} transaksi.
          </p>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredTransactions.length === 0}
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </Card>

      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}

export default TransaksiPage;
