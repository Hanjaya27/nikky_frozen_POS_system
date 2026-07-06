import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, X, Check, Image as ImageIcon, Store, Package } from "lucide-react";
import { getProductImageUrl } from "../../utils/image";
import * as api from "../../services/api";

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
  today.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);
  const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Expired", className: "bg-red-50 text-red-700 border-red-200" };
  if (days <= 30) return { label: "Hampir Expired", className: "bg-orange-50 text-orange-700 border-orange-200" };
  return null;
}

function ProductImage({ product }) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = getProductImageUrl(product);

  if (!imageSrc || imageError) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#EBCDB8] bg-[#FFF6EA] text-[#C80503]">
        <Package className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={product.name || "Produk"}
      className="h-12 w-12 shrink-0 rounded-xl border border-[#EBCDB8] object-cover"
      loading="lazy"
      onError={() => setImageError(true)}
    />
  );
}

function AdminProdukPage() {
  const currentUser = getCurrentUser();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [viewBranch, setViewBranch] = useState("saya");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formError, setFormError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
    setFormError("");
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
        image_url: product.image_url || product.image || "",
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
      setFormError("");
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
      console.error(err);
      setFormError(err.message || "Gagal menyimpan produk. Periksa data produk dan coba lagi.");
    }
  };

  const openDeleteConfirm = (id) => {
    setFormError("");
    setDeleteTarget(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.deleteProduct(deleteTarget);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Gagal menghapus produk.");
      setDeleteConfirmOpen(false);
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

  return (
    <div className="min-h-[calc(100vh-100px)]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#2A1712]">Admin Produk</h1>
          <p className="mt-1 text-sm font-medium text-[#7A6258]">Kelola data produk semua cabang dengan tema Nikky Frozen.</p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal("add")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C80503] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#8B0306]"
        >
          <Plus className="h-4 w-4" /> Tambah Produk
        </button>
      </div>

      {formError && !isModalOpen && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {formError}
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#EBCDB8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau kode produk..."
            className="w-full rounded-xl border border-[#EBCDB8] bg-white py-2.5 pl-10 pr-4 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-[#EBCDB8] bg-white px-4 py-2.5 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20">
          <option value="semua">Semua Status</option>
          <option value="aman">Aman</option>
          <option value="menipis">Menipis</option>
          <option value="habis">Habis</option>
        </select>
        <select value={viewBranch} onChange={(e) => setViewBranch(e.target.value)} className="rounded-xl border border-[#EBCDB8] bg-white px-4 py-2.5 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20">
          <option value="saya">Cabang Saya</option>
          <option value="lain">Cabang Lain</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[#FFF6EA] text-xs font-bold uppercase text-[#7A6258]">
              <tr>
                <th className="border-b border-[#EBCDB8] px-6 py-4">Produk</th>
                <th className="border-b border-[#EBCDB8] px-6 py-4">Cabang</th>
                <th className="border-b border-[#EBCDB8] px-6 py-4">Kategori</th>
                <th className="border-b border-[#EBCDB8] px-6 py-4 text-right">Harga</th>
                <th className="border-b border-[#EBCDB8] px-6 py-4 text-right">Stok</th>
                <th className="border-b border-[#EBCDB8] px-6 py-4">Status</th>
                <th className="border-b border-[#EBCDB8] px-6 py-4">Expired</th>
                <th className="border-b border-[#EBCDB8] px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBCDB8]">
              {!isLoading && filteredProducts.map((p) => {
                const stockBadge = getStockStatusConfig(p.stock ?? 0);
                const expBadge = getExpiredBadge(p.expired_date);
                return (
                  <tr key={p.id} className="bg-white transition-colors hover:bg-[#FFFDF8]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ProductImage product={p} />
                        <div className="min-w-0">
                          <p className="truncate font-black text-[#2A1712]">{p.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-[#7A6258]">{p.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#7A6258]">{p.branch?.name || `Cabang ${p.branch_id}`}</td>
                    <td className="px-6 py-4 font-semibold text-[#7A6258]">{p.category}</td>
                    <td className="px-6 py-4 text-right font-black text-[#2A1712]">{formatRupiah(p.price)}</td>
                    <td className="px-6 py-4 text-right font-black text-[#2A1712]">{p.stock ?? 0}</td>
                    <td className="px-6 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${stockBadge.className}`}>{stockBadge.label}</span></td>
                    <td className="px-6 py-4">{expBadge ? <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${expBadge.className}`}>{expBadge.label}</span> : <span className="text-xs font-semibold text-[#7A6258]">-</span>}</td>
                    <td className="px-6 py-4 text-right">
                      {p.branch_id === currentUser?.branch_id ? (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => handleOpenModal("edit", p)} className="rounded-lg border border-[#EBCDB8] bg-white p-2 text-[#7A6258] transition hover:bg-[#FFF6EA] hover:text-[#C80503]"><Edit className="h-4 w-4" /></button>
                          <button type="button" onClick={() => openDeleteConfirm(p.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-[#8A6F66] italic">Read Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {isLoading && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-[#7A6258]">Memuat data produk...</td>
                </tr>
              )}

              {!isLoading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-[#7A6258]">Belum ada data produk.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EBCDB8] bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-black text-[#2A1712]">{modalMode === "add" ? "Tambah Produk" : "Edit Produk"}</h2>
                <p className="mt-1 text-sm font-medium text-[#7A6258]">Lengkapi data produk di bawah ini.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl bg-[#FFF6EA] p-2 text-[#7A6258] transition hover:bg-[#EBCDB8]"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="lg:w-[220px]">
                    <label className="mb-2 block text-xs font-bold text-[#7A6258]">Foto Produk</label>
                    <div className="group relative flex h-[220px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#EBCDB8] bg-[#FFF6EA] text-center">
                      {(imageFile || (modalMode === "edit" && formData.image_url)) ? (
                        <img
                          src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <ImageIcon className="h-10 w-10 text-[#C80503]" />
                          <span className="mt-2 text-[10px] font-bold text-[#7A6258] transition group-hover:text-[#C80503]">Upload</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#7A6258]">Kode Produk</label>
                        <input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20" placeholder="Misal: FRZ-001" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#7A6258]">Nama Produk</label>
                        <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20" placeholder="Misal: Nugget Ayam" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#7A6258]">Kategori</label>
                        <input required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20" placeholder="Misal: Makanan Beku" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#7A6258]">Harga (Rp)</label>
                        <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20" placeholder="0" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-[#7A6258]">Stok</label>
                      <input required type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20" placeholder="0" />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-[#7A6258]">Tanggal Expired (Opsional)</label>
                      <input type="date" value={formData.expired_date} onChange={(e) => setFormData({ ...formData, expired_date: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2.5 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20" />
                    </div>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex shrink-0 justify-end gap-3 border-t border-[#EBCDB8] bg-[#FFF6EA] px-6 py-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-[#EBCDB8] bg-white px-4 py-2 text-sm font-bold text-[#7A6258] transition hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex items-center gap-2 rounded-xl bg-[#C80503] px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800"><Check className="h-4 w-4" /> Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#EBCDB8] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-[#2A1712]">Hapus produk ini?</h3>
            <p className="mt-2 text-sm text-[#7A6258]">Tindakan ini akan menghapus produk dari daftar.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); }} className="flex-1 rounded-xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#7A6258] hover:bg-[#FFF6EA]">Batal</button>
              <button type="button" onClick={handleDelete} className="flex-1 rounded-xl bg-[#C80503] px-4 py-3 text-sm font-bold text-white hover:bg-[#8B0306]">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProdukPage;
