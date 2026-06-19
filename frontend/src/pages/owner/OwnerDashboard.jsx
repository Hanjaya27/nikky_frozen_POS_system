import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
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

const transactions = [
  {
    id: 1,
    invoice: "TRX-001",
    date: new Date().toISOString(),
    branch: "Cabang 1",
    cashier: "Kasir 1",
    payment: "Tunai",
    status: "Lunas",
    total: 120000,
  },
  {
    id: 2,
    invoice: "TRX-002",
    date: new Date().toISOString(),
    branch: "Cabang 2",
    cashier: "Kasir 2",
    payment: "QRIS",
    status: "Lunas",
    total: 85000,
  },
  {
    id: 3,
    invoice: "TRX-003",
    date: new Date(Date.now() - 86400000).toISOString(),
    branch: "Cabang 1",
    cashier: "Kasir 1",
    payment: "Transfer",
    status: "Lunas",
    total: 450000,
  },
  {
    id: 4,
    invoice: "TRX-004",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    branch: "Cabang 2",
    cashier: "Kasir 2",
    payment: "QRIS",
    status: "Lunas",
    total: 295000,
  },
  {
    id: 5,
    invoice: "TRX-005",
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    branch: "Cabang 1",
    cashier: "Kasir 1",
    payment: "Tunai",
    status: "Lunas",
    total: 275000,
  },
];

