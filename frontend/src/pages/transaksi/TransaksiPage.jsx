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
  CreditCard,
  Banknote,
} from "lucide-react";
import * as api from "../../services/api";

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
    status: transaction.status || "Selesai",
    items:
      transaction.items ||
      transaction.details ||
      transaction.transaction_items ||
      [],
  };
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, variant = "gray" }) {
  const variants = {
    green: "bg-green-50 text-green-700 border border-green-200",
    orange: "bg-orange-50 text-orange-700 border border-orange-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-sky-50 text-[#0B7FC3] border border-sky-200",
    gray: "bg-gray-50 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${variants[variant]}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, colorTheme = "red" }) {
  const themes = {
    red: "bg-[#C80503]/10 text-[#C80503]",
    green: "bg-[#059669]/10 text-[#059669]",
    orange: "bg-[#D97706]/10 text-[#D97706]",
    blue: "bg-[#2563EB]/10 text-[#2563EB]",
  };

  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${themes[colorTheme]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-[#7A6258] uppercase tracking-wide">{label}</p>
        <p className="mt-1 truncate text-2xl font-black text-[#2A1712]">
          {value}
        </p>
      </div>
    </Card>
  );
}

function TransactionDetailModal({ transaction, onClose }) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#2A1712]/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[520px] rounded-[2rem] bg-[#FFFDF8] p-6 shadow-2xl border border-[#EBCDB8]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#2A1712]">Detail Transaksi</h2>
            <p className="mt-1 text-sm font-semibold text-[#7A6258]">
              {transaction.invoice}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF6EA] text-[#7A6258] transition hover:bg-[#EBCDB8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 rounded-2xl bg-white border border-[#EBCDB8] p-5">
          <div className="flex justify-between gap-3">
            <span className="text-sm font-bold text-[#7A6258]">Tanggal</span>
            <span className="text-sm font-black text-[#2A1712]">{formatDateTime(transaction.date)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-sm font-bold text-[#7A6258]">Kasir</span>
            <span className="text-sm font-black text-[#2A1712]">{transaction.cashier}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-sm font-bold text-[#7A6258]">Cabang</span>
            <span className="text-sm font-black text-[#2A1712]">{transaction.branch}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-sm font-bold text-[#7A6258]">Metode Bayar</span>
            <span className="text-sm font-black text-[#2A1712]">{transaction.method}</span>
          </div>

          <div className="border-t border-dashed border-[#EBCDB8] mt-3 pt-3">
            <p className="text-xs font-bold text-[#7A6258] mb-2 uppercase">Item Pembelian</p>
            {transaction.items?.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-[#2A1712] font-semibold">{item.product_name || item.name} x{item.quantity}</span>
                    <span className="text-[#2A1712] font-bold">{formatRupiah(item.subtotal || (item.price * item.quantity))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7A6258] italic">Tidak ada rincian item (Data lama)</p>
            )}
          </div>

          <div className="border-t border-[#EBCDB8] mt-3 pt-3">
            <div className="flex justify-between gap-3 items-center">
              <span className="text-base font-black text-[#2A1712]">Total</span>
              <span className="text-xl font-black text-[#C80503]">
                {formatRupiah(transaction.total)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2A1712] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-black shadow-md"
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
      const response = await api.getTransactions();
      const transactionList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
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
        if (method.includes("tunai") && !method.includes("non")) summary.tunai += item.total;
        else summary.nonTunai += item.total;
        return summary;
      },
      { tunai: 0, nonTunai: 0 }
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
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
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
    <div className="min-h-[calc(100vh-100px)]">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Struk"
          value={filteredTransactions.length}
          icon={ReceiptText}
          colorTheme="red"
        />
        <StatCard
          label="Total Penjualan"
          value={formatRupiah(totalSales)}
          icon={WalletCards}
          colorTheme="green"
        />
        <StatCard
          label="Tunai"
          value={formatRupiah(paymentSummary.tunai)}
          icon={Banknote}
          colorTheme="orange"
        />
        <StatCard
          label="QRIS / Transfer"
          value={formatRupiah(paymentSummary.nonTunai)}
          icon={CreditCard}
          colorTheme="blue"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-[#EBCDB8] bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#EBCDB8]" />
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Cari invoice..."
                className="w-full rounded-xl border border-[#EBCDB8] bg-[#FFFDF8] py-2.5 pl-10 pr-4 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#EBCDB8]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full sm:w-[160px] rounded-xl border border-[#EBCDB8] bg-[#FFFDF8] py-2.5 pl-10 pr-4 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
                />
              </div>
              <select
                value={selectedMethod}
                onChange={(event) => setSelectedMethod(event.target.value)}
                className="rounded-xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-2.5 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[#FFF6EA] text-xs font-bold uppercase text-[#7A6258]">
              <tr>
                <th className="px-6 py-4 border-b border-[#EBCDB8]">Invoice</th>
                <th className="px-6 py-4 border-b border-[#EBCDB8]">Tanggal Waktu</th>
                <th className="px-6 py-4 border-b border-[#EBCDB8]">Kasir</th>
                <th className="px-6 py-4 border-b border-[#EBCDB8]">Metode</th>
                <th className="px-6 py-4 border-b border-[#EBCDB8] text-right">Total Nominal</th>
                <th className="px-6 py-4 border-b border-[#EBCDB8] text-center">Status</th>
                <th className="px-6 py-4 border-b border-[#EBCDB8] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBCDB8]">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="bg-white hover:bg-[#FFFDF8] transition-colors">
                  <td className="px-6 py-4 font-black text-[#2A1712]">{transaction.invoice}</td>
                  <td className="px-6 py-4 font-semibold text-[#7A6258]">{formatDateTime(transaction.date)}</td>
                  <td className="px-6 py-4 font-semibold text-[#7A6258]">{transaction.cashier}</td>
                  <td className="px-6 py-4 font-semibold text-[#7A6258]">{transaction.method}</td>
                  <td className="px-6 py-4 text-right font-black text-[#C80503]">{formatRupiah(transaction.total)}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="green">{transaction.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedTransaction(transaction)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C80503]/10 px-3 py-1.5 text-xs font-bold text-[#C80503] transition hover:bg-[#C80503] hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[#7A6258]">
                    <ReceiptText className="mx-auto h-8 w-8 text-[#EBCDB8] mb-3" />
                    <p className="font-bold">
                      {isLoading ? "Memuat transaksi..." : "Tidak ada transaksi yang cocok."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-5 border-t border-[#EBCDB8] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[#7A6258]">
            Menampilkan <span className="font-bold text-[#2A1712]">{filteredTransactions.length}</span> transaksi.
          </p>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredTransactions.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#EBCDB8] bg-white px-4 py-2 text-sm font-bold text-[#2A1712] transition hover:bg-[#FFF6EA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-[#C80503]" />
            Export ke CSV
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
