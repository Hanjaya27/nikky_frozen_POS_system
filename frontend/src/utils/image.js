const API_ORIGIN = import.meta.env.VITE_API_ORIGIN;

export function getProductImageUrl(product) {
  const raw = product?.image_url || product?.imageUrl || product?.image || "";

  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  if (raw.startsWith('/storage/')) {
    return `${API_ORIGIN}${raw}`;
  }

  if (raw.startsWith('storage/')) {
    return `${API_ORIGIN}/${raw}`;
  }

  return `${API_ORIGIN}/storage/${raw.replace(/^\/+/, "")}`;
}

export function getApiOrigin() {
  return API_ORIGIN;
}
