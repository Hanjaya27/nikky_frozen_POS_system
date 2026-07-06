import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Clock3,
  History,
  LogOut,
  PackageMinus,
  PackagePlus,
  PackageSearch,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  ChevronsLeft,
  ChevronsRight,
  Snowflake,
  UsersRound,
  WalletCards,
  Warehouse,
  X,
} from "lucide-react";

import * as api from "../services/api";
import ConfirmModal from "./ConfirmModal";

const PERMISSION_STORAGE_KEY = "nikky_user_permissions";
const PERMISSION_MIGRATION_KEY = "nikky_permissions_initialized_v3";
const SIDEBAR_COLLAPSED_KEY = "nikky_sidebar_collapsed_final";

export const DEFAULT_KASIR_PERMISSIONS = [
  { id: "pos", name: "Kasir", kasirAccess: true },
  { id: "shift", name: "Shift Saya", kasirAccess: true },
  { id: "transaksi", name: "Riwayat Transaksi", kasirAccess: true },
];

const ownerMenus = [
  { name: "Dashboard", path: "/owner/dashboard", icon: BarChart3 },
  { name: "Laporan", path: "/laporan", icon: ReceiptText },
  { name: "Barang & Stok", path: "/barang", icon: PackageSearch },
  { name: "Pengeluaran", path: "/pengeluaran", icon: WalletCards },
  { name: "Data User", path: "/owner/data-kasir", icon: UsersRound },
  { name: "Aktivitas Login", path: "/owner/aktivitas-login", icon: History },
  { name: "Role Permission", path: "/owner/role-permission", icon: ShieldCheck },
  { name: "Pengaturan", path: "/pengaturan", icon: Settings },
];

const adminMenus = [
  { name: "Dashboard Admin", path: "/admin/dashboard", icon: BarChart3 },
  { name: "Produk", path: "/admin/produk", icon: Boxes },
  { name: "Mutasi Stok", path: "/admin/mutasi", icon: PackagePlus },
  { name: "Riwayat Stok", path: "/admin/riwayat", icon: History },
];

