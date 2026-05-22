import { useMemo, useState } from "react";

const reportData = [
  {
    id: 1,
    date: "2026-05-17",
    transactions: 24,
    income: 1850000,
    expense: 420000,
    cash: 850000,
    ewallet: 650000,
    transfer: 350000,
  },
  {
    id: 2,
    date: "2026-05-18",
    transactions: 31,
    income: 2420000,
    expense: 530000,
    cash: 1050000,
    ewallet: 870000,
    transfer: 500000,
  },
  {
    id: 3,
    date: "2026-05-19",
    transactions: 28,
    income: 2180000,
    expense: 475000,
    cash: 980000,
    ewallet: 700000,
    transfer: 500000,
  },
  {
    id: 4,
    date: "2026-05-20",
    transactions: 35,
    income: 2750000,
    expense: 690000,
    cash: 1250000,
    ewallet: 900000,
    transfer: 600000,
  },
  {
    id: 5,
    date: "2026-05-21",
    transactions: 40,
    income: 3150000,
    expense: 730000,
    cash: 1430000,
    ewallet: 1020000,
    transfer: 700000,
  },
];

const periods = ["Harian", "Mingguan", "Bulanan"];
const branches = ["Semua Cabang", "Cabang Utama", "Cabang 2"];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

function LaporanPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("Mingguan");
  const [selectedBranch, setSelectedBranch] = useState("Semua Cabang");
  const [selectedDate, setSelectedDate] = useState("");

  const filteredReports = useMemo(() => {
    if (!selectedDate) {
      return reportData;
    }

    return reportData.filter((report) => report.date === selectedDate);
  }, [selectedDate]);

  const totalTransactions = filteredReports.reduce(
    (total, report) => total + report.transactions,
    0
  );

  const totalIncome = filteredReports.reduce(
    (total, report) => total + report.income,
    0
  );

  const totalExpense = filteredReports.reduce(
    (total, report) => total + report.expense,
    0
  );

  const grossProfit = totalIncome - totalExpense;

  const totalCash = filteredReports.reduce(
    (total, report) => total + report.cash,
    0
  );

  const totalEwallet = filteredReports.reduce(
    (total, report) => total + report.ewallet,
    0
  );

  const totalTransfer = filteredReports.reduce(
    (total, report) => total + report.transfer,
    0
  );

  const maxIncome = Math.max(...reportData.map((report) => report.income));
  const maxComparison = Math.max(
    ...reportData.map((report) => Math.max(report.income, report.expense))
  );

  const paymentMethods = [
    {
      name: "Tunai",
      value: totalCash,
      percentage: totalIncome ? Math.round((totalCash / totalIncome) * 100) : 0,
    },
    {
      name: "E-Wallet",
      value: totalEwallet,
      percentage: totalIncome
        ? Math.round((totalEwallet / totalIncome) * 100)
        : 0,
    },
    {
      name: "Transfer",
      value: totalTransfer,
      percentage: totalIncome
        ? Math.round((totalTransfer / totalIncome) * 100)
        : 0,
    },
  ];

  const handleExport = () => {
    alert("Laporan berhasil diexport.");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Laporan</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pantau transaksi, pendapatan, pengeluaran, dan laba toko.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Export Laporan
        </button>
      </div>

      <div className="mb-6 grid gap-3 rounded-2xl bg-white p-5 shadow-sm lg:grid-cols-3">
        <select
          value={selectedPeriod}
          onChange={(event) => setSelectedPeriod(event.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
        >
          {periods.map((period) => (
            <option key={period} value={period}>
              Periode {period}
            </option>
          ))}
        </select>

        <select
          value={selectedBranch}
          onChange={(event) => setSelectedBranch(event.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
        >
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Transaksi</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {totalTransactions}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Periode {selectedPeriod.toLowerCase()}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Pendapatan</p>
          <h3 className="mt-2 text-2xl font-bold text-blue-600">
            {formatRupiah(totalIncome)}
          </h3>
          <p className="mt-2 text-xs text-slate-400">{selectedBranch}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Pengeluaran</p>
          <h3 className="mt-2 text-2xl font-bold text-red-600">
            {formatRupiah(totalExpense)}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Operasional dan kebutuhan toko
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Laba Kotor</p>
          <h3 className="mt-2 text-2xl font-bold text-green-600">
            {formatRupiah(grossProfit)}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Pendapatan dikurangi pengeluaran
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-800">
              Grafik Pendapatan Harian
            </h3>
            <p className="text-sm text-slate-500">
              Ringkasan pendapatan berdasarkan tanggal.
            </p>
          </div>

          <div className="flex h-72 items-end gap-4 rounded-2xl bg-slate-50 p-5">
            {reportData.map((report) => {
              const height = Math.max((report.income / maxIncome) * 100, 8);

              return (
                <div
                  key={report.id}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                >
                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className="w-full max-w-14 rounded-t-2xl bg-blue-600 transition-all hover:bg-blue-700"
                      style={{ height: `${height}%` }}
                      title={formatRupiah(report.income)}
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-700">
                      {formatShortDate(report.date)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {report.transactions} trx
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-800">
              Metode Pembayaran
            </h3>
            <p className="text-sm text-slate-500">
              Persentase pembayaran pelanggan.
            </p>
          </div>

          <div className="space-y-5">
            {paymentMethods.map((method) => (
              <div key={method.name}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    {method.name}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {method.percentage}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${method.percentage}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {formatRupiah(method.value)}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            Perbandingan Pendapatan dan Pengeluaran
          </h3>
          <p className="text-sm text-slate-500">
            Membantu owner melihat kondisi keuangan toko secara cepat.
          </p>
        </div>

        <div className="space-y-5">
          {reportData.map((report) => {
            const incomeWidth = (report.income / maxComparison) * 100;
            const expenseWidth = (report.expense / maxComparison) * 100;

            return (
              <div key={report.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-slate-800">
                    {formatShortDate(report.date)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {report.transactions} transaksi
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Pendapatan</span>
                      <span>{formatRupiah(report.income)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${incomeWidth}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Pengeluaran</span>
                      <span>{formatRupiah(report.expense)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${expenseWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            Tabel Laporan Harian
          </h3>
          <p className="text-sm text-slate-500">
            Data laporan yang dapat digunakan untuk rekap dan tutup buku.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                <th className="px-4 py-4 font-semibold">Tanggal</th>
                <th className="px-4 py-4 font-semibold">Transaksi</th>
                <th className="px-4 py-4 font-semibold">Tunai</th>
                <th className="px-4 py-4 font-semibold">E-Wallet</th>
                <th className="px-4 py-4 font-semibold">Transfer</th>
                <th className="px-4 py-4 font-semibold">Pendapatan</th>
                <th className="px-4 py-4 font-semibold">Pengeluaran</th>
                <th className="px-4 py-4 font-semibold">Laba</th>
              </tr>
            </thead>

            <tbody>
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-slate-100 text-sm hover:bg-slate-50"
                >
                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {report.date}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {report.transactions}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatRupiah(report.cash)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatRupiah(report.ewallet)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatRupiah(report.transfer)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-blue-600">
                    {formatRupiah(report.income)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-red-600">
                    {formatRupiah(report.expense)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-green-600">
                    {formatRupiah(report.income - report.expense)}
                  </td>
                </tr>
              ))}

              {filteredReports.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Data laporan tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LaporanPage;