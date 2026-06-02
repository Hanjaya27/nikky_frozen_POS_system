import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../../services/api";

const storageLocations = [
  {
    code: "A1",
    name: "Freezer A1",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Frozen Food",
    capacity: 60,
    colorClass: "bg-rose-500 text-white",
    status: "Penuh / Prioritas Cek",
  },
  {
    code: "A2",
    name: "Freezer A2",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Frozen Food",
    capacity: 50,
    colorClass: "bg-sky-600 text-white",
    status: "Aman",
  },
  {
    code: "A3",
    name: "Freezer A3",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Frozen Food",
    capacity: 45,
    colorClass: "bg-sky-600 text-white",
    status: "Aman",
  },
  {
    code: "A4",
    name: "Freezer A4",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Frozen Food",
    capacity: 50,
    colorClass: "bg-rose-500 text-white",
    status: "Penuh / Prioritas Cek",
  },
  {
    code: "B1",
    name: "Freezer B1",
    branch: "Cabang 2",
    branch_id: 2,
    type: "Frozen Food",
    capacity: 55,
    colorClass: "bg-slate-500 text-white",
    status: "Tidak Aktif",
  },
  {
    code: "B2",
    name: "Freezer B2",
    branch: "Cabang 2",
    branch_id: 2,
    type: "Snack",
    capacity: 40,
    colorClass: "bg-rose-500 text-white",
    status: "Penuh / Prioritas Cek",
  },
  {
    code: "B3",
    name: "Freezer B3",
    branch: "Cabang 2",
    branch_id: 2,
    type: "Frozen Food",
    capacity: 45,
    colorClass: "bg-sky-600 text-white",
    status: "Aman",
  },
  {
    code: "B4",
    name: "Freezer B4",
    branch: "Cabang 2",
    branch_id: 2,
    type: "Dessert",
    capacity: 35,
    colorClass: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    status: "Kosong / Tersedia",
  },
  {
    code: "C1",
    name: "Rak Pendingin C1",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Dessert",
    capacity: 35,
    colorClass: "bg-sky-600 text-white",
    status: "Aman",
  },
  {
    code: "C2",
    name: "Rak Pendingin C2",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Dessert",
    capacity: 35,
    colorClass: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    status: "Kosong / Tersedia",
  },
  {
    code: "C3",
    name: "Rak Pendingin C3",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Snack",
    capacity: 40,
    colorClass: "bg-yellow-400 text-white",
    status: "Perlu Dicek",
  },
  {
    code: "C4",
    name: "Rak Pendingin C4",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Frozen Food",
    capacity: 45,
    colorClass: "bg-rose-500 text-white",
    status: "Penuh / Prioritas Cek",
  },
  {
    code: "D1",
    name: "Freezer D1",
    branch: "Cabang 2",
    branch_id: 2,
    type: "Dessert",
    capacity: 35,
    colorClass: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    status: "Kosong / Tersedia",
  },
  {
    code: "D2",
    name: "Freezer D2",
    branch: "Cabang 2",
    branch_id: 2,
    type: "Frozen Food",
    capacity: 50,
    colorClass: "bg-rose-500 text-white",
    status: "Penuh / Prioritas Cek",
  },
  {
    code: "D3",
    name: "Freezer D3",
    branch: "Cabang 2",
    branch_id: 2,
    type: "Frozen Food",
    capacity: 50,
    colorClass: "bg-sky-600 text-white",
    status: "Aman",
  },
  {
    code: "D4",
    name: "Freezer D4",
    branch: "Cabang 2",
    branch_id: 2,
    type: "Frozen Food",
    capacity: 50,
    colorClass: "bg-sky-600 text-white",
    status: "Aman",
  },
  {
    code: "E1",
    name: "Rak E1",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Snack",
    capacity: 40,
    colorClass: "bg-sky-600 text-white",
    status: "Aman",
  },
  {
    code: "E2",
    name: "Rak E2",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Snack",
    capacity: 40,
    colorClass: "bg-sky-600 text-white",
    status: "Aman",
  },
  {
    code: "E3",
    name: "Rak E3",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Frozen Food",
    capacity: 50,
    colorClass: "bg-rose-500 text-white",
    status: "Penuh / Prioritas Cek",
  },
  {
    code: "E4",
    name: "Rak E4",
    branch: "Cabang 1",
    branch_id: 1,
    type: "Snack",
    capacity: 40,
    colorClass: "bg-yellow-400 text-white",
    status: "Perlu Dicek",
  },
];

