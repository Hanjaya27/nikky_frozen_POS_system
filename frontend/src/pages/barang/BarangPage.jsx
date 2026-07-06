import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import * as api from "../../services/api";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Card({ children, className = "" }) {
  return <div className={`rounded-[24px] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm ${className}`}>{children}</div>;
}

function StatCard({ label, value, note, icon: Icon, tone = "red" }) {
  const tones = {
    red: "bg-[#FFF6EA] text-[#C80503]",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#7A6258]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[#2A1712]">{value}</p>
          <p className="mt-1 text-xs font-semibold text-[#8A6F66]">{note}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#EBCDB8] ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function Badge({ children, className }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${className}`}>{children}</span>;
}

function getStatusBadge(status) {
  switch (status) {
    case "safe":
      return { label: "Aman", className: "bg-green-50 text-green-700 ring-green-100" };
    case "low":
      return { label: "Menipis", className: "bg-orange-50 text-orange-700 ring-orange-100" };
    case "empty":
      return { label: "Habis", className: "bg-red-50 text-red-700 ring-red-100" };
    case "expiring":
      return { label: "Dekat Expired", className: "bg-amber-50 text-amber-700 ring-amber-100" };
    case "expired":
      return { label: "Expired", className: "bg-red-50 text-red-700 ring-red-100" };
    default:
      return { label: "Aktif", className: "bg-gray-50 text-gray-600 ring-gray-100" };
  }
}

function BarangPage() {
  const [data, setData] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchStocks = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const result = await api.getOwnerStocks({
        branch_id: selectedBranch,
        search: searchKeyword,
        status: selectedStockStatus,
        category: selectedCategory,
      });
      setData(result);
    } catch (error) {
      setErrorMessage(error.message || "Gagal memuat data barang dan stok.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [selectedBranch, selectedStockStatus, selectedCategory]);

  const products = data?.products || [];
  const branches = data?.branches || [];
  const categories = useMemo(() => data?.categories || [], [data]);
  const summary = data?.summary || {};

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter((product) =>
        [product.name, product.code, product.category, product.branch_name].some((value) =>
          String(value || "").toLowerCase().includes(keyword)
        )
      );
    }
    return filtered;
  }, [products, searchKeyword]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#FEF6EC]"><Loader2 className="h-8 w-8 animate-spin text-[#C80503]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#FEF6EC] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-[#2A1712] sm:text-3xl">Barang &amp; Stok</h1>
        <p className="mt-1 text-sm font-semibold text-[#7A6258]">Pantau stok produk, status, dan harga di semua cabang.</p>
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Produk" value={summary.total_products ?? 0} note="Produk aktif" icon={Boxes} tone="red" />
        <StatCard label="Stok Aman" value={summary.safe_stock_count ?? 0} note="Di atas minimum stok" icon={CheckCircle2} tone="green" />
        <StatCard label="Stok Menipis" value={summary.low_stock_count ?? 0} note="Perlu restock" icon={AlertTriangle} tone="orange" />
        <StatCard label="Stok Habis" value={summary.empty_stock_count ?? 0} note="Tidak tersedia" icon={XCircle} tone="red" />
        <StatCard label="Dekat Expired" value={summary.expiring_soon_count ?? 0} note="Expired / 30 hari" icon={CalendarClock} tone="orange" />
      </div>

      <Card className="p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-[#2A1712]">Daftar Produk</h2>
            <p className="mt-1 text-sm font-medium text-[#7A6258]">Data stok dari backend.</p>
          </div>
          <button type="button" onClick={fetchStocks} className="inline-flex items-center gap-2 rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#2A1712] shadow-sm hover:bg-[#FFF6EA]">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_180px_180px_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A6F66]" />
            <input value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Cari nama, kode, atau kategori..." className="w-full rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] py-3 pl-12 pr-4 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]" />
          </div>

          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]">
            <option value="">Semua Cabang</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>

          <select value={selectedStockStatus} onChange={(e) => setSelectedStockStatus(e.target.value)} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]">
            <option value="all">Semua Stok</option>
            <option value="safe">Aman</option>
            <option value="low">Menipis</option>
            <option value="empty">Habis</option>
            <option value="expiring">Dekat Expired</option>
            <option value="expired">Expired</option>
          </select>

          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712] outline-none focus:border-[#C80503]">
            <option value="">Semua Kategori</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>

        {errorMessage && <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errorMessage}</div>}

        <div className="overflow-x-auto rounded-2xl border border-[#EBCDB8]">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#FFF6EA] text-xs font-black uppercase text-[#7A6258]">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Cabang</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Harga</th>
                <th className="px-4 py-3 text-right">Stok</th>
                <th className="px-4 py-3">Expired</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBCDB8] bg-white">
              {filteredProducts.length > 0 ? filteredProducts.map((product) => {
                const badge = getStatusBadge(product.status);
                return (
                  <tr key={product.id} className="hover:bg-[#FFFDF8]">
                    <td className="px-4 py-4 font-black text-[#2A1712]">{product.name}</td>
                    <td className="px-4 py-4 font-semibold text-[#5F4B45]">{product.code}</td>
                    <td className="px-4 py-4 font-semibold text-[#5F4B45]">{product.branch_name}</td>
                    <td className="px-4 py-4 font-semibold text-[#5F4B45]">{product.category}</td>
                    <td className="px-4 py-4 text-right font-black text-[#2A1712]">{formatRupiah(product.price)}</td>
                    <td className="px-4 py-4 text-right font-black text-[#2A1712]">{product.stock}</td>
                    <td className="px-4 py-4 font-semibold text-[#5F4B45]">{formatDate(product.expired_date)}</td>
                    <td className="px-4 py-4"><Badge className={badge.className}>{badge.label}</Badge></td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8} className="px-4 py-12 text-center font-semibold text-[#7A6258]">
                  {errorMessage ? errorMessage : "Data produk tidak ditemukan."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default BarangPage;
