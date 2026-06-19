import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";

function getCurrentUser() {
  const savedUser = localStorage.getItem("nikky_user");

  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

function formatDate(date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date) {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getPageInfo(pathname, role) {
  if (pathname.startsWith("/owner/dashboard")) {
    return {
      label: "Dashboard Owner",
      title: "Ringkasan Operasional",
      description: "Pantau kondisi penjualan, stok, expired, dan aktivitas toko.",
    };
  }

  if (pathname.startsWith("/laporan")) {
    return {
      label: "Laporan",
      title: "Laporan Keuangan",
      description: "Pantau pendapatan, pengeluaran, laba, dan transaksi toko.",
    };
  }

  if (pathname.startsWith("/barang")) {
    return {
      label: "Monitoring Stok",
      title: "Barang & Stok",
      description: "Kelola stok, produk menipis, expired, dan lokasi penyimpanan.",
    };
  }

  if (pathname.startsWith("/pengeluaran")) {
    return {
      label: "Pengeluaran",
      title: "Biaya Operasional",
      description: "Catat dan kelola pengeluaran operasional toko.",
    };
  }

  if (pathname.startsWith("/pengaturan")) {
    return {
      label: "Pengaturan",
      title: "Pengaturan Sistem",
      description: "Atur profil toko, pengguna, hak akses, dan konfigurasi struk.",
    };
  }

  if (pathname.startsWith("/shift")) {
    return {
      label: "Kasir",
      title: "Shift Saya",
      description: "Kelola buka shift, tutup shift, dan ringkasan kerja kasir.",
    };
  }

  if (pathname.startsWith("/transaksi")) {
    return {
      label: "Kasir",
      title: "Riwayat Transaksi",
      description: "Lihat transaksi yang sudah diproses oleh kasir.",
    };
  }

  if (role === "kasir") {
    return {
      label: "Kasir POS",
      title: "Transaksi Penjualan",
      description: "Pilih produk, proses pembayaran, dan simpan transaksi.",
    };
  }

  return {
    label: "Nikky Frozen POS",
    title: "Selamat Datang",
    description: "Kelola transaksi, stok, laporan, dan operasional toko.",
  };
}

function MainLayout() {
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const role = String(currentUser?.role || "owner").toLowerCase();

  const displayName =
    currentUser?.name ||
    currentUser?.nama ||
    currentUser?.username ||
    (role === "owner" ? "Owner Nikky Frozen" : "Kasir Nikky Frozen");

  const branchName =
    currentUser?.branch ||
    currentUser?.branch_name ||
    currentUser?.cabang ||
    (role === "owner" ? "Semua Cabang" : "Cabang 1");

  const roleLabel = role === "owner" ? "Owner" : "Kasir";
  const pageInfo = getPageInfo(location.pathname, role);

  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }, [displayName]);

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-800 shadow-sm"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-black text-gray-950">
              {pageInfo.title}
            </p>
            <p className="text-[11px] font-semibold text-gray-500">
              {formatTime(now)}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B7FC3] text-sm font-black text-white">
            {initials || "NF"}
          </div>
        </div>
      </div>

      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1">
          <div className="hidden px-6 pt-5 lg:block">
            <div className="flex items-center justify-between gap-4 rounded-[24px] border border-gray-200 bg-white px-6 py-4 shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B7FC3]">
                  {pageInfo.label}
                </p>

                <h2 className="mt-1 truncate text-xl font-black text-gray-950">
                  {pageInfo.title}
                </h2>

                <p className="mt-1 text-sm font-medium text-gray-500">
                  {pageInfo.description}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="rounded-2xl bg-gray-100 px-5 py-3 text-right">
                  <p className="text-xs font-semibold text-gray-500">
                    {formatDate(now)}
                  </p>
                  <p className="mt-1 text-base font-black text-gray-950">
                    {formatTime(now)}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-gray-100 px-4 py-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0B7FC3] text-sm font-black text-white">
                    {initials || "NF"}
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-950">
                      {displayName}
                    </p>
                    <p className="text-xs font-semibold text-gray-500">
                      {roleLabel} • {branchName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
