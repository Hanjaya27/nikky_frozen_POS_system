function Topbar() {
  const today = new Date();

  const formattedDate = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedTime = today.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="mb-6 flex flex-col gap-4 rounded-3xl bg-white px-6 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Nikky Frozen POS System
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Sistem kasir, stok, transaksi, laporan, dan pengeluaran toko.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl bg-slate-100 px-4 py-2 text-right">
          <p className="text-xs text-slate-500">{formattedDate}</p>
          <p className="text-sm font-bold text-slate-800">{formattedTime}</p>
        </div>

        <button className="relative rounded-2xl bg-slate-100 px-4 py-3 text-lg hover:bg-slate-200">
          🔔
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            AB
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">Ahmad Baihaqi</p>
            <p className="text-xs text-slate-500">Kasir</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;