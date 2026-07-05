import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, X, Check, Image as ImageIcon, Store } from "lucide-react";
import * as api from "../../services/api";

const STORAGE_URL = "http://127.0.0.1:8000/storage";

function getCurrentUser() {
  const saved = localStorage.getItem("nikky_user");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function formatRupiah(val) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(val || 0));
}

function getStockStatusConfig(stock) {
  if (stock <= 0) return { label: "Habis", className: "bg-red-50 text-red-700 border-red-200" };
  if (stock <= 5) return { label: "Menipis", className: "bg-orange-50 text-orange-700 border-orange-200" };
  return { label: "Aman", className: "bg-green-50 text-green-700 border-green-200" };
}

function getExpiredBadge(dateString) {
  if (!dateString) return null;
  const today = new Date();
  const exp = new Date(dateString);
  if (Number.isNaN(exp.getTime())) return null;
  today.setHours(0,0,0,0);
  exp.setHours(0,0,0,0);
  const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Expired", className: "bg-red-50 text-red-700 border-red-200" };
  if (days <= 30) return { label: "Hampir Expired", className: "bg-orange-50 text-orange-700 border-orange-200" };
  return null;
}

function AdminProdukPage() {
  const currentUser = getCurrentUser();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua"); // semua, aman, menipis, habis
  const [viewBranch, setViewBranch] = useState("saya"); // 'saya', 'lain'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add, edit
  const [formData, setFormData] = useState({
    id: "",
    code: "",
    name: "",
    category: "",
    stock: 0,
    price: 0,
    expired_date: "",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      // Fetch all to allow seeing other branches
      const res = await api.getProducts();
      setProducts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchProducts();
  }, [currentUser?.branch_id]);

  const handleOpenModal = (mode, product = null) => {
    setModalMode(mode);
    setImageFile(null);
    if (mode === "edit" && product) {
      setFormData({
        id: product.id,
        code: product.code || "",
        name: product.name || "",
        category: product.category || "",
        stock: product.stock || 0,
        price: product.price || 0,
        expired_date: product.expired_date ? product.expired_date.split("T")[0] : "",
        image_url: product.image || "",
      });
    } else {
      setFormData({
        id: "",
        code: "",
        name: "",
        category: "",
        stock: 0,
        price: 0,
        expired_date: "",
        image_url: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("branch_id", currentUser.branch_id);
      payload.append("code", formData.code);
      payload.append("name", formData.name);
      payload.append("category", formData.category);
      payload.append("stock", formData.stock);
      payload.append("price", formData.price);
      if (formData.expired_date) payload.append("expired_date", formData.expired_date);
      if (imageFile) payload.append("image", imageFile);

      if (modalMode === "add") {
        await api.createProduct(payload);
      } else {
        await api.updateProduct(formData.id, payload);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus produk ini?")) return;
    try {
      await api.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      alert("Gagal menghapus.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchBranch = viewBranch === "saya" 
      ? p.branch_id === currentUser?.branch_id 
      : p.branch_id !== currentUser?.branch_id;
    
      let matchStatus = true;
      if (statusFilter !== "semua") {
        const isHabis = (p.stock ?? 0) <= 0;
        const isMenipis = !isHabis && (p.stock ?? 0) <= 5;
        if (statusFilter === "habis") matchStatus = isHabis;
        if (statusFilter === "menipis") matchStatus = isMenipis;
        if (statusFilter === "aman") matchStatus = !isHabis && !isMenipis;
      }
    
    return matchSearch && matchBranch && matchStatus;
  });

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2A1712]">Kelola Produk</h1>
          <p className="mt-1 text-sm font-semibold text-[#7A6258]">
            Kelola produk dan stok cabang Anda.
          </p>
        </div>
        {viewBranch === "saya" && (
          <button
            onClick={() => handleOpenModal("add")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C80503] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-800 shadow-sm"
          >
            <Plus className="h-5 w-5" /> Tambah Produk
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-2">
        {[
          { label: "Total Produk", value: products.length },
          { label: "Total Stok", value: products.reduce((acc, p) => acc + (p.stock || 0), 0) },
          { label: "Produk Menipis", value: products.filter(p => p.stock > 0 && p.stock <= 5).length },
          { label: "Produk Habis", value: products.filter(p => p.stock <= 0).length },
          { label: "Expired / Segera", value: products.filter(p => getExpiredBadge(p.expired_date)).length }
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-[#EBCDB8] bg-[#FFFDF8] p-4 shadow-sm flex flex-col">
            <span className="text-xs font-bold text-[#7A6258] mb-1">{stat.label}</span>
            <span className="text-xl font-black text-[#2A1712]">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-[#EBCDB8]/30 p-1 rounded-xl w-max mb-1">
        <button
          onClick={() => { setViewBranch("saya"); setSearch(""); setStatusFilter("semua"); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewBranch === "saya" ? "bg-white text-[#2A1712] shadow-sm" : "text-[#7A6258] hover:text-[#2A1712]"}`}
        >
          Cabang Saya
        </button>
        <button
          onClick={() => { setViewBranch("lain"); setSearch(""); setStatusFilter("semua"); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewBranch === "lain" ? "bg-white text-[#2A1712] shadow-sm" : "text-[#7A6258] hover:text-[#2A1712]"}`}
        >
          Cabang Lain (Read-Only)
        </button>
      </div>

      <div className="rounded-[1.25rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#EBCDB8] flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50">
          <div className="flex flex-1 gap-3 w-full md:max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6258]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="w-full rounded-lg border border-[#EBCDB8] bg-white py-2 pl-9 pr-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#EBCDB8] bg-white px-3 py-2 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] w-36"
            >
              <option value="semua">Semua Status</option>
              <option value="aman">Aman</option>
              <option value="menipis">Menipis</option>
              <option value="habis">Habis</option>
            </select>
          </div>
          {viewBranch === "lain" && (
            <div className="text-[11px] font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Hanya dapat melihat stok cabang lain.
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#FFF6EA] text-[11px] font-black uppercase text-[#7A6258]">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Kategori</th>
                {viewBranch === "lain" && <th className="px-4 py-3">Cabang</th>}
                <th className="px-4 py-3 text-right">Harga</th>
                <th className="px-4 py-3 text-right w-24">Stok</th>
                <th className="px-4 py-3">Expired</th>
                <th className="px-4 py-3">Status</th>
                {viewBranch === "saya" && <th className="px-4 py-3 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBCDB8] bg-white">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#FFF6EA]/40 transition group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={`${STORAGE_URL}/${p.image}`} alt={p.name} className="h-12 w-12 rounded-xl object-cover border border-[#EBCDB8]" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF6EA] border border-[#EBCDB8] text-[#EBCDB8]">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-black text-[#2A1712]">{p.name}</p>
                        <p className="text-[11px] font-bold text-[#7A6258] mt-0.5">{p.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#7A6258]">{p.category}</td>
                  {viewBranch === "lain" && (
                    <td className="px-4 py-3 font-bold text-[#2A1712]">{p.branch?.name || "-"}</td>
                  )}
                  <td className="px-4 py-3 text-right font-black text-[#C80503]">{formatRupiah(p.price)}</td>
                    <td className="px-4 py-3 text-right font-black text-[#2A1712]">{p.stock}</td>
                  <td className="px-4 py-3">
                    {p.expired_date ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-bold text-[#2A1712]">{new Date(p.expired_date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                        {getExpiredBadge(p.expired_date) && (
                           <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getExpiredBadge(p.expired_date).className}`}>
                             {getExpiredBadge(p.expired_date).label}
                           </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#7A6258] font-bold">-</span>
                    )}
                  </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStockStatusConfig(p.stock).className}`}>
                        Stok: {getStockStatusConfig(p.stock).label}
                      </span>
                    </td>
                  {viewBranch === "saya" && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenModal("edit", p)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!isLoading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={viewBranch === "lain" ? 7 : 8} className="px-5 py-12 text-center text-[#7A6258] font-medium bg-white">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-xl rounded-[1.5rem] bg-[#FFFDF8] border border-[#EBCDB8] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#EBCDB8] bg-[#FFF6EA] px-6 py-4 shrink-0">
              <h3 className="text-lg font-black text-[#2A1712]">
                {modalMode === "add" ? "Tambah Produk" : "Edit Produk"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#7A6258] hover:text-[#C80503] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="shrink-0 flex flex-col items-center">
                    <label className="block text-xs font-bold text-[#7A6258] mb-2 self-start">
                      Foto Produk
                    </label>
                    <div className="w-32 h-32 rounded-[1rem] border-2 border-dashed border-[#EBCDB8] bg-white flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#C80503] transition">
                      {imageFile ? (
                        <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
                      ) : modalMode === "edit" && formData.image_url ? (
                        <img src={`${STORAGE_URL}/${formData.image_url}`} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-[#EBCDB8]" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {!imageFile && !(modalMode === "edit" && formData.image_url) && (
                         <span className="text-[10px] font-bold text-[#7A6258] mt-2 group-hover:text-[#C80503] transition">Upload</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#7A6258] mb-1.5">Kode Produk</label>
                        <input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20 transition" placeholder="Misal: FRZ-001" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#7A6258] mb-1.5">Nama Produk</label>
                        <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20 transition" placeholder="Misal: Nugget Ayam" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#7A6258] mb-1.5">Kategori</label>
                        <input required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20 transition" placeholder="Misal: Makanan Beku" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#7A6258] mb-1.5">Harga (Rp)</label>
                        <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20 transition" placeholder="0" />
                      </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#7A6258] mb-1.5">Stok</label>
                        <input required type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20 transition" placeholder="0" />
                      </div>

                    <div>
                      <label className="block text-xs font-bold text-[#7A6258] mb-1.5">Tanggal Expired (Opsional)</label>
                      <input type="date" value={formData.expired_date} onChange={(e) => setFormData({ ...formData, expired_date: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20 transition" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#EBCDB8] bg-[#FFF6EA] px-6 py-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#EBCDB8] bg-white px-4 py-2 text-sm font-bold text-[#7A6258] transition hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-[#C80503] px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800"
                >
                  <Check className="h-4 w-4" /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProdukPage;
