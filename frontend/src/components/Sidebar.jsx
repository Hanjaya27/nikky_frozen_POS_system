import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ReceiptText,
  PackageSearch,
  WalletCards,
  Settings,
  LogOut,
  ShoppingCart,
  Clock3,
  Boxes,
  History,
  Sparkles,
  X,
} from "lucide-react";

import * as api from "../services/api";

const PERMISSION_STORAGE_KEY = "nikky_kasir_permissions";
const PERMISSION_MIGRATION_KEY = "nikky_permissions_initialized_v2";

export const DEFAULT_KASIR_PERMISSIONS = [
  { id: "pos", name: "Kasir / POS", kasirAccess: true },
  { id: "shift", name: "Shift Saya", kasirAccess: true },
  { id: "transaksi", name: "Riwayat Transaksi", kasirAccess: true },
  { id: "barang", name: "Barang & Stok", kasirAccess: true },
  { id: "laporan", name: "Laporan", kasirAccess: true },
  { id: "pengeluaran", name: "Pengeluaran", kasirAccess: true },
  { id: "pengaturan", name: "Pengaturan", kasirAccess: true },
];

const ownerMenus = [
  { name: "Dashboard", path: "/owner/dashboard", icon: LayoutDashboard },
  { name: "Laporan", path: "/laporan", icon: ReceiptText },
  { name: "Monitoring Stok", path: "/barang", icon: PackageSearch },
  { name: "Pengeluaran", path: "/pengeluaran", icon: WalletCards },
  { name: "Pengaturan", path: "/pengaturan", icon: Settings },
];

const kasirMenus = [
  { name: "Kasir", path: "/", icon: ShoppingCart, permissionId: "pos" },
  { name: "Shift Saya", path: "/shift", icon: Clock3, permissionId: "shift" },
  {
    name: "Barang & Stok",
    path: "/barang",
    icon: Boxes,
    permissionId: "barang",
  },
  {
    name: "Riwayat Transaksi",
    path: "/transaksi",
    icon: History,
    permissionId: "transaksi",
  },
  {
    name: "Laporan",
    path: "/laporan",
    icon: ReceiptText,
    permissionId: "laporan",
  },
  {
    name: "Pengeluaran",
    path: "/pengeluaran",
    icon: WalletCards,
    permissionId: "pengeluaran",
  },
  {
    name: "Pengaturan",
    path: "/pengaturan",
    icon: Settings,
    permissionId: "pengaturan",
  },
];

function getCurrentUser() {
  const savedUser = localStorage.getItem("nikky_user");

  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem("nikky_user");
    localStorage.removeItem("nikky_login_activity_id");
    return null;
  }
}

function normalizePermission(permission) {
  return {
    id: permission.id || permission.permission_id,
    name: permission.name,
    kasirAccess:
      permission.kasirAccess !== undefined
        ? Boolean(permission.kasirAccess)
        : Boolean(permission.kasir_access),
  };
}

function mergePermissions(savedPermissions) {
  if (!Array.isArray(savedPermissions)) return DEFAULT_KASIR_PERMISSIONS;

  const normalizedPermissions = savedPermissions.map(normalizePermission);

  return DEFAULT_KASIR_PERMISSIONS.map((defaultPermission) => {
    const foundPermission = normalizedPermissions.find(
      (permission) => permission.id === defaultPermission.id,
    );

    if (!foundPermission) return defaultPermission;

    return {
      ...defaultPermission,
      kasirAccess: Boolean(foundPermission.kasirAccess),
    };
  });
}

function writeStoredKasirPermissions(permissions) {
  const mergedPermissions = mergePermissions(permissions);

  localStorage.setItem(
    PERMISSION_STORAGE_KEY,
    JSON.stringify(
      mergedPermissions.map((permission) => ({
        id: permission.id,
        name: permission.name,
        kasirAccess: Boolean(permission.kasirAccess),
      })),
    ),
  );

  return mergedPermissions;
}

function isOldThreeMenuOnly(permissions) {
  const activeIds = permissions
    .filter((permission) => permission.kasirAccess)
    .map((permission) => permission.id)
    .sort();

  return activeIds.join(",") === "pos,shift,transaksi";
}

