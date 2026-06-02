function ProductCard({ product, onAddToCart }) {
  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minimumStock;

  return (
    <div className="flex h-full flex-col rounded-3xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 flex h-44 items-center justify-center rounded-2xl bg-slate-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="text-5xl">📦</div>
        )}
      </div>

      <div className="mb-3 flex min-h-[72px] items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="min-h-[44px] text-base font-bold leading-snug text-slate-800">
            {product.name}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {product.code || product.sku || "Kode Barang"}
          </p>
        </div>

        <span className="shrink-0 whitespace-nowrap rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600">
          {product.category || "Frozen"}
        </span>
      </div>

      <p className="mb-5 text-xl font-bold text-blue-600">
        {formatRupiah(product.price)}
      </p>

      <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-50 px-4 py-4">
        <div>
          <p className="text-sm text-slate-400">Stok</p>
          <p
            className={`mt-1 text-base font-bold ${
              isOutOfStock
                ? "text-red-600"
                : isLowStock
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {product.stock}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-400">Status</p>
          <p
            className={`mt-1 text-base font-bold ${
              isOutOfStock
                ? "text-red-600"
                : isLowStock
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {isOutOfStock ? "Habis" : isLowStock ? "Menipis" : "Tersedia"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAddToCart(product)}
        disabled={isOutOfStock}
        className={`mt-auto w-full rounded-2xl px-4 py-4 text-sm font-bold transition ${
          isOutOfStock
            ? "cursor-not-allowed bg-slate-200 text-slate-400"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isOutOfStock ? "Stok Habis" : "+ Tambah ke Keranjang"}
      </button>
    </div>
  );
}

export default ProductCard;