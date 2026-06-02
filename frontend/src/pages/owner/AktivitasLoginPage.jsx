import { useEffect, useMemo, useState } from "react";

import {
  deleteLoginActivity,
  forceLogoutActivity,
  getLoginActivities,
} from "../../services/api";

const branches = ["Semua", "Cabang 1", "Cabang 2", "Semua Cabang"];
const shifts = ["Semua", "Shift Pagi", "Shift Sore", "Monitoring Owner"];
const statuses = ["Semua", "Login", "Logout"];
const roles = ["Semua", "owner", "kasir"];

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
  if (role === "kasir") return "Kasir";

  return role || "-";
}

function normalizeActivity(activity) {
  return {
    id: activity.id,
    user_id: activity.user_id,
    branch_id: activity.branch_id,

    name: activity.name || activity.user?.name || "-",
    username: activity.username || activity.user?.username || "-",
    role: activity.role || activity.user?.role || "-",

    branch:
      activity.branch_name ||
      activity.branch?.name ||
      (activity.role === "owner" ? "Semua Cabang" : "-"),

    shift: activity.shift_name || "-",

    loginTime: activity.login_at,
    logoutTime: activity.logout_at,

    status: activity.status || "Login",
    device: activity.device || "-",
    ipAddress: activity.ip_address || "-",
    userAgent: activity.user_agent || "-",
    note: activity.note || "-",
  };
}

