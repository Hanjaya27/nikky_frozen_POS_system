import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import {
  closeShift,
  getCurrentShift,
  getShifts,
  openShift,
} from "../../services/api";

const branches = ["Semua", "Cabang 1", "Cabang 2"];
const statuses = ["Semua", "Berjalan", "Selesai"];

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

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function getSavedData(key, fallbackData) {
  const savedData = localStorage.getItem(key);

  if (!savedData) {
    return fallbackData;
  }

  try {
    return JSON.parse(savedData);
  } catch (error) {
    localStorage.removeItem(key);
    return fallbackData;
  }
}

function getBranchIdByName(branchName) {
  if (branchName === "Cabang 1") return 1;
  if (branchName === "Cabang 2") return 2;

  return null;
}

function getBranchNameById(branchId) {
  if (Number(branchId) === 1) return "Cabang 1";
  if (Number(branchId) === 2) return "Cabang 2";

  return "-";
}

function normalizeShift(shift) {
  return {
    id: shift.id,
    branch_id: shift.branch_id,
    branch: shift.branch?.name || getBranchNameById(shift.branch_id),

    cashierName: shift.cashier_name,
    username: shift.username,
    shiftName: shift.shift_name,

    openTime: shift.opened_at,
    closeTime: shift.closed_at,

    openingCash: Number(shift.opening_cash || 0),
    closingCash:
      shift.closing_cash === null || shift.closing_cash === undefined
        ? null
        : Number(shift.closing_cash || 0),

    totalSales: Number(shift.total_sales || 0),
    totalTransactions: Number(shift.total_transactions || 0),
    expectedCash: Number(shift.expected_cash || 0),
    cashDifference: Number(shift.cash_difference || 0),

    note: shift.note || "-",
    status: shift.status || "Berjalan",
    createdAt: shift.created_at,
    updatedAt: shift.updated_at,
  };
}

