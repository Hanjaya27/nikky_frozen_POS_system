import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Building2,
  CalendarClock,
  Clock3,
  Loader2,
  PackageCheck,
  PackageX,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import * as api from "../../services/api";

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function shortRupiah(value) {
  const number = Number(value || 0);
  if (number >= 1000000) return `Rp ${(number / 1000000).toFixed(1).replace(".", ",")}jt`;
  if (number >= 1000) return `Rp ${Math.round(number / 1000)}rb`;
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

function daysUntilExpired(dateString) {
  const today = new Date();
  const expired = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  expired.setHours(0, 0, 0, 0);

  return Math.ceil((expired.getTime() - today.getTime()) / 86400000);
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

function OwnerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const result = await api.getOwnerDashboard();
      setDashboardData(result);
    } catch (error) {
      console.error("Gagal mengambil dashboard owner:", error);
      setErrorMessage(error.message || "Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C80503]" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-red-600 font-bold">
        {errorMessage}
      </div>
    );
  }

  const { summary, sales_trend, priorities, low_stock_products, empty_stock_products, expiring_soon_products, expired_products, branch_performance, recent_transactions } = dashboardData;

  return (
    <div className="min-h-screen bg-[#FEF6EC] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C80503]">
            Owner Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#2A1712] sm:text-3xl">
            Ringkasan Operasional Hari Ini
          </h1>
          <p className="mt-1 text-sm font-semibold text-[#7A6258]">
            Pantau penjualan, transaksi, stok menipis, dan produk hampir expired.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-black text-[#2A1712] shadow-sm transition hover:bg-[#FFF6EA]"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Penjualan Hari Ini" value={rupiah(summary.today_sales)} caption="Total transaksi lunas pada hari ini." icon={ArrowUpRight} tone="green" />
        <StatCard title="Transaksi Hari Ini" value={summary.today_transactions} caption="Jumlah transaksi yang berhasil diproses." icon={ReceiptText} tone="red" />
        <StatCard title="Stok Menipis/Habis" value={summary.low_stock_count + summary.empty_stock_count} caption="Produk yang perlu restock atau sudah habis." icon={Boxes} tone="orange" />
        <StatCard title="Expired / Segera" value={summary.expired_count + summary.expiring_soon_count} caption="Produk yang perlu diperhatikan." icon={CalendarClock} tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#2A1712]">Tren Penjualan 7 Hari</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">Grafik penjualan 7 hari terakhir.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-[#C80503]" />
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C80503" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C80503" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBCDB8" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7A6258", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={shortRupiah} tick={{ fontSize: 12, fill: "#7A6258", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => rupiah(value)} />
                <Area type="monotone" dataKey="total_sales" stroke="#C80503" strokeWidth={3} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#2A1712]">Prioritas Hari Ini</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">Hal penting yang perlu dipantau.</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>

          <div className="space-y-3">
            {priorities.map((item, index) => (
              <div key={`${item.type}-${index}`} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#EBCDB8] ${item.severity === 'danger' ? 'bg-[#FFF6EA] text-[#C80503]' : 'bg-orange-50 text-orange-600'}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#2A1712]">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-[#7A6258]">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
            {priorities.length === 0 && <p className="text-sm font-semibold text-[#7A6258] p-4 text-center">Tidak ada prioritas mendesak.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#2A1712]">Prioritas Hari Ini</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">Hal penting yang perlu dipantau.</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>

          <div className="space-y-3">
            {priorities.length > 0 ? priorities.map((item, index) => (
              <div key={`${item.type}-${index}`} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#EBCDB8] ${item.severity === 'danger' ? 'bg-[#FFF6EA] text-[#C80503]' : 'bg-orange-50 text-orange-600'}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#2A1712]">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-[#7A6258]">{item.description}</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm font-semibold text-[#7A6258] p-4 text-center">Tidak ada prioritas mendesak.</p>}
          </div>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#2A1712]">Performa Cabang Hari Ini</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">Ringkasan performa setiap cabang.</p>
            </div>
            <Building2 className="h-5 w-5 text-[#C80503]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {branch_performance.length > 0 ? branch_performance.map((item) => (
              <div key={item.branch_id} className="rounded-[20px] border border-[#EBCDB8] bg-[#FFFDF8] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-black text-[#2A1712]">{item.branch_name}</h3>
                  <Badge variant={item.today_sales >= 150000 ? "green" : "orange"}>{item.today_sales >= 150000 ? "Stabil" : "Perlu dicek"}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white border border-[#EBCDB8] p-4">
                    <p className="text-xs font-semibold text-[#7A6258]">Penjualan</p>
                    <p className="mt-1 text-lg font-black text-[#2A1712]">{rupiah(item.today_sales)}</p>
                  </div>
                  <div className="rounded-2xl bg-white border border-[#EBCDB8] p-4">
                    <p className="text-xs font-semibold text-[#7A6258]">Transaksi</p>
                    <p className="mt-1 text-lg font-black text-[#2A1712]">{item.today_transactions}</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm font-semibold text-[#7A6258] p-4">Belum ada data cabang.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#2A1712]">Alert Stok</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">Produk habis atau menipis.</p>
            </div>
            <PackageX className="h-5 w-5 text-orange-500" />
          </div>

          <div className="space-y-3">
            {[...empty_stock_products || [], ...low_stock_products || []].slice(0, 5).map((item) => (
              <div key={`stock-${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#2A1712]">{item.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#7A6258]">{item.branch_name || `Cabang ${item.branch_id}`}</p>
                </div>
                <Badge variant={(item.stock ?? 0) <= 0 ? "red" : "orange"}>{(item.stock ?? 0) <= 0 ? "Habis" : `${item.stock} stok`}</Badge>
              </div>
            ))}
            {empty_stock_products?.length === 0 && low_stock_products?.length === 0 && <p className="text-sm font-semibold text-[#7A6258] p-4 text-center">Semua stok aman.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#2A1712]">Hampir Expired</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">Produk yang perlu diprioritaskan.</p>
            </div>
            <PackageCheck className="h-5 w-5 text-red-500" />
          </div>

          <div className="space-y-3">
            {expiring_soon_products?.length > 0 ? expiring_soon_products.slice(0, 5).map((item) => (
              <div key={`exp-${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#2A1712]">{item.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#7A6258]">{item.branch_name || `Cabang ${item.branch_id}`}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold border ${(item.expired_date && daysUntilExpired(item.expired_date) <= 7) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                  {item.expired_date ? `${daysUntilExpired(item.expired_date) ?? '?'} hari` : '-'}
                </span>
              </div>
            )) : <p className="text-sm font-semibold text-[#7A6258] p-4 text-center">Tidak ada produk hampir expired.</p>}
          </div>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#2A1712]">Transaksi Terbaru</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">Lima transaksi terakhir.</p>
            </div>
            <ShoppingBag className="h-5 w-5 text-[#C80503]" />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#EBCDB8]">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#FFF6EA] text-xs font-black uppercase text-[#7A6258]">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3">Kasir</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBCDB8]">
                {recent_transactions.length > 0 ? recent_transactions.map((item) => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-4 py-3 font-black text-[#2A1712]">{item.invoice_number}</td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]"><Clock3 className="inline h-4 w-4 mr-1" />{formatDate(item.transaction_date)}</td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">{item.branch_name}</td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">{item.cashier_name}</td>
                    <td className="px-4 py-3 font-semibold text-[#7A6258]">{item.payment_method}</td>
                    <td className="px-4 py-3 text-right font-black text-[#2A1712]">{rupiah(item.grand_total)}</td>
                  </tr>
                )) : <tr><td colSpan={6} className="text-center p-4 text-sm font-semibold text-[#7A6258]">Belum ada transaksi.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default OwnerDashboard;
