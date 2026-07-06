import { useState } from "react";
import { Package } from "lucide-react";
import { getProductImageUrl } from "../utils/image";

function ProductCard({ product, onAddToCart }) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = getProductImageUrl(product);
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
      <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-[#EBCDB8] bg-[#FFF6EA]">
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt={product.name || "Produk"}
            className="h-full w-full rounded-2xl object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#7A6258]">
            <Package className="h-10 w-10 text-[#C80503]" />
            <span className="text-xs font-bold">Tidak ada gambar</span>
          </div>
        )}
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