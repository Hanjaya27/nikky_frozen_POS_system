import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  FileText,
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
    items: [{ name: "Nugget Ayam", qty: 2 }],
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
    items: [{ name: "Sosis Sapi", qty: 1 }],
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
    items: [{ name: "Chicken Wings", qty: 3 }],
  },
  {
    id: 4,
    invoice: "TRX-004",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    branch: "Cabang 2",
    cashier: "Kasir 2",
    payment: "QRIS",
    status: "Lunas",
    total: 210000,
    items: [{ name: "Beef Slice", qty: 2 }],
  },
];

const expenses = [
  {
    id: 1,
    date: new Date().toISOString(),
    branch: "Cabang 1",
    category: "Operasional",
    description: "Belanja operasional toko",
    amount: 250000,
  },
  {
    id: 2,
    date: new Date(Date.now() - 86400000).toISOString(),
    branch: "Cabang 2",
    category: "Listrik",
    description: "Bayar listrik toko",
    amount: 850000,
  },
  {
    id: 3,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    branch: "Cabang 1",
    category: "Kemasan",
    description: "Plastik dan kantong belanja",
    amount: 120000,
  },
];

const periodOptions = [
  { id: "today", label: "Hari Ini" },
  { id: "week", label: "7 Hari" },
  { id: "month", label: "Bulan Ini" },
];

const branchOptions = [
  { id: "all", label: "Semua Cabang" },
  { id: "Cabang 1", label: "Cabang 1" },
  { id: "Cabang 2", label: "Cabang 2" },
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

function getRange(period) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  end.setHours(23, 59, 59, 999);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  }

  if (period === "week") {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  }

  if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

