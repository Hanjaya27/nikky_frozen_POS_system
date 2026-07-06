import { useEffect, useState } from "react";
import { History, Loader2, Search, ArrowRightLeft, Warehouse, Settings } from "lucide-react";
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
      if (selectedType === "transfer") {
        params.type = "transfer";
      } else if (selectedType === "stock_adjustment") {
        params.type = "correction";
      } else if (selectedType) {
        params.type = selectedType;
      }

      const res = await api.getStockHistories(params);
      setHistories(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setHistories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.branch_id) {
      fetchHistories();
    }
  }, [currentUser?.branch_id, search, selectedType]);

  const getTypeInfo = (type) => {
    switch (type) {
      case "restock":
      case "stock_restock":
      case "batch_restock":
        return { label: "Restock", icon: Warehouse, color: "text-green-700", bg: "bg-green-50 border-green-200" };
      case "transfer":
      case "transfer_in":
      case "transfer_out":
      case "branch_transfer":
      case "batch_transfer":
        return { label: "Transfer Antar Cabang", icon: ArrowRightLeft, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
      case "correction":
      case "stock_correction":
      case "koreksi":
      case "adjustment":
      case "stock_adjustment":
        return { label: "Koreksi Stok", icon: Settings, color: "text-[#C80503]", bg: "bg-[#FFF6EA] border-[#EBCDB8]" };
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
          Riwayat restock, transfer antar cabang, dan koreksi stok untuk cabang Anda.
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-[#EBCDB8] p-5 sm:flex-row">
          <div className="relative w-full max-w-md">
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
              className="min-w-[200px] rounded-xl border border-[#EBCDB8] bg-white px-4 py-2.5 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]"
            >
              <option value="">Semua Tipe Aktivitas</option>
              <option value="restock">Restock</option>
              <option value="transfer">Transfer Antar Cabang</option>
              <option value="stock_adjustment">Koreksi Stok</option>
            </select>
            <button
              onClick={() => {
                setSearch("");
                setSelectedType("");
              }}
              className="rounded-xl border border-[#EBCDB8] bg-white px-4 py-2.5 text-sm font-bold text-[#7A6258] transition hover:bg-[#FFF6EA]"
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
                  <th className="w-48 px-5 py-4">Waktu</th>
                  <th className="px-5 py-4">Produk</th>
                  <th className="px-5 py-4">Aktivitas</th>
                  <th className="px-5 py-4 text-center">Jumlah</th>
                  <th className="px-5 py-4 text-center">Perubahan Stok</th>
                  <th className="px-5 py-4">Admin</th>
                  <th className="px-5 py-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBCDB8]">
                {histories.map((history) => {
                  const info = getTypeInfo(history.type);
                  const Icon = info.icon;
                  return (
                    <tr key={history.id} className="transition hover:bg-[#FFF6EA]/50">
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#7A6258]">
                        {formatDate(history.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-black text-[#2A1712]">{history.product?.name || "Produk Terhapus"}</p>
                        <p className="mt-1 text-xs font-bold text-[#7A6258]">{history.product?.code || "-"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${info.bg} ${info.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {info.label}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="rounded-md border border-[#EBCDB8] bg-[#FFF6EA] px-2 py-1 font-black text-[#C80503]">
                          {history.quantity}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-center">
                        <span className="mr-1 text-xs text-[#7A6258] line-through decoration-[#C80503]/50">
                          {history.before_store_stock}
                        </span>
                        <ArrowRightLeft className="mx-1 inline h-3 w-3 text-[#EBCDB8]" />
                        <span className="ml-1 font-black text-[#2A1712]">{history.after_store_stock}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-[#7A6258]">
                          {history.user?.name || history.user?.username || "Sistem"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-[#7A6258]">{history.note || "-"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-[#7A6258]">
              <History className="mx-auto mb-3 h-12 w-12 text-[#EBCDB8]" />
              <p className="font-bold">Tidak ada riwayat aktivitas stok.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminRiwayatStok;
