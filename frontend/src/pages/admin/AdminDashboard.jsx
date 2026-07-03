import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ImageOff,
  Loader2,
  MapPin,
  PackageCheck,
  PackageMinus,
  RefreshCcw,
  Search,
  Snowflake,
  TriangleAlert,
  Warehouse,
} from "lucide-react";

import * as api from "../../services/api";

const API_BASE_URL = api.getApiBaseUrl().replace("/api", "");

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

function getCurrentUser() {
  const savedUser = localStorage.getItem("nikky_user");
  if (!savedUser) return null;
  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

function normalizeProduct(product) {
  return {
    id: product.id,
    branchId: product.branch_id,
    branchName: product.branch?.name || `Cabang ${product.branch_id || "-"}`,
    code: product.code || "-",
    name: product.name || "-",
    category: product.category || "Lainnya",
    warehouseStock: Number(product.warehouse_stock || 0),
    storeStock: Number(product.store_stock || 0),
    price: Number(product.price || 0),
    expiredDate: product.expired_date || null,
    storageLocation: product.storage_location || "-",
    image: product.image || null,
    status: product.status || "active",
  };
}

function getDaysUntilExpired(dateString) {
  if (!dateString) return null;

  const today = new Date();
  const expiredDate = new Date(dateString);

  if (Number.isNaN(expiredDate.getTime())) return null;

  today.setHours(0, 0, 0, 0);
  expiredDate.setHours(0, 0, 0, 0);

  return Math.ceil((expiredDate - today) / (1000 * 60 * 60 * 24));
}

function getStockStatus(product) {
  if (product.warehouseStock <= 0 && product.storeStock <= 0) {
    return {
      label: "Habis Total",
      className: "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (product.storeStock <= 0) {
    return {
      label: "Toko Kosong",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }
  
  if (product.warehouseStock <= 0) {
    return {
      label: "Gudang Kosong",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }

  return {
    label: "Aman",
    className: "bg-green-50 text-green-700 border-green-200",
  };
}

function ProductImage({ product }) {
  const imageUrl = getImageUrl(product.image);

  if (!imageUrl) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF6EA] text-[#C80503] border border-[#EBCDB8]">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[#EBCDB8]">
      <img
        src={imageUrl}
        alt={product.name}
        className="h-full w-full object-contain p-1"
      />
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#7A6258]">{title}</p>
          <p className="mt-2 text-2xl font-black text-[#2A1712]">{value}</p>
          <p className="mt-1 text-xs font-semibold text-[#7A6258]">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF6EA] text-[#C80503] border border-[#EBCDB8]">
          <Icon className="h-6 w-6" strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
}

function ProductTableRow({ product }) {
  const stockStatus = getStockStatus(product);
  const daysUntilExpired = getDaysUntilExpired(product.expiredDate);
  const isExpired = daysUntilExpired !== null && daysUntilExpired < 0;
  const isExpiringSoon =
    daysUntilExpired !== null && daysUntilExpired >= 0 && daysUntilExpired <= 30;

  return (
    <tr className="border-b border-[#EBCDB8] last:border-b-0 hover:bg-[#FFFDF8] transition">
      <td className="py-3 pl-4 pr-4">
        <div className="flex items-center gap-3">
          <ProductImage product={product} />

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#2A1712]">
              {product.name}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[#7A6258]">
              {product.code} · {product.category}
            </p>
          </div>
        </div>
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm font-black text-[#2A1712]">
        {formatRupiah(product.price)}
      </td>

      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-black text-[#2A1712]">
            Gudang: {product.warehouseStock}
          </span>
          <span className="text-sm font-bold text-[#7A6258]">
            Toko: {product.storeStock}
          </span>
        </div>
      </td>

      <td className="whitespace-nowrap px-4 py-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${stockStatus.className}`}>
          {stockStatus.label}
        </span>
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-[#7A6258]">
        {product.storageLocation}
      </td>

      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold border ${
            isExpired
              ? "bg-red-50 text-red-700 border-red-200"
              : isExpiringSoon
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-gray-50 text-gray-600 border-gray-200"
          }`}
        >
          {formatDate(product.expiredDate)}
        </span>
      </td>
    </tr>
  );
}

function AdminDashboard() {
  const currentUser = getCurrentUser();
  const [products, setProducts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("semua");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setErrorMessage("");

      const result = await api.getProducts({ branch_id: currentUser?.branch_id });

      const productList = Array.isArray(result) ? result : [];
      setProducts(productList.map(normalizeProduct));
    } catch (error) {
      console.error("Gagal mengambil produk:", error);
      setErrorMessage(
        "Data produk gagal dimuat. Pastikan backend Laravel sedang berjalan.",
      );
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProducts();
    }
  }, [currentUser?.branch_id]);

  const summary = useMemo(() => {
    const activeProducts = products.filter(
      (product) => String(product.status).toLowerCase() === "active",
    );

    const totalWarehouseStock = activeProducts.reduce((sum, p) => sum + p.warehouseStock, 0);
    const totalStoreStock = activeProducts.reduce((sum, p) => sum + p.storeStock, 0);

    const storeEmptyProducts = activeProducts.filter((p) => p.storeStock <= 0);
    const warehouseEmptyProducts = activeProducts.filter((p) => p.warehouseStock <= 0);

    const expiredProducts = activeProducts.filter((product) => {
      const days = getDaysUntilExpired(product.expiredDate);
      return days !== null && days < 0;
    });

    const expiringSoonProducts = activeProducts.filter((product) => {
      const days = getDaysUntilExpired(product.expiredDate);
      return days !== null && days >= 0 && days <= 30;
    });

    return {
      activeProducts,
      totalProducts: activeProducts.length,
      totalWarehouseStock,
      totalStoreStock,
      storeEmptyProducts,
      warehouseEmptyProducts,
      expiredProducts,
      expiringSoonProducts,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const keyword = searchKeyword.toLowerCase().trim();

    return summary.activeProducts
      .filter((product) => {
        const matchSearch =
          product.name.toLowerCase().includes(keyword) ||
          product.code.toLowerCase().includes(keyword) ||
          product.category.toLowerCase().includes(keyword) ||
          product.storageLocation.toLowerCase().includes(keyword);

        if (!matchSearch) return false;

        if (selectedFilter === "toko-kosong") {
          return product.storeStock <= 0;
        }

        if (selectedFilter === "gudang-kosong") {
          return product.warehouseStock <= 0;
        }

        return true;
      })
      .sort((a, b) => {
        const aStatus = getStockStatus(a).label;
        const bStatus = getStockStatus(b).label;

        const order = {
          "Habis Total": 1,
          "Toko Kosong": 2,
          "Gudang Kosong": 3,
          "Aman": 4,
        };

        return order[aStatus] - order[bStatus];
      });
  }, [summary.activeProducts, searchKeyword, selectedFilter]);

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-black text-[#2A1712]">Dashboard {currentUser.branch || "Admin"}</h1>
        <p className="mt-1 text-sm font-semibold text-[#7A6258]">
          Ringkasan stok gudang dan toko untuk cabang Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Produk"
          value={summary.totalProducts}
          description="Jenis produk aktif"
          icon={Boxes}
        />

        <StatCard
          title="Total Stok Gudang"
          value={summary.totalWarehouseStock}
          description="Fisik di gudang"
          icon={Warehouse}
        />

        <StatCard
          title="Total Stok Toko"
          value={summary.totalStoreStock}
          description="Fisik di rak depan"
          icon={PackageCheck}
        />

        <StatCard
          title="Stok Kosong"
          value={summary.storeEmptyProducts.length + summary.warehouseEmptyProducts.length}
          description="Perlu tindakan"
          icon={TriangleAlert}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#2A1712]">
                  Ringkasan Stok Produk
                </h2>
                <p className="mt-1 text-sm font-medium text-[#7A6258]">
                  Pantau stok yang ada di gudang dan toko.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchProducts}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EBCDB8] bg-white px-4 py-2 text-sm font-black text-[#2A1712] transition hover:bg-[#FFF6EA]"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh Data
              </button>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A6258]" />
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Cari nama atau kode produk..."
                  className="w-full rounded-xl border border-[#EBCDB8] bg-white py-3 pl-12 pr-4 text-sm font-bold text-[#2A1712] outline-none transition focus:border-[#C80503] focus:ring-2 focus:ring-[#C80503]/20"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  ["semua", "Semua"],
                  ["toko-kosong", "Toko Kosong"],
                  ["gudang-kosong", "Gudang Kosong"],
                ].map(([filterId, label]) => (
                  <button
                    key={filterId}
                    type="button"
                    onClick={() => setSelectedFilter(filterId)}
                    className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition border ${
                      selectedFilter === filterId
                        ? "bg-[#C80503] text-white border-[#C80503]"
                        : "bg-white text-[#7A6258] border-[#EBCDB8] hover:bg-[#FFF6EA]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <AlertCircle className="h-5 w-5" />
              {errorMessage}
            </div>
          )}

          <div className="overflow-hidden rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] shadow-sm">
            {isLoadingProducts ? (
              <div className="p-10 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#C80503]" />
                <p className="mt-3 font-bold text-[#7A6258]">
                  Memuat data produk...
                </p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-[#FFF6EA] border-b border-[#EBCDB8]">
                    <tr className="text-left text-xs font-black uppercase tracking-wide text-[#7A6258]">
                      <th className="py-4 pl-4 pr-4">Produk</th>
                      <th className="px-4 py-4">Harga</th>
                      <th className="px-4 py-4">Stok (G/T)</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Lokasi Gudang</th>
                      <th className="px-4 py-4">Expired</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => (
                      <ProductTableRow key={product.id} product={product} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-lg font-black text-[#2A1712]">
                  Produk tidak ditemukan
                </p>
                <p className="mt-1 text-sm font-medium text-[#7A6258]">
                  Coba gunakan filter atau kata kunci lain.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#EBCDB8] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#2A1712]">
                  Perlu Dicek (Toko)
                </h2>
                <p className="mt-1 text-sm font-medium text-[#7A6258]">
                  Produk kosong di toko (kasir).
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF6EA] text-[#C80503] border border-[#EBCDB8]">
                <CalendarClock className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>

            <div className="space-y-3">
              {summary.storeEmptyProducts.length > 0 ? (
                summary.storeEmptyProducts.slice(0, 5).map((product) => (
                  <div
                    key={`${product.id}-${product.code}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white border border-[#EBCDB8] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#2A1712]">
                        {product.name}
                      </p>
                      <p className="truncate text-xs font-semibold text-[#7A6258]">
                        Gudang: {product.warehouseStock} | Toko: 0
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 border border-orange-200">
                      Butuh Mutasi
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-center text-sm font-bold text-green-700">
                  <CheckCircle2 className="mx-auto mb-2 h-6 w-6" />
                  Stok toko aman.
                </div>
              )}
            </div>
          </div>
          
          <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#EBCDB8] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#2A1712]">
                  Perlu Dicek (Gudang)
                </h2>
                <p className="mt-1 text-sm font-medium text-[#7A6258]">
                  Produk kosong di gudang.
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF6EA] text-[#C80503] border border-[#EBCDB8]">
                <Warehouse className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>

            <div className="space-y-3">
              {summary.warehouseEmptyProducts.length > 0 ? (
                summary.warehouseEmptyProducts.slice(0, 5).map((product) => (
                  <div
                    key={`${product.id}-${product.code}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white border border-[#EBCDB8] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#2A1712]">
                        {product.name}
                      </p>
                      <p className="truncate text-xs font-semibold text-[#7A6258]">
                        Toko: {product.storeStock} | Gudang: 0
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-200">
                      Butuh Restock
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-center text-sm font-bold text-green-700">
                  <CheckCircle2 className="mx-auto mb-2 h-6 w-6" />
                  Stok gudang aman.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AdminDashboard;