const kasirMenus = [
  { name: "Kasir", path: "/", icon: ShoppingCart, permissionId: "pos" },
  { name: "Shift Saya", path: "/shift", icon: Clock3, permissionId: "shift" },
  {
    name: "Riwayat Transaksi",
    path: "/transaksi",
    icon: History,
    permissionId: "transaksi",
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

function writeStoredPermissions(permissions, role) {
  const key = `${PERMISSION_STORAGE_KEY}_${role}`;
  localStorage.setItem(key, JSON.stringify(permissions));
  window.dispatchEvent(new Event("nikky_permissions_updated"));
}

function getStoredPermissions(role) {
  const key = `${PERMISSION_STORAGE_KEY}_${role}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Gagal membaca permission dari localStorage:", error);
      return [];
    }
  }
  return [];
}

function getSavedPermissions(role) {
  return getStoredPermissions(role);
}

export { getSavedPermissions };

function getInitialCollapsedState() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();

  const initialUser = useMemo(() => getCurrentUser(), []);
  const initialRole = String(initialUser?.role || "cashier").toLowerCase().replace("kasir", "cashier");

  const [currentUser, setCurrentUser] = useState(initialUser);
  const [permissions, setPermissions] = useState(() =>
    getStoredPermissions(initialRole),
  );
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const userRole = String(currentUser?.role || "cashier").toLowerCase().replace("kasir", "cashier");

  const isOwner = userRole === "owner";
  const isAdmin = userRole === "admin";
  const isKasir = userRole === "cashier";

  const syncPermissions = () => {
    setPermissions(getStoredPermissions(userRole));
  };

  const toggleCollapse = () => {
    setIsCollapsed((previousValue) => {
      const nextValue = !previousValue;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextValue));
      return nextValue;
    });
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
    if (isAdmin) return adminMenus;

    if (isKasir) {
      const kasirPermissions = getStoredPermissions("cashier").length > 0 ? getStoredPermissions("cashier") : getStoredPermissions("kasir");
      const fallback = kasirPermissions.length > 0 ? kasirPermissions : DEFAULT_KASIR_PERMISSIONS;
      return kasirMenus.filter((menu) => {
        const permission = fallback.find((p) => p.id === menu.permissionId);
        return permission && permission.kasirAccess;
      });
    }

    return [];
  }, [isOwner, isAdmin, isKasir, permissions, userRole]);

  const clearLoginSession = () => {
    localStorage.removeItem("nikky_user");
    localStorage.removeItem("nikky_login_activity_id");
  };

  const handleOpenLogoutModal = () => {
    if (isLoggingOut) return;
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;

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
      setShowLogoutModal(false);
      navigate("/login", { replace: true });
    }
  };

  const handleCloseLogoutModal = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[232px] shrink-0 flex-col border-r border-[#EBCDB8] bg-[#FFFDF8] text-[#2A1712] shadow-2xl shadow-slate-950/10 transition-all duration-300 lg:sticky lg:top-0 lg:z-20 lg:translate-x-0 lg:shadow-none ${
          isCollapsed ? "lg:w-[76px]" : "lg:w-[232px]"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[76px] items-center justify-between px-4">
          <div
            className={`flex min-w-0 items-center gap-3 ${
              isCollapsed ? "lg:hidden" : ""
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C80503] text-white">
              <Snowflake className="h-5 w-5" strokeWidth={2.5} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-black text-[#C80503]">
                Nikky Frozen
              </h1>
              <p className="truncate text-[11px] font-semibold text-[#7A6258]">
                POS System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF6EA] text-[#7A6258] transition hover:bg-[#C80503]/10 hover:text-[#C80503] lg:flex ${
              isCollapsed ? "lg:hidden" : ""
            }`}
            aria-label="Perkecil sidebar"
            title="Perkecil sidebar"
          >
            <ChevronsLeft className="h-4 w-4" strokeWidth={2.8} />
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C80503]/10 text-[#C80503] transition hover:bg-[#C80503]/20 ${
              isCollapsed ? "lg:flex" : "lg:hidden"
            }`}
            aria-label="Buka sidebar"
            title="Buka sidebar"
          >
            <ChevronsRight className="h-4 w-4" strokeWidth={2.8} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF6EA] text-[#7A6258] transition hover:bg-[#EBCDB8] lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
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
                    title={isCollapsed ? menu.name : undefined}
                    className={({ isActive }) =>
                      [
                        "group flex items-center rounded-xl text-sm font-semibold transition-all duration-200",
                        isCollapsed
                          ? "lg:justify-center lg:px-0 lg:py-3"
                          : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-[#C80503]/10 text-[#C80503]"
                          : "text-[#7A6258] hover:bg-[#FFF6EA] hover:text-[#C80503]",
                      ].join(" ")
                    }
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />

                    <span
                      className={`min-w-0 truncate ${
                        isCollapsed ? "lg:hidden" : ""
                      }`}
                    >
                      {menu.name}
                    </span>
                  </NavLink>
                );
              })
            ) : (
              <div className="rounded-xl border border-[#EBCDB8] bg-[#FFF6EA] px-3 py-2 text-xs font-semibold text-[#7A6258]">
                Tidak ada menu.
              </div>
            )}
          </div>
        </nav>

        <div className="border-t border-[#EBCDB8] px-4 py-4">
          <button
            type="button"
            onClick={handleOpenLogoutModal}
            disabled={isLoggingOut}
            className={`flex w-full items-center rounded-xl text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 ${
              isCollapsed ? "lg:justify-center lg:px-0 lg:py-2.5" : "gap-2 px-2 py-2.5"
            }`}
            title="Keluar"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            <span className={isCollapsed ? "lg:hidden" : ""}>
              {isLoggingOut ? "Keluar..." : "Keluar"}
            </span>
          </button>
        </div>

        <ConfirmModal
          open={showLogoutModal}
          title="Keluar dari sistem?"
          message="Apakah Anda yakin ingin mengakhiri sesi saat ini?"
          confirmText="Ya, Keluar"
          cancelText="Batal"
          variant="danger"
          loading={isLoggingOut}
          onConfirm={handleConfirmLogout}
          onCancel={handleCloseLogoutModal}
        />
      </aside>
    </>
  );
}

export default Sidebar;
