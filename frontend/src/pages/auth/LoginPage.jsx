import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../services/api";

const branches = ["Cabang 1", "Cabang 2"];
const shifts = ["Shift Pagi", "Shift Sore"];

function formatDateTime(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userType: "kasir",
    username: "",
    password: "",
    branch: "Cabang 1",
    shift: "Shift Pagi",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setErrorMessage("");
  };

  const handleUserTypeChange = (userType) => {
    setFormData((prevData) => ({
      ...prevData,
      userType,
      username: "",
      password: "",
      branch: userType === "owner" ? "Semua Cabang" : "Cabang 1",
      shift: userType === "owner" ? "Monitoring Owner" : "Shift Pagi",
    }));

    setErrorMessage("");
  };

  const saveLoginSession = (loginData) => {
    const user = loginData.user;
    const loginActivityId = loginData.login_activity_id;

    const loginSession = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id,
      branch: user.role === "owner" ? "Semua Cabang" : user.branch,
      branch_code: user.branch_code,
      shift: user.shift,
      phone: user.phone,
      status: user.status,
      loginTime: formatDateTime(),
      last_login_at: user.last_login_at,
      loginActivityId,
    };

    localStorage.setItem("nikky_user", JSON.stringify(loginSession));
    localStorage.setItem("nikky_login_activity_id", String(loginActivityId));
  };

  const validateLoginResult = (user) => {
    if (user.role !== formData.userType) {
      return `Akun ini terdaftar sebagai ${user.role}, bukan ${formData.userType}.`;
    }

    if (user.status !== "Aktif") {
      return "Akun ini sedang nonaktif. Silakan hubungi owner.";
    }

    if (user.role === "kasir") {
      if (user.branch !== formData.branch) {
        return `Akun ${user.username} hanya terdaftar untuk ${user.branch}.`;
      }

      if (user.shift !== formData.shift) {
        return `Akun ${user.username} terdaftar untuk ${user.shift}.`;
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username.trim()) {
      setErrorMessage("Username wajib diisi.");
      return;
    }

    if (!formData.password.trim()) {
      setErrorMessage("Password wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const loginData = await loginUser({
        username: formData.username,
        password: formData.password,
      });

      const validationMessage = validateLoginResult(loginData.user);

      if (validationMessage) {
        setErrorMessage(validationMessage);
        return;
      }

      saveLoginSession(loginData);

      if (loginData.user.role === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Login gagal. Pastikan username dan password sudah benar."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden w-1/2 flex-col justify-between bg-blue-600 p-10 text-white lg:flex">
        <div>
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-blue-600">
            NF
          </div>

          <h1 className="max-w-xl text-4xl font-bold leading-tight">
            Nikky Frozen POS System
          </h1>

          <p className="mt-4 max-w-lg text-blue-100">
            Sistem kasir dan manajemen stok untuk membantu pengelolaan
            transaksi, cabang, shift kasir, stok barang, pengeluaran, dan
            laporan toko.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-blue-100">Akses Kasir</p>
            <h3 className="mt-1 text-xl font-bold">
              Kasir & Operasional Cabang
            </h3>
            <p className="mt-2 text-sm text-blue-100">
              Kasir login berdasarkan akun database, cabang, dan shift kerja.
            </p>
          </div>

          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-blue-100">Akses Owner</p>
            <h3 className="mt-1 text-xl font-bold">
              Monitoring Semua Cabang
            </h3>
            <p className="mt-2 text-sm text-blue-100">
              Owner dapat memantau laporan, transaksi, stok, pengeluaran, shift,
              dan aktivitas login kasir dari backend.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-2xl font-bold text-white">
              NF
            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              Login Sistem
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Login menggunakan akun yang tersimpan di database backend.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Jenis Pengguna
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleUserTypeChange("kasir")}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    formData.userType === "kasir"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Kasir
                </button>

                <button
                  type="button"
                  onClick={() => handleUserTypeChange("owner")}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    formData.userType === "owner"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Owner
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Masukkan username"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Masukkan password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Cabang
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={formData.userType === "owner"}
                className={`w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                  formData.userType === "owner"
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : "bg-white text-slate-700"
                }`}
              >
                {formData.userType === "owner" ? (
                  <option value="Semua Cabang">Semua Cabang</option>
                ) : (
                  branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Shift
              </label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                disabled={formData.userType === "owner"}
                className={`w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                  formData.userType === "owner"
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : "bg-white text-slate-700"
                }`}
              >
                {formData.userType === "owner" ? (
                  <option value="Monitoring Owner">Monitoring Owner</option>
                ) : (
                  shifts.map((shift) => (
                    <option key={shift} value={shift}>
                      {shift}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-2xl py-3 font-bold text-white shadow-sm ${
                isSubmitting
                  ? "bg-slate-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Memproses Login..." : "Masuk ke Sistem"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            <p className="font-bold text-slate-700">Akun Demo Backend:</p>
            <p className="mt-1">Owner: owner / owner123</p>
            <p>Kasir Cabang 1: kasir1 / kasir123</p>
            <p>Kasir Cabang 2: kasir2 / kasir123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;