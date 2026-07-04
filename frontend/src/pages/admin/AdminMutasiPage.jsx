import { useEffect, useState } from "react";
import { Search, Check, AlertCircle, RefreshCcw, Warehouse, Boxes, PackageCheck, TriangleAlert, Layers, Trash2 } from "lucide-react";
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
  const [note, setNote] = useState("");
  const [isMutating, setIsMutating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [branches, setBranches] = useState([]);
  const [targetBranchId, setTargetBranchId] = useState("");
  
  const [batchItems, setBatchItems] = useState([]);
  const [batchType, setBatchType] = useState("batch_restock"); // 'batch_restock', 'batch_mutation_to_store', 'batch_transfer_branch', 'batch_stock_adjustment'

  const fetchProducts = async () => {
    try {
      const res = await api.getProducts({ branch_id: currentUser?.branch_id });
      setProducts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.getBranches();
      if (res && Array.isArray(res)) {
          setBranches(res.filter(b => b.id !== currentUser?.branch_id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser) {
        fetchProducts();
        fetchBranches();
    }
  }, [currentUser?.branch_id]);

  const getItemError = (item) => {
    if (batchType === "adjust") {
      const ss = item.store_stock_new;
      const ws = item.warehouse_stock_new;
      if (ss === "" || ws === "") return "Stok fisik harus diisi.";
      const ssInt = parseInt(ss, 10);
      const wsInt = parseInt(ws, 10);
      if (isNaN(ssInt) || ssInt < 0 || isNaN(wsInt) || wsInt < 0) return "Stok fisik harus >= 0.";
      return null;
    } else {
      const amountStr = item.batchAmount;
      if (amountStr === "") return "Jumlah wajib diisi.";
      const amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount <= 0) return "Jumlah harus > 0.";
      if ((batchType === "mutate" || batchType === "transfer") && amount > item.warehouse_stock) {
        return "Jumlah melebihi stok gudang.";
      }
      return null;
    }
  };

  const hasErrors = batchItems.some(item => getItemError(item) !== null);

  const handleAction = async (e) => {
    e.preventDefault();
    if (batchItems.length === 0) {
       return setMessage({ type: "error", text: "Pilih setidaknya satu produk untuk batch." });
    }

    if (batchType === "batch_transfer_branch" && !targetBranchId) {
        return setMessage({ type: "error", text: "Silakan pilih cabang tujuan untuk transfer." });
    }

    if (batchType === "batch_stock_adjustment" && !note.trim()) {
        return setMessage({ type: "error", text: "Catatan wajib diisi untuk mode Koreksi Stok." });
    }

    const invalidItems = batchItems.filter(item => getItemError(item) !== null);
    if (invalidItems.length > 0) {
        const names = invalidItems.map(i => i.name).join(", ");
        return setMessage({ type: "error", text: `Periksa jumlah pada: ${names}` });
    }

    setIsMutating(true);
    setMessage({ type: "", text: "" });

    try {
      const payloadItems = batchItems.map(item => {
         if (batchType === "batch_stock_adjustment") {
             return { product_id: item.id, store_stock: parseInt(item.store_stock_new, 10), warehouse_stock: parseInt(item.warehouse_stock_new, 10) };
         } else {
             return { product_id: item.id, amount: parseInt(item.batchAmount, 10) };
         }
      });

      const payload = {
         branch_id: currentUser.branch_id,
         user_id: currentUser.id,
         action: batchType,
         note,
         items: payloadItems
      };
      
      if (batchType === "batch_transfer_branch") {
          payload.target_branch_id = targetBranchId;
      }

      await api.batchProcessStock(payload);
      setMessage({ type: "success", text: `Berhasil memproses batch untuk ${batchItems.length} produk.` });
      setBatchItems([]);
      setNote("");
      setTargetBranchId("");
      fetchProducts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Gagal memproses permintaan batch.",
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

  const summary = {
    totalProducts: products.length,
    totalWarehouse: products.reduce((acc, p) => acc + (parseInt(p.warehouse_stock) || 0), 0),
    totalStore: products.reduce((acc, p) => acc + (parseInt(p.store_stock) || 0), 0),
    needAttention: products.filter(p => p.store_stock <= 3).length
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="mb-2">
        <h1 className="text-2xl font-black text-[#2A1712]">Batch Stok</h1>
        <p className="mt-1 text-sm font-semibold text-[#7A6258]">
          Kelola restock, mutasi, transfer, dan koreksi banyak produk sekaligus.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#7A6258]">Total Produk</p>
            <p className="mt-1 text-2xl font-black text-[#2A1712]">{summary.totalProducts}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF6EA] text-[#C80503] border border-[#EBCDB8]">
            <Boxes className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#7A6258]">Stok Gudang</p>
            <p className="mt-1 text-2xl font-black text-[#2A1712]">{summary.totalWarehouse}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF6EA] text-[#C80503] border border-[#EBCDB8]">
            <Warehouse className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#7A6258]">Stok Toko</p>
            <p className="mt-1 text-2xl font-black text-[#2A1712]">{summary.totalStore}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF6EA] text-[#C80503] border border-[#EBCDB8]">
            <PackageCheck className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#7A6258]">Toko Kosong/Menipis</p>
            <p className="mt-1 text-2xl font-black text-[#2A1712]">{summary.needAttention}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF6EA] text-[#C80503] border border-[#EBCDB8]">
            <TriangleAlert className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[38%_1fr] rounded-[1.25rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm p-6 h-[700px]">
        <div className="flex flex-col h-full border border-[#EBCDB8] rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="p-4 border-b border-[#EBCDB8] shrink-0 bg-white">
            <h2 className="text-md font-black text-[#2A1712] mb-3">1. Pilih Produk</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6258]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="w-full rounded-xl border border-[#EBCDB8] bg-white py-2 pl-10 pr-4 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#FFFDF8]">
            {filteredProducts.map(p => {
              const isSelected = batchItems.some(i => i.id === p.id);
              return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setBatchItems(prev => {
                    if (!prev.find(i => i.id === p.id)) {
                      return [...prev, { ...p, batchAmount: "", store_stock_new: p.store_stock, warehouse_stock_new: p.warehouse_stock }];
                    }
                    return prev;
                  });
                }}
                className={`w-full text-left p-4 rounded-xl transition border hover:shadow-sm ${isSelected ? 'bg-gray-50 border-[#EBCDB8]' : 'bg-white border-[#EBCDB8] hover:border-[#C80503]/50'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-[#2A1712] text-sm">{p.name}</p>
                    <p className="text-xs font-bold text-[#7A6258] mt-0.5">{p.code}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    {isSelected && <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2A1712] text-white border border-[#2A1712]">Dipilih</span>}
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${p.store_stock <= 0 ? 'bg-red-50 text-red-700 border-red-200' : p.store_stock <= 3 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                      {p.store_stock <= 0 ? 'Habis' : p.store_stock <= 3 ? 'Menipis' : 'Aman'}
                    </span>
                    <p className="text-xs font-black text-[#2A1712]">Gudang: {p.warehouse_stock}</p>
                    <p className="text-[10px] font-bold text-[#7A6258] mt-0.5">Toko: {p.store_stock}</p>
                  </div>
                </div>
              </button>
            )})}
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-sm text-[#7A6258] font-medium">Tidak ada produk ditemukan.</div>
            )}
          </div>
        </div>

        <div className="h-full flex flex-col overflow-hidden">
          <h2 className="text-lg font-black text-[#2A1712] mb-5 flex items-center gap-2">
             <Layers className="w-5 h-5 text-[#C80503]"/>
             2. Form Batch Stok
          </h2>
          
          {message.text && (
            <div className={`mb-5 p-4 rounded-xl text-sm font-bold flex items-start gap-3 border shrink-0 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{message.text}</p>
            </div>
          )}

          <form onSubmit={handleAction} className="flex-1 flex flex-col overflow-hidden">
             <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-[#EBCDB8] shrink-0 mb-4">
               <label className="flex items-center gap-2 text-sm font-bold text-[#2A1712] cursor-pointer">
                 <input type="radio" value="batch_restock" checked={batchType === "batch_restock"} onChange={(e) => setBatchType(e.target.value)} className="accent-[#C80503] w-4 h-4" />
                 Batch Restock Gudang
               </label>
               <label className="flex items-center gap-2 text-sm font-bold text-[#2A1712] cursor-pointer">
                 <input type="radio" value="batch_mutation_to_store" checked={batchType === "batch_mutation_to_store"} onChange={(e) => setBatchType(e.target.value)} className="accent-[#C80503] w-4 h-4" />
                 Batch Mutasi ke Toko
               </label>
               <label className="flex items-center gap-2 text-sm font-bold text-[#2A1712] cursor-pointer">
                 <input type="radio" value="batch_transfer_branch" checked={batchType === "batch_transfer_branch"} onChange={(e) => setBatchType(e.target.value)} className="accent-[#C80503] w-4 h-4" />
                 Batch Transfer Cabang
               </label>
               <label className="flex items-center gap-2 text-sm font-bold text-[#2A1712] cursor-pointer">
                 <input type="radio" value="batch_stock_adjustment" checked={batchType === "batch_stock_adjustment"} onChange={(e) => setBatchType(e.target.value)} className="accent-[#C80503] w-4 h-4" />
                 Batch Koreksi Stok
               </label>
             </div>
             
             {batchType === "batch_transfer_branch" && (
                <div className="p-4 bg-white border border-[#EBCDB8] rounded-xl shrink-0 mb-4">
                  <label className="block text-sm font-bold text-[#7A6258] mb-2">Cabang Tujuan</label>
                  <select
                    value={targetBranchId}
                    onChange={(e) => setTargetBranchId(e.target.value)}
                    className="w-full rounded-xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
                    required
                  >
                    <option value="">-- Pilih Cabang Tujuan --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
             )}

             {batchItems.length === 0 ? (
               <div className="p-8 text-center text-sm font-medium text-[#7A6258] border border-dashed border-[#EBCDB8] rounded-xl bg-white flex-1 flex flex-col items-center justify-center mb-4">
                 <p>Belum ada produk dipilih.</p>
                 <p className="text-xs opacity-70 mt-1">Pilih produk dari daftar di sebelah kiri untuk ditambahkan ke batch.</p>
               </div>
             ) : (
               <div className="border border-[#EBCDB8] rounded-xl overflow-hidden bg-white flex-1 flex flex-col mb-4 min-h-0">
                  <div className="overflow-y-auto flex-1 p-0">
                    <table className="w-full text-left text-sm m-0">
                       <thead className="bg-[#FFF6EA] text-[#7A6258] sticky top-0 z-10">
                         <tr>
                           <th className="px-4 py-3 border-b border-[#EBCDB8]">Produk</th>
                           {batchType !== "batch_stock_adjustment" && (
                             <th className="px-4 py-3 border-b border-[#EBCDB8]">Gudang Saat Ini</th>
                           )}
                           <th className={`px-4 py-3 border-b border-[#EBCDB8] ${batchType === "batch_stock_adjustment" ? "w-64" : "w-32"}`}>
                             {batchType === "batch_stock_adjustment" ? "Stok Fisik Baru (Toko | Gudang)" : "Jumlah"}
                           </th>
                           <th className="px-4 py-3 border-b border-[#EBCDB8] w-12 text-center"></th>
                         </tr>
                       </thead>
                       <tbody>
                         {batchItems.map((item, idx) => {
                           const err = getItemError(item);
                           return (

                             <tr key={item.id} className={`border-t border-[#EBCDB8] ${err ? 'bg-red-50/30' : ''}`}>
                               <td className="px-4 py-3 font-bold text-[#2A1712]">
                                 {item.name}
                                 {batchType === "batch_stock_adjustment" && (
                                     <div className="text-xs font-normal text-[#7A6258] mt-1">Saat ini: {item.store_stock} Toko | {item.warehouse_stock} Gudang</div>
                                 )}
                               </td>
                               {batchType !== "batch_stock_adjustment" && (
                                 <td className="px-4 py-3 text-[#2A1712] font-bold">{item.warehouse_stock}</td>
                               )}
                               <td className="px-4 py-2">
                                 {batchType === "batch_stock_adjustment" ? (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                          <input type="number" min="0" placeholder="Toko" value={item.store_stock_new} onChange={(e) => {
                                              const newItems = [...batchItems];
                                              newItems[idx] = { ...newItems[idx], store_stock_new: e.target.value };
                                              setBatchItems(newItems);
                                          }} className={`w-full rounded-lg border px-2 py-2 text-center font-bold text-[#2A1712] outline-none ${err ? 'border-red-500 focus:border-red-500 bg-white' : 'border-[#EBCDB8] focus:border-[#C80503]'}`} required />
                                          <span className="text-[#7A6258]">-</span>
                                          <input type="number" min="0" placeholder="Gudang" value={item.warehouse_stock_new} onChange={(e) => {
                                              const newItems = [...batchItems];
                                              newItems[idx] = { ...newItems[idx], warehouse_stock_new: e.target.value };
                                              setBatchItems(newItems);
                                          }} className={`w-full rounded-lg border px-2 py-2 text-center font-bold text-[#2A1712] outline-none ${err ? 'border-red-500 focus:border-red-500 bg-white' : 'border-[#EBCDB8] focus:border-[#C80503]'}`} required />
                                      </div>
                                      {err && <span className="text-red-500 text-[10px] font-bold">{err}</span>}
                                    </div>
                                 ) : (
                                    <div className="flex flex-col gap-1">
                                      <input type="number" min="1" max={(batchType === "batch_mutation_to_store" || batchType === "batch_transfer_branch") ? item.warehouse_stock : undefined} value={item.batchAmount} onChange={(e) => {
                                          const newItems = [...batchItems];
                                          newItems[idx] = { ...newItems[idx], batchAmount: e.target.value };
                                          setBatchItems(newItems);
                                      }} className={`w-full rounded-lg border px-2 py-2 text-center font-bold text-[#2A1712] outline-none ${err ? 'border-red-500 focus:border-red-500 bg-white' : 'border-[#EBCDB8] focus:border-[#C80503]'}`} required placeholder="0" />
                                      {err && <span className="text-red-500 text-[10px] font-bold">{err}</span>}
                                    </div>
                                 )}
                               </td>
                               <td className="px-4 py-2 text-center">
                                 <button type="button" onClick={() => setBatchItems(batchItems.filter(i => i.id !== item.id))} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                    </table>
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-[#EBCDB8] shrink-0 flex items-center justify-between">
                     <button type="button" onClick={() => setBatchItems([])} className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                        <Trash2 className="w-3.5 h-3.5" /> Kosongkan Batch
                     </button>
                     <span className="text-xs font-bold text-[#7A6258]">Total Item: {batchItems.length}</span>
                  </div>
               </div>
             )}
             
             <div className="shrink-0 mb-4">
               <label className="block text-sm font-bold text-[#7A6258] mb-2">
                 Catatan {batchType === "batch_stock_adjustment" ? "(Wajib)" : "(Opsional)"}
               </label>
               <input
                 type="text"
                 value={note}
                 onChange={(e) => setNote(e.target.value)}
                 className="w-full rounded-xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
                 placeholder={batchType === "batch_stock_adjustment" ? "Alasan koreksi fisik..." : "Catatan transaksi..."}
                 required={batchType === "batch_stock_adjustment"}
               />
             </div>

            <button
              type="submit"
              disabled={isMutating || batchItems.length === 0 || hasErrors}
              className="w-full shrink-0 flex items-center justify-center gap-2 rounded-xl bg-[#C80503] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMutating ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {isMutating ? "Memproses Batch..." : "Simpan Semua"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminMutasiPage;
