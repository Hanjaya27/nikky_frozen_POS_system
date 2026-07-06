import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  FileText,
  Loader2,
  PackageCheck,
  RefreshCw,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import * as api from "../../services/api";

const periodOptions = [
  { id: "today", label: "Hari Ini" },
  { id: "7days", label: "7 Hari" },
  { id: "month", label: "Bulan Ini" },
];

const tabs = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "transaksi", label: "Transaksi" },
  { id: "pengeluaran", label: "Pengeluaran" },
];

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function shortRupiah(value) {
  const number = Number(value || 0);
  if (number >= 1000000) {
    return `Rp ${(number / 1000000).toFixed(1).replace(".", ",")}jt`;
  }
  if (number >= 1000) {
    return `Rp ${Math.round(number / 1000)}rb`;
  }
  return `Rp ${number}`;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-[22px] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatCard({ title, value, caption, icon: Icon, tone = "red" }) {
  const tones = {
    red: "bg-[#FFF6EA] text-[#C80503]",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#7A6258]">{title}</p>
          <h3 className="mt-2 truncate text-2xl font-black text-[#2A1712]">{value}</h3>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-[#7A6258]">
            {caption}
          </p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#EBCDB8] ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function Badge({ children, variant = "gray" }) {
  const variants = {
    green: "bg-green-50 text-green-700 ring-green-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    gray: "bg-gray-50 text-gray-600 ring-gray-100",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${variants[variant]}`}>
      {children}
    </span>
  );
}

function LaporanPage() {
  const [branchList, setBranchList] = useState([]);
  const [period, setPeriod] = useState("month");
  const [branchId, setBranchId] = useState("");
  const [activeTab, setActiveTab] = useState("ringkasan");
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    api.getBranchesCached().then(setBranchList).catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const params = { period };
      if (branchId) {
        params.branch_id = branchId;
      }
      const result = await api.getOwnerReports(params);
      setReportData(result);
    } catch (error) {
      console.error("Gagal mengambil laporan:", error);
      setErrorMessage(error.message || "Gagal memuat data laporan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportError("");

      const { blob, filename } = await api.exportOwnerReports({
        period,
        branch_id: branchId || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "laporan-owner.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal export laporan:", error);
      setExportError(error.message || "Gagal export laporan.");
    } finally {
      setExporting(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [period, branchId]);

  const summary = reportData?.summary || {};
  const chart = reportData?.chart || [];
  const topProducts = reportData?.top_products || [];
  const transactions = reportData?.transactions || [];
  const expenses = reportData?.expenses || [];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FEF6EC]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C80503]" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FEF6EC] p-6">
        <div className="max-w-md rounded-[22px] border border-[#EBCDB8] bg-[#FFFDF8] p-8 text-center shadow-sm">
          <p className="text-sm font-bold text-[#C80503]">{errorMessage}</p>
          <button
            type="button"
            onClick={fetchData}
            className="mt-4 rounded-xl border border-[#EBCDB8] bg-white px-4 py-2 text-xs font-black text-[#2A1712] hover:bg-[#FFF6EA]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEF6EC] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C80503]">
            Laporan Owner
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#2A1712] sm:text-3xl">Laporan</h1>
          <p className="mt-1 text-sm font-semibold text-[#7A6258]">
            Pantau pendapatan, pengeluaran, transaksi, dan performa cabang.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid grid-cols-3 rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] p-1 shadow-sm">
            {periodOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                className={`rounded-xl px-3 py-2 text-xs font-black transition sm:px-4 ${
                  period === item.id
                    ? "bg-[#C80503] text-white shadow-sm"
                    : "text-[#7A6258] hover:bg-[#FFF6EA]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <select
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"
          >
            <option value="">Semua Cabang</option>
            {branchList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchData}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#2A1712] shadow-sm transition hover:bg-[#FFF6EA]"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#C80503] shadow-sm transition hover:bg-[#FFF6EA] hover:border-[#C80503] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className={`h-4 w-4 ${exporting ? "animate-bounce" : ""}`} />
            {exporting ? "Mengekspor..." : "Export"}
          </button>
        </div>
      </div>

      {exportError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {exportError}
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Pendapatan"
          value={rupiah(summary.total_revenue)}
          caption="Dari transaksi lunas pada periode terpilih."
          icon={ArrowUpRight}
          tone="green"
        />
        <StatCard
          title="Total Pengeluaran"
          value={rupiah(summary.total_expenses)}
          caption="Pengeluaran aktif yang tercatat."
          icon={ArrowDownRight}
          tone="red"
        />
        <StatCard
          title="Laba Kotor"
          value={rupiah(summary.gross_profit)}
          caption="Pendapatan dikurangi pengeluaran."
          icon={TrendingUp}
          tone={(summary.gross_profit ?? 0) >= 0 ? "green" : "red"}
        />
        <StatCard
          title="Total Transaksi"
          value={summary.total_transactions ?? 0}
          caption="Jumlah transaksi berhasil."
          icon={ReceiptText}
          tone="orange"
        />
      </div>

      <Card className="mb-5 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition ${
                activeTab === item.id
                  ? "bg-[#C80503] text-white shadow-sm"
                  : "text-[#7A6258] hover:bg-[#FFF6EA]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {activeTab === "ringkasan" && (
        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#2A1712]">
                  Pendapatan vs Pengeluaran
                </h2>
                <p className="mt-1 text-sm font-medium text-[#7A6258]">
                  Ringkasan harian berdasarkan periode dan cabang terpilih.
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-[#C80503]" />
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBCDB8" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#7A6258", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={shortRupiah}
                    tick={{ fontSize: 12, fill: "#7A6258", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value) => rupiah(value)} />
                  <Bar dataKey="revenue" fill="#16A34A" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#C80503" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-black text-[#2A1712]">
              Produk Terlaris
            </h2>
            <p className="mt-1 text-sm font-medium text-[#7A6258]">
              Produk dengan jumlah terjual terbanyak.
            </p>

            <div className="mt-5 space-y-3">
              {topProducts.length > 0 ? topProducts.slice(0, 5).map((item, index) => (
                <div
                  key={`${item.product_id}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#2A1712]">{item.product_name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#7A6258]">
                      {item.product_code} &middot; Peringkat #{index + 1}
                    </p>
                  </div>
                  <Badge variant="orange">{item.quantity_sold} item</Badge>
                </div>
              )) : (
                <p className="p-4 text-center text-sm font-semibold text-[#7A6258]">
                  Belum ada data produk terjual.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5 xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#2A1712]">
                  Perbandingan Cabang
                </h2>
                <p className="mt-1 text-sm font-medium text-[#7A6258]">
                  Grafik pendapatan, pengeluaran, dan laba antar cabang.
                </p>
              </div>
              <PackageCheck className="h-5 w-5 text-[#C80503]" />
            </div>

            <div className="mb-5 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData?.branch_summary || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBCDB8" />
                  <XAxis
                    dataKey="branch_name"
                    tick={{ fontSize: 12, fill: "#7A6258", fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={shortRupiah}
                    tick={{ fontSize: 12, fill: "#7A6258", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value) => rupiah(value)} />
                  <Bar dataKey="total_revenue" fill="#16A34A" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="total_expenses" fill="#C80503" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="gross_profit" fill="#F97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(reportData?.branch_summary || []).length > 0 ? reportData.branch_summary.map((item) => (
                <div
                  key={item.branch_id}
                  className="rounded-[20px] border border-[#EBCDB8] bg-[#FFFDF8] p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-black text-[#2A1712]">
                      {item.branch_name}
                    </h3>
                    <Badge variant={(item.gross_profit ?? 0) >= 0 ? "green" : "red"}>
                      {(item.gross_profit ?? 0) >= 0 ? "Untung" : "Minus"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between gap-3">
                      <span className="text-sm font-semibold text-[#7A6258]">
                        Pendapatan
                      </span>
                      <span className="text-sm font-black text-[#2A1712]">
                        {rupiah(item.total_revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-sm font-semibold text-[#7A6258]">
                        Pengeluaran
                      </span>
                      <span className="text-sm font-black text-[#C80503]">
                        {rupiah(item.total_expenses)}
                      </span>
                    </div>
                    <div className="border-t border-[#EBCDB8] pt-3">
                      <div className="flex justify-between gap-3">
                        <span className="text-sm font-semibold text-[#7A6258]">
                          Laba Kotor
                        </span>
                        <span
                          className={`text-sm font-black ${
                            (item.gross_profit ?? 0) >= 0 ? "text-green-600" : "text-[#C80503]"
                          }`}
                        >
                          {rupiah(item.gross_profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="col-span-2 p-4 text-center text-sm font-semibold text-[#7A6258]">
                  Belum ada data cabang.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "transaksi" && (
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#2A1712]">Transaksi</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">
                Daftar transaksi lunas pada periode terpilih.
              </p>
            </div>
            <FileText className="h-5 w-5 text-[#C80503]" />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#EBCDB8]">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#FFF6EA] text-xs font-black uppercase text-[#7A6258]">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3">Kasir</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBCDB8]">
                {transactions.length > 0 ? transactions.map((item) => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-4 py-3 font-black text-[#2A1712]">
                      {item.invoice_number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">
                      {formatTime(item.created_at)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">
                      {item.branch_name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">
                      {item.cashier_name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">
                      {item.payment_method}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="green">{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[#2A1712]">
                      {rupiah(item.total_amount)}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="p-4 text-center text-sm font-semibold text-[#7A6258]">Belum ada transaksi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "pengeluaran" && (
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#2A1712]">Pengeluaran</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">
                Biaya operasional yang tercatat pada periode terpilih.
              </p>
            </div>
            <WalletCards className="h-5 w-5 text-[#C80503]" />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#EBCDB8]">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#FFF6EA] text-xs font-black uppercase text-[#7A6258]">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBCDB8]">
                {expenses.length > 0 ? expenses.map((item) => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="orange">{item.category}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">
                      {item.branch_name}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[#C80503]">
                      {rupiah(item.amount)}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-4 text-center text-sm font-semibold text-[#7A6258]">Belum ada pengeluaran.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default LaporanPage;