const storageColorLegend = [
  {
    label: "Aman",
    description: "Lokasi penyimpanan masih aman digunakan.",
    colorClass: "bg-sky-600",
  },
  {
    label: "Penuh / Prioritas Cek",
    description: "Lokasi hampir penuh atau perlu pengecekan stok.",
    colorClass: "bg-rose-500",
  },
  {
    label: "Perlu Dicek",
    description: "Lokasi perlu dicek karena stok atau kondisi tertentu.",
    colorClass: "bg-yellow-400",
  },
  {
    label: "Kosong / Tersedia",
    description: "Lokasi kosong atau tersedia untuk barang baru.",
    colorClass: "bg-cyan-100 border border-cyan-200",
  },
  {
    label: "Tidak Aktif",
    description: "Lokasi tidak digunakan atau sedang tidak aktif.",
    colorClass: "bg-slate-500",
  },
];

const categories = ["Semua", "Frozen Food", "Snack", "Dessert"];
const branches = ["Semua", "Cabang 1", "Cabang 2"];
const storageFilters = ["Semua", ...storageLocations.map((item) => item.code)];

const initialFormData = {
  branch_id: 1,
  code: "",
  name: "",
  category: "Frozen Food",
  stock: "",
  minStock: "",
  price: "",
  expiredDate: "",
  location: "A1",
};

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function getSavedData(key, fallbackData) {
  const savedData = localStorage.getItem(key);

  if (!savedData) {
    return fallbackData;
  }

  try {
    return JSON.parse(savedData);
  } catch (error) {
    localStorage.removeItem(key);
    return fallbackData;
  }
}

function getBranchIdByName(branchName) {
  if (branchName === "Cabang 1") return 1;
  if (branchName === "Cabang 2") return 2;

  return null;
}

function getBranchNameById(branchId) {
  if (Number(branchId) === 1) return "Cabang 1";
  if (Number(branchId) === 2) return "Cabang 2";

  return "-";
}

