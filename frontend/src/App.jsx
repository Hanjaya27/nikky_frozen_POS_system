import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import LoginPage from "./pages/auth/LoginPage";
import KasirPage from "./pages/kasir/KasirPage";
import BarangPage from "./pages/barang/BarangPage";
import TransaksiPage from "./pages/transaksi/TransaksiPage";
import LaporanPage from "./pages/laporan/LaporanPage";
import PengeluaranPage from "./pages/pengeluaran/PengeluaranPage";
import PengaturanPage from "./pages/pengaturan/PengaturanPage";
import ShiftPage from "./pages/shift/ShiftPage";

import OwnerDashboard from "./pages/owner/OwnerDashboard";
import DataKasirPage from "./pages/owner/DataKasirPage";
import AktivitasLoginPage from "./pages/owner/AktivitasLoginPage";
import RolePermissionPage from "./pages/owner/RolePermissionPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProdukPage from "./pages/admin/AdminProdukPage";
import AdminMutasiPage from "./pages/admin/AdminMutasiPage";
import AdminRiwayatStok from "./pages/admin/AdminRiwayatStok";

const defaultPermissions = [
  { id: "pos", kasirAccess: true },
  { id: "shift", kasirAccess: true },
  { id: "barang", kasirAccess: false },
  { id: "transaksi", kasirAccess: true },
  { id: "pengeluaran", kasirAccess: false },
  { id: "laporan", kasirAccess: false },
  { id: "data_kasir", kasirAccess: false },
  { id: "aktivitas_login", kasirAccess: false },
  { id: "role_permission", kasirAccess: false },
  { id: "pengaturan", kasirAccess: false },
];

function normalizeRole(role) {
  const normalized = String(role || "").toLowerCase();
  return normalized === "kasir" ? "cashier" : normalized;
}

function getCurrentUser() {
  const savedUser = localStorage.getItem("nikky_user");

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    localStorage.removeItem("nikky_user");
    return null;
  }
}

function getPermissions() {
  const savedPermissions = localStorage.getItem("nikky_user_permissions_kasir") ||
    localStorage.getItem("nikky_permissions") ||
    localStorage.getItem("nikky_kasir_permissions");

  if (!savedPermissions) {
    return defaultPermissions;
  }

  try {
    return JSON.parse(savedPermissions);
  } catch (error) {
    localStorage.removeItem("nikky_user_permissions_kasir");
    localStorage.removeItem("nikky_permissions");
    localStorage.removeItem("nikky_kasir_permissions");
    return defaultPermissions;
  }
}

function hasKasirPermission(permissionId) {
  const permissions = getPermissions();
  const permission = permissions.find((item) => item.id === permissionId);

  return permission?.kasirAccess === true;
}

function GuestRoute({ children }) {
  const currentUser = getCurrentUser();

  if (currentUser?.role === "owner") {
    return <Navigate to="/owner/dashboard" replace />;
  }

  if (currentUser?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (normalizeRole(currentUser?.role) === "cashier") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ProtectedRoute({ children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function OwnerOnlyRoute({ children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (normalizeRole(currentUser.role) !== "owner") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AdminOnlyRoute({ children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (normalizeRole(currentUser.role) !== "admin") {
    if (normalizeRole(currentUser.role) === "owner") {
      return <Navigate to="/owner/dashboard" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

function PermissionRoute({ permissionId, children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (normalizeRole(currentUser.role) === "owner" || normalizeRole(currentUser.role) === "admin") {
    return children;
  }

  if (normalizeRole(currentUser.role) === "cashier") {
    const allowed = hasKasirPermission(permissionId);

    if (!allowed) {
      return <AccessDenied permissionId={permissionId} />;
    }

    return children;
  }

  return <Navigate to="/login" replace />;
}

function RoleRedirect() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (normalizeRole(currentUser.role) === "owner") {
    return <Navigate to="/owner/dashboard" replace />;
  }

  if (normalizeRole(currentUser.role) === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <PermissionRoute permissionId="pos">
      <KasirPage />
    </PermissionRoute>
  );
}

function AccessDenied({ permissionId }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl">
          🔒
        </div>

        <h2 className="text-2xl font-bold text-slate-800">
          Akses Tidak Diizinkan
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Akun kasir tidak memiliki izin untuk membuka halaman ini. Permission
          yang dibutuhkan adalah{" "}
          <span className="font-bold text-slate-700">{permissionId}</span>.
          Silakan hubungi owner untuk mengaktifkan akses melalui menu Role &
          Permission.
        </p>

        <button
          onClick={() => window.history.back()}
          className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}

function AdminFeaturePlaceholder({ title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B63CE]">
        Admin Gudang
      </p>
      <h1 className="mt-2 text-2xl font-black text-slate-950">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
        Halaman ini sudah disiapkan di routing. Setelah dashboard admin selesai,
        bagian ini bisa kita isi dengan form dan tabel operasional.
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleRedirect />} />

          <Route
            path="owner/dashboard"
            element={
              <OwnerOnlyRoute>
                <OwnerDashboard />
              </OwnerOnlyRoute>
            }
          />

          <Route
            path="owner/data-kasir"
            element={
              <OwnerOnlyRoute>
                <DataKasirPage />
              </OwnerOnlyRoute>
            }
          />

          <Route
            path="owner/aktivitas-login"
            element={
              <OwnerOnlyRoute>
                <AktivitasLoginPage />
              </OwnerOnlyRoute>
            }
          />

          <Route
            path="owner/role-permission"
            element={
              <OwnerOnlyRoute>
                <RolePermissionPage />
              </OwnerOnlyRoute>
            }
          />

          <Route
            path="admin/dashboard"
            element={
              <AdminOnlyRoute>
                <AdminDashboard />
              </AdminOnlyRoute>
            }
          />

          <Route
            path="admin/produk"
            element={
              <AdminOnlyRoute>
                <AdminProdukPage />
              </AdminOnlyRoute>
            }
          />

          <Route
            path="admin/mutasi"
            element={
              <AdminOnlyRoute>
                <AdminMutasiPage />
              </AdminOnlyRoute>
            }
          />

          <Route
            path="admin/riwayat"
            element={
              <AdminOnlyRoute>
                <AdminRiwayatStok />
              </AdminOnlyRoute>
            }
          />

          <Route
            path="shift"
            element={
              <PermissionRoute permissionId="shift">
                <ShiftPage />
              </PermissionRoute>
            }
          />

          <Route
            path="barang"
            element={
              <PermissionRoute permissionId="barang">
                <BarangPage />
              </PermissionRoute>
            }
          />

          <Route
            path="transaksi"
            element={
              <PermissionRoute permissionId="transaksi">
                <TransaksiPage />
              </PermissionRoute>
            }
          />

          <Route
            path="laporan"
            element={
              <PermissionRoute permissionId="laporan">
                <LaporanPage />
              </PermissionRoute>
            }
          />

          <Route
            path="pengeluaran"
            element={
              <PermissionRoute permissionId="pengeluaran">
                <PengeluaranPage />
              </PermissionRoute>
            }
          />

          <Route
            path="pengaturan"
            element={
              <PermissionRoute permissionId="pengaturan">
                <PengaturanPage />
              </PermissionRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