function getStoredKasirPermissions() {
  const savedPermissions = localStorage.getItem(PERMISSION_STORAGE_KEY);
  const migrationDone = localStorage.getItem(PERMISSION_MIGRATION_KEY) === "true";

  if (!savedPermissions) {
    localStorage.setItem(PERMISSION_MIGRATION_KEY, "true");
    return writeStoredKasirPermissions(DEFAULT_KASIR_PERMISSIONS);
  }

  try {
    const mergedPermissions = mergePermissions(JSON.parse(savedPermissions));

    if (!migrationDone && isOldThreeMenuOnly(mergedPermissions)) {
      localStorage.setItem(PERMISSION_MIGRATION_KEY, "true");
      return writeStoredKasirPermissions(DEFAULT_KASIR_PERMISSIONS);
    }

    localStorage.setItem(PERMISSION_MIGRATION_KEY, "true");
    return writeStoredKasirPermissions(mergedPermissions);
  } catch {
    localStorage.setItem(PERMISSION_MIGRATION_KEY, "true");
    return writeStoredKasirPermissions(DEFAULT_KASIR_PERMISSIONS);
  }
}

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState(() =>
    getStoredKasirPermissions(),
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userRole = String(currentUser?.role || "").toLowerCase();
  const isOwner = userRole === "owner";
  const isKasir = userRole === "kasir";

  const syncPermissions = () => {
    setPermissions(getStoredKasirPermissions());
  };

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";

    const userData = getCurrentUser();

    if (userData) {
      setCurrentUser(userData);
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    syncPermissions();

    window.addEventListener("storage", syncPermissions);
    window.addEventListener("focus", syncPermissions);
    window.addEventListener("nikky_permissions_updated", syncPermissions);

    return () => {
      window.removeEventListener("storage", syncPermissions);
      window.removeEventListener("focus", syncPermissions);
      window.removeEventListener("nikky_permissions_updated", syncPermissions);
    };
  }, []);

  const menus = useMemo(() => {
    if (isOwner) return ownerMenus;

    return kasirMenus.filter((menu) => {
      const permission = permissions.find(
        (item) => item.id === menu.permissionId,
      );

      return permission?.kasirAccess === true;
    });
  }, [isOwner, permissions]);

  const clearLoginSession = () => {
    localStorage.removeItem("nikky_user");
    localStorage.removeItem("nikky_login_activity_id");
  };

  const handleLogout = async () => {
    const confirmLogout = confirm("Yakin ingin keluar dari sistem?");

    if (!confirmLogout || isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      const savedUser = localStorage.getItem("nikky_user");
      const savedLoginActivityId = localStorage.getItem(
        "nikky_login_activity_id",
      );

      let userData = null;

      if (savedUser) {
        try {
          userData = JSON.parse(savedUser);
        } catch {
          userData = null;
        }
      }

      if (userData?.username && typeof api.logoutUser === "function") {
        await api.logoutUser({
          username: userData.username,
          login_activity_id: savedLoginActivityId
            ? Number(savedLoginActivityId)
            : userData.loginActivityId || null,
        });
      }
    } catch (error) {
      console.error("Logout gagal:", error);
    } finally {
      clearLoginSession();
      setCurrentUser(null);
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[284px] shrink-0 flex-col border-r border-gray-200 bg-white text-gray-900 transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-gray-100 px-5 pb-5 pt-5">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <p className="text-sm font-black text-gray-900">Menu</p>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-[26px] bg-gradient-to-br from-[#0B7FC3] via-[#0D8FDC] to-[#075985] p-4 text-white shadow-lg shadow-sky-900/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#0B7FC3] shadow-sm">
                  NF
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-[17px] font-black leading-tight">
                    Nikky Frozen
                  </h1>
                  <p className="mt-0.5 text-xs font-semibold text-sky-100">
                    POS System
                  </p>
                </div>
              </div>

              <div className="shrink-0 rounded-full bg-white/15 p-2 ring-1 ring-white/20">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Menu Utama
          </p>

          <div className="space-y-1.5">
            {menus.length > 0 ? (
              menus.map((menu) => {
                const Icon = menu.icon;

                return (
                  <NavLink
                    key={menu.name}
                    to={menu.path}
                    end={menu.path === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200",
                        isActive
                          ? "bg-[#EAF4FF] text-[#0B7FC3] shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-950",
                      ].join(" ")
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
                    <span className="truncate">{menu.name}</span>
                  </NavLink>
                );
              })
            ) : (
              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs font-semibold text-orange-700">
                Tidak ada menu yang dapat diakses.
              </div>
            )}
          </div>

          {isKasir && (
            <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500">
              Menu kasir mengikuti akses yang diatur Owner.
            </div>
          )}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
