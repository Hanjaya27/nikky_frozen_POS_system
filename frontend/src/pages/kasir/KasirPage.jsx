import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ImageOff,
  Loader2,
  Minus,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

const paymentMethods = [
  { id: "tunai", label: "Tunai", icon: Banknote },
  { id: "qris", label: "QRIS", icon: QrCode },
  { id: "transfer", label: "Transfer", icon: CreditCard },
];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function makeInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;

  return `NF-${year}${month}${day}-${random}`;
}

function getImageUrl(image) {
  if (!image) return null;

  if (String(image).startsWith("http")) {
    return image;
  }

  const cleanImage = String(image).replace(/^\/+/, "");

  if (cleanImage.startsWith("storage/")) {
    return `${API_BASE_URL}/${cleanImage}`;
  }

  return `${API_BASE_URL}/storage/${cleanImage}`;
}

function normalizeProduct(product) {
  return {
    id: product.id,
    branchId: product.branch_id,
    branchName: product.branch?.name || `Cabang ${product.branch_id || "-"}`,
    code: product.code || "-",
    name: product.name || "-",
    category: product.category || "Lainnya",
    stock: Number(product.stock || 0),
    minStock: Number(product.min_stock || 0),
    price: Number(product.price || 0),
    expiredDate: product.expired_date || null,
    storageLocation: product.storage_location || "-",
    image: product.image || null,
    status: product.status || "active",
  };
}

