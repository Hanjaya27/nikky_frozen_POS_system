import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Boxes,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Printer,
  ReceiptText,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  WalletCards,
} from "lucide-react";
import * as api from "../../services/api";
import { useNavigate } from "react-router-dom";

const tabs = [
  { id: "profil", label: "Profil Toko", icon: Store },
  { id: "stok", label: "Stok & Expired", icon: Boxes },
  { id: "transaksi", label: "Transaksi", icon: CreditCard },
  { id: "struk", label: "Struk", icon: Printer },
];

function Card({ children, className = "" }) {
  return (
    <div className={"rounded-[24px] border border-[#f1d8c8] bg-white shadow-sm " + (className || "")}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#d50000]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-black text-[#241313]">{title}</h2>
        <p className="mt-1 text-sm font-medium leading-relaxed text-[#8a6f66]">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#5f4b45]">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input {...props} className="w-full rounded-2xl border border-[#f1d8c8] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#241313] outline-none transition focus:border-[#d50000] focus:bg-white focus:ring-4 focus:ring-[#fee2e2]" />
  );
}

function TextArea(props) {
  return (
    <textarea {...props} className="min-h-[110px] w-full resize-none rounded-2xl border border-[#f1d8c8] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#241313] outline-none transition focus:border-[#d50000] focus:bg-white focus:ring-4 focus:ring-[#fee2e2]" />
  );
}

function ToggleRow({ title, description, checked, onChange, icon: Icon }) {
  const activeClass = checked ? "border-[#f3d6c4] bg-[#fff1f1]" : "border-[#f1d8c8] bg-white hover:bg-[#fffaf3]";
  const iconClass = checked ? "bg-white text-[#d50000] ring-1 ring-[#fee2e2]" : "bg-[#fef6ec] text-[#8a6f66]";
  const badgeClass = checked ? "bg-green-50 text-green-700" : "bg-[#fef6ec] text-[#8a6f66]";
  return (
    <button type="button" onClick={onChange} className={"flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition " + activeClass}>
      <div className="flex min-w-0 items-start gap-3">
        <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl " + iconClass}><Icon className="h-5 w-5" /></div>
        <div><p className="font-black text-[#241313]">{title}</p><p className="mt-1 text-sm font-medium leading-relaxed text-[#8a6f66]">{description}</p></div>
      </div>
      <div className={"shrink-0 rounded-full px-3 py-1 text-xs font-black " + badgeClass}>{checked ? "Aktif" : "Nonaktif"}</div>
    </button>
  );
}


function PengaturanPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("nikky_settings_tab");
    return ["profil", "stok", "transaksi", "struk"].includes(saved) ? saved : "profil";
  });
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getOwnerSettingsCached(true);
      setSettings(data);
    } catch (err) {
      setError(err.message || "Gagal memuat data pengaturan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const updateSetting = (group, key, value) => {
    setSettings((prev) => ({ ...prev, [group]: { ...(prev[group] || {}), [key]: value } }));
  };

  const handlePaymentMethodToggle = (method) => {
    const methods = settings?.transaction?.payment_methods || [];
    const next = methods.includes(method) ? methods.filter((m) => m !== method) : [...methods, method];
    updateSetting("transaction", "payment_methods", next);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true); setError(null); setIsSaved(false);
      const payload = {
        profile: { store_name: settings?.profile?.store_name || "", owner_name: settings?.profile?.owner_name || "", phone: settings?.profile?.phone || "", address: settings?.profile?.address || "", active_branch_id: settings?.profile?.active_branch_id || null },
        stock_expired: { low_stock_threshold: settings?.stock_expired?.low_stock_threshold ?? 5, expired_warning_days: settings?.stock_expired?.expired_warning_days ?? 30, show_expired_alert: Boolean(settings?.stock_expired?.show_expired_alert), block_expired_sale: Boolean(settings?.stock_expired?.block_expired_sale), allow_negative_stock: Boolean(settings?.stock_expired?.allow_negative_stock) },
        transaction: { auto_print_receipt: Boolean(settings?.transaction?.auto_print_receipt), require_shift_open: Boolean(settings?.transaction?.require_shift_open), payment_methods: settings?.transaction?.payment_methods || ["cash"] },
        receipt: { footer_note: settings?.receipt?.footer_note || "" },
      };
      const result = await api.updateOwnerSettings(payload);
      setSettings(result.data);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => { fetchSettings(); setError(null); setIsSaved(false); };

  const summaryCards = useMemo(() => {
    if (!settings) return [];
    return [
      { label: "Profil Toko", value: settings?.profile?.store_name || "-", note: settings?.profile?.active_branch_name || "-", icon: Store, tone: "red" },
      { label: "Peringatan Expired", value: settings?.stock_expired?.expired_warning_days ?? 0, note: "Hari sebelum expired", icon: BellRing, tone: "amber" },
      { label: "Pembayaran", value: settings?.transaction?.payment_methods?.length ?? 0, note: "Metode aktif", icon: WalletCards, tone: "green" },
    ];
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-[#C80503]" /><p className="mt-4 font-bold text-[#7A6258]">Memuat pengaturan...</p></div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md text-center"><Settings className="mx-auto h-12 w-12 text-[#EBCDB8]" /><p className="mt-4 font-bold text-[#7A6258]">{error}</p>
          <button onClick={fetchSettings} className="mt-4 rounded-2xl bg-[#C80503] px-5 py-3 text-sm font-bold text-white hover:bg-[#A80000]">Coba Lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-[#241313] sm:text-3xl">Pengaturan Toko</h1>
        <p className="mt-1 text-sm font-semibold text-[#8a6f66]">Atur profil toko, stok & expired, transaksi, struk, dan konfigurasi operasional toko.</p>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {summaryCards.map((card, idx) => {
          const tones = { red: "bg-[#fff1f1] text-[#d50000]", amber: "bg-[#fff7ed] text-[#f97316]", green: "bg-[#ecfdf5] text-[#16a34a]" };
          return (
            <div key={idx} className="rounded-[24px] border border-[#f1d8c8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#8a6f66]">{card.label}</p>
                  <p className="mt-2 truncate text-xl font-black text-[#241313]">{card.value}</p>
                  <p className="mt-1 text-xs font-semibold text-[#8a6f66]">{card.note}</p>
                </div>
                <div className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#f1d8c8] " + tones[card.tone]}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-5 rounded-[24px] border border-[#f1d8c8] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const btnClass = isActive ? "bg-[#d50000] text-white shadow-sm" : "bg-[#fff7ed] text-[#5f4b45] hover:bg-[#fee2e2]";
              return (
                <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id); localStorage.setItem("nikky_settings_tab", tab.id); }}
                  className={"flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition " + btnClass}>
                  <Icon className="h-4 w-4" />{tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleReset} className="flex items-center justify-center gap-2 rounded-2xl border border-[#f1d8c8] bg-white px-4 py-3 text-sm font-black text-[#5f4b45] transition hover:bg-[#fee2e2]"><RotateCcw className="h-4 w-4" />Reset</button>
            <button type="button" onClick={handleSave} disabled={isSaving} className={(isSaving ? "cursor-not-allowed bg-[#d50000]/50" : "bg-[#d50000] hover:bg-[#a80000]") + " flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-sm transition"}><Save className="h-4 w-4" />{isSaving ? "Menyimpan..." : "Simpan Semua"}</button>
          </div>
        </div>
        {isSaved && <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700"><CheckCircle2 className="h-5 w-5" />Pengaturan berhasil disimpan.</div>}
        {error && <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      </div>

      {activeTab === "profil" && (
        <div className="rounded-[24px] border border-[#f1d8c8] bg-white p-5 shadow-sm">
          <SectionTitle icon={Store} title="Profil Toko" description="Atur identitas toko yang akan dipakai di tampilan dan struk." />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama Toko"><TextInput value={settings?.profile?.store_name || ""} onChange={(e) => updateSetting("profile", "store_name", e.target.value)} /></Field>
            <Field label="Nama Owner"><TextInput value={settings?.profile?.owner_name || ""} onChange={(e) => updateSetting("profile", "owner_name", e.target.value)} /></Field>
            <Field label="Cabang Aktif"><select className="w-full rounded-2xl border border-[#f1d8c8] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#241313] outline-none transition focus:border-[#d50000] focus:bg-white focus:ring-4 focus:ring-[#fee2e2]" value={settings?.profile?.active_branch_id || ""} onChange={(e) => updateSetting("profile", "active_branch_id", Number(e.target.value))}>{(settings?.branches || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
            <Field label="No Telepon"><TextInput value={settings?.profile?.phone || ""} onChange={(e) => updateSetting("profile", "phone", e.target.value)} /></Field>
            <div className="md:col-span-2"><Field label="Alamat Toko"><TextArea value={settings?.profile?.address || ""} onChange={(e) => updateSetting("profile", "address", e.target.value)} /></Field></div>
          </div>
        </div>
      )}

      {activeTab === "stok" && (
        <div className="rounded-[24px] border border-[#f1d8c8] bg-white p-5 shadow-sm">
          <SectionTitle icon={Boxes} title="Stok & Expired" description="Atur batas minimum stok, peringatan expired, dan map lokasi penyimpanan." />
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Default Minimum Stok"><TextInput type="number" min="0" value={settings?.stock_expired?.low_stock_threshold ?? 5} onChange={(e) => updateSetting("stock_expired", "low_stock_threshold", Number(e.target.value))} /></Field>
            <Field label="Peringatan Expired (hari)"><TextInput type="number" min="1" max="365" value={settings?.stock_expired?.expired_warning_days ?? 30} onChange={(e) => updateSetting("stock_expired", "expired_warning_days", Number(e.target.value))} /></Field>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <ToggleRow title="Peringatan Expired" description="Tampilkan peringatan produk mendekati expired." icon={BellRing} checked={Boolean(settings?.stock_expired?.show_expired_alert)} onChange={() => updateSetting("stock_expired", "show_expired_alert", !settings?.stock_expired?.show_expired_alert)} />
            <ToggleRow title="Blokir Penjualan Expired" description="Cegah transaksi produk expired." icon={BellRing} checked={Boolean(settings?.stock_expired?.block_expired_sale)} onChange={() => updateSetting("stock_expired", "block_expired_sale", !settings?.stock_expired?.block_expired_sale)} />
            <ToggleRow title="Izinkan Stok Negatif" description="Memperbolehkan stok produk menjadi minus." icon={Boxes} checked={Boolean(settings?.stock_expired?.allow_negative_stock)} onChange={() => updateSetting("stock_expired", "allow_negative_stock", !settings?.stock_expired?.allow_negative_stock)} />
          </div>
        </div>
      )}

      {activeTab === "transaksi" && (
        <div className="rounded-[24px] border border-[#f1d8c8] bg-white p-5 shadow-sm">
          <SectionTitle icon={CreditCard} title="Transaksi" description="Atur metode pembayaran dan batas aksi kasir saat transaksi." />
          <div className="grid gap-3 lg:grid-cols-2">
            <ToggleRow title="Pembayaran Tunai" description="Aktifkan pembayaran tunai." icon={WalletCards} checked={(settings?.transaction?.payment_methods || []).includes("cash")} onChange={() => handlePaymentMethodToggle("cash")} />
            <ToggleRow title="Pembayaran QRIS" description="Aktifkan pembayaran QRIS." icon={CreditCard} checked={(settings?.transaction?.payment_methods || []).includes("qris")} onChange={() => handlePaymentMethodToggle("qris")} />
            <ToggleRow title="Pembayaran Transfer" description="Aktifkan pembayaran transfer bank." icon={CreditCard} checked={(settings?.transaction?.payment_methods || []).includes("transfer")} onChange={() => handlePaymentMethodToggle("transfer")} />
            <ToggleRow title="Auto Cetak Struk" description="Cetak struk otomatis setelah transaksi." icon={Printer} checked={Boolean(settings?.transaction?.auto_print_receipt)} onChange={() => updateSetting("transaction", "auto_print_receipt", !settings?.transaction?.auto_print_receipt)} />
            <ToggleRow title="Wajib Buka Shift" description="Kasir harus buka shift sebelum transaksi." icon={Clock3} checked={Boolean(settings?.transaction?.require_shift_open)} onChange={() => updateSetting("transaction", "require_shift_open", !settings?.transaction?.require_shift_open)} />
          </div>
          <div className="mt-4 rounded-2xl border border-[#f1d8c8] bg-[#fffaf3] p-4 text-xs font-semibold text-[#8a6f66]">
            Hak akses menu kasir dikelola melalui <button onClick={() => navigate("/owner/role-permission")} className="font-black text-[#d50000] underline hover:text-[#a80000]">Role &amp; Permission</button>.
          </div>
        </div>
      )}

      {activeTab === "struk" && (
        <div className="rounded-[24px] border border-[#f1d8c8] bg-white p-5 shadow-sm">
          <SectionTitle icon={Printer} title="Struk" description="Atur teks tambahan di bagian bawah struk." />
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <Field label="Footer Struk"><TextArea value={settings?.receipt?.footer_note || ""} onChange={(e) => updateSetting("receipt", "footer_note", e.target.value)} /></Field>
            <div className="rounded-[22px] border border-dashed border-[#f1d8c8] bg-[#fffaf3] p-5">
              <p className="text-center text-sm font-black uppercase tracking-[0.18em] text-[#8a6f66]">Preview Struk</p>
              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-center text-base font-black text-[#241313]">{settings?.profile?.store_name || "Toko"}</p>
                <p className="mt-1 text-center text-xs font-semibold text-[#8a6f66]">{settings?.profile?.active_branch_name || ""}</p>
                <p className="mt-1 text-center text-xs font-semibold text-[#8a6f66]">{settings?.profile?.phone || ""}</p>
                <div className="my-4 border-t border-dashed border-[#f1d8c8]" />
                <div className="space-y-2 text-sm font-semibold text-[#5f4b45]"><div className="flex justify-between"><span>Nugget Ayam x1</span><span>Rp 35.000</span></div><div className="flex justify-between"><span>Sosis Sapi x1</span><span>Rp 42.000</span></div></div>
                <div className="my-4 border-t border-dashed border-[#f1d8c8]" />
                <div className="flex justify-between text-base font-black text-[#241313]"><span>Total</span><span>Rp 77.000</span></div>
                <p className="mt-5 text-center text-xs font-semibold leading-relaxed text-[#8a6f66]">{settings?.receipt?.footer_note || ""}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PengaturanPage;
