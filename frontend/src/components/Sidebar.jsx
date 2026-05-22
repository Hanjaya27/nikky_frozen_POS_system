import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

function Sidebar() {
  const [theme, setTheme] = useState("light");

  const menus = [
    { name: "Kasir", path: "/", icon: "🧾" },
    { name: "Barang & Stok", path: "/barang", icon: "📦" },
    { name: "Riwayat Transaksi", path: "/transaksi", icon: "🕘" },
    { name: "Laporan", path: "/laporan", icon: "📊" },
    { name: "Pengeluaran", path: "/pengeluaran", icon: "💸" },
    { name: "Pengaturan", path: "/pengaturan", icon: "⚙️" },
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleLogout = () => {
    const confirmLogout = confirm("Yakin ingin keluar dari sistem?");

    if (confirmLogout) {
      alert("Anda berhasil keluar.");
    }
  };

  const isDark = theme === "dark";

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
            POS Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
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
        ))}
      </nav>

      <div
        className={`mb-4 rounded-2xl p-4 ${
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
        <p className="mt-1 text-sm font-bold">Ahmad Baihaqi</p>
        <p
          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          Kasir
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
      >
        <span>🚪</span>
        <span>Keluar</span>
      </button>
    </aside>
  );
}

export default Sidebar;