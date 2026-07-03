import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Clock } from "lucide-react";
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
      label: "OWNER",
      title: "Dashboard Owner",
      description: "Pantau kondisi penjualan, stok, dan performa toko.",
    };
  }

  if (pathname.startsWith("/admin/dashboard")) {
    return {
      label: "ADMIN",
      title: "Dashboard Admin",
      description: "Kelola barang, stok, dan lokasi gudang.",
    };
  }

  if (pathname.startsWith("/admin/stok-masuk")) {
    return {
      label: "ADMIN",
      title: "Stok Masuk",
      description: "Catat barang datang ke gudang.",
    };
  }

  if (pathname.startsWith("/admin/stok-keluar")) {
    return {
      label: "ADMIN",
      title: "Stok Keluar",
      description: "Catat barang rusak, expired, retur, atau koreksi stok.",
    };
  }

  if (pathname.startsWith("/admin/gudang")) {
    return {
      label: "ADMIN",
      title: "Peta Gudang",
      description: "Pantau posisi produk di freezer.",
    };
  }

  if (pathname.startsWith("/admin/expired")) {
    return {
      label: "ADMIN",
      title: "Produk Expired",
      description: "Pantau masa simpan produk frozen food.",
    };
  }

  if (pathname.startsWith("/laporan")) {
    return {
      label: "LAPORAN",
      title: "Laporan",
      description: "Analisa keuangan dan performa toko.",
    };
  }

  if (pathname.startsWith("/barang")) {
    return {
      label: role === "admin" ? "ADMIN" : "STOK",
      title: "Barang & Stok",
      description: "Kelola produk, harga, stok, dan lokasi penyimpanan.",
    };
  }

  if (pathname.startsWith("/pengeluaran")) {
    return {
      label: "PENGELUARAN",
      title: "Pengeluaran",
      description: "Catat biaya operasional toko.",
    };
  }

  if (pathname.startsWith("/pengaturan")) {
    return {
      label: "PENGATURAN",
      title: "Pengaturan Toko",
      description: "Konfigurasi sistem dan preferensi toko.",
    };
  }

  if (pathname.startsWith("/shift")) {
    return {
      label: "KASIR",
      title: "Shift Saya",
      description: "Kelola buka shift, tutup shift, dan ringkasan kerja kasir.",
    };
  }

  if (pathname.startsWith("/transaksi")) {
    return {
      label: "KASIR",
      title: "Riwayat Transaksi",
      description: "Lihat dan kelola riwayat penjualan.",
    };
  }

  if (role === "kasir") {
    return {
      label: "KASIR",
      title: "Kasir POS",
      description: "Toko frozen food",
    };
  }

  return {
    label: "POS",
    title: "Nikky Frozen POS",
    description: "Kelola transaksi, stok, laporan, dan operasional toko.",
  };
}

function MainLayout({ children }) {
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

  const role = String(currentUser?.role || "kasir").toLowerCase();

  const displayName =
    currentUser?.name ||
    currentUser?.nama ||
    currentUser?.username ||
    (role === "owner"
      ? "Owner"
      : role === "admin"
        ? "Admin Gudang"
        : "Kasir");

  const branchName =
    currentUser?.branch ||
    currentUser?.branch_name ||
    currentUser?.cabang ||
    (role === "owner" ? "Semua Cabang" : "Cabang 1");

  const roleLabel =
    role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Kasir";

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
    <div className="min-h-screen bg-[#FFF6EA] text-[#2A1712] font-sans">
      <div className="flex min-h-screen">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1 flex flex-col">
          <header className="sticky top-0 z-30 flex h-[76px] shrink-0 items-center bg-[#FFFDF8]/95 px-4 backdrop-blur lg:px-6 border-b border-[#EBCDB8]">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#C80503] shadow-sm border border-[#EBCDB8] transition hover:bg-[#FFF6EA] lg:hidden"
                  aria-label="Buka menu"
                >
                  <Menu className="h-5 w-5" strokeWidth={2.4} />
                </button>

                <div className="min-w-0">
                  <p className="truncate text-xs font-black uppercase tracking-[0.24em] text-[#C80503]">
                    {pageInfo.label}
                  </p>
                  <h2 className="truncate text-xl font-black leading-tight tracking-[-0.03em] text-[#2A1712]">
                    {pageInfo.title}
                  </h2>
                  <p className="truncate text-sm font-semibold leading-tight text-[#7A6258] hidden sm:block">
                    {pageInfo.description}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 border border-[#EBCDB8] md:flex">
                  <Clock className="h-4 w-4 text-[#C80503]" />
                  <p className="text-sm font-black leading-tight text-[#2A1712]">
                    {formatTime(now)}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-1.5 border border-[#EBCDB8]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C80503] text-sm font-black text-white shadow-sm">
                    {initials || "NF"}
                  </div>

                  <div className="hidden min-w-0 sm:block pr-1">
                    <p className="max-w-[140px] truncate text-sm font-black leading-tight text-[#2A1712]">
                      {displayName}
                    </p>
                    <p className="max-w-[140px] truncate text-[11px] font-bold leading-tight text-[#7A6258]">
                      {roleLabel} • {branchName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="flex-1 p-4 lg:p-6 bg-[#FFF6EA]">
            {children || <Outlet />}
          </section>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
