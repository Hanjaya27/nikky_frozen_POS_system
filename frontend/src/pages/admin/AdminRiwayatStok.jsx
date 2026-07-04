import { useEffect, useState } from "react";
import { History, Loader2, Search, ArrowRightLeft, Warehouse, PackagePlus, Edit, Settings, ArrowRight, ArrowDownLeft } from "lucide-react";
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

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminRiwayatStok() {
  const currentUser = getCurrentUser();
  const [histories, setHistories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const fetchHistories = async () => {
    try {
      setIsLoading(true);
      const params = { branch_id: currentUser?.branch_id };
      if (search) params.search = search;
      if (selectedType) params.type = selectedType;
      
      const res = await api.getStockHistories(params);
      setHistories(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchHistories();
    }
  }, [currentUser?.branch_id, search, selectedType]);

  const getTypeInfo = (type) => {
    switch (type) {
      case "mutation_to_store":
        return { label: "Mutasi ke Toko", icon: ArrowRightLeft, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
      case "restock_warehouse":
        return { label: "Restock Gudang", icon: Warehouse, color: "text-green-700", bg: "bg-green-50 border-green-200" };
      case "product_created":
        return { label: "Produk Baru", icon: PackagePlus, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" };
      case "product_updated":
        return { label: "Update Stok", icon: Edit, color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
      case "stock_adjustment":
        return { label: "Koreksi Stok", icon: Settings, color: "text-[#C80503]", bg: "bg-[#FFF6EA] border-[#EBCDB8]" };
      case "transfer_out":
        return { label: "Transfer Keluar", icon: ArrowRight, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
      case "transfer_in":
        return { label: "Transfer Masuk", icon: ArrowDownLeft, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
      default:
        return { label: type, icon: History, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" };
    }
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-black text-[#2A1712]">Riwayat Stok</h1>
        <p className="mt-1 text-sm font-semibold text-[#7A6258]">
          Kelola produk, stok gudang, mutasi, dan riwayat stok cabang Anda.
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm">
        <div className="p-5 border-b border-[#EBCDB8] flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A6258]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="w-full rounded-xl border border-[#EBCDB8] bg-white py-2.5 pl-12 pr-4 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-xl border border-[#EBCDB8] bg-white px-4 py-2.5 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] min-w-[200px]"
            >
              <option value="">Semua Tipe Aktivitas</option>
              <option value="mutation_to_store">Mutasi ke Toko</option>
              <option value="restock_warehouse">Restock Gudang</option>
              <option value="stock_adjustment">Koreksi Stok</option>
              <option value="transfer_out">Transfer Keluar</option>
              <option value="transfer_in">Transfer Masuk</option>
              <option value="product_created">Produk Baru Dibuat</option>
              <option value="product_updated">Produk Diupdate</option>
            </select>
            <button
              onClick={() => { setSearch(""); setSelectedType(""); }}
              className="px-4 py-2.5 rounded-xl border border-[#EBCDB8] bg-white text-sm font-bold text-[#7A6258] hover:bg-[#FFF6EA] transition"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-16 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#C80503]" />
              <p className="mt-4 font-bold text-[#7A6258]">Memuat riwayat stok...</p>
            </div>
          ) : histories.length > 0 ? (
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-[#FFF6EA] text-xs font-black uppercase text-[#7A6258]">
                <tr>
                  <th className="px-5 py-4 w-48">Waktu</th>
                  <th className="px-5 py-4">Produk</th>
                  <th className="px-5 py-4">Aktivitas</th>
                  <th className="px-5 py-4 text-center">Jumlah</th>
                  <th className="px-5 py-4 text-center">Stok Toko</th>
                  <th className="px-5 py-4 text-center">Stok Gudang</th>
                  <th className="px-5 py-4">Admin</th>
                  <th className="px-5 py-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBCDB8]">
                {histories.map((h) => {
                  const info = getTypeInfo(h.type);
                  const Icon = info.icon;
                  return (
                    <tr key={h.id} className="hover:bg-[#FFF6EA]/50 transition">
                      <td className="px-5 py-4 font-semibold text-[#7A6258] whitespace-nowrap">
                        {formatDate(h.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-black text-[#2A1712]">{h.product?.name || "Produk Terhapus"}</p>
                        <p className="text-xs font-bold text-[#7A6258] mt-1">{h.product?.code || "-"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${info.bg} ${info.color}`}>
                          <Icon className="w-3.5 h-3.5" /> {info.label}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-black text-[#C80503] bg-[#FFF6EA] px-2 py-1 rounded-md border border-[#EBCDB8]">
                          {h.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="text-[#7A6258] line-through decoration-[#C80503]/50 mr-1 text-xs">{h.before_store_stock}</span>
                        <ArrowRightLeft className="inline w-3 h-3 text-[#EBCDB8] mx-1" />
                        <span className="font-black text-[#2A1712] ml-1">{h.after_store_stock}</span>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="text-[#7A6258] line-through decoration-[#C80503]/50 mr-1 text-xs">{h.before_warehouse_stock}</span>
                        <ArrowRightLeft className="inline w-3 h-3 text-[#EBCDB8] mx-1" />
                        <span className="font-black text-[#2A1712] ml-1">{h.after_warehouse_stock}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-[#7A6258]">
                          {h.user?.name || h.user?.username || "Sistem"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-[#7A6258]">
                          {h.note || "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-[#7A6258]">
              <History className="mx-auto h-12 w-12 text-[#EBCDB8] mb-3" />
              <p className="font-bold">Tidak ada riwayat aktivitas stok.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminRiwayatStok;
