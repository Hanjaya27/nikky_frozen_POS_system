import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import {
  createUser,
  deleteUser,
  getSettingsApi,
  getUsers,
  updateSettingsApi,
  updateUser,
} from "../../services/api";

const initialStoreProfile = {
  storeName: "Nikky Frozen",
  address: "Klaten, Jawa Tengah",
  phone: "0272-000000",
  whatsapp: "081234567890",
  npwp: "",
  logoName: "",
};

const initialReceiptSetting = {
  ppnActive: true,
  ppnRate: 11,
  maxDiscount: 10,
  roundingType: "Tidak ada pembulatan",
  invoiceFormat: "INV-{YYYY}{MM}{DD}-{0000}",
  resetNumber: "Reset setiap hari",
  paperSize: "Thermal 80mm",
  margin: 5,
  autoPrint: true,
  showCashierName: true,
  showBranchName: true,
  footerNote: "Terima kasih telah berbelanja di Nikky Frozen.",
};

const initialUserForm = {
  name: "",
  username: "",
  password: "",
  branch_id: 1,
  shift_name: "Shift Pagi",
  phone: "",
  status: "Aktif",
};

function getBranchNameById(branchId) {
  if (Number(branchId) === 1) return "Cabang 1";
  if (Number(branchId) === 2) return "Cabang 2";

  return "Semua Cabang";
}

function getBranchIdByName(branchName) {
  if (branchName === "Cabang 1") return 1;
  if (branchName === "Cabang 2") return 2;

  return null;
}

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

function normalizeUser(user) {
  const isOwner = user.role === "owner";

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    roleLabel: isOwner ? "Owner" : "Kasir",
    branch_id: user.branch_id,
    branch: isOwner
      ? "Semua Cabang"
      : user.branch?.name || getBranchNameById(user.branch_id),
    shift: user.shift_name || (isOwner ? "Monitoring Owner" : "-"),
    phone: user.phone || "-",
    status: user.status || "Aktif",
    lastLogin: user.last_login_at,
  };
}

function normalizeReceiptSetting(data) {
  return {
    ...initialReceiptSetting,
    ...data,
    ppnActive: Boolean(data?.ppnActive),
    ppnRate: Number(data?.ppnRate ?? initialReceiptSetting.ppnRate),
    maxDiscount: Number(data?.maxDiscount ?? initialReceiptSetting.maxDiscount),
    margin: Number(data?.margin ?? initialReceiptSetting.margin),
    autoPrint: Boolean(data?.autoPrint),
    showCashierName: Boolean(data?.showCashierName),
    showBranchName: Boolean(data?.showBranchName),
  };
}

