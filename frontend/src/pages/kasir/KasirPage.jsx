import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import ProductCard from "../../components/ProductCard";
import CartItem from "../../components/CartItem";
import PaymentSummary from "../../components/PaymentSummary";

import {
  checkoutTransaction,
  getCurrentShift,
  getProducts,
  getSettingsApi,
} from "../../services/api";

const categories = ["Semua", "Frozen Food", "Snack", "Dessert"];

const branches = [
  { id: null, name: "Semua" },
  { id: 1, name: "Cabang 1" },
  { id: 2, name: "Cabang 2" },
];

const defaultReceiptSetting = {
  ppnActive: true,
  ppnRate: 11,
  maxDiscount: 10,
  roundingType: "Tidak ada pembulatan",
  invoiceFormat: "INV-{YYYY}{MM}{DD}-{0000}",
  resetNumber: "Reset setiap hari",
  paperSize: "Thermal 80mm",
  margin: 5,
  autoPrint: true,
  showCashierName: true,
  showBranchName: true,
  footerNote: "Terima kasih telah berbelanja di Nikky Frozen.",
};

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateTime(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSavedData(key, fallbackData) {
  const savedData = localStorage.getItem(key);

  if (!savedData) {
    return fallbackData;
  }

  try {
    return JSON.parse(savedData);
  } catch (error) {
    localStorage.removeItem(key);
    return fallbackData;
  }
}

function getBranchIdByName(branchName) {
  if (branchName === "Cabang 1") return 1;
  if (branchName === "Cabang 2") return 2;

  return null;
}

function getBranchNameById(branchId) {
  if (Number(branchId) === 1) return "Cabang 1";
  if (Number(branchId) === 2) return "Cabang 2";

  return "-";
}

function normalizeReceiptSetting(setting = {}) {
  return {
    ...defaultReceiptSetting,
    ...setting,
    ppnActive:
      setting.ppnActive !== undefined
        ? Boolean(setting.ppnActive)
        : defaultReceiptSetting.ppnActive,
    ppnRate: Number(setting.ppnRate ?? defaultReceiptSetting.ppnRate),
    maxDiscount: Number(
      setting.maxDiscount ?? defaultReceiptSetting.maxDiscount
    ),
    margin: Number(setting.margin ?? defaultReceiptSetting.margin),
    autoPrint:
      setting.autoPrint !== undefined
        ? Boolean(setting.autoPrint)
        : defaultReceiptSetting.autoPrint,
    showCashierName:
      setting.showCashierName !== undefined
        ? Boolean(setting.showCashierName)
        : defaultReceiptSetting.showCashierName,
    showBranchName:
      setting.showBranchName !== undefined
        ? Boolean(setting.showBranchName)
        : defaultReceiptSetting.showBranchName,
  };
}

function normalizeProduct(product) {
  return {
    ...product,
    id: product.id,
    branch_id: product.branch_id,
    code: product.code,
    name: product.name,
    category: product.category,
    stock: Number(product.stock || 0),
    min_stock: Number(product.min_stock || 0),
    minStock: Number(product.min_stock || 0),
    minimumStock: Number(product.min_stock || 0),
    price: Number(product.price || 0),
    expired_date: product.expired_date,
    expiredDate: product.expired_date,
    storage_location: product.storage_location,
    location: product.storage_location,
    image: product.image || "",
    status: product.status || "Aktif",
    branch: product.branch?.name || getBranchNameById(product.branch_id),
  };
}

function normalizeShift(shift) {
  if (!shift) return null;

  return {
    id: shift.id,
    branch_id: shift.branch_id,
    branch: shift.branch?.name || getBranchNameById(shift.branch_id),
    cashierName: shift.cashier_name,
    username: shift.username,
    shiftName: shift.shift_name,
    openingCash: Number(shift.opening_cash || 0),
    closingCash:
      shift.closing_cash === null || shift.closing_cash === undefined
        ? null
        : Number(shift.closing_cash || 0),
    openTime: shift.opened_at,
    closeTime: shift.closed_at,
    totalSales: Number(shift.total_sales || 0),
    totalTransactions: Number(shift.total_transactions || 0),
    expectedCash: Number(shift.expected_cash || 0),
    cashDifference: Number(shift.cash_difference || 0),
    note: shift.note || "-",
    status: shift.status || "Berjalan",
  };
}

function normalizeBackendTransaction(transaction) {
  return {
    id: transaction.id,
    invoiceNumber: transaction.invoice_number,
    transactionDate: transaction.transaction_date,
    cashierName: transaction.cashier_name,
    username: transaction.username,
    branch_id: transaction.branch_id,
    branch: transaction.branch?.name || getBranchNameById(transaction.branch_id),
    shift: transaction.shift_name,
    totalItem: Number(transaction.total_item || 0),
    subtotal: Number(transaction.subtotal || 0),
    discount: Number(transaction.discount || 0),
    tax: Number(transaction.tax || 0),
    taxRate: Number(transaction.tax_rate || 0),
    grandTotal: Number(transaction.grand_total || 0),
    paymentMethod: transaction.payment_method,
    paidAmount: Number(transaction.paid_amount || 0),
    changeAmount: Number(transaction.change_amount || 0),
    status: transaction.status,
    items: (transaction.items || []).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      code: item.product_code,
      name: item.product_name,
      category: item.category,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
      subtotal: Number(item.subtotal || 0),
    })),
  };
}

function KasirPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [runningShift, setRunningShift] = useState(null);
  const [receiptSetting, setReceiptSetting] = useState(defaultReceiptSetting);

  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [paidAmount, setPaidAmount] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingShift, setIsLoadingShift] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("nikky_user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        setCurrentUser(parsedUser);

        if (parsedUser.role === "kasir") {
          setSelectedBranch(parsedUser.branch || "Cabang 1");
        } else {
          setSelectedBranch("Semua");
        }
      } catch (error) {
        setCurrentUser(null);
      }
    }
  }, []);

  const isOwner = currentUser?.role === "owner";
  const isKasir = currentUser?.role === "kasir";

  const activeBranchId = useMemo(() => {
    if (currentUser?.role === "kasir") {
      return getBranchIdByName(currentUser.branch) || 1;
    }

    if (selectedBranch !== "Semua") {
      return getBranchIdByName(selectedBranch);
    }

    return null;
  }, [currentUser, selectedBranch]);

  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true);

      const settingsData = await getSettingsApi();
      const backendReceiptSetting = normalizeReceiptSetting(
        settingsData?.receipt_setting || {}
      );

      setReceiptSetting(backendReceiptSetting);

      localStorage.setItem(
        "nikky_receipt_setting",
        JSON.stringify(backendReceiptSetting)
      );
    } catch (error) {
      const savedReceiptSetting = getSavedData(
        "nikky_receipt_setting",
        defaultReceiptSetting
      );

      setReceiptSetting(normalizeReceiptSetting(savedReceiptSetting));
      setErrorMessage(
        error.message ||
          "Gagal mengambil pengaturan dari backend. Menggunakan pengaturan terakhir."
      );
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setErrorMessage("");

      const params = {};

      if (activeBranchId) {
        params.branch_id = activeBranchId;
      }

      const productData = await getProducts(params);
      const normalizedProducts = productData.map(normalizeProduct);

      setProducts(normalizedProducts);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data produk dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchRunningShift = async () => {
    if (!currentUser?.username || currentUser?.role !== "kasir") {
      setRunningShift(null);
      return null;
    }

    try {
      setIsLoadingShift(true);

      const shiftData = await getCurrentShift(currentUser.username);
      const normalizedShift = shiftData ? normalizeShift(shiftData) : null;

      setRunningShift(normalizedShift);

      return normalizedShift;
    } catch (error) {
      setRunningShift(null);
      setErrorMessage(
        error.message || "Gagal mengambil data shift berjalan dari backend."
      );

      return null;
    } finally {
      setIsLoadingShift(false);
    }
  };

  const refreshPageData = async () => {
    await Promise.all([fetchSettings(), fetchProducts(), fetchRunningShift()]);
  };

  useEffect(() => {
    if (!currentUser) return;

    refreshPageData();
  }, [currentUser, activeBranchId]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = searchKeyword.toLowerCase();

      const matchCategory =
        selectedCategory === "Semua" || product.category === selectedCategory;

      const matchSearch =
        product.name.toLowerCase().includes(keyword) ||
        product.code.toLowerCase().includes(keyword);

      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchKeyword]);

  const subtotal = cartItems.reduce((total, item) => {
    return total + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);

  const discountAmount = Number(discount) || 0;

  const taxRatePercent = receiptSetting.ppnActive
    ? Number(receiptSetting.ppnRate || 0)
    : 0;

  const taxRate = taxRatePercent / 100;

  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = Math.round(taxableAmount * taxRate);
  const grandTotal = taxableAmount + taxAmount;

  const changeAmount =
    paymentMethod === "Tunai" ? Number(paidAmount || 0) - grandTotal : 0;

  const totalItem = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  const handleRefresh = async () => {
    await refreshPageData();
    showSuccess("Data produk, shift, dan pengaturan berhasil diperbarui.");
  };

  const handleAddToCart = async (product) => {
    if (currentUser?.role === "kasir") {
      const latestShift = await fetchRunningShift();

      if (!latestShift) {
        alert("Buka shift terlebih dahulu sebelum melakukan transaksi.");
        return;
      }
    }

    if (Number(product.stock) <= 0) {
      alert("Stok produk habis.");
      return;
    }

    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      if (Number(existingItem.quantity) >= Number(product.stock)) {
        alert("Jumlah produk di keranjang sudah mencapai stok tersedia.");
        return;
      }

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );

      return;
    }

    setCartItems((prevItems) => [
      ...prevItems,
      {
        ...product,
        product_id: product.id,
        quantity: 1,
      },
    ]);
  };

  const handleIncreaseQuantity = (productId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        if (Number(item.quantity) >= Number(item.stock)) {
          alert("Jumlah produk tidak boleh melebihi stok tersedia.");
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  };

  const handleDecreaseQuantity = (productId) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
    setDiscount(0);
    setPaymentMethod("Tunai");
    setPaidAmount("");
  };

  const saveTransactionToLocalStorageBackup = (transactionData) => {
    const savedTransactions = getSavedData("nikky_transactions_backup", []);
    const updatedTransactions = [transactionData, ...savedTransactions];

    localStorage.setItem(
      "nikky_transactions_backup",
      JSON.stringify(updatedTransactions)
    );
  };

  const handleCheckout = async () => {
    if (isCheckingOut) return;

    if (cartItems.length === 0) {
      alert("Keranjang masih kosong.");
      return;
    }

    if (!currentUser) {
      alert("Data login tidak ditemukan. Silakan login ulang.");
      return;
    }

    await fetchSettings();

    let latestRunningShift = runningShift;

    if (currentUser.role === "kasir") {
      latestRunningShift = await fetchRunningShift();

      if (!latestRunningShift) {
        alert("Kasir harus membuka shift terlebih dahulu sebelum transaksi.");
        return;
      }

      if (latestRunningShift.status !== "Berjalan") {
        alert("Shift sudah tidak berjalan. Silakan buka shift baru.");
        return;
      }
    }

    if (currentUser.role === "owner" && !activeBranchId) {
      alert("Owner harus memilih cabang terlebih dahulu sebelum transaksi.");
      return;
    }

    if (discountAmount > subtotal) {
      alert("Diskon tidak boleh lebih besar dari subtotal.");
      return;
    }

    if (paymentMethod === "Tunai" && Number(paidAmount || 0) < grandTotal) {
      alert("Nominal pembayaran belum mencukupi total transaksi.");
      return;
    }

    const hasInvalidStock = cartItems.some((item) => {
      const latestProduct = products.find((product) => product.id === item.id);

      if (!latestProduct) return true;

      return Number(item.quantity) > Number(latestProduct.stock);
    });

    if (hasInvalidStock) {
      alert("Ada produk dengan jumlah melebihi stok tersedia.");
      return;
    }

    const checkoutPayload = {
      branch_id: activeBranchId,
      cashier_name: currentUser.name,
      username: currentUser.username,
      shift_name:
        latestRunningShift?.shiftName || currentUser.shift || "Shift Aktif",
      discount: discountAmount,
      tax_rate: taxRatePercent,
      payment_method: paymentMethod,
      paid_amount:
        paymentMethod === "Tunai" ? Number(paidAmount || 0) : grandTotal,
      items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: Number(item.quantity),
      })),
    };

    try {
      setIsCheckingOut(true);
      setErrorMessage("");

      const backendTransaction = await checkoutTransaction(checkoutPayload);
      const normalizedTransaction =
        normalizeBackendTransaction(backendTransaction);

      saveTransactionToLocalStorageBackup(normalizedTransaction);

      await fetchProducts();
      await fetchRunningShift();

      setLastTransaction(normalizedTransaction);
      setShowPaymentModal(true);

      showSuccess(
        `Transaksi berhasil disimpan ke backend dengan PPN ${taxRatePercent}%.`
      );
    } catch (error) {
      alert(error.message || "Transaksi gagal diproses.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleNewTransaction = () => {
    setShowPaymentModal(false);
    setLastTransaction(null);
    handleClearCart();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title="Kasir / POS"
        description="Transaksi penjualan produk Nikky Frozen berdasarkan cabang, shift, dan pengaturan pajak dari backend."
      />

      <div className="mb-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm hover:bg-green-50"
        >
          Refresh Data
        </button>
      </div>

      {successMessage && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoadingSettings && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
          Mengambil pengaturan PPN dari backend...
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Kasir</p>
          <h3 className="mt-2 text-lg font-bold text-slate-800">
            {currentUser?.name || "-"}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {isOwner
              ? `${selectedBranch} • Owner`
              : `${currentUser?.branch || "-"} • ${currentUser?.shift || "-"}`}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Status Shift</p>
          <h3
            className={`mt-2 text-lg font-bold ${
              runningShift || isOwner ? "text-green-600" : "text-red-600"
            }`}
          >
            {isOwner
              ? "Owner Mode"
              : isLoadingShift
              ? "Mengecek..."
              : runningShift
              ? "Berjalan"
              : "Belum Dibuka"}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {isOwner
              ? "Owner dapat memilih cabang transaksi"
              : runningShift
              ? formatDateTime(runningShift.openTime)
              : "Buka shift terlebih dahulu"}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Item Keranjang</p>
          <h3 className="mt-2 text-lg font-bold text-blue-600">
            {totalItem} item
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Total produk yang dipilih
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Sementara</p>
          <h3 className="mt-2 text-lg font-bold text-green-600">
            {formatRupiah(grandTotal)}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {receiptSetting.ppnActive
              ? `Termasuk PPN ${taxRatePercent}% dari backend`
              : "Tanpa PPN dari backend"}
          </p>
        </div>
      </div>

      {runningShift && isKasir && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
          Shift aktif: {runningShift.shiftName} • Kas awal{" "}
          {formatRupiah(runningShift.openingCash)} • Dibuka{" "}
          {formatDateTime(runningShift.openTime)}
        </div>
      )}

      {!runningShift && currentUser?.role === "kasir" && (
        <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm font-semibold text-yellow-700">
          Shift belum dibuka. Silakan buka shift terlebih dahulu melalui menu
          Shift Saya sebelum melakukan transaksi.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Daftar Produk
                </h3>
                <p className="text-sm text-slate-500">
                  Produk diambil dari backend sesuai cabang login.
                </p>
              </div>

              <input
                type="text"
                placeholder="Cari nama / kode barang..."
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 lg:w-80"
              />
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {isOwner ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {branches.map((branch) => (
                  <button
                    key={branch.name}
                    type="button"
                    onClick={() => {
                      setSelectedBranch(branch.name);
                      handleClearCart();
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      selectedBranch === branch.name
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {branch.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-5 rounded-2xl bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
                Produk yang tampil adalah produk {currentUser?.branch || "-"}.
              </div>
            )}

            {isLoadingProducts ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Mengambil data produk dari backend...
              </div>
            ) : (
              <>
                <div className="grid items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    Produk tidak ditemukan.
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-800">Keranjang</h3>
              <p className="text-sm text-slate-500">
                Produk yang dipilih pelanggan.
              </p>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {cartItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Belum ada produk dipilih.
                </div>
              ) : (
                cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onIncrease={handleIncreaseQuantity}
                    onDecrease={handleDecreaseQuantity}
                    onRemove={handleRemoveFromCart}
                  />
                ))
              )}
            </div>
          </div>

          <PaymentSummary
            cartItems={cartItems}
            discount={discount}
            taxRate={taxRate}
            paymentMethod={paymentMethod}
            paidAmount={paidAmount}
            onDiscountChange={setDiscount}
            onPaymentMethodChange={setPaymentMethod}
            onPaidAmountChange={setPaidAmount}
            onCheckout={handleCheckout}
            onClearCart={handleClearCart}
          />

          {isCheckingOut && (
            <div className="rounded-2xl bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
              Memproses transaksi ke backend dan memperbarui stok...
            </div>
          )}
        </aside>
      </div>

      {showPaymentModal && lastTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
                ✓
              </div>

              <h3 className="text-xl font-bold text-slate-800">
                Pembayaran Berhasil
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Transaksi berhasil disimpan ke backend dan stok sudah berkurang.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">No. Invoice</span>
                <span className="font-bold text-slate-800">
                  {lastTransaction.invoiceNumber}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Kasir</span>
                <span className="font-bold text-slate-800">
                  {lastTransaction.cashierName}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Cabang</span>
                <span className="font-bold text-slate-800">
                  {lastTransaction.branch}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shift</span>
                <span className="font-bold text-slate-800">
                  {lastTransaction.shift}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Metode</span>
                <span className="font-bold text-slate-800">
                  {lastTransaction.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">PPN</span>
                <span className="font-bold text-slate-800">
                  {lastTransaction.taxRate}%
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Bayar</span>
                <span className="font-bold text-blue-600">
                  {formatRupiah(lastTransaction.grandTotal)}
                </span>
              </div>

              {lastTransaction.paymentMethod === "Tunai" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Uang Dibayar</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(lastTransaction.paidAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Kembalian</span>
                    <span className="font-bold text-green-600">
                      {formatRupiah(lastTransaction.changeAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="rounded-xl border border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handleNewTransaction}
                className="rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KasirPage;