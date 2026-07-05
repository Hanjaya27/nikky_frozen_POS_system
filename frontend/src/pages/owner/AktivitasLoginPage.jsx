import { useEffect, useMemo, useState } from "react";

import {
  getOwnerLoginActivities,
  forceLogoutActivity,
  deleteLoginActivity,
} from "../../services/api";

const branches = ["Semua", "Cabang 1", "Cabang 2", "Semua Cabang"];
const shifts = ["Semua", "Shift Pagi", "Shift Sore", "Monitoring Owner"];
const statuses = ["Semua", "Login", "Logout"];
const roles = ["Semua", "owner", "admin", "cashier"];

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

function getBranchIdByName(branchName) {
  if (branchName === "Cabang 1") return 1;
  if (branchName === "Cabang 2") return 2;

  return null;
}

function formatRoleLabel(role) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  if (role === "cashier" || role === "kasir") return "Kasir";
  return role || "-";
}

function normalizeActivity(activity) {
  return {
    id: activity.id,
    user_id: activity.user_id,
    branch_id: activity.branch_id,

    name: activity.user_name || activity.name || "-",
    username: activity.username || "-",
    role: activity.role || "-",

    branch: activity.branch_name || "-",
    shift: activity.shift || activity.shift_name || "-",

    loginTime: activity.login_at,
    logoutTime: activity.logout_at,

    status: activity.status === "login" ? "Login" : "Logout",
    device: activity.device || "-",
    ipAddress: activity.ip_address || "-",
    note: activity.note || "-",
  };
}

