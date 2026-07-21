/**
 * Format string numeric murni (misal: "1500000") menjadi string tampilan dengan pemisah ribuan (misal: "1.500.000")
 */
export function formatNumberInput(value) {
  if (value === undefined || value === null || value === "") return "";
  
  // Hapus semua karakter selain angka
  const numericString = value.toString().replace(/[^0-9]/g, "");
  
  if (!numericString) return "";
  
  // Format menjadi ribuan lokal Indonesia
  return new Intl.NumberFormat("id-ID").format(Number(numericString));
}

/**
 * Kembalikan string tampilan yang memiliki titik (misal: "1.500.000") menjadi angka murni string (misal: "1500000")
 * agar aman disimpan di state / dikirim ke backend.
 */
export function parseNumberInput(value) {
  if (value === undefined || value === null || value === "") return "";
  return value.toString().replace(/[^0-9]/g, "");
}