function ShiftPage() {
  const [currentUser, setCurrentUser] = useState(null);

  const [shifts, setShifts] = useState([]);
  const [currentKasirShift, setCurrentKasirShift] = useState(null);

  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [openNote, setOpenNote] = useState("");
  const [closeNote, setCloseNote] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedUser = getSavedData("nikky_user", null);

    if (savedUser) {
      setCurrentUser(savedUser);

      if (savedUser.role === "kasir") {
        setSelectedBranch(savedUser.branch || "Cabang 1");
      }
    }
  }, []);

  const isOwner = currentUser?.role === "owner";
  const isKasir = currentUser?.role === "kasir";

  const fetchCurrentShift = async (username) => {
    if (!username) return;

    try {
      const shiftData = await getCurrentShift(username);

      if (shiftData) {
        setCurrentKasirShift(normalizeShift(shiftData));
      } else {
        setCurrentKasirShift(null);
      }
    } catch (error) {
      setCurrentKasirShift(null);
    }
  };

  const fetchShifts = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setErrorMessage("");

      const params = {};

      if (isKasir) {
        params.username = currentUser.username;
      }

      if (isOwner && selectedBranch !== "Semua") {
        params.branch_id = getBranchIdByName(selectedBranch);
      }

      if (selectedStatus !== "Semua") {
        params.status = selectedStatus;
      }

      if (selectedDate) {
        params.date = selectedDate;
      }

      const shiftData = await getShifts(params);
      const normalizedShifts = shiftData.map(normalizeShift);

      setShifts(normalizedShifts);

      if (isKasir) {
        await fetchCurrentShift(currentUser.username);
      }
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data shift dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    fetchShifts();
  }, [currentUser, selectedBranch, selectedStatus, selectedDate]);

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  const myShiftHistory = useMemo(() => {
    if (!currentUser) return [];

    return shifts.filter((shift) => shift.username === currentUser.username);
  }, [shifts, currentUser]);

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const keyword = searchKeyword.toLowerCase();

      const matchSearch =
        shift.cashierName?.toLowerCase().includes(keyword) ||
        shift.username?.toLowerCase().includes(keyword) ||
        shift.branch?.toLowerCase().includes(keyword) ||
        shift.shiftName?.toLowerCase().includes(keyword);

      return matchSearch;
    });
  }, [shifts, searchKeyword]);

  const summary = useMemo(() => {
    const runningShift = shifts.filter(
      (shift) => shift.status === "Berjalan"
    ).length;

    const closedShift = shifts.filter(
      (shift) => shift.status === "Selesai"
    ).length;

    const branchOne = shifts.filter((shift) => shift.branch === "Cabang 1")
      .length;

    const branchTwo = shifts.filter((shift) => shift.branch === "Cabang 2")
      .length;

    const totalOpeningCash = shifts.reduce(
      (total, shift) => total + Number(shift.openingCash || 0),
      0
    );

    const totalClosingCash = shifts.reduce(
      (total, shift) => total + Number(shift.closingCash || 0),
      0
    );

    const totalSales = shifts.reduce(
      (total, shift) => total + Number(shift.totalSales || 0),
      0
    );

    const totalTransactions = shifts.reduce(
      (total, shift) => total + Number(shift.totalTransactions || 0),
      0
    );

    const totalDifference = shifts.reduce(
      (total, shift) => total + Number(shift.cashDifference || 0),
      0
    );

    return {
      totalShift: shifts.length,
      runningShift,
      closedShift,
      branchOne,
      branchTwo,
      totalOpeningCash,
      totalClosingCash,
      totalSales,
      totalTransactions,
      totalDifference,
    };
  }, [shifts]);

  const handleOpenShift = async () => {
    if (!currentUser) {
      alert("Data login tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (currentKasirShift) {
      alert("Shift kamu masih berjalan. Tutup shift terlebih dahulu.");
      return;
    }

    if (!openingCash || Number(openingCash) < 0) {
      alert("Masukkan kas awal dengan benar.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const payload = {
        branch_id: getBranchIdByName(currentUser.branch),
        cashier_name: currentUser.name,
        username: currentUser.username,
        shift_name: currentUser.shift || "Shift Pagi",
        opening_cash: Number(openingCash),
        note: openNote || null,
      };

      await openShift(payload);

      setOpeningCash("");
      setOpenNote("");

      await fetchShifts();
      await fetchCurrentShift(currentUser.username);

      showSuccess("Shift berhasil dibuka dan tersimpan ke backend.");
    } catch (error) {
      alert(error.message || "Gagal membuka shift.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (!currentKasirShift) {
      alert("Tidak ada shift yang sedang berjalan.");
      return;
    }

    if (!closingCash || Number(closingCash) < 0) {
      alert("Masukkan kas akhir dengan benar.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await closeShift(currentKasirShift.id, {
        closing_cash: Number(closingCash),
        note: closeNote || null,
      });

      setClosingCash("");
      setCloseNote("");

      await fetchShifts();
      await fetchCurrentShift(currentUser.username);

      showSuccess("Shift berhasil ditutup dan direkap oleh backend.");
    } catch (error) {
      alert(error.message || "Gagal menutup shift.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOwnerForceClose = async (shift) => {
    const defaultCash =
      Number(shift.expectedCash || 0) > 0
        ? Number(shift.expectedCash || 0)
        : Number(shift.openingCash || 0) + Number(shift.totalSales || 0);

    const closingCashInput = prompt(
      `Masukkan kas akhir untuk menutup shift ${shift.cashierName}:`,
      String(defaultCash)
    );

    if (closingCashInput === null) return;

    if (closingCashInput === "" || Number(closingCashInput) < 0) {
      alert("Kas akhir tidak valid.");
      return;
    }

    const confirmClose = confirm("Yakin ingin menutup shift kasir ini?");

    if (!confirmClose) return;

    try {
      setErrorMessage("");

      await closeShift(shift.id, {
        closing_cash: Number(closingCashInput),
        note: "Ditutup oleh owner",
      });

      await fetchShifts();

      showSuccess("Shift kasir berhasil ditutup oleh owner.");
    } catch (error) {
      alert(error.message || "Gagal menutup shift kasir.");
    }
  };

  const handleRefresh = async () => {
    await fetchShifts();

    if (isKasir) {
      await fetchCurrentShift(currentUser.username);
    }

    showSuccess("Data shift berhasil diperbarui dari backend.");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title={isOwner ? "Shift Kasir" : "Shift Saya"}
        description={
          isOwner
            ? "Monitoring shift kasir berdasarkan cabang, waktu, dan status shift dari backend."
            : "Kelola buka shift, tutup shift, dan riwayat shift kerja kamu dari backend."
        }
      />

      <div className="mb-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm hover:bg-green-50"
        >
          Refresh Data
        </button>
      </div>

      {successMessage && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {isKasir && (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-800">
                Status Shift Saat Ini
              </h3>

              {currentKasirShift ? (
                <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">
                        Shift sedang berjalan
                      </p>
                      <h4 className="mt-1 text-xl font-bold text-green-700">
                        {currentKasirShift.shiftName}
                      </h4>
                    </div>

                    <span className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white">
                      Berjalan
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoBox label="Cabang" value={currentKasirShift.branch} />
                    <InfoBox
                      label="Jam Buka"
                      value={formatDateTime(currentKasirShift.openTime)}
                    />
                    <InfoBox
                      label="Kas Awal"
                      value={formatRupiah(currentKasirShift.openingCash)}
                      valueClass="text-blue-600"
                    />
                    <InfoBox
                      label="Penjualan Sementara"
                      value={formatRupiah(currentKasirShift.totalSales)}
                      valueClass="text-green-600"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-yellow-100 bg-yellow-50 p-5">
                  <p className="font-bold text-yellow-700">
                    Belum ada shift yang berjalan
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    Masukkan kas awal untuk membuka shift kerja.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">Aksi Shift</h3>

              <div className="mt-5 space-y-4">
                {!currentKasirShift && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Kas Awal
                    </label>
                    <input
                      type="number"
                      value={openingCash}
                      onChange={(event) => setOpeningCash(event.target.value)}
                      placeholder="Contoh: 500000"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <label className="mb-2 mt-4 block text-sm font-semibold text-slate-700">
                      Catatan Buka Shift
                    </label>
                    <textarea
                      value={openNote}
                      onChange={(event) => setOpenNote(event.target.value)}
                      placeholder="Opsional"
                      rows="3"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleOpenShift}
                      className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold text-white ${
                        isSubmitting
                          ? "bg-slate-400"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isSubmitting ? "Memproses..." : "Buka Shift"}
                    </button>
                  </div>
                )}

                {currentKasirShift && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Kas Akhir
                    </label>
                    <input
                      type="number"
                      value={closingCash}
                      onChange={(event) => setClosingCash(event.target.value)}
                      placeholder="Contoh: 1250000"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <label className="mb-2 mt-4 block text-sm font-semibold text-slate-700">
                      Catatan Tutup Shift
                    </label>
                    <textarea
                      value={closeNote}
                      onChange={(event) => setCloseNote(event.target.value)}
                      placeholder="Opsional"
                      rows="3"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kas Awal</span>
                        <span className="font-bold text-slate-800">
                          {formatRupiah(currentKasirShift.openingCash)}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between">
                        <span className="text-slate-500">
                          Penjualan Tercatat
                        </span>
                        <span className="font-bold text-green-600">
                          {formatRupiah(currentKasirShift.totalSales)}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                        <span className="font-bold text-slate-700">
                          Estimasi Kas
                        </span>
                        <span className="font-bold text-blue-600">
                          {formatRupiah(
                            currentKasirShift.openingCash +
                              currentKasirShift.totalSales
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleCloseShift}
                      className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold text-white ${
                        isSubmitting
                          ? "bg-slate-400"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {isSubmitting ? "Memproses..." : "Tutup Shift"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-800">
              Riwayat Shift Saya
            </h3>

            {isLoading ? (
              <LoadingBox message="Mengambil riwayat shift dari backend..." />
            ) : (
              <ShiftTable
                shifts={myShiftHistory}
                isOwner={false}
                onForceClose={handleOwnerForceClose}
              />
            )}
          </div>
        </>
      )}

      {isOwner && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Total Shift" value={summary.totalShift} />
            <SummaryCard
              label="Shift Berjalan"
              value={summary.runningShift}
              valueClass="text-green-600"
            />
            <SummaryCard
              label="Shift Selesai"
              value={summary.closedShift}
              valueClass="text-red-600"
            />
            <SummaryCard label="Cabang 1" value={summary.branchOne} />
            <SummaryCard label="Cabang 2" value={summary.branchTwo} />
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MoneySummaryCard
              label="Total Kas Awal"
              value={summary.totalOpeningCash}
              valueClass="text-blue-600"
            />

            <MoneySummaryCard
              label="Total Kas Akhir"
              value={summary.totalClosingCash}
              valueClass="text-green-600"
            />

            <MoneySummaryCard
              label="Total Penjualan Shift"
              value={summary.totalSales}
              valueClass="text-purple-600"
            />

            <MoneySummaryCard
              label="Selisih Kas"
              value={summary.totalDifference}
              valueClass={
                summary.totalDifference >= 0 ? "text-green-600" : "text-red-600"
              }
            />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Monitoring Shift Kasir
                </h3>
                <p className="text-sm text-slate-500">
                  Menampilkan seluruh shift kasir dari Cabang 1 dan Cabang 2.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
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

                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Cari kasir..."
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {isLoading ? (
              <LoadingBox message="Mengambil data shift dari backend..." />
            ) : (
              <ShiftTable
                shifts={filteredShifts}
                isOwner={true}
                onForceClose={handleOwnerForceClose}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function InfoBox({ label, value, valueClass = "text-slate-800" }) {
  return (
    <div className="rounded-xl bg-white p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function LoadingBox({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function SummaryCard({ label, value, valueClass = "text-slate-800" }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</h3>
    </div>
  );
}

function MoneySummaryCard({ label, value, valueClass = "text-slate-800" }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className={`mt-2 text-2xl font-bold ${valueClass}`}>
        {formatRupiah(value)}
      </h3>
    </div>
  );
}

function ShiftTable({ shifts, isOwner, onForceClose }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1250px] border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
            <th className="px-4 py-4 font-semibold">Kasir</th>
            <th className="px-4 py-4 font-semibold">Cabang</th>
            <th className="px-4 py-4 font-semibold">Shift</th>
            <th className="px-4 py-4 font-semibold">Jam Buka</th>
            <th className="px-4 py-4 font-semibold">Jam Tutup</th>
            <th className="px-4 py-4 font-semibold">Kas Awal</th>
            <th className="px-4 py-4 font-semibold">Kas Akhir</th>
            <th className="px-4 py-4 font-semibold">Penjualan</th>
            <th className="px-4 py-4 font-semibold">Transaksi</th>
            <th className="px-4 py-4 font-semibold">Selisih</th>
            <th className="px-4 py-4 font-semibold">Status</th>
            {isOwner && (
              <th className="px-4 py-4 text-center font-semibold">Aksi</th>
            )}
          </tr>
        </thead>

        <tbody>
          {shifts.length > 0 ? (
            shifts.map((shift) => (
              <tr
                key={shift.id}
                className="border-b border-slate-100 text-sm hover:bg-slate-50"
              >
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-800">
                    {shift.cashierName}
                  </p>
                  <p className="text-xs text-slate-400">@{shift.username}</p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      shift.branch === "Cabang 1"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {shift.branch}
                  </span>
                </td>

                <td className="px-4 py-4 text-slate-600">
                  {shift.shiftName}
                </td>

                <td className="px-4 py-4 text-slate-600">
                  {formatDateTime(shift.openTime)}
                </td>

                <td className="px-4 py-4 text-slate-600">
                  {shift.closeTime ? formatDateTime(shift.closeTime) : "-"}
                </td>

                <td className="px-4 py-4 font-semibold text-blue-600">
                  {formatRupiah(shift.openingCash)}
                </td>

                <td className="px-4 py-4 font-semibold text-green-600">
                  {shift.closingCash !== null
                    ? formatRupiah(shift.closingCash)
                    : "-"}
                </td>

                <td className="px-4 py-4 font-semibold text-purple-600">
                  {formatRupiah(shift.totalSales)}
                </td>

                <td className="px-4 py-4 text-slate-600">
                  {shift.totalTransactions}
                </td>

                <td
                  className={`px-4 py-4 font-semibold ${
                    shift.cashDifference >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {shift.status === "Selesai"
                    ? formatRupiah(shift.cashDifference)
                    : "-"}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      shift.status === "Berjalan"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {shift.status}
                  </span>
                </td>

                {isOwner && (
                  <td className="px-4 py-4 text-center">
                    {shift.status === "Berjalan" ? (
                      <button
                        type="button"
                        onClick={() => onForceClose(shift)}
                        className="rounded-lg bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-700 hover:bg-yellow-100"
                      >
                        Tutup Shift
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Selesai</span>
                    )}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={isOwner ? "12" : "11"}
                className="px-4 py-10 text-center text-sm text-slate-500"
              >
                Data shift tidak ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ShiftPage;