function inPeriod(dateString, period) {
  const date = new Date(dateString);
  const { start, end } = getRange(period);

  return date >= start && date <= end;
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-[22px] border border-gray-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatCard({ title, value, caption, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-[#0B7FC3]",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <h3 className="mt-2 text-2xl font-black text-gray-950">{value}</h3>
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

function LaporanPage() {
  const [period, setPeriod] = useState("month");
  const [branch, setBranch] = useState("all");
  const [activeTab, setActiveTab] = useState("ringkasan");

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((item) => inPeriod(item.date, period))
      .filter((item) => branch === "all" || item.branch === branch);
  }, [period, branch]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => inPeriod(item.date, period))
      .filter((item) => branch === "all" || item.branch === branch);
  }, [period, branch]);

  const totalRevenue = filteredTransactions.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const totalExpense = filteredExpenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const grossProfit = totalRevenue - totalExpense;

  const dailyChart = useMemo(() => {
    const { start, end } = getRange(period);
    const result = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      result.push({
        key: dateKey(cursor),
        label: cursor.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        pendapatan: 0,
        pengeluaran: 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    filteredTransactions.forEach((item) => {
      const point = result.find((row) => row.key === dateKey(new Date(item.date)));
      if (point) point.pendapatan += item.total;
    });

    filteredExpenses.forEach((item) => {
      const point = result.find((row) => row.key === dateKey(new Date(item.date)));
      if (point) point.pengeluaran += item.amount;
    });

    return result;
  }, [filteredTransactions, filteredExpenses, period]);

  const branchReport = useMemo(() => {
    return ["Cabang 1", "Cabang 2"].map((branchName) => {
      const revenue = filteredTransactions
        .filter((item) => item.branch === branchName)
        .reduce((sum, item) => sum + item.total, 0);

      const expense = filteredExpenses
        .filter((item) => item.branch === branchName)
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        branch: branchName,
        pendapatan: revenue,
        pengeluaran: expense,
        laba: revenue - expense,
      };
    });
  }, [filteredTransactions, filteredExpenses]);

  const topProducts = useMemo(() => {
    const map = {};

    filteredTransactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        if (!map[item.name]) {
          map[item.name] = {
            name: item.name,
            qty: 0,
          };
        }

        map[item.name].qty += item.qty;
      });
    });

    const result = Object.values(map).sort((a, b) => b.qty - a.qty);

    return result.length > 0 ? result : [{ name: "Belum ada data", qty: 0 }];
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
            Laporan
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Pantau pendapatan, pengeluaran, transaksi, dan performa cabang.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid grid-cols-3 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            {periodOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                className={`rounded-xl px-3 py-2 text-xs font-black transition sm:px-4 ${
                  period === item.id
                    ? "bg-[#0B7FC3] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <select
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm outline-none focus:border-[#0B7FC3]"
          >
            {branchOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Pendapatan"
          value={rupiah(totalRevenue)}
          caption="Dari transaksi lunas pada periode terpilih."
          icon={ArrowUpRight}
          tone="green"
        />

        <StatCard
          title="Total Pengeluaran"
          value={rupiah(totalExpense)}
          caption="Pengeluaran aktif yang tercatat."
          icon={ArrowDownRight}
          tone="red"
        />

        <StatCard
          title="Laba Kotor"
          value={rupiah(grossProfit)}
          caption="Pendapatan dikurangi pengeluaran."
          icon={TrendingUp}
          tone={grossProfit >= 0 ? "blue" : "red"}
        />

        <StatCard
          title="Total Transaksi"
          value={filteredTransactions.length}
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
                  ? "bg-[#0B7FC3] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
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
                <h2 className="text-lg font-black text-gray-950">
                  Pendapatan vs Pengeluaran
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Ringkasan harian berdasarkan periode dan cabang terpilih.
                </p>
              </div>

              <BarChart3 className="h-5 w-5 text-[#0B7FC3]" />
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  <Bar dataKey="pendapatan" fill="#0B7FC3" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pengeluaran" fill="#EF4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-black text-gray-950">
              Produk Terlaris
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Produk dengan jumlah terjual terbanyak.
            </p>

            <div className="mt-5 space-y-3">
              {topProducts.slice(0, 5).map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-black text-gray-950">{item.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-gray-500">
                      Peringkat #{index + 1}
                    </p>
                  </div>

                  <Badge variant="blue">{item.qty} item</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-950">
                  Perbandingan Cabang
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Grafik pendapatan, pengeluaran, dan laba antar cabang.
                </p>
              </div>

              <PackageCheck className="h-5 w-5 text-[#0B7FC3]" />
            </div>

            <div className="mb-5 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchReport} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="branch"
                    tick={{ fontSize: 12, fill: "#6B7280", fontWeight: 700 }}
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
                  <Bar dataKey="pendapatan" fill="#0B7FC3" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pengeluaran" fill="#EF4444" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="laba" fill="#22C55E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {branchReport.map((item) => (
                <div
                  key={item.branch}
                  className="rounded-[20px] border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-black text-gray-950">
                      {item.branch}
                    </h3>

                    <Badge variant={item.laba >= 0 ? "green" : "red"}>
                      {item.laba >= 0 ? "Untung" : "Minus"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-500">
                        Pendapatan
                      </span>
                      <span className="text-sm font-black text-gray-950">
                        {rupiah(item.pendapatan)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-500">
                        Pengeluaran
                      </span>
                      <span className="text-sm font-black text-red-600">
                        {rupiah(item.pengeluaran)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between gap-3">
                        <span className="text-sm font-semibold text-gray-500">
                          Laba Kotor
                        </span>
                        <span
                          className={`text-sm font-black ${
                            item.laba >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {rupiah(item.laba)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "transaksi" && (
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">Transaksi</h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Daftar transaksi lunas pada periode terpilih.
              </p>
            </div>

            <FileText className="h-5 w-5 text-[#0B7FC3]" />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-black uppercase text-gray-500">
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

              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((item) => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-4 py-3 font-black text-gray-950">
                      {item.invoice}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {formatTime(item.date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {item.branch}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {item.cashier}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {item.payment}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="green">{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-gray-950">
                      {rupiah(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "pengeluaran" && (
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">Pengeluaran</h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Biaya operasional yang tercatat pada periode terpilih.
              </p>
            </div>

            <WalletCards className="h-5 w-5 text-red-500" />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-black uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((item) => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="orange">{item.category}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {item.branch}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-red-600">
                      {rupiah(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default LaporanPage;