import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Snowflake, User, Lock, Store, Clock, Eye, EyeOff, LogIn } from "lucide-react";

import { loginUser } from "../../services/api";
import frozenFoodImage from "../../assets/Frozen food.jpg";

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
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setErrorMessage("");
  };

  const handleUserTypeChange = (userType) => {
    let defaultBranch = "Cabang 1";
    let defaultShift = "Shift Pagi";
    
    if (userType === "owner") {
      defaultBranch = "Semua Cabang";
      defaultShift = "Monitoring Owner";
    } else if (userType === "admin") {
      defaultShift = "Tanpa Shift";
    }

    setFormData((prevData) => ({
      ...prevData,
      userType,
      username: "",
      password: "",
      branch: defaultBranch,
      shift: defaultShift,
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
    localStorage.setItem(
      "nikky_login_activity_id",
      String(loginActivityId)
    );
  };

  const validateLoginResult = (user) => {
    if (user.role !== formData.userType) {
      return `Akun ini terdaftar sebagai ${user.role}, bukan ${formData.userType}.`;
    }

    if (user.status !== "Aktif") {
      return "Akun ini sedang nonaktif. Silakan hubungi owner.";
    }

    if (user.role === "kasir" || user.role === "admin") {
      if (user.branch !== formData.branch) {
        return `Akun ${user.username} hanya terdaftar untuk ${user.branch}.`;
      }
    }

    if (user.role === "kasir") {
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
      } else if (loginData.user.role === "admin") {
        navigate("/admin/dashboard");
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
    <div className="flex h-screen overflow-hidden bg-[#FFF6EA] font-sans">
      {/* Panel gambar sebelah kiri */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex">
        {/* Foto frozen food */}
        <img
          src={frozenFoodImage}
          alt="Produk frozen food Nikky Frozen"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Overlay gelap agar tulisan terlihat */}
        <div className="absolute inset-0 bg-[#1B120E]/70" />

        {/* Gradasi untuk memperjelas bagian bawah */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B120E]/90 via-transparent to-transparent" />

        {/* Isi panel kiri */}
        <div className="relative z-10 flex w-full flex-col justify-center p-14 text-white">
          <div className="max-w-xl">
            <h1 className="text-5xl font-black leading-tight tracking-tight drop-shadow-lg">
              <span className="text-[#C80503]">Nikky</span> Frozen<br/>
              POS System
            </h1>

            <div className="mt-6 h-1 w-24 rounded-full bg-[#C80503]" />

            <p className="mt-6 text-lg leading-relaxed text-slate-200 drop-shadow-md">
              Sistem kasir dan manajemen stok untuk membantu pengelolaan transaksi, cabang, shift kasir, stok barang, pengeluaran, dan laporan toko.
            </p>
          </div>
        </div>
      </div>

      {/* Panel login sebelah kanan */}
      <div className="flex w-full items-center justify-center px-4 py-4 lg:w-1/2">
        <div className="w-full max-w-md rounded-[2rem] border border-[#EBCDB8] bg-[#FFFDF8] p-6 lg:p-8 shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C80503] text-white shadow-md shadow-[#C80503]/20">
              <Snowflake className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-bold text-[#2A1712]">
              Login Sistem
            </h2>

            <p className="mt-1 text-xs text-[#7A6258] px-2">
              Login menggunakan akun dari database backend.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#2A1712]">
                Jenis Pengguna
              </label>
              
              <div className="flex rounded-xl border border-[#EBCDB8] bg-white p-1">
                <button
                  type="button"
                  onClick={() => handleUserTypeChange("kasir")}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all duration-200 ${formData.userType === "kasir"
                      ? "bg-[#C80503] text-white shadow-sm"
                      : "text-[#7A6258] hover:bg-[#FFF6EA]"
                    }`}
                >
                  Kasir
                </button>

                <button
                  type="button"
                  onClick={() => handleUserTypeChange("admin")}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all duration-200 ${formData.userType === "admin"
                      ? "bg-[#C80503] text-white shadow-sm"
                      : "text-[#7A6258] hover:bg-[#FFF6EA]"
                    }`}
                >
                  Admin
                </button>

                <button
                  type="button"
                  onClick={() => handleUserTypeChange("owner")}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all duration-200 ${formData.userType === "owner"
                      ? "bg-[#C80503] text-white shadow-sm"
                      : "text-[#7A6258] hover:bg-[#FFF6EA]"
                    }`}
                >
                  Owner
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#2A1712]">
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#C80503]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className="w-full rounded-xl border border-[#EBCDB8] bg-white py-2.5 pl-10 pr-4 text-sm text-[#2A1712] placeholder:text-[#EBCDB8] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#2A1712]">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#C80503]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-[#EBCDB8] bg-white py-2.5 pl-10 pr-10 text-sm text-[#2A1712] placeholder:text-[#EBCDB8] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#C80503] hover:text-[#8B0306] focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#2A1712]">
                Cabang
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#C80503]">
                  <Store className="h-4 w-4" />
                </div>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  disabled={formData.userType === "owner"}
                  className={`w-full appearance-none rounded-xl border border-[#EBCDB8] py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20 ${formData.userType === "owner"
                      ? "cursor-not-allowed bg-[#FFF6EA] text-[#7A6258]"
                      : "bg-white text-[#2A1712]"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#2A1712]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {formData.userType === "kasir" && (
              <div>
                <label className="mb-1.5 block text-sm font-bold text-[#2A1712]">
                  Shift
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#C80503]">
                    <Clock className="h-4 w-4" />
                  </div>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-[#EBCDB8] bg-white py-2.5 pl-10 pr-10 text-sm text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
                  >
                    {shifts.map((shift) => (
                      <option key={shift} value={shift}>
                        {shift}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#2A1712]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 mt-2 font-bold text-white shadow-md transition-all ${isSubmitting
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-[#C80503] hover:bg-[#8B0306] hover:shadow-[#C80503]/30"
                }`}
            >
              {isSubmitting ? (
                "Memproses Login..."
              ) : (
                <>
                  Masuk ke Sistem <LogIn className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;