function PengaturanPage() {
  const [activeTab, setActiveTab] = useState("profil");

  const [storeProfile, setStoreProfile] = useState(initialStoreProfile);
  const [receiptSetting, setReceiptSetting] = useState(initialReceiptSetting);
  const [users, setUsers] = useState([]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(initialUserForm);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true);
      setErrorMessage("");

      const settingsData = await getSettingsApi();

      const profileData = {
        ...initialStoreProfile,
        ...(settingsData.store_profile || {}),
      };

      const receiptData = normalizeReceiptSetting(
        settingsData.receipt_setting || {}
      );

      setStoreProfile(profileData);
      setReceiptSetting(receiptData);

      localStorage.setItem("nikky_store_profile", JSON.stringify(profileData));
      localStorage.setItem("nikky_receipt_setting", JSON.stringify(receiptData));
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil pengaturan dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setErrorMessage("");

      const userData = await getUsers();
      setUsers(userData.map(normalizeUser));
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data pengguna dari backend."
      );
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = searchKeyword.toLowerCase();

      const matchSearch =
        user.name?.toLowerCase().includes(keyword) ||
        user.username?.toLowerCase().includes(keyword) ||
        user.roleLabel?.toLowerCase().includes(keyword) ||
        user.branch?.toLowerCase().includes(keyword);

      const matchBranch =
        selectedBranch === "Semua" || user.branch === selectedBranch;

      const matchStatus =
        selectedStatus === "Semua" || user.status === selectedStatus;

      return matchSearch && matchBranch && matchStatus;
    });
  }, [users, searchKeyword, selectedBranch, selectedStatus]);

  const totalUsers = users.length;
  const totalCashier = users.filter((user) => user.role === "kasir").length;
  const activeCashier = users.filter(
    (user) => user.role === "kasir" && user.status === "Aktif"
  ).length;
  const inactiveCashier = users.filter(
    (user) => user.role === "kasir" && user.status === "Nonaktif"
  ).length;

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setStoreProfile((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleReceiptChange = (event) => {
    const { name, value } = event.target;

    setReceiptSetting((prevData) => ({
      ...prevData,
      [name]: ["ppnRate", "maxDiscount", "margin"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleToggleReceipt = (name) => {
    setReceiptSetting((prevData) => ({
      ...prevData,
      [name]: !prevData[name],
    }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setStoreProfile((prevData) => ({
      ...prevData,
      logoName: file.name,
    }));
  };

  const getSettingsPayload = (profile = storeProfile, receipt = receiptSetting) => {
    return {
      store_profile: {
        ...profile,
        storeName: profile.storeName,
        address: profile.address,
        phone: profile.phone,
        whatsapp: profile.whatsapp || "",
        npwp: profile.npwp || "",
        logoName: profile.logoName || "",
      },
      receipt_setting: {
        ...receipt,
        ppnActive: Boolean(receipt.ppnActive),
        ppnRate: Number(receipt.ppnRate || 0),
        maxDiscount: Number(receipt.maxDiscount || 0),
        roundingType: receipt.roundingType,
        invoiceFormat: receipt.invoiceFormat,
        resetNumber: receipt.resetNumber,
        paperSize: receipt.paperSize,
        margin: Number(receipt.margin || 0),
        autoPrint: Boolean(receipt.autoPrint),
        showCashierName: Boolean(receipt.showCashierName),
        showBranchName: Boolean(receipt.showBranchName),
        footerNote: receipt.footerNote || "",
      },
    };
  };

  const saveSettings = async (profile = storeProfile, receipt = receiptSetting) => {
    const payload = getSettingsPayload(profile, receipt);

    const updatedSettings = await updateSettingsApi(payload);

    const updatedProfile = {
      ...initialStoreProfile,
      ...(updatedSettings.store_profile || payload.store_profile),
    };

    const updatedReceipt = normalizeReceiptSetting(
      updatedSettings.receipt_setting || payload.receipt_setting
    );

    setStoreProfile(updatedProfile);
    setReceiptSetting(updatedReceipt);

    localStorage.setItem("nikky_store_profile", JSON.stringify(updatedProfile));
    localStorage.setItem("nikky_receipt_setting", JSON.stringify(updatedReceipt));
  };

  const saveProfile = async () => {
    if (!storeProfile.storeName || !storeProfile.address || !storeProfile.phone) {
      alert("Nama toko, alamat, dan nomor telepon wajib diisi.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      await saveSettings(storeProfile, receiptSetting);

      showSuccess("Profil toko berhasil disimpan ke backend.");
    } catch (error) {
      alert(error.message || "Gagal menyimpan profil toko.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveReceiptSetting = async () => {
    if (Number(receiptSetting.ppnRate) < 0) {
      alert("PPN tidak boleh bernilai negatif.");
      return;
    }

    if (Number(receiptSetting.maxDiscount) < 0) {
      alert("Diskon maksimal tidak boleh bernilai negatif.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      await saveSettings(storeProfile, receiptSetting);

      showSuccess("Pengaturan struk dan pajak berhasil disimpan ke backend.");
    } catch (error) {
      alert(error.message || "Gagal menyimpan pengaturan struk.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetProfile = async () => {
    const confirmReset = confirm("Yakin ingin mereset profil toko?");

    if (!confirmReset) return;

    try {
      setIsSaving(true);
      await saveSettings(initialStoreProfile, receiptSetting);
      showSuccess("Profil toko berhasil direset.");
    } catch (error) {
      alert(error.message || "Gagal reset profil toko.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetReceiptSetting = async () => {
    const confirmReset = confirm("Yakin ingin mereset pengaturan struk?");

    if (!confirmReset) return;

    try {
      setIsSaving(true);
      await saveSettings(storeProfile, initialReceiptSetting);
      showSuccess("Pengaturan struk berhasil direset.");
    } catch (error) {
      alert(error.message || "Gagal reset pengaturan struk.");
    } finally {
      setIsSaving(false);
    }
  };

  const openAddUserModal = () => {
    setModalMode("add");
    setEditingUser(null);
    setUserForm(initialUserForm);
    setShowUserModal(true);
  };

  const openEditUserModal = (user) => {
    if (user.role === "owner") {
      showSuccess("Data owner tidak dapat diedit melalui halaman ini.");
      return;
    }

    setModalMode("edit");
    setEditingUser(user);
    setUserForm({
      name: user.name,
      username: user.username,
      password: "",
      branch_id: user.branch_id || 1,
      shift_name: user.shift,
      phone: user.phone === "-" ? "" : user.phone,
      status: user.status,
    });
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setModalMode("add");
    setEditingUser(null);
    setUserForm(initialUserForm);
  };

  const handleUserFormChange = (event) => {
    const { name, value } = event.target;

    setUserForm((prevData) => ({
      ...prevData,
      [name]: name === "branch_id" ? Number(value) : value,
    }));
  };

  const getUserPayload = () => {
    const payload = {
      name: userForm.name,
      username: userForm.username,
      email: `${userForm.username}@nikkyfrozen.test`,
      role: "kasir",
      branch_id: Number(userForm.branch_id),
      shift_name: userForm.shift_name,
      phone: userForm.phone,
      status: userForm.status,
    };

    if (userForm.password.trim()) {
      payload.password = userForm.password;
    }

    return payload;
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();

    if (!userForm.name || !userForm.username || !userForm.phone) {
      alert("Lengkapi nama, username, dan nomor telepon.");
      return;
    }

    if (modalMode === "add" && !userForm.password) {
      alert("Password wajib diisi untuk kasir baru.");
      return;
    }

    if (userForm.password && userForm.password.length < 6) {
      alert("Password minimal 6 karakter.");
      return;
    }

    if (userForm.username.toLowerCase() === "owner") {
      alert("Username owner tidak boleh digunakan untuk kasir.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const payload = getUserPayload();

      if (modalMode === "edit") {
        await updateUser(editingUser.id, payload);
        showSuccess("Data kasir berhasil diperbarui ke backend.");
      } else {
        await createUser(payload);
        showSuccess("Data kasir berhasil ditambahkan ke backend.");
      }

      closeUserModal();
      await fetchUsers();
    } catch (error) {
      alert(error.message || "Gagal menyimpan data pengguna.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === "owner") {
      showSuccess("Data owner tidak dapat dihapus.");
      return;
    }

    const confirmDelete = confirm(`Yakin ingin menghapus ${user.name}?`);

    if (!confirmDelete) return;

    try {
      setIsSaving(true);
      await deleteUser(user.id);
      await fetchUsers();
      showSuccess("Data pengguna berhasil dihapus dari backend.");
    } catch (error) {
      alert(error.message || "Gagal menghapus pengguna.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    if (user.role === "owner") {
      showSuccess("Status owner tidak dapat dinonaktifkan.");
      return;
    }

    const newStatus = user.status === "Aktif" ? "Nonaktif" : "Aktif";

    const confirmUpdate = confirm(
      `Yakin ingin mengubah status ${user.name} menjadi ${newStatus}?`
    );

    if (!confirmUpdate) return;

    try {
      setIsSaving(true);

      await updateUser(user.id, {
        name: user.name,
        username: user.username,
        email: user.email || `${user.username}@nikkyfrozen.test`,
        role: "kasir",
        branch_id: user.branch_id,
        shift_name: user.shift,
        phone: user.phone === "-" ? "" : user.phone,
        status: newStatus,
      });

      await fetchUsers();

      showSuccess(`Status pengguna berhasil diubah menjadi ${newStatus}.`);
    } catch (error) {
      alert(error.message || "Gagal mengubah status pengguna.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profil", name: "Profil Toko", icon: "🏪" },
    { id: "struk", name: "Struk & Pajak", icon: "🧾" },
    { id: "pengguna", name: "Pengguna", icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title="Pengaturan Toko"
        description="Konfigurasi profil toko, struk, pajak, printer, dan data pengguna sistem dari backend."
      />

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

      {(isLoadingSettings || isLoadingUsers || isSaving) && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
          {isSaving
            ? "Menyimpan data ke backend..."
            : "Mengambil data dari backend..."}
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-6 flex flex-wrap gap-3 rounded-2xl bg-slate-50 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {activeTab === "profil" && (
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
              <h3 className="mb-5 text-lg font-bold text-slate-800">
                Informasi Toko
              </h3>

              <div className="space-y-5">
                <InputField
                  label="Nama toko"
                  required
                  name="storeName"
                  value={storeProfile.storeName}
                  onChange={handleProfileChange}
                  placeholder="Contoh: Nikky Frozen"
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Alamat lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={storeProfile.address}
                    onChange={handleProfileChange}
                    placeholder="Contoh: Jl. Merdeka, Klaten"
                    rows="4"
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Nomor telepon"
                    required
                    name="phone"
                    value={storeProfile.phone}
                    onChange={handleProfileChange}
                    placeholder="+62"
                  />

                  <InputField
                    label="Nomor WhatsApp"
                    name="whatsapp"
                    value={storeProfile.whatsapp}
                    onChange={handleProfileChange}
                    placeholder="+62"
                  />
                </div>

                <InputField
                  label="NPWP"
                  name="npwp"
                  value={storeProfile.npwp}
                  onChange={handleProfileChange}
                  placeholder="Contoh: 01.000.000.0-000.000"
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Logo toko
                  </label>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-center text-sm text-slate-400 hover:bg-slate-100">
                      <span className="text-3xl">📄</span>
                      <span className="mt-2">Upload Logo</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.svg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="text-sm text-slate-400">
                      <p>Format: JPG, PNG, atau SVG</p>
                      <p>Untuk saat ini yang disimpan adalah nama file logo.</p>
                      {storeProfile.logoName && (
                        <p className="mt-2 font-semibold text-blue-600">
                          File dipilih: {storeProfile.logoName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-400"
                  >
                    Simpan Perubahan
                  </button>

                  <button
                    type="button"
                    onClick={resetProfile}
                    disabled={isSaving}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
                  >
                    Reset Profil
                  </button>
                </div>
              </div>
            </div>

            <PreviewProfile storeProfile={storeProfile} />
          </div>
        )}

        {activeTab === "struk" && (
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="mb-5 text-lg font-bold text-slate-800">
                  Pengaturan Pajak
                </h3>

                <div className="space-y-5">
                  <ToggleRow
                    title="PPN Aktif"
                    description="Aktifkan PPN secara default pada transaksi baru."
                    active={receiptSetting.ppnActive}
                    onClick={() => handleToggleReceipt("ppnActive")}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      type="number"
                      label="PPN (%)"
                      name="ppnRate"
                      value={receiptSetting.ppnRate}
                      onChange={handleReceiptChange}
                      placeholder="Contoh: 11"
                    />

                    <InputField
                      type="number"
                      label="Diskon Maksimal (%)"
                      name="maxDiscount"
                      value={receiptSetting.maxDiscount}
                      onChange={handleReceiptChange}
                      placeholder="Contoh: 10"
                    />
                  </div>

                  <SelectField
                    label="Pembulatan Harga"
                    name="roundingType"
                    value={receiptSetting.roundingType}
                    onChange={handleReceiptChange}
                    options={[
                      "Tidak ada pembulatan",
                      "Bulatkan ke atas",
                      "Bulatkan ke bawah",
                      "Bulatkan ke kelipatan 500",
                      "Bulatkan ke kelipatan 1000",
                    ]}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="mb-5 text-lg font-bold text-slate-800">
                  Nomor Dokumen
                </h3>

                <div className="space-y-5">
                  <InputField
                    label="Format Nomor Transaksi"
                    name="invoiceFormat"
                    value={receiptSetting.invoiceFormat}
                    onChange={handleReceiptChange}
                    placeholder="INV-{YYYY}{MM}{DD}-{0000}"
                  />

                  <SelectField
                    label="Reset Nomor Urut"
                    name="resetNumber"
                    value={receiptSetting.resetNumber}
                    onChange={handleReceiptChange}
                    options={[
                      "Reset setiap hari",
                      "Reset setiap bulan",
                      "Reset setiap tahun",
                      "Tidak reset otomatis",
                    ]}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="mb-5 text-lg font-bold text-slate-800">
                  Printer & Tampilan Struk
                </h3>

                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      label="Ukuran Kertas"
                      name="paperSize"
                      value={receiptSetting.paperSize}
                      onChange={handleReceiptChange}
                      options={["Thermal 58mm", "Thermal 80mm", "A4"]}
                    />

                    <InputField
                      type="number"
                      label="Margin (mm)"
                      name="margin"
                      value={receiptSetting.margin}
                      onChange={handleReceiptChange}
                      placeholder="Contoh: 5"
                    />
                  </div>

                  <ToggleRow
                    title="Cetak Otomatis"
                    description="Cetak struk otomatis setelah pembayaran."
                    active={receiptSetting.autoPrint}
                    onClick={() => handleToggleReceipt("autoPrint")}
                  />

                  <ToggleRow
                    title="Tampilkan Nama Kasir"
                    description="Nama kasir akan tampil pada struk transaksi."
                    active={receiptSetting.showCashierName}
                    onClick={() => handleToggleReceipt("showCashierName")}
                  />

                  <ToggleRow
                    title="Tampilkan Cabang"
                    description="Cabang transaksi akan tampil pada struk."
                    active={receiptSetting.showBranchName}
                    onClick={() => handleToggleReceipt("showBranchName")}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Catatan Footer Struk
                    </label>
                    <textarea
                      name="footerNote"
                      value={receiptSetting.footerNote}
                      onChange={handleReceiptChange}
                      rows="3"
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={saveReceiptSetting}
                      disabled={isSaving}
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-400"
                    >
                      Simpan Pengaturan Struk
                    </button>

                    <button
                      type="button"
                      onClick={resetReceiptSetting}
                      disabled={isSaving}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
                    >
                      Reset Struk
                    </button>

                    <button
                      type="button"
                      onClick={() => showSuccess("Tes cetak berhasil diproses.")}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Tes Cetak
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <ReceiptPreview
              storeProfile={storeProfile}
              receiptSetting={receiptSetting}
            />
          </div>
        )}

        {activeTab === "pengguna" && (
          <UserTab
            users={users}
            filteredUsers={filteredUsers}
            totalUsers={totalUsers}
            totalCashier={totalCashier}
            activeCashier={activeCashier}
            inactiveCashier={inactiveCashier}
            searchKeyword={searchKeyword}
            selectedBranch={selectedBranch}
            selectedStatus={selectedStatus}
            setSearchKeyword={setSearchKeyword}
            setSelectedBranch={setSelectedBranch}
            setSelectedStatus={setSelectedStatus}
            openAddUserModal={openAddUserModal}
            openEditUserModal={openEditUserModal}
            handleDeleteUser={handleDeleteUser}
            handleToggleUserStatus={handleToggleUserStatus}
            fetchUsers={fetchUsers}
          />
        )}
      </div>

      {showUserModal && (
        <UserModal
          modalMode={modalMode}
          userForm={userForm}
          isSaving={isSaving}
          onClose={closeUserModal}
          onChange={handleUserFormChange}
          onSubmit={handleUserSubmit}
        />
      )}
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ title, description, active, onClick }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
          active ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            active ? "translate-x-8" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function PreviewProfile({ storeProfile }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h3 className="text-lg font-bold text-slate-800">Preview Profil</h3>

      <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
          NF
        </div>

        <h4 className="text-xl font-bold text-slate-800">
          {storeProfile.storeName || "Nama Toko"}
        </h4>

        <p className="mt-2 text-sm text-slate-500">
          {storeProfile.address || "Alamat toko belum diisi"}
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <PreviewRow label="Telepon" value={storeProfile.phone || "-"} />
          <PreviewRow label="WhatsApp" value={storeProfile.whatsapp || "-"} />
          <PreviewRow label="NPWP" value={storeProfile.npwp || "-"} />
          <PreviewRow label="Logo" value={storeProfile.logoName || "-"} />
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function ReceiptPreview({ storeProfile, receiptSetting }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h3 className="text-lg font-bold text-slate-800">Preview Struk</h3>

      <div className="mt-5 rounded-2xl bg-white p-5 font-mono text-sm shadow-sm">
        <div className="text-center">
          <h4 className="font-bold text-slate-800">
            {storeProfile.storeName || "Nikky Frozen"}
          </h4>
          <p className="text-xs text-slate-500">
            {storeProfile.address || "Alamat toko"}
          </p>
          <p className="text-xs text-slate-500">
            Telp: {storeProfile.phone || "-"}
          </p>
        </div>

        <div className="my-4 border-t border-dashed border-slate-300" />

        <div className="space-y-1 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>No</span>
            <span>INV-20260601-0001</span>
          </div>

          {receiptSetting.showCashierName && (
            <div className="flex justify-between">
              <span>Kasir</span>
              <span>Kasir Cabang 1</span>
            </div>
          )}

          {receiptSetting.showBranchName && (
            <div className="flex justify-between">
              <span>Cabang</span>
              <span>Cabang 1</span>
            </div>
          )}
        </div>

        <div className="my-4 border-t border-dashed border-slate-300" />

        <div className="space-y-2 text-xs">
          <div>
            <p className="font-semibold">Chicken Nugget</p>
            <div className="flex justify-between text-slate-500">
              <span>1 x Rp28.000</span>
              <span>Rp28.000</span>
            </div>
          </div>

          <div>
            <p className="font-semibold">Sosis Ayam</p>
            <div className="flex justify-between text-slate-500">
              <span>2 x Rp25.000</span>
              <span>Rp50.000</span>
            </div>
          </div>
        </div>

        <div className="my-4 border-t border-dashed border-slate-300" />

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rp78.000</span>
          </div>

          {receiptSetting.ppnActive && (
            <div className="flex justify-between">
              <span>PPN {receiptSetting.ppnRate}%</span>
              <span>Rp8.580</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-slate-800">
            <span>Total</span>
            <span>Rp86.580</span>
          </div>
        </div>

        <div className="my-4 border-t border-dashed border-slate-300" />

        <p className="text-center text-xs text-slate-500">
          {receiptSetting.footerNote}
        </p>
      </div>
    </div>
  );
}

function UserTab({
  users,
  filteredUsers,
  totalUsers,
  totalCashier,
  activeCashier,
  inactiveCashier,
  searchKeyword,
  selectedBranch,
  selectedStatus,
  setSearchKeyword,
  setSelectedBranch,
  setSelectedStatus,
  openAddUserModal,
  openEditUserModal,
  handleDeleteUser,
  handleToggleUserStatus,
  fetchUsers,
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Pengguna" value={totalUsers} />
        <SummaryCard
          label="Total Kasir"
          value={totalCashier}
          valueClass="text-blue-600"
        />
        <SummaryCard
          label="Kasir Aktif"
          value={activeCashier}
          valueClass="text-green-600"
        />
        <SummaryCard
          label="Kasir Nonaktif"
          value={inactiveCashier}
          valueClass="text-red-600"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Data Pengguna</h3>
            <p className="text-sm text-slate-500">
              Data owner dan kasir diambil dari tabel users backend.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchUsers}
              className="rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-bold text-green-700 hover:bg-green-50"
            >
              Refresh User
            </button>

            <button
              type="button"
              onClick={openAddUserModal}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              + Tambah Kasir
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <input
            type="text"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="Cari nama, username, role..."
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={selectedBranch}
            onChange={(event) => setSelectedBranch(event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option>Semua</option>
            <option>Semua Cabang</option>
            <option>Cabang 1</option>
            <option>Cabang 2</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option>Semua</option>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                <th className="px-4 py-4 font-semibold">Nama</th>
                <th className="px-4 py-4 font-semibold">Username</th>
                <th className="px-4 py-4 font-semibold">Role</th>
                <th className="px-4 py-4 font-semibold">Cabang</th>
                <th className="px-4 py-4 font-semibold">Shift</th>
                <th className="px-4 py-4 font-semibold">Login Terakhir</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 text-center font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={`${user.role}-${user.username}`}
                  className="border-b border-slate-100 text-sm hover:bg-slate-50"
                >
                  <td className="px-4 py-4 font-bold text-slate-800">
                    {user.name}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    @{user.username}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        user.role === "owner"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.roleLabel}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-600">{user.branch}</td>
                  <td className="px-4 py-4 text-slate-600">{user.shift}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDateTime(user.lastLogin)}
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(user)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        user.status === "Aktif"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status}
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditUserModal(user)}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100"
                      >
                        Edit
                      </button>

                      {user.role !== "owner" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Data pengguna tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Menampilkan {filteredUsers.length} dari {users.length} pengguna.
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

function UserModal({ modalMode, userForm, isSaving, onClose, onChange, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {modalMode === "edit" ? "Edit Data Kasir" : "Tambah Kasir"}
            </h3>
            <p className="text-sm text-slate-500">
              Data kasir akan tersimpan di tabel users backend.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
          >
            X
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Nama Kasir"
              name="name"
              value={userForm.name}
              onChange={onChange}
              placeholder="Contoh: Kasir Cabang 1"
            />

            <InputField
              label="Username"
              name="username"
              value={userForm.username}
              onChange={onChange}
              placeholder="Contoh: kasir1"
            />

            <InputField
              label="Password"
              name="password"
              value={userForm.password}
              onChange={onChange}
              placeholder={
                modalMode === "edit"
                  ? "Kosongkan jika tidak ingin mengubah password"
                  : "Minimal 6 karakter"
              }
            />

            <InputField
              label="No. Telepon"
              name="phone"
              value={userForm.phone}
              onChange={onChange}
              placeholder="Contoh: 08123456789"
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Cabang
              </label>
              <select
                name="branch_id"
                value={userForm.branch_id}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value={1}>Cabang 1</option>
                <option value={2}>Cabang 2</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Shift Default
              </label>
              <select
                name="shift_name"
                value={userForm.shift_name}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option>Shift Pagi</option>
                <option>Shift Sore</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                name="status"
                value={userForm.status}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option>Aktif</option>
                <option>Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-400"
            >
              {isSaving
                ? "Menyimpan..."
                : modalMode === "edit"
                ? "Simpan Perubahan"
                : "Tambah Kasir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PengaturanPage;