function getStockStatus(stock, minStock) {
  if (Number(stock) <= 0) {
    return {
      label: "Habis",
      className: "bg-red-100 text-red-700",
    };
  }

  if (Number(stock) <= Number(minStock)) {
    return {
      label: "Menipis",
      className: "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: "Aman",
    className: "bg-green-100 text-green-700",
  };
}

function getExpiredStatus(expiredDate) {
  if (!expiredDate) {
    return {
      label: "Tidak Ada",
      className: "bg-slate-100 text-slate-600",
    };
  }

  const today = new Date();
  const expired = new Date(`${String(expiredDate).slice(0, 10)}T00:00:00`);

  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(expired.getTime())) {
    return {
      label: "Tidak Valid",
      className: "bg-slate-100 text-slate-600",
    };
  }

  const differenceTime = expired.getTime() - today.getTime();
  const differenceDays = Math.ceil(differenceTime / (1000 * 60 * 60 * 24));

  if (differenceDays < 0) {
    return {
      label: "Expired",
      className: "bg-red-100 text-red-700",
    };
  }

  if (differenceDays <= 30) {
    return {
      label: "Hampir Expired",
      className: "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: "Aman",
    className: "bg-green-100 text-green-700",
  };
}

function normalizeProduct(product) {
  return {
    id: product.id,
    branch_id: product.branch_id,
    code: product.code,
    name: product.name,
    category: product.category,
    stock: Number(product.stock || 0),
    minStock: Number(product.min_stock || 0),
    minimumStock: Number(product.min_stock || 0),
    price: Number(product.price || 0),
    branch: product.branch?.name || getBranchNameById(product.branch_id),
    expiredDate: product.expired_date,
    location: product.storage_location || "-",
    image: product.image || "",
    status: product.status || "Aktif",
  };
}

function getProductPayload(formData, currentUser) {
  const selectedLocation = storageLocations.find(
    (location) => location.code === formData.location
  );

  const branchId =
    currentUser?.role === "kasir"
      ? getBranchIdByName(currentUser.branch)
      : Number(formData.branch_id || selectedLocation?.branch_id || 1);

  return {
    branch_id: branchId,
    code: formData.code,
    name: formData.name,
    category: formData.category,
    stock: Number(formData.stock),
    min_stock: Number(formData.minStock),
    price: Number(formData.price),
    expired_date: formData.expiredDate || null,
    storage_location: formData.location,
    image: null,
    status: "Aktif",
  };
}

function BarangPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const [selectedStorage, setSelectedStorage] = useState("Semua");

  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [modalMode, setModalMode] = useState("add");
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedUser = getSavedData("nikky_user", null);

    if (savedUser) {
      setCurrentUser(savedUser);

      if (savedUser.role === "kasir") {
        const branchId = getBranchIdByName(savedUser.branch);

        setSelectedBranch(savedUser.branch || "Cabang 1");
        setFormData((prevData) => ({
          ...prevData,
          branch_id: branchId,
          location: branchId === 2 ? "B1" : "A1",
        }));
      }
    }
  }, []);

  const isOwner = currentUser?.role === "owner";

  const activeBranchId = useMemo(() => {
    if (currentUser?.role === "kasir") {
      return getBranchIdByName(currentUser.branch);
    }

    if (selectedBranch !== "Semua") {
      return getBranchIdByName(selectedBranch);
    }

    return null;
  }, [currentUser, selectedBranch]);

  const getStorageInfo = (locationCode) => {
    return storageLocations.find((location) => location.code === locationCode);
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const params = {};

      if (activeBranchId) {
        params.branch_id = activeBranchId;
      }

      const productData = await getProducts(params);
      const normalizedProducts = productData.map(normalizeProduct);

      setProducts(normalizedProducts);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal mengambil data barang dari backend. Pastikan Laravel server berjalan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    fetchProducts();
  }, [currentUser, activeBranchId]);

  const totalProduct = products.length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  const safeStock = products.filter(
    (product) => Number(product.stock) > Number(product.minStock)
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) > 0 &&
      Number(product.stock) <= Number(product.minStock)
  ).length;

  const emptyStock = products.filter(
    (product) => Number(product.stock) <= 0
  ).length;

  const nearlyExpired = products.filter((product) => {
    const expiredStatus = getExpiredStatus(product.expiredDate);

    return (
      expiredStatus.label === "Hampir Expired" ||
      expiredStatus.label === "Expired"
    );
  }).length;

  const storageSummary = storageLocations.map((location) => {
    const usedStock = products
      .filter((product) => product.location === location.code)
      .reduce((total, product) => total + Number(product.stock || 0), 0);

    const percentage = Math.min(
      Math.round((usedStock / location.capacity) * 100),
      100
    );

    return {
      ...location,
      usedStock,
      percentage,
    };
  });

  const selectedStorageInfo =
    selectedStorage === "Semua"
      ? null
      : storageSummary.find((location) => location.code === selectedStorage);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = searchKeyword.toLowerCase();

      const matchSearch =
        product.name.toLowerCase().includes(keyword) ||
        product.code.toLowerCase().includes(keyword);

      const matchCategory =
        selectedCategory === "Semua" || product.category === selectedCategory;

      const matchBranch =
        selectedBranch === "Semua" || product.branch === selectedBranch;

      const matchStorage =
        selectedStorage === "Semua" || product.location === selectedStorage;

      return matchSearch && matchCategory && matchBranch && matchStorage;
    });
  }, [
    products,
    searchKeyword,
    selectedCategory,
    selectedBranch,
    selectedStorage,
  ]);

  const selectedFormStorage = getStorageInfo(formData.location);

  const availableStorageLocations = useMemo(() => {
    if (currentUser?.role === "kasir") {
      return storageLocations.filter(
        (location) => location.branch === currentUser.branch
      );
    }

    return storageLocations.filter(
      (location) => Number(location.branch_id) === Number(formData.branch_id)
    );
  }, [currentUser, formData.branch_id]);

  const showSuccessNotification = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage("");
    }, 2500);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "branch_id") {
      const branchId = Number(value);
      const firstLocation = storageLocations.find(
        (location) => Number(location.branch_id) === branchId
      );

      setFormData((prevData) => ({
        ...prevData,
        branch_id: branchId,
        location: firstLocation?.code || "A1",
      }));

      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const resetForm = () => {
    const defaultBranchId =
      currentUser?.role === "kasir"
        ? getBranchIdByName(currentUser.branch)
        : 1;

    const defaultLocation = defaultBranchId === 2 ? "B1" : "A1";

    setFormData({
      ...initialFormData,
      branch_id: defaultBranchId,
      location: defaultLocation,
    });
  };

  const openAddModal = () => {
    resetForm();
    setModalMode("add");
    setEditingProductId(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setModalMode("edit");
    setEditingProductId(product.id);

    setFormData({
      branch_id: product.branch_id,
      code: product.code,
      name: product.name,
      category: product.category,
      stock: String(product.stock),
      minStock: String(product.minStock),
      price: String(product.price),
      expiredDate: product.expiredDate || "",
      location: product.location,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    resetForm();
    setModalMode("add");
    setEditingProductId(null);
    setShowModal(false);
  };

  const validateForm = () => {
    if (
      !formData.code ||
      !formData.name ||
      formData.stock === "" ||
      formData.minStock === "" ||
      !formData.price ||
      !formData.expiredDate ||
      !formData.location
    ) {
      alert("Lengkapi semua data barang terlebih dahulu.");
      return false;
    }

    const codeExists = products.some(
      (product) =>
        product.code.toLowerCase() === formData.code.toLowerCase() &&
        product.id !== editingProductId
    );

    if (codeExists) {
      alert("Kode barang sudah digunakan. Gunakan kode lain.");
      return false;
    }

    if (Number(formData.stock) < 0 || Number(formData.minStock) < 0) {
      alert("Stok dan minimal stok tidak boleh bernilai negatif.");
      return false;
    }

    if (Number(formData.price) <= 0) {
      alert("Harga barang harus lebih dari 0.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const payload = getProductPayload(formData, currentUser);

      if (modalMode === "edit") {
        await updateProduct(editingProductId, payload);
        showSuccessNotification("Data barang berhasil diperbarui ke backend.");
      } else {
        await createProduct(payload);
        showSuccessNotification("Data barang berhasil ditambahkan ke backend.");
      }

      closeModal();
      await fetchProducts();
    } catch (error) {
      alert(error.message || "Gagal menyimpan data barang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    const confirmDelete = confirm("Yakin ingin menghapus data barang ini?");

    if (!confirmDelete) {
      return;
    }

    try {
      setErrorMessage("");
      await deleteProduct(productId);
      await fetchProducts();
      showSuccessNotification("Data barang berhasil dihapus dari backend.");
    } catch (error) {
      alert(error.message || "Gagal menghapus data barang.");
    }
  };

  const handleRefresh = async () => {
    await fetchProducts();
    showSuccessNotification("Data barang berhasil diperbarui dari backend.");
  };

  const exportCSV = () => {
    if (products.length === 0) {
      alert("Tidak ada data barang untuk diexport.");
      return;
    }

    const headers = [
      "Kode",
      "Nama Barang",
      "Kategori",
      "Stok",
      "Minimal Stok",
      "Harga",
      "Cabang",
      "Expired Date",
      "Lokasi",
    ];

    const rows = filteredProducts.map((product) => [
      product.code,
      product.name,
      product.category,
      product.stock,
      product.minStock,
      product.price,
      product.branch,
      product.expiredDate,
      product.location,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((item) => `"${item}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "data-barang-nikky-frozen.csv";
    link.click();

    URL.revokeObjectURL(url);
    showSuccessNotification("Data barang berhasil diexport.");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title="Barang & Stok"
        description="Kelola data produk, stok, cabang, kedaluwarsa, dan tempat penyimpanan dari backend."
      />

      <div className="mb-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm hover:bg-green-50"
        >
          Refresh Data
        </button>

        <button
          type="button"
          onClick={exportCSV}
          className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
        >
          Export CSV
        </button>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + Tambah Barang
        </button>
      </div>

      {showSuccess && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {lowStock > 0 && (
        <div className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm font-medium text-yellow-700">
          Perhatian! Terdapat {lowStock} barang dengan stok menipis atau berada
          di bawah batas minimum.
        </div>
      )}

      {emptyStock > 0 && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          Perhatian! Terdapat {emptyStock} barang dengan stok habis.
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Produk</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {totalProduct}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Stok</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            {totalStock}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Stok Aman</p>
          <h3 className="mt-2 text-2xl font-bold text-green-600">
            {safeStock}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Stok Menipis</p>
          <h3 className="mt-2 text-2xl font-bold text-yellow-600">
            {lowStock}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Stok Habis</p>
          <h3 className="mt-2 text-2xl font-bold text-red-600">
            {emptyStock}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Hampir Expired</p>
          <h3 className="mt-2 text-2xl font-bold text-orange-600">
            {nearlyExpired}
          </h3>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5 grid gap-3 lg:grid-cols-4">
              <input
                type="text"
                placeholder="Cari nama atau kode barang..."
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={selectedBranch}
                disabled={!isOwner}
                onChange={(event) => setSelectedBranch(event.target.value)}
                className={`rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                  !isOwner ? "bg-slate-100 text-slate-400" : ""
                }`}
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>

              <select
                value={selectedStorage}
                onChange={(event) => setSelectedStorage(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {storageFilters.map((storage) => (
                  <option key={storage} value={storage}>
                    {storage === "Semua" ? "Semua Lokasi" : `Lokasi ${storage}`}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                Mengambil data barang dari backend...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                      <th className="px-4 py-4 font-semibold">Kode</th>
                      <th className="px-4 py-4 font-semibold">Nama Barang</th>
                      <th className="px-4 py-4 font-semibold">Kategori</th>
                      <th className="px-4 py-4 font-semibold">Stok</th>
                      <th className="px-4 py-4 font-semibold">Min. Stok</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                      <th className="px-4 py-4 font-semibold">Harga</th>
                      <th className="px-4 py-4 font-semibold">Cabang</th>
                      <th className="px-4 py-4 font-semibold">Kedaluwarsa</th>
                      <th className="px-4 py-4 font-semibold">Lokasi</th>
                      <th className="px-4 py-4 text-center font-semibold">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(
                        product.stock,
                        product.minStock
                      );

                      const expiredStatus = getExpiredStatus(
                        product.expiredDate
                      );
                      const storageInfo = getStorageInfo(product.location);

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-slate-100 text-sm hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 font-medium text-slate-700">
                            {product.code}
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-800">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              ID: {product.id}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {product.category}
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-800">
                            {product.stock}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {product.minStock}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${stockStatus.className}`}
                            >
                              {stockStatus.label}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {formatRupiah(product.price)}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {product.branch}
                          </td>

                          <td className="px-4 py-4">
                            <div>
                              <p className="text-slate-600">
                                {product.expiredDate || "-"}
                              </p>
                              <span
                                className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${expiredStatus.className}`}
                              >
                                {expiredStatus.label}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  storageInfo?.colorClass ||
                                  "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {product.location}
                              </span>
                              <p className="mt-1 text-xs text-slate-500">
                                {storageInfo?.name || "-"}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(product.id)}
                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan="11"
                          className="px-4 py-10 text-center text-sm text-slate-500"
                        >
                          Data barang tidak ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-4 text-sm text-slate-500">
              Menampilkan {filteredProducts.length} dari {products.length} data
              barang.
            </p>
          </div>
        </section>

        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-800">
              Tempat Penyimpanan
            </h3>
            <p className="text-sm text-slate-500">
              Pilih kode lokasi untuk melihat detail freezer atau rak.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedStorage("Semua")}
            className={`mb-4 w-full rounded-2xl px-4 py-3 text-sm font-bold transition ${
              selectedStorage === "Semua"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Lokasi
          </button>

          <div className="grid grid-cols-4 gap-3">
            {storageSummary.map((location) => (
              <button
                key={location.code}
                type="button"
                onClick={() => setSelectedStorage(location.code)}
                className={`flex h-14 items-center justify-center rounded-xl text-sm font-bold shadow-sm transition hover:scale-105 ${
                  location.colorClass
                } ${
                  selectedStorage === location.code
                    ? "ring-4 ring-blue-200"
                    : "ring-0"
                }`}
                title={`${location.name} - ${location.status}`}
              >
                {location.code}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-bold text-slate-800">
              Keterangan Warna
            </h4>

            <div className="space-y-3">
              {storageColorLegend.map((legend) => (
                <div key={legend.label} className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-4 w-4 rounded-md ${legend.colorClass}`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {legend.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {legend.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedStorageInfo && (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`rounded-xl px-3 py-1 text-xs font-bold ${selectedStorageInfo.colorClass}`}
                >
                  {selectedStorageInfo.code}
                </span>

                <p className="text-sm font-bold text-slate-800">
                  {selectedStorageInfo.name}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cabang</span>
                  <span className="font-semibold text-slate-700">
                    {selectedStorageInfo.branch}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Jenis</span>
                  <span className="font-semibold text-slate-700">
                    {selectedStorageInfo.type}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-slate-700">
                    {selectedStorageInfo.status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Kapasitas</span>
                  <span className="font-semibold text-slate-700">
                    {selectedStorageInfo.usedStock}/
                    {selectedStorageInfo.capacity}
                  </span>
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${
                    selectedStorageInfo.percentage >= 90
                      ? "bg-red-500"
                      : selectedStorageInfo.percentage >= 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${selectedStorageInfo.percentage}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Terpakai {selectedStorageInfo.percentage}% dari kapasitas
                penyimpanan.
              </p>
            </div>
          )}
        </aside>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {modalMode === "edit"
                    ? "Edit Data Barang"
                    : "Tambah Barang Baru"}
                </h3>
                <p className="text-sm text-slate-500">
                  {modalMode === "edit"
                    ? "Ubah data produk, stok, dan lokasi penyimpanan ke backend."
                    : "Masukkan data produk, stok, dan lokasi penyimpanan ke backend."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cabang
                </label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  disabled={!isOwner}
                  onChange={handleChange}
                  className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                    !isOwner ? "bg-slate-100 text-slate-400" : ""
                  }`}
                >
                  <option value={1}>Cabang 1</option>
                  <option value={2}>Cabang 2</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Kode Barang
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Contoh: NF-009-C1"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nama Barang
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama barang"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Kategori
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Frozen Food">Frozen Food</option>
                  <option value="Snack">Snack</option>
                  <option value="Dessert">Dessert</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Lokasi Penyimpanan
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  {availableStorageLocations.map((location) => (
                    <option key={location.code} value={location.code}>
                      {location.code} - {location.name} - {location.branch}
                    </option>
                  ))}
                </select>

                {selectedFormStorage && (
                  <p className="mt-2 text-xs text-slate-500">
                    Cabang lokasi:{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedFormStorage.branch}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Stok
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="Jumlah stok"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Minimal Stok
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleChange}
                  placeholder="Batas stok minimum"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Harga
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Harga barang"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tanggal Kedaluwarsa
                </label>
                <input
                  type="date"
                  name="expiredDate"
                  value={formData.expiredDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-2 flex gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl py-3 font-semibold text-white ${
                    isSubmitting
                      ? "bg-slate-400"
                      : modalMode === "edit"
                      ? "bg-slate-800 hover:bg-slate-900"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : modalMode === "edit"
                    ? "Simpan Perubahan"
                    : "Simpan Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BarangPage;