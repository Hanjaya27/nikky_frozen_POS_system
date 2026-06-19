import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Boxes,
  CalendarClock,
  CheckCircle2,
  MapPin,
  PackageSearch,
  Search,
  Snowflake,
  XCircle,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

const defaultWarehouseSlots = [
  "Freezer A1",
  "Freezer A2",
  "Freezer B1",
  "Freezer B2",
  "Freezer C1",
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

function getDaysUntilExpired(dateString) {
  if (!dateString) return null;

  const today = new Date();
  const expiredDate = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  expiredDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(expiredDate.getTime())) return null;

  return Math.ceil((expiredDate.getTime() - today.getTime()) / 86400000);
}

function normalizeProduct(product) {
  return {
    id: product.id,
    code: product.code || `PRD-${product.id}`,
    name: product.name || "-",
    category: product.category || "Lainnya",
    stock: Number(product.stock || 0),
    minStock: Number(product.min_stock || product.minStock || 0),
    price: Number(product.price || 0),
    expiredDate: product.expired_date || product.expiredDate || null,
    location:
      product.storage_location ||
      product.storageLocation ||
      product.location ||
      "Belum diatur",
    image: product.image || null,
    status: product.status || "active",
  };
}

function getStockStatus(product) {
  if (product.stock <= 0) {
    return {
      value: "habis",
      label: "Habis",
      badge: "bg-red-50 text-red-700 ring-red-100",
    };
  }

  if (product.stock <= product.minStock) {
    return {
      value: "menipis",
      label: "Menipis",
      badge: "bg-orange-50 text-orange-700 ring-orange-100",
    };
  }

  return {
    value: "aman",
    label: "Aman",
    badge: "bg-green-50 text-green-700 ring-green-100",
  };
}

