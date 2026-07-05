import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BellRing,
  Boxes,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Printer,
  ReceiptText,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  ToggleLeft,
  ToggleRight,
  WalletCards,
} from "lucide-react";
import * as api from "../../services/api";

const tabs = [
  { id: "profil", label: "Profil Toko", icon: Store },
  { id: "akses", label: "Akses Kasir", icon: ShieldCheck },
  { id: "stok", label: "Stok & Expired", icon: Boxes },
  { id: "transaksi", label: "Transaksi", icon: CreditCard },
  { id: "struk", label: "Struk", icon: Printer },
];

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-[24px] border border-[#f1d8c8] bg-white shadow-sm ${className}`}
    >
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
        <p className="mt-1 text-sm font-medium leading-relaxed text-[#8a6f66]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#5f4b45]">
        {label}
      </span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-[#f1d8c8] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#241313] outline-none transition focus:border-[#d50000] focus:bg-white focus:ring-4 focus:ring-[#fee2e2]"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-[110px] w-full resize-none rounded-2xl border border-[#f1d8c8] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#241313] outline-none transition focus:border-[#d50000] focus:bg-white focus:ring-4 focus:ring-[#fee2e2]"
    />
  );
}

function ToggleRow({ title, description, checked, onChange, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-[#f3d6c4] bg-[#fff1f1]"
          : "border-[#f1d8c8] bg-white hover:bg-[#fffaf3]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            checked
              ? "bg-white text-[#d50000] ring-1 ring-[#fee2e2]"
              : "bg-[#fef6ec] text-[#8a6f66]"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="font-black text-[#241313]">{title}</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-[#8a6f66]">
            {description}
          </p>
        </div>
      </div>

      <div
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
          checked ? "bg-green-50 text-green-700" : "bg-[#fef6ec] text-[#8a6f66]"
        }`}
      >
        {checked ? "Aktif" : "Nonaktif"}
      </div>
    </button>
  );
}

function PermissionCard({ permission, onToggle }) {
  const Icon = permission.icon;
  const isActive = permission.kasirAccess;

  return (
    <button
      type="button"
      onClick={() => onToggle(permission.id)}
      className={`rounded-[22px] border p-4 text-left transition ${
        isActive
          ? "border-[#f3d6c4] bg-[#fff1f1] shadow-sm"
          : "border-[#f1d8c8] bg-white hover:border-[#f3d6c4] hover:bg-[#fffaf3]"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            isActive
              ? "bg-white text-[#d50000] ring-1 ring-[#fee2e2]"
              : "bg-[#fef6ec] text-[#8a6f66]"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
            isActive
              ? "bg-green-50 text-green-700 ring-1 ring-green-100"
              : "bg-[#fef6ec] text-[#8a6f66]"
          }`}
        >
          {isActive ? (
            <ToggleRight className="h-4 w-4" />
          ) : (
            <ToggleLeft className="h-4 w-4" />
          )}
          {isActive ? "Aktif" : "Nonaktif"}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-black text-[#241313]">{permission.name}</h3>

          {permission.recommended && (
            <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-green-700">
              Utama
            </span>
          )}
        </div>

        <p className="mt-2 text-sm font-medium leading-relaxed text-[#8a6f66]">
          {permission.description}
        </p>
      </div>
    </button>
  );
}

function PengaturanPage() {
  const [activeTab, setActiveTab] = useState("profil");
  const [settings, setSettings] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getOwnerSettings();
      setSettings(data);
      
      // Map permissions from RolePermissionPage logic or a similar API if needed
      // For now, we'll assume permissions are managed via RolePermissionPage, 
      // but we can mirror them here if we want. 
      // The user request says "Tab Akses Kasir... berjalan dengan benar".
      // We will fetch them from the RolePermission API to be consistent.
      const permData = await api.getOwnerRolePermissions();
      setPermissions(permData.permissions.map(p => ({
        id: p.permission_id,
        name: p.feature_name,
        description: p.description,
        kasirAccess: p.raw?.cashier_access ?? false,
        recommended: p.permission_id === 'cashier_pos' || p.permission_id === 'cashier_shift' || p.permission_id === 'cashier_transactions',
        icon: getIconForPermission(p.permission_id)
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  function getIconForPermission(id) {
    const icons = {
      'cashier_pos': ShoppingCart,
      'cashier_shift': Clock3,
      'cashier_transactions': ReceiptText,
      'barang': Boxes,
      'laporan': LayoutDashboard,
      'pengeluaran': WalletCards,
      'pengaturan': Settings,
    };
    return icons[id] || Settings;
  }

  const activePermissionCount = useMemo(() => {
    return permissions.filter((p) => p.kasirAccess).length;
  }, [permissions]);

  const saveAllSettings = async () => {
    try {
      const payload = {
        profile: {
          store_name: settings.profile.store_name,
          owner_name: settings.profile.owner_name,
          phone: settings.profile.phone,
          address: settings.profile.address,
          active_branch_id: settings.profile.active_branch_id,
        },
        cashier_access: {
          allow_discount: settings.cashier_access.allow_discount,
          allow_manual_price: settings.cashier_access.allow_manual_price,
          allow_cancel_transaction: settings.cashier_access.allow_cancel_transaction,
          allow_view_stock: settings.cashier_access.allow_view_stock,
        },
        stock_expired: {
          low_stock_threshold: settings.stock_expired.low_stock_threshold,
          expired_warning_days: settings.stock_expired.expired_warning_days,
          show_expired_alert: settings.stock_expired.show_expired_alert,
          block_expired_sale: settings.stock_expired.block_expired_sale,
          allow_negative_stock: settings.stock_expired.allow_negative_stock,
        },
        transaction: {
          auto_print_receipt: settings.transaction.auto_print_receipt,
          require_shift_open: settings.transaction.require_shift_open,
          payment_methods: settings.transaction.payment_methods,
        },
        receipt: {
          store_header: settings.receipt.store_header,
          footer_note: settings.receipt.footer_note,
          show_cashier_name: settings.receipt.show_cashier_name,
          show_branch_name: settings.receipt.show_branch_name,
          show_phone: settings.receipt.show_phone,
          show_address: settings.receipt.show_address,
        },
      };

      await api.updateOwnerSettings(payload);
      
      setSavedAt(new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }));
      setIsSaved(true);
      await fetchSettings();
      setTimeout(() => setIsSaved(false), 4000);
    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    }
  };

  const resetAllSettings = async () => {
    if (!confirm("Yakin ingin mengembalikan semua pengaturan ke default?")) return;
    await fetchSettings();
    setIsSaved(false);
  };

  const togglePermission = async (permissionId) => {
    setIsSaved(false);
    const permission = permissions.find(p => p.id === permissionId);
    if (!permission) return;
    
    try {
      await api.updateSinglePermissionApi(permissionId, !permission.kasirAccess);
      setPermissions(prev => prev.map(p => p.id === permissionId ? {...p, kasirAccess: !p.kasirAccess} : p));
    } catch (err) {
      alert("Gagal memperbarui permission: " + err.message);
    }
  };

  const updateSetting = (group, key, value) => {
    setIsSaved(false);
    setSettings(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value
      }
    }));
  };

  if (isLoading) return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d50000] border-t-transparent"></div>
        <p className="text-sm font-bold text-[#5f4b45]">Memuat Pengaturan...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex h-full items-center justify-center">
      <div className="rounded-2xl bg-red-50 p-6 text-center">
        <p className="text-red-600 font-bold">{error}</p>
        <button onClick={fetchSettings} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-white text-sm font-bold">Coba Lagi</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fffaf3] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-semibold text-[#8a6f66]">Profil Toko</p>
          <p className="mt-2 truncate text-xl font-black text-[#241313]">
            {settings.profile.store_name}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#8a6f66]">
            {settings.profile.active_branch_name}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-[#8a6f66]">Akses Kasir</p>
          <p className="mt-2 text-3xl font-black text-[#d50000]">
            {activePermissionCount}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#8a6f66]">
            Menu aktif untuk kasir
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-[#8a6f66]">Peringatan Expired</p>
          <p className="mt-2 text-3xl font-black text-orange-600">
            {settings.stock_expired.expired_warning_days}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#8a6f66]">
            Hari sebelum expired
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-[#8a6f66]">Pembayaran</p>
          <p className="mt-2 text-3xl font-black text-green-600">
            {settings.transaction.payment_methods.length}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#8a6f66]">
            Metode aktif
          </p>
        </Card>
      </div>

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    isActive
                      ? "bg-[#d50000] text-white shadow-sm"
                      : "bg-[#fff7ed] text-[#5f4b45] hover:bg-[#fef2f2]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={resetAllSettings}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm font-black text-[#5f4b45] transition hover:bg-[#fef2f2]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <button
              type="button"
              onClick={saveAllSettings}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#d50000] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#c40000]"
            >
              <Save className="h-4 w-4" />
              Simpan Semua
            </button>
          </div>
        </div>

        {isSaved && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Pengaturan berhasil disimpan
            {savedAt ? ` pada ${savedAt}.` : "."}
          </div>
        )}
      </Card>

      {activeTab === "profil" && (
        <Card className="p-5">
          <SectionTitle
            icon={Building2}
            title="Profil Toko"
            description="Atur identitas toko yang akan dipakai di tampilan sistem dan struk."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama Toko">
              <TextInput
                value={settings.profile.store_name}
                onChange={(e) => updateSetting("profile", "store_name", e.target.value)}
              />
            </Field>

            <Field label="Nama Owner">
              <TextInput
                value={settings.profile.owner_name}
                onChange={(e) => updateSetting("profile", "owner_name", e.target.value)}
              />
            </Field>

            <Field label="Cabang Aktif">
              <select
                className="w-full rounded-2xl border border-[#f1d8c8] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#241313] outline-none transition focus:border-[#d50000] focus:bg-white focus:ring-4 focus:ring-[#fee2e2]"
                value={settings.profile.active_branch_id}
                onChange={(e) => updateSetting("profile", "active_branch_id", Number(e.target.value))}
              >
                {settings.branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Nomor Telepon">
              <TextInput
                value={settings.profile.phone}
                onChange={(e) => updateSetting("profile", "phone", e.target.value)}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Alamat Toko">
                <TextArea
                  value={settings.profile.address}
                  onChange={(e) => updateSetting("profile", "address", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "akses" && (
        <Card className="p-5">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionTitle
              icon={ShieldCheck}
              title="Akses Menu Kasir"
              description="Owner bisa memilih menu yang muncul di sidebar kasir."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {permissions.map((permission) => (
              <PermissionCard
                key={permission.id}
                permission={permission}
                onToggle={togglePermission}
              />
            ))}
          </div>
        </Card>
      )}

      {activeTab === "stok" && (
        <Card className="p-5">
          <SectionTitle
            icon={Boxes}
            title="Pengaturan Stok & Expired"
            description="Atur batas minimum stok, peringatan expired, dan map lokasi penyimpanan."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Default Minimum Stok">
              <TextInput
                type="number"
                min="0"
                value={settings.stock_expired.low_stock_threshold}
                onChange={(e) => updateSetting("stock_expired", "low_stock_threshold", Number(e.target.value))}
              />
            </Field>

            <Field label="Peringatan Expired Sebelum Berapa Hari">
              <TextInput
                type="number"
                min="1"
                value={settings.stock_expired.expired_warning_days}
                onChange={(e) => updateSetting("stock_expired", "expired_warning_days", Number(e.target.value))}
              />
            </Field>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <ToggleRow
              title="Peringatan Expired"
              description="Tampilkan peringatan untuk produk yang mendekati expired."
              icon={BellRing}
              checked={settings.stock_expired.show_expired_alert}
              onChange={() => updateSetting("stock_expired", "show_expired_alert", !settings.stock_expired.show_expired_alert)}
            />

            <ToggleRow
              title="Blokir Penjualan Expired"
              description="Cegah transaksi produk yang sudah expired."
              icon={BellRing}
              checked={settings.stock_expired.block_expired_sale}
              onChange={() => updateSetting("stock_expired", "block_expired_sale", !settings.stock_expired.block_expired_sale)}
            />

            <ToggleRow
              title="Izinkan Stok Negatif"
              description="Memperbolehkan stok produk menjadi minus."
              icon={Boxes}
              checked={settings.stock_expired.allow_negative_stock}
              onChange={() => updateSetting("stock_expired", "allow_negative_stock", !settings.stock_expired.allow_negative_stock)}
            />
          </div>
        </Card>
      )}

      {activeTab === "transaksi" && (
        <Card className="p-5">
          <SectionTitle
            icon={CreditCard}
            title="Pengaturan Transaksi"
            description="Atur metode pembayaran dan batas aksi kasir saat transaksi."
          />

          <div className="grid gap-3 lg:grid-cols-2">
            <ToggleRow
              title="Pembayaran Tunai"
              description="Aktifkan pembayaran menggunakan uang tunai."
              icon={WalletCards}
              checked={settings.transaction.payment_methods.includes("cash")}
              onChange={() => {
                const methods = settings.transaction.payment_methods;
                const next = methods.includes("cash") 
                  ? methods.filter(m => m !== "cash") 
                  : [...methods, "cash"];
                updateSetting("transaction", "payment_methods", next);
              }}
            />

            <ToggleRow
              title="Pembayaran QRIS"
              description="Aktifkan metode pembayaran QRIS."
              icon={CreditCard}
              checked={settings.transaction.payment_methods.includes("qris")}
              onChange={() => {
                const methods = settings.transaction.payment_methods;
                const next = methods.includes("qris") 
                  ? methods.filter(m => m !== "qris") 
                  : [...methods, "qris"];
                updateSetting("transaction", "payment_methods", next);
              }}
            />

            <ToggleRow
              title="Pembayaran Transfer"
              description="Aktifkan metode pembayaran transfer bank."
              icon={CreditCard}
              checked={settings.transaction.payment_methods.includes("transfer")}
              onChange={() => {
                const methods = settings.transaction.payment_methods;
                const next = methods.includes("transfer") 
                  ? methods.filter(m => m !== "transfer") 
                  : [...methods, "transfer"];
                updateSetting("transaction", "payment_methods", next);
              }}
            />

            <ToggleRow
              title="Diskon Transaksi"
              description="Izinkan kasir memberi diskon saat pembayaran."
              icon={ReceiptText}
              checked={settings.cashier_access.allow_discount}
              onChange={() => updateSetting("cashier_access", "allow_discount", !settings.cashier_access.allow_discount)}
            />

            <ToggleRow
              title="Void / Batalkan Transaksi"
              description="Batasi fitur pembatalan transaksi agar hanya owner yang bisa."
              icon={ShieldCheck}
              checked={settings.cashier_access.allow_cancel_transaction}
              onChange={() => updateSetting("cashier_access", "allow_cancel_transaction", !settings.cashier_access.allow_cancel_transaction)}
            />

            <ToggleRow
              title="Auto Cetak Struk"
              description="Cetak struk otomatis setelah transaksi berhasil."
              icon={Printer}
              checked={settings.transaction.auto_print_receipt}
              onChange={() => updateSetting("transaction", "auto_print_receipt", !settings.transaction.auto_print_receipt)}
            />

            <ToggleRow
              title="Wajib Buka Shift"
              description="Kasir harus membuka shift sebelum melakukan transaksi."
              icon={Clock3}
              checked={settings.transaction.require_shift_open}
              onChange={() => updateSetting("transaction", "require_shift_open", !settings.transaction.require_shift_open)}
            />
          </div>
        </Card>
      )}

      {activeTab === "struk" && (
        <Card className="p-5">
          <SectionTitle
            icon={Printer}
            title="Pengaturan Struk"
            description="Atur teks tambahan yang tampil di bagian bawah struk."
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <Field label="Footer Struk">
              <TextArea
                value={settings.receipt.footer_note}
                onChange={(e) => updateSetting("receipt", "footer_note", e.target.value)}
              />
            </Field>

            <div className="rounded-[22px] border border-dashed border-[#f1d8c8] bg-[#fffaf3] p-5">
              <p className="text-center text-sm font-black uppercase tracking-[0.18em] text-[#8a6f66]">
                Preview Struk
              </p>

              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-center text-base font-black text-[#241313]">
                  {settings.profile.store_name}
                </p>
                <p className="mt-1 text-center text-xs font-semibold text-[#8a6f66]">
                  {settings.profile.active_branch_name}
                </p>
                <p className="mt-1 text-center text-xs font-semibold text-[#8a6f66]">
                  {settings.profile.phone}
                </p>

                <div className="my-4 border-t border-dashed border-[#f1d8c8]" />

                <div className="space-y-2 text-sm font-semibold text-[#5f4b45]">
                  <div className="flex justify-between">
                    <span>Nugget Ayam x1</span>
                    <span>Rp 35.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sosis Sapi x1</span>
                    <span>Rp 42.000</span>
                  </div>
                </div>

                <div className="my-4 border-t border-dashed border-[#f1d8c8]" />

                <div className="flex justify-between text-base font-black text-[#241313]">
                  <span>Total</span>
                  <span>Rp 77.000</span>
                </div>

                <p className="mt-5 text-center text-xs font-semibold leading-relaxed text-[#8a6f66]">
                  {settings.receipt.footer_note}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default PengaturanPage;
