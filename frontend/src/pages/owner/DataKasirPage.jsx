import { useEffect, useMemo, useState } from "react";
import {
  createUser,
  deleteUser,
  getOwnerUsers,
  updateUser,
} from "../../services/api";
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Download,
} from "lucide-react";

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Card({ children, className = "" }) {
  return <div className={`rounded-[24px] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm ${className}`}>{children}</div>;
}

function Badge({ children, className }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${className}`}>{children}</span>;
}

const shifts = ["Shift Pagi", "Shift Sore"];
const roleOptions = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin Cabang" },
  { value: "cashier", label: "Kasir" },
];

function DataUserPage() {
  const [data, setData] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "cashier",
    branch_id: "",
    shift_name: "Shift Pagi",
    phone: "",
    status: "Aktif",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const params = {};
      if (selectedBranch) params.branch_id = selectedBranch;
      if (selectedRole !== "all") params.role = selectedRole;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (searchKeyword.trim()) params.search = searchKeyword.trim();
      const result = await getOwnerUsers(params);
      setData(result);
    } catch (e) {
      setErrorMessage(e.message || "Gagal memuat data user.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [selectedBranch, selectedRole, selectedStatus]);

  const users = data?.users || [];
  const branches = data?.branches || [];
  const summary = data?.summary || {};

  const filteredUsers = useMemo(() => users.filter((u) => {
    const kw = searchKeyword.toLowerCase();
    return !kw || [u.name, u.username, u.email, u.branch_name, u.phone, u.shift_default].some((v) => String(v || "").toLowerCase().includes(kw));
  }), [users, searchKeyword]);

  const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(""), 2500); };

  const resetForm = () => {
    setFormData({ name: "", username: "", password: "", role: "cashier", branch_id: "", shift_name: "Shift Pagi", phone: "", status: "Aktif" });
    setEditingUser(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name, username: user.username, password: "",
      role: user.role, branch_id: user.branch_id || "",
      shift_name: user.shift_default || "Shift Pagi",
      phone: user.phone === "-" ? "" : user.phone,
      status: user.status === "active" ? "Aktif" : "Nonaktif",
    });
    setShowModal(true);
  };
  const closeModal = () => { resetForm(); setShowModal(false); };

  const handleChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };

  const validate = () => {
    if (!formData.name.trim()) { alert("Nama wajib diisi."); return false; }
    if (!formData.username.trim()) { alert("Username wajib diisi."); return false; }
    if (!editingUser && !formData.password.trim()) { alert("Password wajib diisi untuk user baru."); return false; }
    if (formData.password && formData.password.length < 6) { alert("Password minimal 6 karakter."); return false; }
    if ((formData.role === "admin" || formData.role === "cashier") && !formData.branch_id) { alert("Cabang wajib dipilih untuk admin/kasir."); return false; }
    return true;
  };

  const getPayload = () => {
    const payload = {
      name: formData.name, username: formData.username,
      email: `${formData.username}@nikkyfrozen.test`,
      role: formData.role, branch_id: formData.role === "owner" ? null : Number(formData.branch_id),
      shift_name: formData.shift_name, phone: formData.phone, status: formData.status,
    };
    if (formData.password.trim()) payload.password = formData.password;
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true); setErrorMessage("");
      const payload = getPayload();
      if (editingUser) { await updateUser(editingUser.id, payload); showSuccess("User berhasil diperbarui."); }
      else { await createUser(payload); showSuccess("User berhasil ditambahkan."); }
      closeModal();
      fetchUsers();
    } catch (err) { alert(err.message || "Gagal menyimpan user."); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Yakin ingin menghapus ${user.name}?`)) return;
    try { await deleteUser(user.id); showSuccess("User berhasil dihapus."); fetchUsers(); } catch (err) { alert(err.message || "Gagal menghapus user."); }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "Nonaktif" : "Aktif";
    if (!confirm(`Ubah status ${user.name} menjadi ${newStatus}?`)) return;
    try {
      await updateUser(user.id, {
        name: user.name, username: user.username,
        email: user.email || `${user.username}@nikkyfrozen.test`,
        role: user.role, branch_id: user.branch_id,
        shift_name: user.shift_default, phone: user.phone === "-" ? "" : user.phone,
        status: newStatus,
      });
      showSuccess(`Status ${user.name} menjadi ${newStatus}.`);
      fetchUsers();
    } catch (err) { alert(err.message || "Gagal."); }
  };

  const exportCSV = () => {
    if (filteredUsers.length === 0) { alert("Tidak ada data user untuk diexport."); return; }
    const headers = ["Nama", "Username", "Role", "Cabang", "Shift", "Telepon", "Login Terakhir", "Dibuat", "Status"];
    const rows = filteredUsers.map((u) => [u.name, u.username, u.role_label, u.branch_name || "-", u.shift_default || "-", u.phone, formatDateTime(u.last_login_at), formatDateTime(u.created_at), u.status]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c || "-"}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "data-user-nikky-frozen.csv"; link.click();
    URL.revokeObjectURL(url);
    showSuccess("Data user berhasil diexport.");
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-[#FEF6EC]"><Loader2 className="h-8 w-8 animate-spin text-[#C80503]" /></div>;

  return (
    <div className="min-h-screen bg-[#FEF6EC] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C80503]">Data User</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#2A1712] sm:text-3xl">Data User</h1>
          <p className="mt-1 text-sm font-semibold text-[#7A6258]">Kelola owner, admin cabang, kasir, status akun, dan akses login.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={fetchUsers} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#2A1712] hover:bg-[#FFF6EA]"><RefreshCw className="mr-2 inline h-4 w-4"/>Refresh Data</button>
          <button onClick={exportCSV} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#2A1712] hover:bg-[#FFF6EA]"><Download className="mr-2 inline h-4 w-4"/>Export CSV</button>
          <button onClick={openAdd} className="rounded-2xl bg-[#C80503] px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-[#A80000]"><Plus className="mr-2 inline h-4 w-4"/>Tambah User</button>
        </div>
      </div>

      {successMessage && <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{successMessage}</div>}
      {errorMessage && <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errorMessage}</div>}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="p-5"><p className="text-sm font-semibold text-[#7A6258]">Total User</p><p className="mt-2 text-2xl font-black text-[#2A1712]">{summary.total_users ?? 0}</p></Card>
        <Card className="p-5"><p className="text-sm font-semibold text-[#7A6258]">User Aktif</p><p className="mt-2 text-2xl font-black text-green-600">{summary.active_users ?? 0}</p></Card>
        <Card className="p-5"><p className="text-sm font-semibold text-[#7A6258]">User Nonaktif</p><p className="mt-2 text-2xl font-black text-[#C80503]">{summary.inactive_users ?? 0}</p></Card>
        <Card className="p-5"><p className="text-sm font-semibold text-[#7A6258]">Admin Cabang</p><p className="mt-2 text-2xl font-black text-orange-600">{summary.admin_count ?? 0}</p></Card>
        <Card className="p-5"><p className="text-sm font-semibold text-[#7A6258]">Kasir</p><p className="mt-2 text-2xl font-black text-[#2A1712]">{summary.cashier_count ?? 0}</p></Card>
      </div>

      <Card className="p-5">
        <div className="mb-5 grid gap-3 xl:grid-cols-[170px_170px_170px_1fr]">
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"><option value="">Semua Cabang</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"><option value="all">Semua Role</option><option value="owner">Owner</option><option value="admin">Admin</option><option value="cashier">Kasir</option></select>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"><option value="all">Semua Status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select>
          <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A6F66]" /><input value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Cari nama, username..." className="w-full rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] py-3 pl-12 pr-4 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" /></div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#EBCDB8]">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[#FFF6EA] text-xs font-black uppercase text-[#7A6258]"><tr><th className="px-4 py-3">Nama User</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Cabang</th><th className="px-4 py-3">Shift</th><th className="px-4 py-3">Telepon</th><th className="px-4 py-3">Login Terakhir</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-center">Aksi</th></tr></thead>
            <tbody className="divide-y divide-[#EBCDB8] bg-white">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                const roleBadge = user.role === "owner" ? "bg-[#FFF6EA] text-[#C80503] ring-[#EBCDB8]" : user.role === "admin" ? "bg-orange-50 text-orange-700 ring-orange-100" : "bg-gray-50 text-gray-700 ring-gray-100";
                const statusBadge = user.status === "active" ? "bg-green-50 text-green-700 ring-green-100" : "bg-red-50 text-red-700 ring-red-100";
                return (<tr key={user.id} className="hover:bg-[#FFFDF8]">
                  <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF6EA] text-sm font-black text-[#C80503]">{user.name?.charAt(0) || "?"}</div><div><p className="font-black text-[#2A1712]">{user.name}</p><p className="text-xs font-semibold text-[#8A6F66]">Dibuat: {formatDate(user.created_at)}</p></div></div></td>
                  <td className="px-4 py-4 font-semibold text-[#5F4B45]">@{user.username}</td>
                  <td className="px-4 py-4"><Badge className={roleBadge}>{user.role_label}</Badge></td>
                  <td className="px-4 py-4 font-semibold text-[#5F4B45]">{user.branch_name || "Semua Cabang"}</td>
                  <td className="px-4 py-4 font-semibold text-[#5F4B45]">{user.shift_default || "-"}</td>
                  <td className="px-4 py-4 font-semibold text-[#5F4B45]">{user.phone || "-"}</td>
                  <td className="px-4 py-4 font-semibold text-[#5F4B45]">{formatDateTime(user.last_login_at)}</td>
                  <td className="px-4 py-4"><button onClick={() => handleToggleStatus(user)}><Badge className={statusBadge}>{user.status === "active" ? "Aktif" : "Nonaktif"}</Badge></button></td>
                  <td className="px-4 py-4"><div className="flex justify-center gap-2"><button onClick={() => openEdit(user)} className="rounded-xl border border-[#EBCDB8] bg-[#FFFDF8] px-3 py-2 text-xs font-black text-[#2A1712] hover:bg-[#FFF6EA]">Edit</button><button onClick={() => handleDelete(user)} className="rounded-xl border border-[#EBCDB8] bg-[#FFF6EA] px-3 py-2 text-xs font-black text-[#C80503] hover:bg-red-50">Hapus</button></div></td>
                </tr>);
              }) : <tr><td colSpan={9} className="p-8 text-center text-sm font-semibold text-[#7A6258]">Data user tidak ditemukan.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-[24px] bg-[#FFFDF8] p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-black text-[#2A1712]">{editingUser ? "Edit User" : "Tambah User"}</h3><p className="text-sm text-[#7A6258]">Data user akan disimpan ke backend.</p></div><button onClick={closeModal} className="rounded-xl bg-[#FFF6EA] px-3 py-2 text-sm font-bold text-[#2A1712]">X</button></div>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div><label className="mb-1 block text-xs font-bold text-[#2A1712]">Nama</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-2xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" /></div>
              <div><label className="mb-1 block text-xs font-bold text-[#2A1712]">Username</label><input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full rounded-2xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" /></div>
              <div><label className="mb-1 block text-xs font-bold text-[#2A1712]">Password</label><input type="text" name="password" value={formData.password} onChange={handleChange} placeholder={editingUser ? "Kosongkan jika tidak ganti" : "Min 6 karakter"} className="w-full rounded-2xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" /></div>
              <div><label className="mb-1 block text-xs font-bold text-[#2A1712]">Role</label><select name="role" value={formData.role} onChange={handleChange} className="w-full rounded-2xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]">{roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-bold text-[#2A1712]">Cabang</label><select name="branch_id" value={formData.branch_id} onChange={handleChange} disabled={formData.role === "owner"} className="w-full rounded-2xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] disabled:opacity-50"><option value="">Pilih Cabang</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-bold text-[#2A1712]">No Telepon</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-2xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" /></div>
              <div><label className="mb-1 block text-xs font-bold text-[#2A1712]">Shift Default</label><select name="shift_name" value={formData.shift_name} onChange={handleChange} className="w-full rounded-2xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]">{shifts.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-bold text-[#2A1712]">Status</label><select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-2xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"><option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option></select></div>
              <div className="col-span-2 flex justify-end gap-3 pt-3"><button type="button" onClick={closeModal} className="rounded-2xl border border-[#EBCDB8] bg-white px-5 py-3 text-sm font-black text-[#2A1712]">Batal</button><button type="submit" disabled={isSubmitting} className={`rounded-2xl px-5 py-3 text-sm font-black text-white ${isSubmitting ? "bg-gray-400" : "bg-[#C80503] hover:bg-[#A80000]"}`}>{isSubmitting ? "Menyimpan..." : editingUser ? "Simpan" : "Tambah User"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataUserPage;