function ProductImage({ product }) {
  const imageUrl = getImageUrl(product.image);

  if (!imageUrl) {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-gray-100 text-[#0B7FC3]">
        <div className="text-center">
          <ImageOff className="mx-auto h-7 w-7" />
          <p className="mt-2 text-xs font-black uppercase tracking-wide">
            {product.code}
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product.name}
      className="h-28 w-full rounded-2xl object-cover"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

function ProductCard({ product, cartQuantity, onAdd }) {
  const remainingStock = product.stock - cartQuantity;
  const isInactive = String(product.status).toLowerCase() !== "active";
  const isOutOfStock = product.stock <= 0;
  const isLowStock = remainingStock > 0 && remainingStock <= product.minStock;
  const cannotAdd = isInactive || isOutOfStock || remainingStock <= 0;

  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={cannotAdd}
      className={`rounded-[22px] border bg-white p-3 text-left shadow-sm transition ${
        cannotAdd
          ? "cursor-not-allowed border-gray-200 opacity-60"
          : "border-gray-200 hover:border-[#0B7FC3] hover:shadow-md"
      }`}
    >
      <ProductImage product={product} />

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-gray-950">
            {product.name}
          </p>
          <p className="mt-0.5 text-xs font-bold text-gray-500">
            {product.code} • {product.category}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
            isOutOfStock
              ? "bg-red-50 text-red-600"
              : isLowStock
              ? "bg-orange-50 text-orange-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {isOutOfStock ? "Habis" : `${remainingStock} stok`}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs font-semibold text-gray-500">
        <p>Exp: {formatDate(product.expiredDate)}</p>
        <p>Lokasi: {product.storageLocation}</p>
      </div>

      <p className="mt-3 text-lg font-black text-[#0B7FC3]">
        {formatRupiah(product.price)}
      </p>

      <div
        className={`mt-3 rounded-2xl px-4 py-2.5 text-center text-sm font-black ${
          cannotAdd ? "bg-gray-100 text-gray-400" : "bg-[#0B7FC3] text-white"
        }`}
      >
        {cannotAdd ? "Tidak tersedia" : "Tambah"}
      </div>
    </button>
  );
}

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-gray-950">
            {item.name}
          </p>
          <p className="mt-0.5 text-xs font-bold text-gray-500">
            {item.code} • {formatRupiah(item.price)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center rounded-2xl border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => onDecrease(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100"
          >
            <Minus className="h-4 w-4" />
          </button>

          <span className="w-10 text-center text-sm font-black text-gray-950">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onIncrease(item.id)}
            disabled={item.quantity >= item.stock}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm font-black text-gray-950">
          {formatRupiah(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}

function PaymentModal({
  isOpen,
  cart,
  total,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  const change = Number(cashReceived || 0) - total;
  const isCash = paymentMethod === "tunai";
  const isCashInvalid = isCash && Number(cashReceived || 0) < total;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[520px] rounded-[28px] bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-950">Pembayaran</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Periksa pesanan sebelum transaksi disimpan.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500">Total Bayar</span>
            <span className="text-2xl font-black text-gray-950">
              {formatRupiah(total)}
            </span>
          </div>

          <div className="mt-3 max-h-[150px] space-y-2 overflow-y-auto">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="font-semibold text-gray-600">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-black text-gray-950">
                  {formatRupiah(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-sm font-black text-gray-700">
            Metode Pembayaran
          </p>

          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-sm font-black transition ${
                    paymentMethod === method.id
                      ? "border-[#0B7FC3] bg-sky-50 text-[#0B7FC3]"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {method.label}
                </button>
              );
            })}
          </div>
        </div>

        {isCash && (
          <div className="mb-5">
            <label className="mb-2 block text-sm font-black text-gray-700">
              Uang Diterima
            </label>

            <input
              type="number"
              value={cashReceived}
              onChange={(event) => setCashReceived(event.target.value)}
              placeholder="Masukkan nominal uang"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-black text-gray-950 outline-none focus:border-[#0B7FC3] focus:ring-4 focus:ring-sky-100"
            />

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
              <span className="text-sm font-bold text-gray-500">Kembalian</span>
              <span
                className={`text-lg font-black ${
                  change < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {formatRupiah(Math.max(change, 0))}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isCashInvalid}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B7FC3] px-4 py-4 text-base font-black text-white hover:bg-[#086da8] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <CheckCircle2 className="h-5 w-5" />
          Simpan Transaksi
        </button>

        {isCashInvalid && (
          <p className="mt-3 text-center text-xs font-bold text-red-600">
            Uang diterima belum cukup.
          </p>
        )}
      </div>
    </div>
  );
}

function SuccessModal({ transaction, onClose }) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-[28px] bg-white p-5 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h2 className="mt-4 text-xl font-black text-gray-950">
          Transaksi Berhasil
        </h2>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Pesanan berhasil diproses di tampilan kasir.
        </p>

        <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-left">
          <div className="flex justify-between gap-3">
            <span className="text-sm font-bold text-gray-500">Invoice</span>
            <span className="text-sm font-black text-gray-950">
              {transaction.invoice}
            </span>
          </div>

          <div className="mt-3 flex justify-between gap-3">
            <span className="text-sm font-bold text-gray-500">Metode</span>
            <span className="text-sm font-black text-gray-950">
              {transaction.paymentMethod}
            </span>
          </div>

          <div className="mt-3 flex justify-between gap-3">
            <span className="text-sm font-bold text-gray-500">Total</span>
            <span className="text-sm font-black text-gray-950">
              {formatRupiah(transaction.total)}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Cetak
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-[#0B7FC3] px-4 py-3 text-sm font-black text-white hover:bg-[#086da8]"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}

function KasirPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("tunai");
  const [cashReceived, setCashReceived] = useState("");
  const [successTransaction, setSuccessTransaction] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/api/products`);
      const result = await response.json();

      const productList = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];

      setProducts(productList.map(normalizeProduct));
    } catch (error) {
      console.error("Gagal mengambil produk:", error);
      setErrorMessage("Produk gagal dimuat. Pastikan backend Laravel sedang berjalan.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    return ["Semua", ...new Set(products.map((product) => product.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => String(product.status).toLowerCase() === "active")
      .filter((product) => {
        const keyword = searchKeyword.toLowerCase();

        const matchSearch =
          product.name.toLowerCase().includes(keyword) ||
          product.code.toLowerCase().includes(keyword) ||
          product.category.toLowerCase().includes(keyword);

        const matchCategory =
          selectedCategory === "Semua" || product.category === selectedCategory;

        return matchSearch && matchCategory;
      });
  }, [products, searchKeyword, selectedCategory]);

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const getCartQuantity = (productId) => {
    return cart.find((item) => item.id === productId)?.quantity || 0;
  };

  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        if (existingItem.quantity >= product.stock) return currentCart;

        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const handleIncreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId && item.quantity < item.stock
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;

    const confirmClear = confirm("Kosongkan keranjang?");
    if (!confirmClear) return;

    setCart([]);
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) return;

    setPaymentMethod("tunai");
    setCashReceived("");
    setIsPaymentOpen(true);
  };

  const handleSubmitTransaction = () => {
    const transaction = {
      invoice: makeInvoiceNumber(),
      total: subtotal,
      paymentMethod:
        paymentMethods.find((method) => method.id === paymentMethod)?.label ||
        "Tunai",
      items: cart,
      createdAt: new Date().toISOString(),
    };

    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const soldItem = cart.find((item) => item.id === product.id);

        if (!soldItem) return product;

        return {
          ...product,
          stock: Math.max(product.stock - soldItem.quantity, 0),
        };
      })
    );

    setCart([]);
    setCashReceived("");
    setIsPaymentOpen(false);
    setSuccessTransaction(transaction);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="min-w-0">
          <div className="mb-4 rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-lg font-black text-gray-950">Pilih Produk</h1>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Data produk diambil dari database Laravel.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchProducts}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-50"
              >
                Refresh Produk
              </button>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Cari nama, kode, atau kategori produk..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition ${
                      selectedCategory === category
                        ? "bg-[#0B7FC3] text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <AlertCircle className="h-5 w-5" />
              {errorMessage}
            </div>
          )}

          {isLoadingProducts ? (
            <div className="rounded-[24px] border border-gray-200 bg-white p-8 text-center shadow-sm">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#0B7FC3]" />
              <p className="mt-3 font-black text-gray-950">Memuat produk...</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={getCartQuantity(product.id)}
                  onAdd={handleAddToCart}
                />
              ))}

              {filteredProducts.length === 0 && (
                <div className="col-span-full rounded-[24px] border border-gray-200 bg-white p-8 text-center shadow-sm">
                  <p className="font-black text-gray-950">Produk tidak ditemukan</p>
                  <p className="mt-1 text-sm font-medium text-gray-500">
                    Coba gunakan kata kunci atau kategori lain.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[26px] border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-gray-950">Keranjang</h2>
                  <p className="mt-1 text-sm font-medium text-gray-500">
                    {totalItems} item dipilih
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-[#0B7FC3]">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto p-5">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onIncrease={handleIncreaseQuantity}
                    onDecrease={handleDecreaseQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <ReceiptText className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-3 text-sm font-black text-gray-700">
                    Keranjang masih kosong
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Pilih produk untuk mulai transaksi.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-500">Subtotal</span>
                  <span className="text-sm font-black text-gray-950">
                    {formatRupiah(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-500">Diskon</span>
                  <span className="text-sm font-black text-gray-950">
                    {formatRupiah(0)}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-gray-950">Total</span>
                    <span className="text-2xl font-black text-[#0B7FC3]">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleClearCart}
                  disabled={cart.length === 0}
                  className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Kosongkan
                </button>

                <button
                  type="button"
                  onClick={handleOpenPayment}
                  disabled={cart.length === 0}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#0B7FC3] px-4 py-3 text-sm font-black text-white hover:bg-[#086da8] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Bayar
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-4 text-center text-xs font-medium text-gray-400">
                Tahap ini masih menyimpan transaksi di tampilan. Penyimpanan ke database transaksi kita sambungkan setelah ini.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        cart={cart}
        total={subtotal}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        cashReceived={cashReceived}
        setCashReceived={setCashReceived}
        onClose={() => setIsPaymentOpen(false)}
        onSubmit={handleSubmitTransaction}
      />

      <SuccessModal
        transaction={successTransaction}
        onClose={() => setSuccessTransaction(null)}
      />
    </div>
  );
}

export default KasirPage;
