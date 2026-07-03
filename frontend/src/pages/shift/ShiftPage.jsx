import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  WalletCards,
  Receipt,
  TrendingUp,
  Loader2,
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

function getCurrentUser() {
  const savedUser = localStorage.getItem("nikky_user");
  if (!savedUser) return null;
  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm ${className}`}
    >
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
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${variants[variant]}`}
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      // Cek shift berjalan
      const shiftRes = await api.getCurrentShift(currentUser.username);
      setActiveShift(shiftRes || null);
      
      // Ambil riwayat shift yang sudah selesai
      const historyRes = await api.getShifts({ 
        username: currentUser.username, 
        status: "Selesai" 
      });
      setHistory(Array.isArray(historyRes) ? historyRes : (historyRes?.data || []));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.username]);

  const todaySummary = useMemo(() => {
    return {
      transaksi: activeShift?.total_transactions || 0,
      penjualan: activeShift?.total_sales || 0,
      kasAwal: activeShift?.opening_cash || 0,
    };
  }, [activeShift]);

  const handleStartShift = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        branch_id: currentUser.branch_id,
        cashier_name: currentUser.name || currentUser.username,
        username: currentUser.username,
        shift_name: currentUser.shift || "Shift Pagi",
        opening_cash: Number(openingCash || 0),
        note: ""
      };
      await api.openShift(payload);
      setOpeningCash("");
      await fetchData(); // Reload data after open
    } catch (error) {
      alert("Gagal membuka shift: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;

    const confirmClose = window.confirm("Tutup shift sekarang?");
    if (!confirmClose) return;

    try {
      setIsSubmitting(true);
      await api.closeShift(activeShift.id, {
        closing_cash: Number(closingCash || 0),
        note: ""
      });
      setClosingCash("");
      await fetchData(); // Reload data after close
    } catch (error) {
      alert("Gagal menutup shift: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return <div className="p-8">Memuat data user...</div>;

  return (
    <div className="min-h-[calc(100vh-100px)]">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-[#EBCDB8] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#2A1712]">Status Shift Saat Ini</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">
                Lacak aktivitas selama shift ini berlangsung.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C80503]/10 text-[#C80503]">
              <Clock3 className="h-6 w-6" />
            </div>
          </div>

          {isLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#C80503]" />
              <p className="mt-2 text-sm font-bold text-[#7A6258]">Memuat data shift...</p>
            </div>
          ) : activeShift ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-green-700 uppercase tracking-wide">
                    Shift Aktif ({activeShift.shift_name})
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-[#2A1712]">
                    {activeShift.cashier_name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[#7A6258]">
                    {activeShift.branch?.name || currentUser.branch} • Dimulai pada {formatDateTime(activeShift.opened_at)}
                  </p>
                </div>
                <Badge variant="green">Sedang Berjalan</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-green-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-bold text-[#7A6258] uppercase">Kas Awal</p>
                  </div>
                  <p className="text-xl font-black text-[#2A1712]">
                    {formatRupiah(todaySummary.kasAwal)}
                  </p>
                </div>

                <div className="rounded-xl border border-green-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-bold text-[#7A6258] uppercase">Transaksi</p>
                  </div>
                  <p className="text-xl font-black text-[#2A1712]">
                    {todaySummary.transaksi}
                  </p>
                </div>

                <div className="rounded-xl border border-green-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-bold text-[#7A6258] uppercase">Pemasukan</p>
                  </div>
                  <p className="text-xl font-black text-[#2A1712]">
                    {formatRupiah(todaySummary.penjualan)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-orange-600 shadow-sm border border-orange-100">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black text-[#2A1712]">Belum ada shift berjalan</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-[#7A6258]">
                  Anda belum membuka shift. Silakan buka shift dengan memasukkan kas awal di panel aksi sebelah kanan sebelum melayani pelanggan.
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-[#EBCDB8] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#2A1712]">Aksi Shift</h2>
              <p className="mt-1 text-sm font-medium text-[#7A6258]">
                Buka / Tutup shift kerja Anda.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF6EA] text-[#C80503] border border-[#EBCDB8]">
              <WalletCards className="h-6 w-6" />
            </div>
          </div>

          {!activeShift ? (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#2A1712]">
                  Masukkan Kas Awal (Modal)
                </label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(event) => setOpeningCash(event.target.value)}
                  placeholder="Rp 0"
                  disabled={isLoading || isSubmitting}
                  className="w-full rounded-xl border border-[#EBCDB8] bg-white px-4 py-3.5 text-base font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="button"
                onClick={handleStartShift}
                disabled={!openingCash || isLoading || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C80503] px-4 py-4 text-sm font-bold text-white transition hover:bg-[#8B0306] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                {isSubmitting ? "Memproses..." : "Buka Shift Sekarang"}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#2A1712]">
                  Masukkan Kas Akhir (Total di Laci)
                </label>
                <input
                  type="number"
                  value={closingCash}
                  onChange={(event) => setClosingCash(event.target.value)}
                  placeholder="Rp 0"
                  disabled={isLoading || isSubmitting}
                  className="w-full rounded-xl border border-[#EBCDB8] bg-white px-4 py-3.5 text-base font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="button"
                onClick={handleEndShift}
                disabled={!closingCash || isLoading || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2A1712] px-4 py-4 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                {isSubmitting ? "Menutup..." : "Tutup Shift"}
              </button>
            </div>
          )}

          <div className="mt-6 rounded-xl bg-[#FFF6EA] p-4 border border-[#EBCDB8]">
            <p className="text-xs font-semibold leading-relaxed text-[#7A6258] flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#C80503] mt-0.5" />
              <span>Pastikan jumlah uang fisik di laci kasir sesuai dengan kas akhir sebelum menutup shift.</span>
            </p>
          </div>
        </Card>

        <Card className="p-0 xl:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-[#EBCDB8]">
            <h2 className="text-lg font-bold text-[#2A1712]">Riwayat Shift Sebelumnya</h2>
            <p className="mt-1 text-sm font-medium text-[#7A6258]">
              Daftar histori shift Anda yang telah ditutup.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[#FFF6EA] text-xs font-bold uppercase text-[#7A6258]">
                <tr>
                  <th className="px-6 py-4 font-bold border-b border-[#EBCDB8]">Kasir</th>
                  <th className="px-6 py-4 font-bold border-b border-[#EBCDB8]">Cabang</th>
                  <th className="px-6 py-4 font-bold border-b border-[#EBCDB8]">Waktu Mulai</th>
                  <th className="px-6 py-4 font-bold border-b border-[#EBCDB8]">Waktu Selesai</th>
                  <th className="px-6 py-4 font-bold border-b border-[#EBCDB8] text-right">Kas Awal</th>
                  <th className="px-6 py-4 font-bold border-b border-[#EBCDB8] text-right">Kas Akhir</th>
                  <th className="px-6 py-4 font-bold border-b border-[#EBCDB8] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBCDB8]">
                {history.map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-[#FFFDF8] transition-colors">
                    <td className="px-6 py-4 font-black text-[#2A1712]">{item.cashier_name}</td>
                    <td className="px-6 py-4 font-semibold text-[#7A6258]">{item.branch?.name || "-"}</td>
                    <td className="px-6 py-4 font-semibold text-[#7A6258]">{formatDateTime(item.opened_at)}</td>
                    <td className="px-6 py-4 font-semibold text-[#7A6258]">{formatDateTime(item.closed_at)}</td>
                    <td className="px-6 py-4 text-right font-black text-[#2A1712]">{formatRupiah(item.opening_cash)}</td>
                    <td className="px-6 py-4 text-right font-black text-[#2A1712]">{formatRupiah(item.closing_cash)}</td>
                    <td className="px-6 py-4 text-center"><Badge variant="gray">Selesai</Badge></td>
                  </tr>
                ))}
                {!isLoading && history.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[#7A6258]">
                      <LogOut className="mx-auto h-8 w-8 text-[#EBCDB8] mb-3" />
                      <p className="font-bold">Belum ada riwayat shift.</p>
                      <p className="text-xs mt-1">Shift yang Anda tutup akan muncul di sini.</p>
                    </td>
                  </tr>
                )}
                {isLoading && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[#7A6258]">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#C80503] mb-3" />
                      <p className="font-bold">Memuat riwayat...</p>
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
