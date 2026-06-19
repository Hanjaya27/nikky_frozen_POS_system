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
  Trash2,
  WalletCards,
} from "lucide-react";

const PERMISSION_STORAGE_KEY = "nikky_kasir_permissions";
const STORE_SETTING_KEY = "nikky_store_settings";
const STOCK_SETTING_KEY = "nikky_stock_settings";
const TRANSACTION_SETTING_KEY = "nikky_transaction_settings";

const defaultPermissions = [
  {
    id: "pos",
    name: "Kasir / POS",
    description: "Kasir dapat membuat transaksi penjualan.",
    icon: ShoppingCart,
    kasirAccess: true,
    recommended: true,
  },
  {
    id: "shift",
    name: "Shift Saya",
    description: "Kasir dapat membuka dan menutup shift kerja.",
    icon: Clock3,
    kasirAccess: true,
    recommended: true,
  },
  {
    id: "transaksi",
    name: "Riwayat Transaksi",
    description: "Kasir dapat melihat riwayat transaksi kasir.",
    icon: ReceiptText,
    kasirAccess: true,
    recommended: true,
  },
  {
    id: "barang",
    name: "Barang & Stok",
    description: "Kasir dapat melihat monitoring stok produk.",
    icon: Boxes,
    kasirAccess: false,
    recommended: false,
  },
  {
    id: "laporan",
    name: "Laporan",
    description: "Kasir dapat melihat laporan penjualan.",
    icon: LayoutDashboard,
    kasirAccess: false,
    recommended: false,
  },
  {
    id: "pengeluaran",
    name: "Pengeluaran",
    description: "Kasir dapat membuka data pengeluaran.",
    icon: WalletCards,
    kasirAccess: false,
    recommended: false,
  },
  {
    id: "pengaturan",
    name: "Pengaturan",
    description: "Kasir dapat membuka halaman pengaturan sistem.",
    icon: Settings,
    kasirAccess: false,
    recommended: false,
  },
];

const defaultStoreSettings = {
  storeName: "Nikky Frozen Food",
  ownerName: "Owner",
  branchName: "Cabang 1",
  phone: "08xxxxxxxxxx",
  address: "Alamat toko belum diatur",
  footerReceipt: "Terima kasih sudah berbelanja.",
};

const defaultStockSettings = {
  defaultMinStock: 5,
  expiryWarningDays: 30,
  showWarehouseMap: true,
  lowStockAlert: true,
  expiredAlert: true,
};

const defaultTransactionSettings = {
  allowCash: true,
  allowQris: true,
  allowTransfer: true,
  allowDiscount: true,
  allowVoid: false,
  printReceipt: true,
};

const tabs = [
  { id: "profil", label: "Profil Toko", icon: Store },
  { id: "akses", label: "Akses Kasir", icon: ShieldCheck },
  { id: "stok", label: "Stok & Expired", icon: Boxes },
  { id: "transaksi", label: "Transaksi", icon: CreditCard },
  { id: "struk", label: "Struk", icon: Printer },
];

function readJsonStorage(key, fallback) {
  const savedValue = localStorage.getItem(key);

  if (!savedValue) return fallback;

  try {
    return {
      ...fallback,
      ...JSON.parse(savedValue),
    };
  } catch {
    return fallback;
  }
}

function mergePermissions(savedPermissions) {
  if (!Array.isArray(savedPermissions)) return defaultPermissions;

  return defaultPermissions.map((defaultPermission) => {
    const foundPermission = savedPermissions.find(
      (permission) => permission.id === defaultPermission.id,
    );

    if (!foundPermission) return defaultPermission;

    return {
      ...defaultPermission,
      kasirAccess: Boolean(foundPermission.kasirAccess),
    };
  });
}

function readPermissions() {
  const savedPermissions = localStorage.getItem(PERMISSION_STORAGE_KEY);

  if (!savedPermissions) return defaultPermissions;

  try {
    return mergePermissions(JSON.parse(savedPermissions));
  } catch {
    return defaultPermissions;
  }
}