function AktivitasLoginPage() {
  const [activities, setActivities] = useState([]);

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
        params.status = selectedStatus;
      }

      if (selectedShift !== "Semua") {
        params.shift_name = selectedShift;
      }

      if (selectedDate) {
        params.date = selectedDate;
      }

      if (searchKeyword.trim()) {
        params.search = searchKeyword.trim();
      }

      const activityData = await getLoginActivities(params);
      const normalizedActivities = activityData.map(normalizeActivity);

      setActivities(normalizedActivities);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data aktivitas login dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedBranch, selectedRole, selectedStatus, selectedShift, selectedDate]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const keyword = searchKeyword.toLowerCase();

      const matchSearch =
        activity.name?.toLowerCase().includes(keyword) ||
        activity.username?.toLowerCase().includes(keyword) ||
        activity.branch?.toLowerCase().includes(keyword) ||
        activity.shift?.toLowerCase().includes(keyword) ||
        activity.device?.toLowerCase().includes(keyword);

      return matchSearch;
    });
  }, [activities, searchKeyword]);

  const totalActivity = activities.length;

  const activeLogin = activities.filter(
    (activity) => activity.status === "Login"
  ).length;

  const logoutActivity = activities.filter(
    (activity) => activity.status === "Logout"
  ).length;

  const ownerActivity = activities.filter(
    (activity) => activity.role === "owner"
  ).length;

  const cashierActivity = activities.filter(
    (activity) => activity.role === "kasir"
  ).length;

  const branchOneActivity = activities.filter(
    (activity) => activity.branch === "Cabang 1"
  ).length;

  const branchTwoActivity = activities.filter(
    (activity) => activity.branch === "Cabang 2"
  ).length;

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  const handleRefresh = async () => {
    await fetchActivities();
    showSuccess("Data aktivitas login berhasil diperbarui dari backend.");
  };

  const handleForceLogout = async (activity) => {
    const confirmLogout = confirm(
      `Yakin ingin force logout user ${activity.username}?`
    );

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
    const confirmDelete = confirm(
      `Yakin ingin menghapus aktivitas login ${activity.username}?`
    );

    if (!confirmDelete) return;

    try {
      setErrorMessage("");

      await deleteLoginActivity(activity.id);
      await fetchActivities();

      showSuccess("Data aktivitas login berhasil dihapus dari backend.");
    } catch (error) {
      alert(error.message || "Gagal menghapus aktivitas login.");
    }
  };

  const exportCSV = () => {
    if (filteredActivities.length === 0) {
      alert("Tidak ada data aktivitas login untuk diexport.");
      return;
    }

    const headers = [
      "Nama",
      "Username",
      "Role",
      "Cabang",
      "Shift",
      "Waktu Login",
      "Waktu Logout",
      "Status",
      "Device",
      "IP Address",
      "Catatan",
    ];

    const rows = filteredActivities.map((activity) => [
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
      activity.note,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((item) => `"${item}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "aktivitas-login-nikky-frozen.csv";
    link.click();

    URL.revokeObjectURL(url);
    showSuccess("Data aktivitas login berhasil diexport.");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Aktivitas Login
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pantau aktivitas login owner dan kasir berdasarkan cabang, shift,
            perangkat, dan status dari backend.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm hover:bg-green-50"
          >
            Refresh Data
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
          >
            Export CSV
          </button>
        </div>
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

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <SummaryCard label="Total Aktivitas" value={totalActivity} />
        <SummaryCard
          label="Sedang Login"
          value={activeLogin}
          valueClass="text-green-600"
        />
        <SummaryCard
          label="Sudah Logout"
          value={logoutActivity}
          valueClass="text-red-600"
        />
        <SummaryCard
          label="Owner"
          value={ownerActivity}
          valueClass="text-purple-600"
        />
        <SummaryCard
          label="Kasir"
          value={cashierActivity}
          valueClass="text-blue-600"
        />
        <SummaryCard
          label="Cabang 1"
          value={branchOneActivity}
          valueClass="text-blue-600"
        />
        <SummaryCard
          label="Cabang 2"
          value={branchTwoActivity}
          valueClass="text-purple-600"
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Riwayat Aktivitas Login
            </h3>
            <p className="text-sm text-slate-500">
              Data diambil dari tabel login_activities backend.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === "Semua" ? "Semua Role" : formatRoleLabel(role)}
                </option>
              ))}
            </select>

            <select
              value={selectedBranch}
              onChange={(event) => setSelectedBranch(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch === "Semua" ? "Semua Cabang" : branch}
                </option>
              ))}
            </select>

            <select
              value={selectedShift}
              onChange={(event) => setSelectedShift(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {shifts.map((shift) => (
                <option key={shift} value={shift}>
                  {shift === "Semua" ? "Semua Shift" : shift}
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
                  {status === "Semua" ? "Semua Status" : status}
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
              placeholder="Cari user..."
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            Mengambil data aktivitas login dari backend...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                  <th className="px-4 py-4 font-semibold">Pengguna</th>
                  <th className="px-4 py-4 font-semibold">Role</th>
                  <th className="px-4 py-4 font-semibold">Cabang</th>
                  <th className="px-4 py-4 font-semibold">Shift</th>
                  <th className="px-4 py-4 font-semibold">Login</th>
                  <th className="px-4 py-4 font-semibold">Logout</th>
                  <th className="px-4 py-4 font-semibold">Device</th>
                  <th className="px-4 py-4 font-semibold">IP</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 text-center font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-slate-100 text-sm hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold ${
                            activity.role === "owner"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {activity.name?.charAt(0) || "U"}
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            {activity.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            @{activity.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          activity.role === "owner"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {formatRoleLabel(activity.role)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {activity.branch}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {activity.shift}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDateTime(activity.loginTime)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDateTime(activity.logoutTime)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {activity.device}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {activity.ipAddress}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          activity.status === "Login"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {activity.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        {activity.status === "Login" && (
                          <button
                            type="button"
                            onClick={() => handleForceLogout(activity)}
                            className="rounded-lg bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-700 hover:bg-yellow-100"
                          >
                            Force Logout
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(activity)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredActivities.length === 0 && (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Data aktivitas login tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-500">
          Menampilkan {filteredActivities.length} dari {activities.length} data
          aktivitas login.
        </p>
      </div>
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

export default AktivitasLoginPage;