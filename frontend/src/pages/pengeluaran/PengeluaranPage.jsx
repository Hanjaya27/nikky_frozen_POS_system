import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Printer, RefreshCw, Search, Trash2 } from "lucide-react";

import PageHeader from "../../components/PageHeader";
import * as api from "../../services/api";
import { formatNumberInput, parseNumberInput } from "../../utils/formatters";

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function Card({ children, className = "" }) {
  return <div className={`rounded-[24px] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm ${className}`}>{children}</div>;
}

function Stat({ label, value, tone = "red" }) {
  const tones = { red: "bg-[#FFF6EA] text-[#C80503]", green: "bg-green-50 text-green-600", amber: "bg-orange-50 text-orange-600" };
  return <Card className="p-5"><p className="text-sm font-semibold text-[#7A6258]">{label}</p><p className="mt-2 text-2xl font-black text-[#2A1712]">{value}</p><div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${tones[tone]}`}>Owner</div></Card>;
}

function Badge({ children, className }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${className}`}>{children}</span>; }

function PengeluaranPage() {
  const [data, setData] = useState(null);
  const [branchId, setBranchId] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ branch_id: "", category: "", description: "", amount: "", expense_date: new Date().toISOString().slice(0, 10) });

  const fetchData = async () => {
    try {
      setIsLoading(true); setError("");
      const result = await api.getOwnerExpenses({ branch_id: branchId, category, search, period });
      setData(result);
    } catch (e) { setError(e.message || "Gagal memuat pengeluaran."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [branchId, category, period]);

  const expenses = data?.expenses || [];
  const branches = data?.branches || [];
  const categories = data?.categories || [];
  const summary = data?.summary || {};
  const categorySummary = data?.category_summary || [];

  const filteredExpenses = useMemo(() => expenses.filter((item) => {
    const kw = search.toLowerCase();
    return !kw || [item.description, item.category, item.created_by_name, item.branch_name].some((v) => String(v || "").toLowerCase().includes(kw));
  }), [expenses, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, amount: Number(form.amount || 0), branch_id: form.branch_id || branchId || undefined };
      await api.createExpense(payload);
      setShowModal(false);
      setForm({ branch_id: "", category: "", description: "", amount: "", expense_date: new Date().toISOString().slice(0, 10) });
      await fetchData();
    } catch (e2) { alert(e2.message || "Gagal menyimpan pengeluaran."); }
  };

  const handleDelete = async (id) => { if (!confirm("Hapus pengeluaran ini?")) return; await api.deleteExpense(id); fetchData(); };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-[#FEF6EC]"><Loader2 className="h-8 w-8 animate-spin text-[#C80503]" /></div>;

  return <div className="min-h-screen bg-[#FEF6EC] px-4 py-5 sm:px-6 lg:px-8">
    <PageHeader title="Pengeluaran Toko" description="Catat dan kelola pengeluaran operasional berdasarkan cabang dari backend." />
    <Card className="mb-5 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-black text-[#2A1712]">Login sebagai Owner</p><p className="text-sm text-[#7A6258]">Data pengeluaran seluruh cabang.</p></div><div className="flex flex-wrap gap-2"><button onClick={fetchData} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#2A1712] hover:bg-[#FFF6EA]"><RefreshCw className="mr-2 inline h-4 w-4"/>Refresh Data</button><button onClick={() => window.print()} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#2A1712] hover:bg-[#FFF6EA]"><Printer className="mr-2 inline h-4 w-4"/>Cetak Pengeluaran</button><button onClick={() => setShowModal(true)} className="rounded-2xl bg-[#C80503] px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-[#A80000]"><Plus className="mr-2 inline h-4 w-4"/>Tambah Pengeluaran</button></div></div></Card>
    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total Pengeluaran" value={rupiah(summary.total_expenses)} tone="red" /><Stat label="Pengeluaran Aktif" value={summary.active_expenses_count ?? 0} tone="green" /><Stat label="Pengeluaran Hari Ini" value={rupiah(summary.today_expenses)} tone="amber" /><Stat label="Nominal Terbesar" value={rupiah(summary.largest_expense)} tone="red" /></div>
    <Card className="p-5"><div className="mb-5 grid gap-3 xl:grid-cols-[180px_180px_1fr_180px]"><select value={branchId} onChange={(e)=>setBranchId(e.target.value)} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712]"><option value="">Semua Cabang</option>{branches.map((b)=><option key={b.id} value={b.id}>{b.name}</option>)}</select><select value={category} onChange={(e)=>setCategory(e.target.value)} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712]"><option value="">Semua Kategori</option>{categories.map((c)=><option key={c} value={c}>{c}</option>)}</select><div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A6F66]" /><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cari deskripsi, kategori, pengguna..." className="w-full rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] py-3 pl-12 pr-4 text-sm font-bold text-[#2A1712] outline-none" /></div><select value={period} onChange={(e)=>setPeriod(e.target.value)} className="rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#2A1712]"><option value="all">Semua Periode</option><option value="today">Hari Ini</option><option value="7days">7 Hari</option><option value="month">Bulan Ini</option></select></div>
      {error && <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      <div className="overflow-x-auto rounded-2xl border border-[#EBCDB8]"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#FFF6EA] text-xs font-black uppercase text-[#7A6258]"><tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Cabang</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Deskripsi</th><th className="px-4 py-3">Pengguna</th><th className="px-4 py-3 text-right">Nominal</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-[#EBCDB8] bg-white">{filteredExpenses.length > 0 ? filteredExpenses.map((item) => <tr key={item.id} className="hover:bg-[#FFFDF8]"><td className="px-4 py-3 font-semibold text-[#5F4B45]">{formatDate(item.date || item.expense_date || item.created_at)}</td><td className="px-4 py-3 font-semibold text-[#5F4B45]">{item.branch_name}</td><td className="px-4 py-3"><Badge className="bg-orange-50 text-orange-700 ring-orange-100">{item.category}</Badge></td><td className="px-4 py-3 font-semibold text-[#5F4B45]">{item.description}</td><td className="px-4 py-3 font-semibold text-[#5F4B45]">{item.created_by_name || item.user_name || "-"}</td><td className="px-4 py-3 text-right font-black text-[#C80503]">{rupiah(item.amount)}</td><td className="px-4 py-3"><Badge className="bg-green-50 text-green-700 ring-green-100">Aktif</Badge></td><td className="px-4 py-3"><button onClick={() => handleDelete(item.id)} className="inline-flex items-center rounded-xl border border-[#EBCDB8] px-3 py-2 text-xs font-black text-[#C80503] hover:bg-[#FFF6EA]"><Trash2 className="mr-1 h-3 w-3"/>Hapus</button></td></tr>) : <tr><td colSpan={8} className="p-8 text-center text-sm font-semibold text-[#7A6258]">Belum ada data pengeluaran.</td></tr>}</tbody></table></div>
    </Card>
    <div className="mt-5 grid gap-4 xl:grid-cols-2">{categorySummary.map((item) => <Card key={item.category} className="p-4"><div className="flex items-center justify-between"><div><p className="font-black text-[#2A1712]">{item.category}</p><p className="text-sm text-[#7A6258]">{item.count} transaksi</p></div><p className="font-black text-[#C80503]">{rupiah(item.total_amount)}</p></div></Card>)}{categorySummary.length === 0 && <Card className="border-dashed border-[#EBCDB8] p-6 text-center text-sm font-semibold text-[#7A6258]">Belum ada ringkasan kategori.</Card>}</div>
    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-[24px] bg-[#FFFDF8] p-5 shadow-xl"><h3 className="text-lg font-black text-[#2A1712]">Tambah Pengeluaran</h3><form onSubmit={handleSubmit} className="mt-4 grid gap-3"><select value={form.branch_id} onChange={(e)=>setForm((c)=>({...c, branch_id: e.target.value}))} className="rounded-2xl border border-[#EBCDB8] bg-white px-4 py-3 text-sm font-bold text-[#2A1712]"><option value="">Pilih Cabang</option>{branches.map((b)=><option key={b.id} value={b.id}>{b.name}</option>)}</select><input value={form.category} onChange={(e)=>setForm((c)=>({...c, category: e.target.value}))} placeholder="Kategori" className="rounded-2xl border border-[#EBCDB8] px-4 py-3" /><textarea value={form.description} onChange={(e)=>setForm((c)=>({...c, description: e.target.value}))} placeholder="Deskripsi" className="rounded-2xl border border-[#EBCDB8] px-4 py-3" /><input type="text" inputMode="numeric" value={formatNumberInput(form.amount)} onChange={(e)=>setForm((c)=>({...c, amount: parseNumberInput(e.target.value)}))} placeholder="Nominal" className="rounded-2xl border border-[#EBCDB8] px-4 py-3" /><input type="date" value={form.expense_date} onChange={(e)=>setForm((c)=>({...c, expense_date: e.target.value}))} className="rounded-2xl border border-[#EBCDB8] px-4 py-3" /><div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowModal(false)} className="rounded-2xl border border-[#EBCDB8] px-4 py-3 font-black text-[#2A1712]">Batal</button><button type="submit" className="rounded-2xl bg-[#C80503] px-4 py-3 font-black text-white">Simpan</button></div></form></div></div>}
  </div>;
}

export default PengeluaranPage;
