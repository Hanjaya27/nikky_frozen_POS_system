import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { getPermissionsApi, logoutUser } from "../services/api";

const defaultPermissions = [
  { id: "pos", kasirAccess: true },
  { id: "shift", kasirAccess: true },
  { id: "barang", kasirAccess: true },
  { id: "transaksi", kasirAccess: true },
  { id: "laporan", kasirAccess: false },
  { id: "pengeluaran", kasirAccess: false },
  { id: "data_kasir", kasirAccess: false },
  { id: "aktivitas_login", kasirAccess: false },
  { id: "role_permission", kasirAccess: false },
  { id: "pengaturan", kasirAccess: false },
];

const kasirMenus = [
  {
    name: "Kasir",
    path: "/",
    icon: "🧾",
    permissionId: "pos",
  },
  {
    name: "Shift Saya",
    path: "/shift",
    icon: "🕒",
    permissionId: "shift",
  },
  {
    name: "Barang & Stok",
    path: "/barang",
    icon: "📦",
    permissionId: "barang",
  },
  {
    name: "Riwayat Transaksi",
    path: "/transaksi",
    icon: "🕘",
    permissionId: "transaksi",
  },
  {
    name: "Laporan",
    path: "/laporan",
    icon: "📊",
    permissionId: "laporan",
  },
  {
    name: "Pengeluaran",
    path: "/pengeluaran",
    icon: "💸",
    permissionId: "pengeluaran",
  },
  {
    name: "Pengaturan",
    path: "/pengaturan",
    icon: "⚙️",
    permissionId: "pengaturan",
  },
];

const ownerMenus = [
  {
    name: "Dashboard Owner",
    path: "/owner/dashboard",
    icon: "🏠",
  },
  {
    name: "Laporan",
    path: "/laporan",
    icon: "📊",
  },
  {
    name: "Shift Kasir",
    path: "/shift",
    icon: "🕒",
  },
  {
    name: "Barang & Stok",
    path: "/barang",
    icon: "📦",
  },
  {
    name: "Riwayat Transaksi",
    path: "/transaksi",
    icon: "🕘",
  },
  {
    name: "Pengeluaran",
    path: "/pengeluaran",
    icon: "💸",
  },
  {
    name: "Data Kasir",
    path: "/owner/data-kasir",
    icon: "👥",
  },
  {
    name: "Aktivitas Login",
    path: "/owner/aktivitas-login",
    icon: "🟢",
  },
  {
    name: "Role & Permission",
    path: "/owner/role-permission",
    icon: "🔐",
  },
  {
    name: "Pengaturan",
    path: "/pengaturan",
    icon: "⚙️",
  },
];

function getCurrentUser() {
  const savedUser = localStorage.getItem("nikky_user");

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    localStorage.removeItem("nikky_user");
    localStorage.removeItem("nikky_login_activity_id");
    return null;
  }
}

function normalizePermission(permission) {
  return {
    id: permission.permission_id || permission.id,
    kasirAccess:
      permission.kasir_access !== undefined
        ? Boolean(permission.kasir_access)
        : Boolean(permission.kasirAccess),
    menuName: permission.menu_name || permission.menuName || "",
    menuGroup: permission.menu_group || permission.menuGroup || "",
    status: permission.status || "Aktif",
  };
}

function mergePermissions(backendPermissions) {
  if (!Array.isArray(backendPermissions)) {
    return defaultPermissions;
  }

  const normalizedPermissions = backendPermissions.map(normalizePermission);

  return defaultPermissions.map((defaultPermission) => {
    const foundPermission = normalizedPermissions.find(
      (permission) => permission.id === defaultPermission.id
    );

    if (!foundPermission) {
      return defaultPermission;
    }

    return {
      ...defaultPermission,
      ...foundPermission,
    };
  });
}

