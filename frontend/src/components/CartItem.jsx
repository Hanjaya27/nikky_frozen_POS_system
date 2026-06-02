function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const quantity = item.quantity || item.qty || 1;
  const subtotal = item.price * quantity;

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>

          <p className="mt-1 text-xs text-slate-400">
            {item.code || item.sku || "Kode Barang"}
          </p>

          <p className="mt-2 text-sm font-semibold text-blue-600">
            {formatRupiah(item.price)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
        >
          ×
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDecrease(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          >
            -
          </button>

          <span className="min-w-8 text-center text-sm font-bold text-slate-800">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => onIncrease(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            +
          </button>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">Subtotal</p>
          <p className="text-sm font-bold text-slate-800">
            {formatRupiah(subtotal)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CartItem;