import { useMemo, useState } from "react";

const transactions = [
  {
    id: "TRX-001",
    date: "2026-05-21",
    time: "08:45",
    cashier: "Ahmad Baihaqi",
    customer: "Pelanggan Umum",
    paymentMethod: "Tunai",
    status: "Selesai",
    items: [
      { name: "Chicken Nugget", qty: 2, price: 28000 },
      { name: "Sosis Ayam", qty: 1, price: 25000 },
    ],
  },
  {
    id: "TRX-002",
    date: "2026-05-21",
    time: "09:20",
    cashier: "Ahmad Baihaqi",
    customer: "Pelanggan Umum",
    paymentMethod: "E-Wallet",
    status: "Selesai",
    items: [
      { name: "Bakso Sapi", qty: 1, price: 32000 },
      { name: "Kentang Frozen", qty: 2, price: 22000 },
    ],
  },
  {
    id: "TRX-003",
    date: "2026-05-21",
    time: "10:15",
    cashier: "Danang Wijayanto",
    customer: "Pelanggan Umum",
    paymentMethod: "Transfer",
    status: "Selesai",
    items: [
      { name: "Dimsum Ayam", qty: 3, price: 30000 },
      { name: "Cireng Isi", qty: 2, price: 18000 },
    ],
  },
  {
    id: "TRX-004",
    date: "2026-05-20",
    time: "15:30",
    cashier: "Nafal Lauza",
    customer: "Pelanggan Umum",
    paymentMethod: "Tunai",
    status: "Dibatalkan",
    items: [
      { name: "Kebab Mini", qty: 1, price: 27000 },
      { name: "Es Krim Cup", qty: 4, price: 12000 },
    ],
  },
  {
    id: "TRX-005",
    date: "2026-05-20",
    time: "17:05",
    cashier: "Samuel Jari",
    customer: "Pelanggan Umum",
    paymentMethod: "E-Wallet",
    status: "Selesai",
    items: [
      { name: "Chicken Nugget", qty: 1, price: 28000 },
      { name: "Bakso Sapi", qty: 2, price: 32000 },
      { name: "Kentang Frozen", qty: 1, price: 22000 },
    ],
  },
];

const paymentMethods = ["Semua", "Tunai", "E-Wallet", "Transfer"];
const statuses = ["Semua", "Selesai", "Dibatalkan"];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function calculateSubtotal(items) {
  return items.reduce((total, item) => total + item.qty * item.price, 0);
}

function calculateTax(subtotal) {
  return Math.round(subtotal * 0.11);
}

function calculateTotal(items) {
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal);
  return subtotal + tax;
}

function TransaksiPage() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(transactions[0]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchSearch =
        transaction.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        transaction.cashier.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        transaction.customer.toLowerCase().includes(searchKeyword.toLowerCase());

      const matchPayment =
        selectedPayment === "Semua" ||
        transaction.paymentMethod === selectedPayment;

      const matchStatus =
        selectedStatus === "Semua" || transaction.status === selectedStatus;

      const matchDate =
        selectedDate === "" || transaction.date === selectedDate;

      return matchSearch && matchPayment && matchStatus && matchDate;
    });
  }, [searchKeyword, selectedPayment, selectedStatus, selectedDate]);

  const completedTransactions = transactions.filter(
    (transaction) => transaction.status === "Selesai"
  );

  const totalTransaction = transactions.length;

  const totalSales = completedTransactions.reduce(
    (total, transaction) => total + calculateTotal(transaction.items),
    0
  );

  const grossProfit = Math.round(totalSales * 0.35);

  const totalItemsSold = completedTransactions.reduce((total, transaction) => {
    const itemQty = transaction.items.reduce((sum, item) => sum + item.qty, 0);
    return total + itemQty;
  }, 0);

  const selectedSubtotal = selectedTransaction
    ? calculateSubtotal(selectedTransaction.items)
    : 0;

  const selectedTax = calculateTax(selectedSubtotal);

  const selectedTotal = selectedTransaction
    ? calculateTotal(selectedTransaction.items)
    : 0;

  const handlePrint = () => {
    alert("Fitur cetak ulang struk akan diproses.");
  };

  const getStatusBadge = (status) => {
    if (status === "Selesai") {
      return "bg-green-100 text-green-700";
    }

    return "bg-red-100 text-red-700";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Riwayat Transaksi
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Lihat daftar transaksi, detail pembelian, metode pembayaran, dan cetak ulang struk.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Cetak Ulang Struk
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Transaksi</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {totalTransaction}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Penjualan</p>
          <h3 className="mt-2 text-2xl font-bold text-blue-600">
            {formatRupiah(totalSales)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Laba Kotor</p>
          <h3 className="mt-2 text-2xl font-bold text-green-600">
            {formatRupiah(grossProfit)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Produk Terjual</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {totalItemsSold}
          </h3>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-800">
                Daftar Transaksi
              </h3>
              <p className="text-sm text-slate-500">
                Pilih transaksi untuk melihat detail.
              </p>
            </div>

            <div className="mb-5 grid gap-3 lg:grid-cols-4">
              <input
                type="text"
                placeholder="Cari ID / kasir..."
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={selectedPayment}
                onChange={(event) => setSelectedPayment(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                    <th className="px-4 py-4 font-semibold">ID Transaksi</th>
                    <th className="px-4 py-4 font-semibold">Tanggal</th>
                    <th className="px-4 py-4 font-semibold">Kasir</th>
                    <th className="px-4 py-4 font-semibold">Metode</th>
                    <th className="px-4 py-4 font-semibold">Total</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 font-semibold">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const total = calculateTotal(transaction.items);

                    return (
                      <tr
                        key={transaction.id}
                        className={`border-b border-slate-100 text-sm hover:bg-slate-50 ${
                          selectedTransaction?.id === transaction.id
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {transaction.id}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          <p>{transaction.date}</p>
                          <p className="text-xs text-slate-400">
                            {transaction.time}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {transaction.cashier}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {transaction.paymentMethod}
                        </td>

                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {formatRupiah(total)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <button
                            onClick={() => setSelectedTransaction(transaction)}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        Data transaksi tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          {selectedTransaction ? (
            <>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Detail Transaksi
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedTransaction.id}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                    selectedTransaction.status
                  )}`}
                >
                  {selectedTransaction.status}
                </span>
              </div>

              <div className="mb-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-semibold text-slate-700">
                    {selectedTransaction.date}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Waktu</span>
                  <span className="font-semibold text-slate-700">
                    {selectedTransaction.time}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Kasir</span>
                  <span className="font-semibold text-slate-700">
                    {selectedTransaction.cashier}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pembayaran</span>
                  <span className="font-semibold text-slate-700">
                    {selectedTransaction.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="mb-5">
                <h4 className="mb-3 text-sm font-semibold text-slate-800">
                  Item Transaksi
                </h4>

                <div className="space-y-3">
                  {selectedTransaction.items.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="rounded-xl border border-slate-100 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.qty} x {formatRupiah(item.price)}
                          </p>
                        </div>

                        <p className="text-sm font-bold text-slate-800">
                          {formatRupiah(item.qty * item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(selectedSubtotal)}</span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>PPN 11%</span>
                  <span>{formatRupiah(selectedTax)}</span>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-slate-800">
                    <span>Total</span>
                    <span>{formatRupiah(selectedTotal)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="mt-5 w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
              >
                Cetak Ulang
              </button>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Pilih transaksi untuk melihat detail.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default TransaksiPage;