function Sidebar() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState("light");
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isDark = theme === "dark";
  const isOwner = currentUser?.role === "owner";
  const isKasir = currentUser?.role === "kasir";

  const fetchPermissions = useCallback(async () => {
    if (!isKasir) {
      return;
    }

    try {
      setIsLoadingPermissions(true);

      const permissionData = await getPermissionsApi();
      const mergedPermissions = mergePermissions(permissionData);

      setPermissions(mergedPermissions);
    } catch (error) {
      console.error("Gagal mengambil permission backend:", error);
      setPermissions(defaultPermissions);
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [isKasir]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const userData = getCurrentUser();

    if (savedTheme) {
      setTheme(savedTheme);
    }

    if (userData) {
      setCurrentUser(userData);
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === "owner") {
      setPermissions(defaultPermissions);
      return;
    }

    fetchPermissions();
  }, [currentUser, fetchPermissions]);

  useEffect(() => {
    if (!isKasir) return;

    const interval = setInterval(() => {
      fetchPermissions();
    }, 5000);

    return () => clearInterval(interval);
  }, [isKasir, fetchPermissions]);

  const menus = useMemo(() => {
    if (isOwner) {
      return ownerMenus;
    }

    return kasirMenus.filter((menu) => {
      const permission = permissions.find(
        (item) => item.id === menu.permissionId
      );

      return permission?.kasirAccess === true;
    });
  }, [isOwner, permissions]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const clearLoginSession = () => {
    localStorage.removeItem("nikky_user");
    localStorage.removeItem("nikky_login_activity_id");
  };

  const handleLogout = async () => {
    const confirmLogout = confirm("Yakin ingin keluar dari sistem?");

    if (!confirmLogout || isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      const savedUser = localStorage.getItem("nikky_user");
      const savedLoginActivityId = localStorage.getItem(
        "nikky_login_activity_id"
      );

      let userData = null;

      if (savedUser) {
        try {
          userData = JSON.parse(savedUser);
        } catch (error) {
          userData = null;
        }
      }

      if (userData?.username) {
        await logoutUser({
          username: userData.username,
          login_activity_id: savedLoginActivityId
            ? Number(savedLoginActivityId)
            : userData.loginActivityId || null,
        });
      }
    } catch (error) {
      console.error("Logout backend gagal:", error);
    } finally {
      clearLoginSession();
      setCurrentUser(null);
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  const displayName = currentUser?.name || "Guest User";
  const displayRole = isOwner ? "Owner" : "Kasir";
  const displayBranch = currentUser?.branch || "-";
  const displayShift = currentUser?.shift || "-";

  return (
    <aside
      className={`sticky top-0 flex h-screen w-72 flex-col border-r px-5 py-6 transition-all duration-300 ${
        isDark
          ? "border-slate-700 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-800"
      }`}
    >
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-md">
          NF
        </div>

        <div>
          <h1 className="text-lg font-bold leading-tight">Nikky Frozen</h1>
          <p
            className={`text-xs ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {isOwner ? "Owner Dashboard" : "Kasir Dashboard"}
          </p>
        </div>
      </div>

      {isKasir && (
        <div
          className={`mb-4 rounded-2xl px-4 py-3 text-xs font-semibold ${
            isLoadingPermissions
              ? "bg-yellow-50 text-yellow-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {isLoadingPermissions
            ? "Mengambil permission..."
            : "Permission tersinkron backend"}
        </div>
      )}

      <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
        {menus.length > 0 ? (
          menus.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              end={menu.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : isDark
                    ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <span className="text-lg">{menu.icon}</span>
              <span>{menu.name}</span>
            </NavLink>
          ))
        ) : (
          <div
            className={`rounded-2xl p-4 text-sm ${
              isDark
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            Tidak ada menu yang dapat diakses. Hubungi owner untuk mengaktifkan
            permission.
          </div>
        )}
      </nav>

      <div
        className={`mb-4 mt-4 rounded-2xl p-4 ${
          isDark ? "bg-slate-800" : "bg-slate-100"
        }`}
      >
        <p
          className={`mb-3 text-xs font-semibold ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Mode Tampilan
        </p>

        <button
          type="button"
          onClick={toggleTheme}
          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${
            isDark
              ? "bg-slate-700 text-white hover:bg-slate-600"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span>{isDark ? "Mode Gelap" : "Mode Terang"}</span>
          <span>{isDark ? "🌙" : "☀️"}</span>
        </button>
      </div>

      <div
        className={`mb-4 rounded-2xl p-4 ${
          isDark ? "bg-slate-800" : "bg-slate-100"
        }`}
      >
        <p
          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          Login sebagai
        </p>

        <p className="mt-1 text-sm font-bold">{displayName}</p>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              Role
            </span>
            <span
              className={`rounded-full px-3 py-1 font-bold text-white ${
                isOwner ? "bg-purple-600" : "bg-blue-600"
              }`}
            >
              {displayRole}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              Cabang
            </span>
            <span className="font-semibold">{displayBranch}</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              Shift
            </span>
            <span className="font-semibold">{displayShift}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
          isLoggingOut
            ? "cursor-not-allowed bg-slate-100 text-slate-400"
            : "bg-red-50 text-red-600 hover:bg-red-100"
        }`}
      >
        <span>🚪</span>
        <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
      </button>
    </aside>
  );
}

export default Sidebar;