function writePermissions(permissions) {
  const payload = permissions.map((permission) => ({
    id: permission.id,
    name: permission.name,
    kasirAccess: Boolean(permission.kasirAccess),
  }));

  localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event("nikky_permissions_updated"));
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-[24px] border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0B7FC3]">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h2 className="text-xl font-black text-gray-950">{title}</h2>
        <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-gray-700">
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
      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-[110px] w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
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
          ? "border-sky-200 bg-sky-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            checked
              ? "bg-white text-[#0B7FC3] ring-1 ring-sky-100"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="font-black text-gray-950">{title}</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <div
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
          checked ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
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
          ? "border-sky-200 bg-sky-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            isActive
              ? "bg-white text-[#0B7FC3] ring-1 ring-sky-100"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
            isActive
              ? "bg-green-50 text-green-700 ring-1 ring-green-100"
              : "bg-gray-100 text-gray-500"
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
          <h3 className="font-black text-gray-950">{permission.name}</h3>

          {permission.recommended && (
            <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-green-700">
              Utama
            </span>
          )}
        </div>

        <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
          {permission.description}
        </p>
      </div>
    </button>
  );
}

function PengaturanPage() {
  const [activeTab, setActiveTab] = useState("profil");
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings);
  const [stockSettings, setStockSettings] = useState(defaultStockSettings);
  const [transactionSettings, setTransactionSettings] = useState(
    defaultTransactionSettings,
  );
  const [isSaved, setIsSaved] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    setPermissions(readPermissions());
    setStoreSettings(readJsonStorage(STORE_SETTING_KEY, defaultStoreSettings));
    setStockSettings(readJsonStorage(STOCK_SETTING_KEY, defaultStockSettings));
    setTransactionSettings(
      readJsonStorage(TRANSACTION_SETTING_KEY, defaultTransactionSettings),
    );
  }, []);

  const activePermissionCount = useMemo(() => {
    return permissions.filter((permission) => permission.kasirAccess).length;
  }, [permissions]);

  const saveAllSettings = () => {
    writePermissions(permissions);
    localStorage.setItem(STORE_SETTING_KEY, JSON.stringify(storeSettings));
    localStorage.setItem(STOCK_SETTING_KEY, JSON.stringify(stockSettings));
    localStorage.setItem(
      TRANSACTION_SETTING_KEY,
      JSON.stringify(transactionSettings),
    );

    setSavedAt(
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
    setIsSaved(true);

    setTimeout(() => setIsSaved(false), 4000);
  };

  const resetAllSettings = () => {
    const confirmReset = confirm(
      "Yakin ingin mengembalikan semua pengaturan ke default?",
    );

    if (!confirmReset) return;

    setPermissions(defaultPermissions);
    setStoreSettings(defaultStoreSettings);
    setStockSettings(defaultStockSettings);
    setTransactionSettings(defaultTransactionSettings);
    setIsSaved(false);
  };

  const clearLocalData = () => {
    const confirmClear = confirm(
      "Yakin ingin menghapus data pengaturan lokal? Data login tidak ikut dihapus.",
    );

    if (!confirmClear) return;

    localStorage.removeItem(PERMISSION_STORAGE_KEY);
    localStorage.removeItem(STORE_SETTING_KEY);
    localStorage.removeItem(STOCK_SETTING_KEY);
    localStorage.removeItem(TRANSACTION_SETTING_KEY);

    setPermissions(defaultPermissions);
    setStoreSettings(defaultStoreSettings);
    setStockSettings(defaultStockSettings);
    setTransactionSettings(defaultTransactionSettings);
    window.dispatchEvent(new Event("nikky_permissions_updated"));
  };

  const togglePermission = (permissionId) => {
    setIsSaved(false);

    setPermissions((currentPermissions) =>
      currentPermissions.map((permission) => {
        if (permission.id !== permissionId) return permission;

        return {
          ...permission,
          kasirAccess: !permission.kasirAccess,
        };
      }),
    );
  };

  const setRecommendedPermission = () => {
    setIsSaved(false);

    setPermissions((currentPermissions) =>
      currentPermissions.map((permission) => ({
        ...permission,
        kasirAccess: Boolean(permission.recommended),
      })),
    );
  };

  const enableAllPermission = () => {
    setIsSaved(false);

    setPermissions((currentPermissions) =>
      currentPermissions.map((permission) => ({
        ...permission,
        kasirAccess: true,
      })),
    );
  };

  const updateStoreSetting = (key, value) => {
    setIsSaved(false);
    setStoreSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  };

  const updateStockSetting = (key, value) => {
    setIsSaved(false);
    setStockSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  };

  const updateTransactionSetting = (key, value) => {
    setIsSaved(false);
    setTransactionSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-500">Profil Toko</p>
          <p className="mt-2 truncate text-xl font-black text-gray-950">
            {storeSettings.storeName}
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-400">
            {storeSettings.branchName}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-500">Akses Kasir</p>
          <p className="mt-2 text-3xl font-black text-[#0B7FC3]">
            {activePermissionCount}
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-400">
            Menu aktif untuk kasir
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-500">Peringatan Expired</p>
          <p className="mt-2 text-3xl font-black text-orange-600">
            {stockSettings.expiryWarningDays}
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-400">
            Hari sebelum expired
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-500">Pembayaran</p>
          <p className="mt-2 text-3xl font-black text-green-600">
            {
              [
                transactionSettings.allowCash,
                transactionSettings.allowQris,
                transactionSettings.allowTransfer,
              ].filter(Boolean).length
            }
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-400">
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
                      ? "bg-[#0B7FC3] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
              className="flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-200"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <button
              type="button"
              onClick={saveAllSettings}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#0B7FC3] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#096EA8]"
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
                value={storeSettings.storeName}
                onChange={(event) =>
                  updateStoreSetting("storeName", event.target.value)
                }
              />
            </Field>

            <Field label="Nama Owner">
              <TextInput
                value={storeSettings.ownerName}
                onChange={(event) =>
                  updateStoreSetting("ownerName", event.target.value)
                }
              />
            </Field>

            <Field label="Cabang Aktif">
              <TextInput
                value={storeSettings.branchName}
                onChange={(event) =>
                  updateStoreSetting("branchName", event.target.value)
                }
              />
            </Field>

            <Field label="Nomor Telepon">
              <TextInput
                value={storeSettings.phone}
                onChange={(event) =>
                  updateStoreSetting("phone", event.target.value)
                }
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Alamat Toko">
                <TextArea
                  value={storeSettings.address}
                  onChange={(event) =>
                    updateStoreSetting("address", event.target.value)
                  }
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

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={setRecommendedPermission}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-200"
              >
                <RotateCcw className="h-4 w-4" />
                Default Kasir
              </button>

              <button
                type="button"
                onClick={enableAllPermission}
                className="flex items-center justify-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-black text-[#0B7FC3] transition hover:bg-sky-100"
              >
                <BadgeCheck className="h-4 w-4" />
                Aktifkan Semua
              </button>
            </div>
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
                value={stockSettings.defaultMinStock}
                onChange={(event) =>
                  updateStockSetting(
                    "defaultMinStock",
                    Number(event.target.value),
                  )
                }
              />
            </Field>

            <Field label="Peringatan Expired Sebelum Berapa Hari">
              <TextInput
                type="number"
                min="1"
                value={stockSettings.expiryWarningDays}
                onChange={(event) =>
                  updateStockSetting(
                    "expiryWarningDays",
                    Number(event.target.value),
                  )
                }
              />
            </Field>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <ToggleRow
              title="Tampilkan Map Lokasi"
              description="Menampilkan map freezer/lokasi penyimpanan di Monitoring Stok."
              icon={Boxes}
              checked={stockSettings.showWarehouseMap}
              onChange={() =>
                updateStockSetting(
                  "showWarehouseMap",
                  !stockSettings.showWarehouseMap,
                )
              }
            />

            <ToggleRow
              title="Peringatan Stok Menipis"
              description="Menandai produk yang stoknya sama atau di bawah minimum."
              icon={BellRing}
              checked={stockSettings.lowStockAlert}
              onChange={() =>
                updateStockSetting("lowStockAlert", !stockSettings.lowStockAlert)
              }
            />

            <ToggleRow
              title="Peringatan Expired"
              description="Menandai produk expired atau mendekati expired."
              icon={BellRing}
              checked={stockSettings.expiredAlert}
              onChange={() =>
                updateStockSetting("expiredAlert", !stockSettings.expiredAlert)
              }
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
              checked={transactionSettings.allowCash}
              onChange={() =>
                updateTransactionSetting("allowCash", !transactionSettings.allowCash)
              }
            />

            <ToggleRow
              title="Pembayaran QRIS"
              description="Aktifkan metode pembayaran QRIS."
              icon={CreditCard}
              checked={transactionSettings.allowQris}
              onChange={() =>
                updateTransactionSetting("allowQris", !transactionSettings.allowQris)
              }
            />

            <ToggleRow
              title="Pembayaran Transfer"
              description="Aktifkan metode pembayaran transfer bank."
              icon={CreditCard}
              checked={transactionSettings.allowTransfer}
              onChange={() =>
                updateTransactionSetting(
                  "allowTransfer",
                  !transactionSettings.allowTransfer,
                )
              }
            />

            <ToggleRow
              title="Diskon Transaksi"
              description="Izinkan kasir memberi diskon saat pembayaran."
              icon={ReceiptText}
              checked={transactionSettings.allowDiscount}
              onChange={() =>
                updateTransactionSetting(
                  "allowDiscount",
                  !transactionSettings.allowDiscount,
                )
              }
            />

            <ToggleRow
              title="Void / Batalkan Transaksi"
              description="Batasi fitur pembatalan transaksi agar hanya owner yang bisa."
              icon={ShieldCheck}
              checked={transactionSettings.allowVoid}
              onChange={() =>
                updateTransactionSetting("allowVoid", !transactionSettings.allowVoid)
              }
            />

            <ToggleRow
              title="Cetak Struk"
              description="Tampilkan opsi cetak struk setelah transaksi berhasil."
              icon={Printer}
              checked={transactionSettings.printReceipt}
              onChange={() =>
                updateTransactionSetting(
                  "printReceipt",
                  !transactionSettings.printReceipt,
                )
              }
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
                value={storeSettings.footerReceipt}
                onChange={(event) =>
                  updateStoreSetting("footerReceipt", event.target.value)
                }
              />
            </Field>

            <div className="rounded-[22px] border border-dashed border-gray-300 bg-gray-50 p-5">
              <p className="text-center text-sm font-black uppercase tracking-[0.18em] text-gray-400">
                Preview Struk
              </p>

              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-center text-base font-black text-gray-950">
                  {storeSettings.storeName}
                </p>
                <p className="mt-1 text-center text-xs font-semibold text-gray-500">
                  {storeSettings.branchName}
                </p>
                <p className="mt-1 text-center text-xs font-semibold text-gray-500">
                  {storeSettings.phone}
                </p>

                <div className="my-4 border-t border-dashed border-gray-300" />

                <div className="space-y-2 text-sm font-semibold text-gray-600">
                  <div className="flex justify-between">
                    <span>Nugget Ayam x1</span>
                    <span>Rp 35.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sosis Sapi x1</span>
                    <span>Rp 42.000</span>
                  </div>
                </div>

                <div className="my-4 border-t border-dashed border-gray-300" />

                <div className="flex justify-between text-base font-black text-gray-950">
                  <span>Total</span>
                  <span>Rp 77.000</span>
                </div>

                <p className="mt-5 text-center text-xs font-semibold leading-relaxed text-gray-500">
                  {storeSettings.footerReceipt}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clearLocalData}
            className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Data Pengaturan Lokal
          </button>
        </Card>
      )}
    </div>
  );
}

export default PengaturanPage;