function AktivitasLoginPage() {
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const [selectedShift, setSelectedShift] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedRole, setSelectedRole] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const params = {};

      if (selectedBranch !== "Semua" && selectedBranch !== "Semua Cabang") {
        params.branch_id = getBranchIdByName(selectedBranch);
      }

      if (selectedRole !== "Semua") {
        params.role = selectedRole;
      }

      if (selectedStatus !== "Semua") {
        params.status = selectedStatus.toLowerCase();
      }

      if (selectedShift !== "Semua") {
        params.shift = selectedShift;
      }

      if (selectedDate) {
        params.date = selectedDate;
      }

      if (searchKeyword.trim()) {
        params.search = searchKeyword.trim();
      }

      const response = await getOwnerLoginActivities(params);
      const activityData = response.activities || [];
      const summaryData = response.summary || {};

      const normalizedActivities = activityData.map(normalizeActivity);

      setActivities(normalizedActivities);
      setSummary(summaryData);
    } catch (error) {
      setErrorMessage(
        error.message || "Gagal mengambil data aktivitas login dari backend."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedBranch, selectedRole, selectedStatus, selectedShift, selectedDate, searchKeyword]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 2500);
  };

  const handleRefresh = async () => {
    await fetchActivities();
    showSuccess("Data aktivitas login berhasil diperbarui.");
  };

  const handleForceLogout = async (activity) => {
    const confirmLogout = confirm(`Yakin ingin force logout user ${activity.username}?`);
    if (!confirmLogout) return;

    try {
      setErrorMessage("");
      await forceLogoutActivity(activity.id);
      await fetchActivities();
      showSuccess("Status login berhasil diubah menjadi logout.");
    } catch (error) {
      alert(error.message || "Gagal melakukan force logout.");
    }
  };

  const handleDelete = async (activity) => {
    const confirmDelete = confirm(`Yakin ingin menghapus aktivitas login ${activity.username}?`);
    if (!confirmDelete) return;

    try {
      setErrorMessage("");
      await deleteLoginActivity(activity.id);
      await fetchActivities();
      showSuccess("Data aktivitas login berhasil dihapus.");
    } catch (error) {
      alert(error.message || "Gagal menghapus aktivitas login.");
    }
  };

  const exportCSV = () => {
    if (activities.length === 0) {
      alert("Tidak ada data aktivitas login untuk diexport.");
      return;
    }

    const headers = ["Nama", "Username", "Role", "Cabang", "Shift", "Waktu Login", "Waktu Logout", "Status", "Device", "IP Address"];
    const rows = activities.map((activity) => [
      activity.name,
      activity.username,
      formatRoleLabel(activity.role),
      activity.branch,
      activity.shift,
      formatDateTime(activity.loginTime),
      formatDateTime(activity.logoutTime),
      activity.status,
      activity.device,
      activity.ipAddress,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((item) => `"${item}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aktivitas-login-nikky-frozen.csv";
    link.click();
    URL.revokeObjectURL(url);
    showSuccess("Data aktivitas login berhasil diexport.");
  };

  return (
    <div className="min-h-screen bg-[#FEF6EC] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C80503]">OWNER</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#2A1712] sm:text-3xl">Aktivitas Login</h1>
          <p className="mt-1 text-sm font-semibold text-[#7A6258]">Pantau aktivitas login semua user dari seluruh cabang.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#2A1712] hover:bg-[#FFF6EA]"
          >
            Refresh Data
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#2A1712] hover:bg-[#FFF6EA]"
          >
            Export CSV
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Aktivitas" value={summary.total_activities ?? 0} tone="red" />
        <StatCard label="Sedang Login" value={summary.currently_login ?? 0} tone="green" />
        <StatCard label="Sudah Logout" value={summary.logged_out ?? 0} tone="red" />
        <StatCard label="Owner" value={summary.owner_count ?? 0} tone="red" />
        <StatCard label="Admin" value={summary.admin_count ?? 0} tone="orange" />
        <StatCard label="Kasir" value={summary.cashier_count ?? 0} tone="red" />
        <StatCard label="Cabang 1" value={summary.branch_1_count ?? 0} tone="orange" />
        <StatCard label="Cabang 2" value={summary.branch_2_count ?? 0} tone="orange" />
      </div>

      <div className="rounded-[24px] border border-[#EBCDB8] bg-[#FFFDF8] p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-[#2A1712]">Riwayat Aktivitas Login</h2>
            <p className="mt-1 text-sm font-medium text-[#7A6258]">Data diambil dari backend login_activities.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === "Semua" ? "Semua Role" : formatRoleLabel(role)}
                </option>
              ))}
            </select>

            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch === "Semua" ? "Semua Cabang" : branch}
                </option>
              ))}
            </select>

            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"
            >
              {shifts.map((shift) => (
                <option key={shift} value={shift}>
                  {shift === "Semua" ? "Semua Shift" : shift}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "Semua" ? "Semua Status" : status}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"
            />

            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Cari user..."
              className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] placeholder-[#8A6F66] outline-none focus:border-[#C80503]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-[#EBCDB8] p-10 text-center text-sm font-semibold text-[#7A6258]">
            Mengambil data aktivitas login dari backend...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#EBCDB8]">
            <table className="w-full min-w-[1250px] text-left text-sm">
              <thead className="bg-[#FFF6EA] text-xs font-black uppercase text-[#7A6258]">
                <tr>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Login</th>
                  <th className="px-4 py-3">Logout</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBCDB8] bg-white">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-[#FFFDF8]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black ${
                            activity.role === "owner"
                              ? "bg-[#FFF6EA] text-[#C80503]"
                              : activity.role === "admin"
                              ? "bg-orange-50 text-orange-700"
                              : "bg-gray-50 text-gray-700"
                          }`}>
                            {activity.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-black text-[#2A1712]">{activity.name}</p>
                            <p className="text-xs font-semibold text-[#8A6F66]">@{activity.username}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${
                          activity.role === "owner"
                            ? "bg-[#FFF6EA] text-[#C80503] ring-[#F3D6C4]"
                            : activity.role === "admin"
                            ? "bg-orange-50 text-orange-700 ring-orange-100"
                            : "bg-gray-50 text-gray-700 ring-gray-100"
                        }`}>
                          {formatRoleLabel(activity.role)}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-semibold text-[#5F4B45]">{activity.branch}</td>
                      <td className="px-4 py-4 font-semibold text-[#5F4B45]">{activity.shift}</td>
                      <td className="px-4 py-4 font-semibold text-[#5F4B45]">{formatDateTime(activity.loginTime)}</td>
                      <td className="px-4 py-4 font-semibold text-[#5F4B45]">{formatDateTime(activity.logoutTime)}</td>
                      <td className="px-4 py-4 font-semibold text-[#5F4B45]">{activity.device}</td>
                      <td className="px-4 py-4 font-semibold text-[#5F4B45]">{activity.ipAddress}</td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${
                          activity.status === "Login"
                            ? "bg-green-50 text-green-700 ring-green-100"
                            : "bg-red-50 text-red-700 ring-red-100"
                        }`}>
                          {activity.status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          {activity.status === "Login" && (
                            <button
                              type="button"
                              onClick={() => handleForceLogout(activity)}
                              className="rounded-xl border border-[#EBCDB8] bg-[#FFFDF8] px-3 py-2 text-xs font-black text-[#2A1712] hover:bg-[#FFF6EA]"
                            >
                              Force Logout
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(activity)}
                            className="rounded-xl border border-[#EBCDB8] bg-[#FFF6EA] px-3 py-2 text-xs font-black text-[#C80503] hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-sm font-semibold text-[#7A6258]">
                      {errorMessage || "Data aktivitas login tidak ditemukan."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-sm font-semibold text-[#7A6258]">
          Menampilkan {activities.length} data aktivitas login.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone = "red" }) {
  const tones = {
    red: "bg-[#FFF6EA] text-[#C80503]",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="rounded-[24px] border border-[#EBCDB8] bg-[#FFFDF8] p-5 shadow-sm">
      <p className="text-sm font-semibold text-[#7A6258]">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tones[tone] || tones.red}`}>{value}</p>
    </div>
  );
}

export default AktivitasLoginPage;