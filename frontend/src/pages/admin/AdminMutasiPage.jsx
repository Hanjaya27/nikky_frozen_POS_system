import { useEffect, useState } from "react";
import { PackagePlus, Search, Check, AlertCircle, RefreshCcw } from "lucide-react";
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

function AdminMutasiPage() {
  const currentUser = getCurrentUser();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mutateAmount, setMutateAmount] = useState("");
  const [isMutating, setIsMutating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchProducts = async () => {
    try {
      const res = await api.getProducts({ branch_id: currentUser?.branch_id });
      setProducts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser) fetchProducts();
  }, [currentUser?.branch_id]);

  const handleMutate = async (e) => {
    e.preventDefault();
    if (!selectedProduct)
      return setMessage({ type: "error", text: "Pilih produk terlebih dahulu." });

    const amount = parseInt(mutateAmount, 10);
    if (!amount || amount <= 0)
      return setMessage({
        type: "error",
        text: "Jumlah mutasi harus lebih dari 0.",
      });
      
    if (amount > selectedProduct.warehouse_stock)
      return setMessage({
        type: "error",
        text: `Gagal. Stok gudang hanya tersisa ${selectedProduct.warehouse_stock}.`,
      });

    setIsMutating(true);
    setMessage({ type: "", text: "" });

    try {
      await api.mutateProductStock(selectedProduct.id, amount);
      setMessage({
        type: "success",
        text: `Berhasil memutasi ${amount} stok ${selectedProduct.name} ke toko.`,
      });
      setMutateAmount("");
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Gagal memutasi stok.",
      });
    } finally {
      setIsMutating(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="mb-2">
        <h1 className="text-2xl font-black text-[#2A1712]">Mutasi Stok Gudang ke Toko</h1>
        <p className="mt-1 text-sm font-semibold text-[#7A6258]">
          Cabang {currentUser.branch || currentUser.branch_id}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm flex flex-col h-[600px]">
          <div className="p-5 border-b border-[#EBCDB8] shrink-0">
            <h2 className="text-lg font-black text-[#2A1712] mb-3">1. Pilih Produk</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A6258]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="w-full rounded-xl border border-[#EBCDB8] bg-white py-2.5 pl-12 pr-4 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProduct(p);
                  setMessage({ type: "", text: "" });
                }}
                className={`w-full text-left p-4 rounded-xl mb-2 transition border ${selectedProduct?.id === p.id ? 'bg-[#C80503]/10 border-[#C80503]' : 'bg-white border-[#EBCDB8] hover:bg-[#FFF6EA]'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-[#2A1712]">{p.name}</p>
                    <p className="text-xs font-bold text-[#7A6258] mt-1">{p.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#2A1712]">Gudang: {p.warehouse_stock}</p>
                    <p className="text-xs font-bold text-[#7A6258] mt-1">Toko: {p.store_stock}</p>
                  </div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-[#7A6258] font-medium">Tidak ada produk ditemukan.</div>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm p-6 h-fit">
          <h2 className="text-lg font-black text-[#2A1712] mb-5">2. Form Mutasi</h2>
          
          {message.text && (
            <div className={`mb-5 p-4 rounded-xl text-sm font-bold flex items-start gap-3 border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{message.text}</p>
            </div>
          )}

          {!selectedProduct ? (
            <div className="text-center p-8 border border-dashed border-[#EBCDB8] rounded-xl bg-white">
              <PackagePlus className="mx-auto h-8 w-8 text-[#EBCDB8] mb-3" />
              <p className="text-sm font-bold text-[#7A6258]">Silakan pilih produk dari daftar di sebelah kiri untuk melakukan mutasi stok.</p>
            </div>
          ) : (
            <form onSubmit={handleMutate} className="space-y-5">
              <div className="p-4 rounded-xl bg-white border border-[#EBCDB8]">
                <p className="text-xs font-bold text-[#7A6258] mb-1">Produk Terpilih:</p>
                <p className="font-black text-[#2A1712] text-lg">{selectedProduct.name}</p>
                <div className="flex gap-4 mt-3">
                  <div className="bg-[#FFF6EA] px-3 py-1.5 rounded-lg border border-[#EBCDB8]">
                    <span className="text-xs font-bold text-[#7A6258]">Stok Gudang: </span>
                    <span className="font-black text-[#C80503]">{selectedProduct.warehouse_stock}</span>
                  </div>
                  <div className="bg-[#FFF6EA] px-3 py-1.5 rounded-lg border border-[#EBCDB8]">
                    <span className="text-xs font-bold text-[#7A6258]">Stok Toko: </span>
                    <span className="font-black text-[#2A1712]">{selectedProduct.store_stock}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#7A6258] mb-2">Jumlah dipindahkan ke Toko</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.warehouse_stock}
                  value={mutateAmount}
                  onChange={(e) => setMutateAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#EBCDB8] bg-white px-4 py-3 text-lg font-black text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
                  placeholder="0"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isMutating || selectedProduct.warehouse_stock <= 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C80503] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMutating ? (
                  <RefreshCcw className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                {isMutating ? "Memproses..." : "Konfirmasi Mutasi"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminMutasiPage;
