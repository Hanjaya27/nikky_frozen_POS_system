import { useMemo, useState } from "react";

const products = [
  {
    id: 1,
    name: "Chicken Nugget",
    code: "NF-001",
    category: "Frozen Food",
    price: 28000,
    stock: 35,
  },
  {
    id: 2,
    name: "Sosis Ayam",
    code: "NF-002",
    category: "Frozen Food",
    price: 25000,
    stock: 42,
  },
  {
    id: 3,
    name: "Bakso Sapi",
    code: "NF-003",
    category: "Frozen Food",
    price: 32000,
    stock: 20,
  },
  {
    id: 4,
    name: "Kentang Frozen",
    code: "NF-004",
    category: "Snack",
    price: 22000,
    stock: 18,
  },
  {
    id: 5,
    name: "Dimsum Ayam",
    code: "NF-005",
    category: "Frozen Food",
    price: 30000,
    stock: 25,
  },
  {
    id: 6,
    name: "Cireng Isi",
    code: "NF-006",
    category: "Snack",
    price: 18000,
    stock: 30,
  },
  {
    id: 7,
    name: "Kebab Mini",
    code: "NF-007",
    category: "Snack",
    price: 27000,
    stock: 15,
  },
  {
    id: 8,
    name: "Es Krim Cup",
    code: "NF-008",
    category: "Dessert",
    price: 12000,
    stock: 50,
  },
];

const categories = ["Semua", "Frozen Food", "Snack", "Dessert"];
const paymentMethods = ["Tunai", "QRIS", "Transfer"];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function KasirPage() {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [paidAmount, setPaidAmount] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === "Semua" || product.category === selectedCategory;

      const matchSearch =
        product.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        product.code.toLowerCase().includes(searchKeyword.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchKeyword]);

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.qty,
    0
  );

  const tax = Math.round(subtotal * 0.11);
  const totalPayment = subtotal + tax;
  const change = Number(paidAmount || 0) - totalPayment;

  const addToCart = (product) => {
    const existingProduct = cart.find((item) => item.id === product.id);

    if (existingProduct) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, qty: Math.min(item.qty + 1, product.stock) }
            : item
        )
      );
      return;
    }

    setCart([...cart, { ...product, qty: 1 }]);
  };

  const increaseQty = (productId) => {
    setCart(
      cart.map((item) =>
        item.id === productId
          ? { ...item, qty: Math.min(item.qty + 1, item.stock) }
          : item
      )
    );
  };

  const decreaseQty = (productId) => {
    setCart(
      cart
        .map((item) =>
          item.id === productId ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const resetTransaction = () => {
    setCart([]);
    setPaidAmount("");
    setPaymentMethod("Tunai");
    setShowPaymentModal(false);
  };

  const handlePayment = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong.");
      return;
    }

    if (paymentMethod === "Tunai" && Number(paidAmount) < totalPayment) {
      alert("Nominal pembayaran kurang.");
      return;
    }

    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Kasir / POS</h2>
          <p className="mt-1 text-sm text-slate-500">
            Transaksi penjualan produk Nikky Frozen.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-5 py-3 shadow-sm">
          <p className="text-xs text-slate-400">Shift Kasir</p>
          <p className="font-semibold text-slate-700">
            Shift Pagi - Ahmad Baihaqi
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Daftar Produk
                </h3>
                <p className="text-sm text-slate-500">
                  Pilih produk untuk ditambahkan ke keranjang.
                </p>
              </div>

              <input
                type="text"
                placeholder="Cari nama / kode barang..."
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500 md:w-72"
              />
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-4 flex h-24 items-center justify-center rounded-xl bg-slate-100">
                    <span className="text-sm font-semibold text-slate-400">
                      Produk
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-slate-400">{product.code}</p>
                    <h4 className="font-semibold text-slate-800">
                      {product.name}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Stok: {product.stock}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="font-bold text-blue-600">
                      {formatRupiah(product.price)}
                    </p>

                    <button
                      onClick={() => addToCart(product)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                Produk tidak ditemukan.
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-800">
              Keranjang
            </h3>
            <p className="text-sm text-slate-500">
              Ringkasan transaksi pelanggan.
            </p>
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Belum ada produk dipilih.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {formatRupiah(item.price)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
                      <button
                        onClick={() => decreaseQty(item.id)}
                        className="px-3 py-1 text-slate-600 hover:bg-slate-200"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-sm font-semibold">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => increaseQty(item.id)}
                        className="px-3 py-1 text-slate-600 hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm font-bold text-slate-800">
                      {formatRupiah(item.price * item.qty)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="my-5 border-t border-slate-100" />

          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                      paymentMethod === method
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "Tunai" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Uang Dibayar
                </label>
                <input
                  type="number"
                  placeholder="Masukkan nominal"
                  value={paidAmount}
                  onChange={(event) => setPaidAmount(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="my-5 space-y-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>PPN 11%</span>
              <span>{formatRupiah(tax)}</span>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between text-lg font-bold text-slate-800">
                <span>Total</span>
                <span>{formatRupiah(totalPayment)}</span>
              </div>
            </div>

            {paymentMethod === "Tunai" && paidAmount !== "" && (
              <div className="flex justify-between text-sm font-semibold text-green-600">
                <span>Kembalian</span>
                <span>{change >= 0 ? formatRupiah(change) : "-"}</span>
              </div>
            )}
          </div>

          <button
            onClick={handlePayment}
            className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
          >
            Bayar Sekarang
          </button>
        </aside>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Pembayaran Berhasil
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Transaksi berhasil disimpan.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Metode</span>
                <span className="font-semibold text-slate-800">
                  {paymentMethod}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Bayar</span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(totalPayment)}
                </span>
              </div>

              {paymentMethod === "Tunai" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Uang Dibayar</span>
                    <span className="font-semibold text-slate-800">
                      {formatRupiah(Number(paidAmount))}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Kembalian</span>
                    <span className="font-semibold text-green-600">
                      {formatRupiah(change)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>

              <button
                onClick={resetTransaction}
                className="rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
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