function getExpiredStatus(product) {
  const daysLeft = getDaysUntilExpired(product.expiredDate);

  if (daysLeft === null) {
    return {
      value: "kosong",
      label: "Belum ada tanggal",
      badge: "bg-gray-50 text-gray-600 ring-gray-100",
    };
  }

  if (daysLeft < 0) {
    return {
      value: "expired",
      label: "Expired",
      badge: "bg-red-50 text-red-700 ring-red-100",
    };
  }

  if (daysLeft <= 30) {
    return {
      value: "dekat",
      label: `${daysLeft} hari lagi`,
      badge: "bg-orange-50 text-orange-700 ring-orange-100",
    };
  }

  return {
    value: "aman",
    label: "Aman",
    badge: "bg-sky-50 text-[#0B7FC3] ring-sky-100",
  };
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

function StatCard({ label, value, note, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-[#0B7FC3]",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-gray-950">{value}</p>
          <p className="mt-1 text-xs font-semibold text-gray-400">{note}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function Badge({ children, className }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${className}`}
    >
      {children}
    </span>
  );
}

function ProductImage({ product }) {
  if (product.image) {
    return (
      <img
        src={product.image}
        alt={product.name}
        className="h-14 w-14 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-[#0B7FC3]">
      <PackageSearch className="h-6 w-6" />
    </div>
  );
}

function BarangPage() {
  const [products, setProducts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedStockStatus, setSelectedStockStatus] = useState("Semua");
  const [selectedLocation, setSelectedLocation] = useState("Semua");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(`${API_BASE_URL}/api/products`);

        if (!response.ok) {
          throw new Error("API produk tidak merespons normal.");
        }

        const result = await response.json();

        const productList = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : [];

        setProducts(productList.map(normalizeProduct));
      } catch (error) {
        console.error("Gagal mengambil produk:", error);
        setErrorMessage("Produk belum bisa dimuat. Pastikan backend Laravel sedang berjalan.");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    return [
      "Semua",
      ...new Set(products.map((product) => product.category).filter(Boolean)),
    ];
  }, [products]);

  const warehouseSlots = useMemo(() => {
    const locationsFromProducts = products
      .map((product) => product.location)
      .filter(Boolean);

    return [...new Set([...defaultWarehouseSlots, ...locationsFromProducts])];
  }, [products]);

  const summary = useMemo(() => {
    const safe = products.filter(
      (product) => getStockStatus(product).value === "aman",
    ).length;

    const low = products.filter(
      (product) => getStockStatus(product).value === "menipis",
    ).length;

    const empty = products.filter(
      (product) => getStockStatus(product).value === "habis",
    ).length;

    const expiredRisk = products.filter((product) => {
      const expiredStatus = getExpiredStatus(product).value;
      return expiredStatus === "dekat" || expiredStatus === "expired";
    }).length;

    return {
      total: products.length,
      safe,
      low,
      empty,
      expiredRisk,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = searchKeyword.toLowerCase();
      const stockStatus = getStockStatus(product).value;

      const matchSearch =
        product.name.toLowerCase().includes(keyword) ||
        product.code.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.location.toLowerCase().includes(keyword);

      const matchCategory =
        selectedCategory === "Semua" || product.category === selectedCategory;

      const matchStockStatus =
        selectedStockStatus === "Semua" || stockStatus === selectedStockStatus;

      const matchLocation =
        selectedLocation === "Semua" || product.location === selectedLocation;

      return matchSearch && matchCategory && matchStockStatus && matchLocation;
    });
  }, [products, searchKeyword, selectedCategory, selectedStockStatus, selectedLocation]);

  const warehouseGroups = useMemo(() => {
    return warehouseSlots.map((slot) => {
      const slotProducts = products.filter((product) => product.location === slot);

      const totalStock = slotProducts.reduce(
        (total, product) => total + product.stock,
        0,
      );

      const riskCount = slotProducts.filter((product) => {
        const stockStatus = getStockStatus(product).value;
        const expiredStatus = getExpiredStatus(product).value;

        return (
          stockStatus === "habis" ||
          stockStatus === "menipis" ||
          expiredStatus === "dekat" ||
          expiredStatus === "expired"
        );
      }).length;

      return {
        slot,
        products: slotProducts,
        totalStock,
        riskCount,
      };
    });
  }, [products, warehouseSlots]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Produk"
          value={summary.total}
          note="Produk dari database"
          icon={Boxes}
          tone="blue"
        />

        <StatCard
          label="Stok Aman"
          value={summary.safe}
          note="Di atas stok minimum"
          icon={CheckCircle2}
          tone="green"
        />

        <StatCard
          label="Stok Menipis"
          value={summary.low}
          note="Perlu restock"
          icon={AlertTriangle}
          tone="orange"
        />

        <StatCard
          label="Stok Habis"
          value={summary.empty}
          note="Tidak bisa dijual"
          icon={XCircle}
          tone="red"
        />

        <StatCard
          label="Dekat Expired"
          value={summary.expiredRisk}
          note="Expired / <= 30 hari"
          icon={CalendarClock}
          tone="purple"
        />
      </div>

      <Card className="mb-5 p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-gray-950">
              Map Lokasi Penyimpanan
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Gambaran sederhana posisi stok di freezer. Klik lokasi untuk memfilter produk.
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0B7FC3]">
            <Snowflake className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {warehouseGroups.map((group) => (
            <button
              type="button"
              key={group.slot}
              onClick={() => setSelectedLocation(group.slot)}
              className={`rounded-[22px] border p-4 text-left transition hover:border-[#0B7FC3] hover:bg-sky-50 ${
                selectedLocation === group.slot
                  ? "border-[#0B7FC3] bg-sky-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0B7FC3] ring-1 ring-sky-100">
                    <Archive className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-black text-gray-950">{group.slot}</p>
                    <p className="text-xs font-bold text-gray-400">
                      {group.products.length} produk
                    </p>
                  </div>
                </div>

                {group.riskCount > 0 ? (
                  <Badge className="bg-orange-50 text-orange-700 ring-orange-100">
                    Cek
                  </Badge>
                ) : (
                  <Badge className="bg-green-50 text-green-700 ring-green-100">
                    Aman
                  </Badge>
                )}
              </div>

              <div className="rounded-2xl bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">
                    Total Stok
                  </span>
                  <span className="font-black text-gray-950">
                    {group.totalStock}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">
                    Risiko
                  </span>
                  <span className="font-black text-gray-950">
                    {group.riskCount}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedLocation !== "Semua" && (
          <button
            type="button"
            onClick={() => setSelectedLocation("Semua")}
            className="mt-4 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-200"
          >
            Tampilkan semua lokasi
          </button>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-5">
          <h2 className="text-lg font-black text-gray-950">Daftar Produk</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Pantau stok, harga, tanggal expired, dan lokasi penyimpanan.
          </p>
        </div>

        <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_170px_170px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Cari nama, kode, kategori, atau lokasi..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={selectedStockStatus}
            onChange={(event) => setSelectedStockStatus(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
          >
            <option value="Semua">Semua Stok</option>
            <option value="aman">Aman</option>
            <option value="menipis">Menipis</option>
            <option value="habis">Habis</option>
          </select>

          <select
            value={selectedLocation}
            onChange={(event) => setSelectedLocation(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-[#0B7FC3] focus:bg-white focus:ring-4 focus:ring-sky-100"
          >
            <option value="Semua">Semua Lokasi</option>
            {warehouseSlots.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
            {errorMessage}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-gray-50 text-xs font-black uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Stok</th>
                <th className="px-4 py-3 text-right">Min.</th>
                <th className="px-4 py-3 text-right">Harga</th>
                <th className="px-4 py-3">Expired</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                const expiredStatus = getExpiredStatus(product);

                return (
                  <tr key={product.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <ProductImage product={product} />
                        <div>
                          <p className="font-black text-gray-950">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs font-bold text-gray-400">
                            {product.code}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-bold text-gray-600">
                      {product.category}
                    </td>

                    <td className="px-4 py-4 text-right font-black text-gray-950">
                      {product.stock}
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-gray-500">
                      {product.minStock}
                    </td>

                    <td className="px-4 py-4 text-right font-black text-[#0B7FC3]">
                      {formatRupiah(product.price)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-600">
                          {formatDate(product.expiredDate)}
                        </p>
                        <Badge className={expiredStatus.badge}>
                          {expiredStatus.label}
                        </Badge>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs font-black text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {product.location}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Badge className={stockStatus.badge}>
                        {stockStatus.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-12 text-center font-semibold text-gray-500"
                  >
                    {isLoading
                      ? "Memuat produk..."
                      : "Data produk tidak ditemukan."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default BarangPage;