const products = [
  {
    id: 1,
    name: "Nugget Ayam",
    branch: "Cabang 1",
    stock: 8,
    minStock: 10,
    expiredDate: new Date(Date.now() + 20 * 86400000).toISOString(),
  },
  {
    id: 2,
    name: "Sosis Sapi",
    branch: "Cabang 2",
    stock: 4,
    minStock: 10,
    expiredDate: new Date(Date.now() + 8 * 86400000).toISOString(),
  },
  {
    id: 3,
    name: "Chicken Wings",
    branch: "Cabang 1",
    stock: 24,
    minStock: 10,
    expiredDate: new Date(Date.now() + 45 * 86400000).toISOString(),
  },
  {
    id: 4,
    name: "Beef Slice",
    branch: "Cabang 2",
    stock: 0,
    minStock: 8,
    expiredDate: new Date(Date.now() + 6 * 86400000).toISOString(),
  },
  {
    id: 5,
    name: "Dimsum Ayam",
    branch: "Cabang 1",
    stock: 16,
    minStock: 10,
    expiredDate: new Date(Date.now() + 12 * 86400000).toISOString(),
  },
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
  if (number >= 1000000) return `Rp ${(number / 1000000).toFixed(1).replace(".", ",")}jt`;
  if (number >= 1000) return `Rp ${Math.round(number / 1000)}rb`;
  return `Rp ${number}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysUntilExpired(dateString) {
  const today = new Date();
  const expired = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  expired.setHours(0, 0, 0, 0);

  return Math.ceil((expired.getTime() - today.getTime()) / 86400000);
}

function buildSalesChart() {
  const result = [];
  const today = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);

    result.push({
      key: dateKey(date),
      label: date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      penjualan: 0,
      transaksi: 0,
    });
  }

  transactions.forEach((transaction) => {
    const point = result.find((item) => item.key === dateKey(new Date(transaction.date)));

    if (point) {
      point.penjualan += transaction.total;
      point.transaksi += 1;
    }
  });

  return result;
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-[22px] border border-gray-200 bg-white shadow-sm ${className}`}>
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${variants[variant]}`}>
      {children}
    </span>
  );
}

function StatCard({ title, value, caption, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-[#0B7FC3]",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <h3 className="mt-2 truncate text-2xl font-black text-gray-950">{value}</h3>
          <p className="mt-3 text-xs font-medium leading-relaxed text-gray-500">
            {caption}
          </p>
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function OwnerDashboard() {
  const [isLoading, setIsLoading] = useState(false);

  const todayTransactions = useMemo(() => {
    return transactions.filter((item) => isToday(item.date));
  }, []);

  const todayRevenue = todayTransactions.reduce((sum, item) => sum + item.total, 0);

  const lowStockProducts = useMemo(() => {
    return products
      .filter((item) => item.stock > 0 && item.stock <= item.minStock)
      .sort((a, b) => a.stock - b.stock);
  }, []);

  const emptyStockProducts = useMemo(() => {
    return products.filter((item) => item.stock <= 0);
  }, []);

  const expiringProducts = useMemo(() => {
    return products
      .map((item) => ({
        ...item,
        daysLeft: daysUntilExpired(item.expiredDate),
      }))
      .filter((item) => item.daysLeft >= 0 && item.daysLeft <= 14)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, []);

  const salesChart = useMemo(() => buildSalesChart(), []);

  const branchPerformance = useMemo(() => {
    return ["Cabang 1", "Cabang 2"].map((branch) => {
      const branchTransactions = todayTransactions.filter((item) => item.branch === branch);
      const revenue = branchTransactions.reduce((sum, item) => sum + item.total, 0);

      return {
        branch,
        revenue,
        transactions: branchTransactions.length,
        status: revenue >= 150000 ? "Stabil" : "Perlu dicek",
      };
    });
  }, [todayTransactions]);

  const priorities = useMemo(() => {
    const result = [];

    if (emptyStockProducts.length > 0) {
      result.push({
        title: `${emptyStockProducts.length} produk stok habis`,
        description: "Segera cek ketersediaan barang di cabang terkait.",
        tone: "red",
      });
    }

    if (lowStockProducts.length > 0) {
      result.push({
        title: `${lowStockProducts.length} produk stok menipis`,
        description: "Prioritaskan restock sebelum penjualan terganggu.",
        tone: "orange",
      });
    }

    if (expiringProducts.length > 0) {
      result.push({
        title: `${expiringProducts.length} produk hampir expired`,
        description: "Evaluasi promo atau prioritas penjualan produk tersebut.",
        tone: "red",
      });
    }

    const branchNeedCheck = branchPerformance.find((item) => item.status === "Perlu dicek");

    if (branchNeedCheck) {
      result.push({
        title: `${branchNeedCheck.branch} perlu dicek`,
        description: "Pendapatan hari ini masih rendah dibanding target awal.",
        tone: "blue",
      });
    }

    if (result.length === 0) {
      result.push({
        title: "Operasional toko aman",
        description: "Belum ada prioritas mendesak untuk hari ini.",
        tone: "green",
      });
    }

    return result.slice(0, 4);
  }, [emptyStockProducts, lowStockProducts, expiringProducts, branchPerformance]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B7FC3]">
            Owner Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
            Ringkasan Operasional Hari Ini
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Pantau penjualan, transaksi, stok menipis, dan produk hampir expired.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Penjualan Hari Ini"
          value={rupiah(todayRevenue)}
          caption="Total transaksi lunas pada hari ini."
          icon={ArrowUpRight}
          tone="green"
        />

        <StatCard
          title="Transaksi Hari Ini"
          value={todayTransactions.length}
          caption="Jumlah transaksi yang berhasil diproses."
          icon={ReceiptText}
          tone="blue"
        />

        <StatCard
          title="Stok Menipis"
          value={lowStockProducts.length + emptyStockProducts.length}
          caption="Produk yang perlu restock atau sudah habis."
          icon={Boxes}
          tone="orange"
        />

        <StatCard
          title="Hampir Expired"
          value={expiringProducts.length}
          caption="Produk dengan masa expired maksimal 14 hari."
          icon={CalendarClock}
          tone="red"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                Tren Penjualan 7 Hari
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Grafik untuk melihat penjualan naik, turun, atau stabil.
              </p>
            </div>

            <TrendingUp className="h-5 w-5 text-[#0B7FC3]" />
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B7FC3" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0B7FC3" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#6B7280", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={shortRupiah}
                  tick={{ fontSize: 12, fill: "#6B7280", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => rupiah(value)} />
                <Area
                  type="monotone"
                  dataKey="penjualan"
                  stroke="#0B7FC3"
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                Prioritas Hari Ini
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Hal yang perlu dilihat owner terlebih dahulu.
              </p>
            </div>

            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>

          <div className="space-y-3">
            {priorities.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      item.tone === "red"
                        ? "bg-red-50 text-red-600"
                        : item.tone === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : item.tone === "green"
                        ? "bg-green-50 text-green-600"
                        : "bg-sky-50 text-[#0B7FC3]"
                    }`}
                  >
                    {item.tone === "green" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-950">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                Performa Cabang Hari Ini
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Ringkasan singkat agar owner tahu cabang mana yang perlu dicek.
              </p>
            </div>

            <Building2 className="h-5 w-5 text-[#0B7FC3]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {branchPerformance.map((item) => (
              <div key={item.branch} className="rounded-[20px] border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-black text-gray-950">{item.branch}</h3>
                  <Badge variant={item.status === "Stabil" ? "green" : "orange"}>
                    {item.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold text-gray-500">Penjualan</p>
                    <p className="mt-1 text-lg font-black text-gray-950">{rupiah(item.revenue)}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold text-gray-500">Transaksi</p>
                    <p className="mt-1 text-lg font-black text-gray-950">{item.transactions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">Alert Stok</h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Produk yang habis atau mendekati minimum stok.
              </p>
            </div>

            <PackageX className="h-5 w-5 text-orange-500" />
          </div>

          <div className="space-y-3">
            {[...emptyStockProducts, ...lowStockProducts].slice(0, 5).map((item) => (
              <div key={`stock-${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-gray-950">{item.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-gray-500">
                    {item.branch} - Minimal {item.minStock}
                  </p>
                </div>

                <Badge variant={item.stock <= 0 ? "red" : "orange"}>
                  {item.stock <= 0 ? "Habis" : `${item.stock} stok`}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">Hampir Expired</h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Produk yang perlu diprioritaskan sebelum kedaluwarsa.
              </p>
            </div>

            <PackageCheck className="h-5 w-5 text-red-500" />
          </div>

          <div className="space-y-3">
            {expiringProducts.slice(0, 5).map((item) => (
              <div key={`expired-${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-gray-950">{item.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-gray-500">
                    {item.branch} - Exp {formatDate(item.expiredDate)}
                  </p>
                </div>

                <Badge variant={item.daysLeft <= 7 ? "red" : "orange"}>
                  {item.daysLeft} hari
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">Transaksi Terbaru</h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Lima transaksi terakhir yang berhasil diproses.
              </p>
            </div>

            <ShoppingBag className="h-5 w-5 text-[#0B7FC3]" />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-black uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3">Kasir</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((item) => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-4 py-3 font-black text-gray-950">{item.invoice}</td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-gray-400" />
                        {formatDate(item.date)} - {formatTime(item.date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">{item.branch}</td>
                    <td className="px-4 py-3 font-semibold text-gray-600">{item.cashier}</td>
                    <td className="px-4 py-3 font-semibold text-gray-600">{item.payment}</td>
                    <td className="px-4 py-3 text-right font-black text-gray-950">
                      {rupiah(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default OwnerDashboard;
