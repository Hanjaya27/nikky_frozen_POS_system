function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function PaymentSummary({
  cartItems = [],
  discount = 0,
  taxRate = 0,
  paymentMethod = "Tunai",
  paidAmount = "",
  onDiscountChange,
  onPaymentMethodChange,
  onPaidAmountChange,
  onCheckout,
  onClearCart,
}) {
  const subtotal = cartItems.reduce((total, item) => {
    return total + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);

  const totalItem = cartItems.reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);

  const discountAmount = Number(discount) || 0;
  const taxableAmount = Math.max(subtotal - discountAmount, 0);

  const taxRateNumber = Number(taxRate || 0);

  const taxRateDecimal =
    taxRateNumber > 1 ? taxRateNumber / 100 : taxRateNumber;

  const taxRatePercent =
    taxRateNumber > 1 ? taxRateNumber : taxRateNumber * 100;

  const taxAmount = Math.round(taxableAmount * taxRateDecimal);
  const grandTotal = taxableAmount + taxAmount;

  const changeAmount =
    paymentMethod === "Tunai" ? Number(paidAmount || 0) - grandTotal : 0;

  const paymentMethods = ["Tunai", "QRIS", "Debit", "Transfer"];

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-800">
          Ringkasan Pembayaran
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Periksa kembali transaksi sebelum melakukan pembayaran.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total Item</span>
          <span className="font-bold text-slate-800">{totalItem} item</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-bold text-slate-800">
            {formatRupiah(subtotal)}
          </span>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-500">Diskon</span>
            <span className="font-bold text-red-500">
              - {formatRupiah(discountAmount)}
            </span>
          </div>

          <input
            type="number"
            value={discount}
            onChange={(event) => onDiscountChange(Number(event.target.value))}
            placeholder="0"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex justify-between border-b border-slate-100 pb-4 text-sm">
          <span className="text-slate-500">
            PPN {Number(taxRatePercent).toFixed(0)}%
          </span>
          <span className="font-bold text-slate-800">
            {formatRupiah(taxAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-slate-800">
            Total Bayar
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {formatRupiah(grandTotal)}
          </span>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-slate-700">
            Metode Pembayaran
          </p>

          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => onPaymentMethodChange(method)}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  paymentMethod === method
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === "Tunai" && (
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Uang Dibayar
            </label>
            <input
              type="number"
              value={paidAmount}
              onChange={(event) => onPaidAmountChange(event.target.value)}
              placeholder="Masukkan nominal uang"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            {Number(paidAmount || 0) > 0 && (
              <div
                className={`mt-3 rounded-xl px-4 py-3 text-sm font-bold ${
                  changeAmount >= 0
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {changeAmount >= 0
                  ? `Kembalian: ${formatRupiah(changeAmount)}`
                  : `Kurang: ${formatRupiah(Math.abs(changeAmount))}`}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClearCart}
            className="rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Kosongkan
          </button>

          <button
            type="button"
            onClick={onCheckout}
            disabled={cartItems.length === 0}
            className={`rounded-xl py-3 text-sm font-bold text-white ${
              cartItems.length === 0
                ? "cursor-not-allowed bg-slate-300"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Bayar
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSummary;