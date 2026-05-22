import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import KasirPage from "./pages/kasir/KasirPage";
import BarangPage from "./pages/barang/BarangPage";
import TransaksiPage from "./pages/transaksi/TransaksiPage";
import LaporanPage from "./pages/laporan/LaporanPage";
import PengeluaranPage from "./pages/pengeluaran/PengeluaranPage";
import PengaturanPage from "./pages/pengaturan/PengaturanPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<KasirPage />} />
          <Route path="barang" element={<BarangPage />} />
          <Route path="transaksi" element={<TransaksiPage />} />
          <Route path="laporan" element={<LaporanPage />} />
          <Route path="pengeluaran" element={<PengeluaranPage />} />
          <Route path="pengaturan" element={<PengaturanPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;