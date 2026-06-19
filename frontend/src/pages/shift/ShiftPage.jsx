import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  WalletCards,
} from "lucide-react";

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

function getCurrentUser() {
  const savedUser = localStorage.getItem("nikky_user");

  if (!savedUser) {
    return {
      id: 1,
      name: "Kasir Nikky Frozen",
      username: "kasir",
      branch: "Cabang 1",
    };
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    return {
      id: 1,
      name: "Kasir Nikky Frozen",
      username: "kasir",
      branch: "Cabang 1",
    };
  }
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

function ShiftPage() {
  const currentUser = getCurrentUser();

  const [activeShift, setActiveShift] = useState(null);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [history, setHistory] = useState([]);

  const todaySummary = useMemo(() => {
    return {
      transaksi: activeShift ? 0 : 0,
      penjualan: activeShift ? 0 : 0,
      kasAwal: activeShift?.openingCash || 0,
    };
  }, [activeShift]);

  const handleStartShift = () => {
    const cash = Number(openingCash || 0);

    const newShift = {
      id: Date.now(),
      cashierName: currentUser?.name || currentUser?.username || "Kasir",
      branch: currentUser?.branch || currentUser?.branch_name || "Cabang 1",
      startedAt: new Date().toISOString(),
      openingCash: cash,
      status: "active",
    };

    setActiveShift(newShift);
    setOpeningCash("");
  };

  const handleEndShift = () => {
    if (!activeShift) return;

    const confirmClose = confirm("Tutup shift sekarang?");
    if (!confirmClose) return;

    const closedShift = {
      ...activeShift,
      endedAt: new Date().toISOString(),
      closingCash: Number(closingCash || 0),
      status: "closed",
    };

    setHistory((currentHistory) => [closedShift, ...currentHistory]);
    setActiveShift(null);
    setClosingCash("");
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                Status Shift Saat Ini
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Shift kasir aktif akan dipakai untuk mencatat transaksi.
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-[#0B7FC3]">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>

          {activeShift ? (
            <div className="rounded-[22px] border border-green-100 bg-green-50 p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    Shift sedang berjalan
                  </p>
                  <h3 className="mt-1 text-xl font-black text-gray-950">
                    {activeShift.cashierName}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-gray-600">
                    {activeShift.branch} • Mulai{" "}
                    {formatDateTime(activeShift.startedAt)}
                  </p>
                </div>

                <Badge variant="green">Aktif</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-gray-500">Kas Awal</p>
                  <p className="mt-1 text-lg font-black text-gray-950">
                    {formatRupiah(todaySummary.kasAwal)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-gray-500">Transaksi</p>
                  <p className="mt-1 text-lg font-black text-gray-950">
                    {todaySummary.transaksi}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-gray-500">Penjualan</p>
                  <p className="mt-1 text-lg font-black text-gray-950">
                    {formatRupiah(todaySummary.penjualan)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-orange-100 bg-orange-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600">
                  <LogIn className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-black text-gray-950">
                    Belum ada shift yang berjalan
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-600">
                    Mulai shift terlebih dahulu sebelum memproses transaksi
                    kasir.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-950">Aksi Shift</h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Buka atau tutup shift kerja kasir.
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-[#0B7FC3]">
              <WalletCards className="h-5 w-5" />
            </div>
          </div>

          {!activeShift ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-gray-700">
                  Kas Awal
                </label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(event) => setOpeningCash(event.target.value)}
                  placeholder="Masukkan kas awal"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <button
                type="button"
                onClick={handleStartShift}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B7FC3] px-4 py-3 text-sm font-black text-white transition hover:bg-[#086da8]"
              >
                <LogIn className="h-4 w-4" />
                Mulai Shift
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-gray-700">
                  Kas Akhir
                </label>
                <input
                  type="number"
                  value={closingCash}
                  onChange={(event) => setClosingCash(event.target.value)}
                  placeholder="Masukkan kas akhir"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                />
              </div>

              <button
                type="button"
                onClick={handleEndShift}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700"
              >
                <LogOut className="h-4 w-4" />
                Tutup Shift
              </button>
            </div>
          )}

          <p className="mt-4 text-xs font-medium leading-relaxed text-gray-400">
            Data shift saat ini masih diproses di tampilan. Penyimpanan ke
            backend akan disambungkan setelah alur POS stabil.
          </p>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                Riwayat Shift
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Shift yang sudah ditutup akan muncul di daftar ini.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-black uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Kasir</th>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3">Mulai</th>
                  <th className="px-4 py-3">Selesai</th>
                  <th className="px-4 py-3 text-right">Kas Awal</th>
                  <th className="px-4 py-3 text-right">Kas Akhir</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {history.map((item) => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-4 py-3 font-black text-gray-950">
                      {item.cashierName}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {item.branch}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {formatDateTime(item.startedAt)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {formatDateTime(item.endedAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-gray-950">
                      {formatRupiah(item.openingCash)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-gray-950">
                      {formatRupiah(item.closingCash)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray">Ditutup</Badge>
                    </td>
                  </tr>
                ))}

                {history.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-8 text-center font-semibold text-gray-500"
                    >
                      Belum ada riwayat shift.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ShiftPage;
