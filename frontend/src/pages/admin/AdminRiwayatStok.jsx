import { History } from "lucide-react";

function AdminRiwayatStok() {
  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-black text-[#2A1712]">Riwayat Stok</h1>
        <p className="mt-1 text-sm font-semibold text-[#7A6258]">Catatan mutasi stok gudang dan toko.</p>
      </div>

      <div className="rounded-[1.5rem] border border-[#EBCDB8] bg-[#FFFDF8] p-16 shadow-sm text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#FFF6EA] border border-[#EBCDB8] text-[#C80503] mb-6">
          <History className="h-10 w-10" strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-black text-[#2A1712] mb-3">Fitur Riwayat Stok Segera Hadir</h2>
        <p className="text-sm font-bold text-[#7A6258] max-w-md mx-auto">
          Fitur ini sedang dalam tahap pengembangan. Nantinya, Anda dapat melihat riwayat lengkap mutasi stok dari Gudang ke Toko beserta waktu, dan jumlah stok yang dipindahkan.
        </p>
      </div>
    </div>
  );
}

export default AdminRiwayatStok;
