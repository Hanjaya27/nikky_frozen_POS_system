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

function AdminProdukPage() {
  const currentUser = getCurrentUser();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewBranch, setViewBranch] = useState("saya"); // 'saya', 'lain'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add, edit
  const [formData, setFormData] = useState({
    id: "",
    code: "",
    name: "",
    category: "",
    store_stock: 0,
    warehouse_stock: 0,
    price: 0,
    expired_date: "",
    storage_location: "",
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
        store_stock: product.store_stock || 0,
        warehouse_stock: product.warehouse_stock || 0,
        price: product.price || 0,
        expired_date: product.expired_date ? product.expired_date.split("T")[0] : "",
        storage_location: product.storage_location || "",
      });
    } else {
      setFormData({
        id: "",
        code: "",
        name: "",
        category: "",
        store_stock: 0,
        warehouse_stock: 0,
        price: 0,
        expired_date: "",
        storage_location: "",
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
      payload.append("store_stock", formData.store_stock);
      payload.append("warehouse_stock", formData.warehouse_stock);
      payload.append("price", formData.price);
      if (formData.expired_date) payload.append("expired_date", formData.expired_date);
      if (formData.storage_location) payload.append("storage_location", formData.storage_location);
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
    
    return matchSearch && matchBranch;
  });

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2A1712]">Kelola Produk</h1>
          <p className="mt-1 text-sm font-semibold text-[#7A6258]">
            Cabang {currentUser.branch || currentUser.branch_id}
          </p>
        </div>
        {viewBranch === "saya" && (
          <button
            onClick={() => handleOpenModal("add")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C80503] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-800"
          >
            <Plus className="h-5 w-5" /> Tambah Produk
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setViewBranch("saya")}
          className={`px-5 py-2.5 rounded-t-2xl text-sm font-black transition ${viewBranch === "saya" ? "bg-[#FFFDF8] text-[#2A1712] border-t border-x border-[#EBCDB8]" : "bg-transparent text-[#7A6258] hover:bg-white/50"}`}
        >
          Produk Cabang Saya
        </button>
        <button
          onClick={() => setViewBranch("lain")}
          className={`px-5 py-2.5 rounded-t-2xl text-sm font-black transition ${viewBranch === "lain" ? "bg-[#FFFDF8] text-[#2A1712] border-t border-x border-[#EBCDB8]" : "bg-transparent text-[#7A6258] hover:bg-white/50"}`}
        >
          Produk Cabang Lain (Read-Only)
        </button>
      </div>

      <div className="rounded-b-[1.5rem] rounded-tr-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm -mt-[1px]">
        <div className="p-5 border-b border-[#EBCDB8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A6258]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode produk..."
              className="w-full rounded-xl border border-[#EBCDB8] bg-white py-2.5 pl-12 pr-4 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
            />
          </div>
          {viewBranch === "lain" && (
            <div className="text-xs font-bold text-orange-700 bg-orange-50 px-4 py-2 rounded-xl ring-1 ring-orange-200 flex items-center gap-2">
              <Store className="w-4 h-4" /> Anda hanya dapat melihat (read-only) stok cabang lain.
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#FFF6EA] text-xs font-black uppercase text-[#7A6258]">
              <tr>
                <th className="px-5 py-4 w-20">Foto</th>
                <th className="px-5 py-4">Produk</th>
                <th className="px-5 py-4">Kategori</th>
                {viewBranch === "lain" && <th className="px-5 py-4">Cabang</th>}
                <th className="px-5 py-4 text-right">Harga</th>
                <th className="px-5 py-4 text-right">Stok Toko</th>
                <th className="px-5 py-4 text-right">Stok Gudang</th>
                {viewBranch === "saya" && <th className="px-5 py-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBCDB8]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#FFF6EA]/50 transition">
                  <td className="px-5 py-4">
                    {p.image ? (
                      <img src={`${STORAGE_URL}/${p.image}`} alt={p.name} className="h-12 w-12 rounded-lg object-cover ring-1 ring-[#EBCDB8]" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FFF6EA] text-[#7A6258] ring-1 ring-[#EBCDB8]">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-black text-[#2A1712]">{p.name}</p>
                    <p className="text-xs font-bold text-[#7A6258] mt-1">{p.code}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#7A6258]">{p.category}</td>
                  {viewBranch === "lain" && (
                    <td className="px-5 py-4 font-bold text-[#2A1712]">{p.branch?.name || "-"}</td>
                  )}
                  <td className="px-5 py-4 text-right font-black text-[#C80503]">{formatRupiah(p.price)}</td>
                  <td className="px-5 py-4 text-right font-black text-[#2A1712]">{p.store_stock}</td>
                  <td className="px-5 py-4 text-right font-black text-[#2A1712]">{p.warehouse_stock}</td>
                  {viewBranch === "saya" && (
                    <td className="px-5 py-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenModal("edit", p)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!isLoading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={viewBranch === "lain" ? 8 : 7} className="px-5 py-12 text-center text-[#7A6258] font-medium">
                    Tidak ada produk ditemukan di {viewBranch === "saya" ? "cabang ini" : "cabang lain"}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-2xl rounded-[1.5rem] bg-[#FFFDF8] border border-[#EBCDB8] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
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
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-[#7A6258] mb-1">
                      Foto Produk
                    </label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2 text-sm font-bold text-[#2A1712] outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-[#FFF6EA] file:text-[#C80503] hover:file:bg-[#EBCDB8]/50"
                    />
                    {modalMode === "edit" && !imageFile && (
                      <p className="text-xs text-[#7A6258] mt-1">Kosongkan jika tidak ingin mengubah foto.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6258] mb-1">Kode Produk</label>
                    <input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6258] mb-1">Nama Produk</label>
                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6258] mb-1">Kategori</label>
                    <input required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6258] mb-1">Harga (Rp)</label>
                    <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6258] mb-1">Stok Toko (Display)</label>
                    <input required type="number" min="0" value={formData.store_stock} onChange={(e) => setFormData({ ...formData, store_stock: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6258] mb-1">Stok Gudang (Simpanan)</label>
                    <input required type="number" min="0" value={formData.warehouse_stock} onChange={(e) => setFormData({ ...formData, warehouse_stock: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6258] mb-1">Tanggal Expired (Opsional)</label>
                    <input type="date" value={formData.expired_date} onChange={(e) => setFormData({ ...formData, expired_date: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6258] mb-1">Lokasi Gudang (Opsional)</label>
                    <input value={formData.storage_location} onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })} className="w-full rounded-xl border border-[#EBCDB8] bg-white px-3 py-2 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" />
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
