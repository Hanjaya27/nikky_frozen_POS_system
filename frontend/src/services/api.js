const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

async function handleResponse(response, defaultErrorMessage) {
  let result = null;

  try {
    result = await response.json();
  } catch (error) {
    result = null;
  }

  if (!response.ok) {
    if (result?.errors) {
      const firstError = Object.values(result.errors)[0]?.[0];

      throw new Error(firstError || result.message || defaultErrorMessage);
    }

    throw new Error(result?.message || defaultErrorMessage);
  }

  return result;
}

function buildQueryParams(params = {}) {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  return queryParams.toString();
}

async function request(
  url,
  options = {},
  defaultErrorMessage = "Terjadi kesalahan."
) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    return handleResponse(response, defaultErrorMessage);
  } catch (error) {
    throw new Error(
      "Tidak bisa terhubung ke backend. Pastikan Laravel berjalan di http://127.0.0.1:8000"
    );
  }
}

/* =========================
   PRODUCTS API
========================= */

export async function getProducts(params = {}) {
  const queryString = buildQueryParams(params);

  const url = queryString
    ? `${API_BASE_URL}/products?${queryString}`
    : `${API_BASE_URL}/products`;

  const result = await request(
    url,
    {
      method: "GET",
    },
    "Gagal mengambil data produk."
  );

  return result.data;
}

export async function getProductById(id) {
  const result = await request(
    `${API_BASE_URL}/products/${id}`,
    {
      method: "GET",
    },
    "Gagal mengambil detail produk."
  );

  return result.data;
}

export async function createProduct(productData) {
  const result = await request(
    `${API_BASE_URL}/products`,
    {
      method: "POST",
      body: JSON.stringify(productData),
    },
    "Gagal menambahkan produk."
  );

  return result.data;
}

export async function updateProduct(id, productData) {
  const result = await request(
    `${API_BASE_URL}/products/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(productData),
    },
    "Gagal memperbarui produk."
  );

  return result.data;
}

export async function deleteProduct(id) {
  const result = await request(
    `${API_BASE_URL}/products/${id}`,
    {
      method: "DELETE",
    },
    "Gagal menghapus produk."
  );

  return result;
}

/* =========================
   TRANSACTIONS API
========================= */

export async function checkoutTransaction(transactionData) {
  const result = await request(
    `${API_BASE_URL}/checkout`,
    {
      method: "POST",
      body: JSON.stringify(transactionData),
    },
    "Gagal memproses transaksi."
  );

  return result.data;
}

export async function getTransactions(params = {}) {
  const queryString = buildQueryParams(params);

  const url = queryString
    ? `${API_BASE_URL}/transactions?${queryString}`
    : `${API_BASE_URL}/transactions`;

  const result = await request(
    url,
    {
      method: "GET",
    },
    "Gagal mengambil data transaksi."
  );

  return result.data;
}

/* =========================
   EXPENSES API
========================= */

export async function getExpenses(params = {}) {
  const queryString = buildQueryParams(params);

  const url = queryString
    ? `${API_BASE_URL}/expenses?${queryString}`
    : `${API_BASE_URL}/expenses`;

  const result = await request(
    url,
    {
      method: "GET",
    },
    "Gagal mengambil data pengeluaran."
  );

  return result.data;
}

export async function getExpenseById(id) {
  const result = await request(
    `${API_BASE_URL}/expenses/${id}`,
    {
      method: "GET",
    },
    "Gagal mengambil detail pengeluaran."
  );

  return result.data;
}

export async function createExpense(expenseData) {
  const result = await request(
    `${API_BASE_URL}/expenses`,
    {
      method: "POST",
      body: JSON.stringify(expenseData),
    },
    "Gagal menambahkan pengeluaran."
  );

  return result.data;
}

export async function updateExpense(id, expenseData) {
  const result = await request(
    `${API_BASE_URL}/expenses/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(expenseData),
    },
    "Gagal memperbarui pengeluaran."
  );

  return result.data;
}

export async function deleteExpense(id) {
  const result = await request(
    `${API_BASE_URL}/expenses/${id}`,
    {
      method: "DELETE",
    },
    "Gagal menghapus pengeluaran."
  );

  return result;
}

/* =========================
   SHIFTS API
========================= */

export async function getShifts(params = {}) {
  const queryString = buildQueryParams(params);

  const url = queryString
    ? `${API_BASE_URL}/shifts?${queryString}`
    : `${API_BASE_URL}/shifts`;

  const result = await request(
    url,
    {
      method: "GET",
    },
    "Gagal mengambil data shift."
  );

  return result.data;
}

export async function getCurrentShift(username) {
  const queryString = buildQueryParams({ username });

  const result = await request(
    `${API_BASE_URL}/shifts/current?${queryString}`,
    {
      method: "GET",
    },
    "Gagal mengambil shift berjalan."
  );

  return result.data;
}

export async function openShift(shiftData) {
  const result = await request(
    `${API_BASE_URL}/shifts/open`,
    {
      method: "POST",
      body: JSON.stringify(shiftData),
    },
    "Gagal membuka shift."
  );

  return result.data;
}

export async function closeShift(id, closeData) {
  const result = await request(
    `${API_BASE_URL}/shifts/${id}/close`,
    {
      method: "PUT",
      body: JSON.stringify(closeData),
    },
    "Gagal menutup shift."
  );

  return result.data;
}

export async function updateShift(id, shiftData) {
  const result = await request(
    `${API_BASE_URL}/shifts/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(shiftData),
    },
    "Gagal memperbarui shift."
  );

  return result.data;
}

export async function deleteShift(id) {
  const result = await request(
    `${API_BASE_URL}/shifts/${id}`,
    {
      method: "DELETE",
    },
    "Gagal menghapus shift."
  );

  return result;
}

/* =========================
   AUTH API
========================= */

export async function loginUser(loginData) {
  const result = await request(
    `${API_BASE_URL}/login`,
    {
      method: "POST",
      body: JSON.stringify(loginData),
    },
    "Gagal login."
  );

  return result.data;
}

export async function logoutUser(logoutData) {
  const result = await request(
    `${API_BASE_URL}/logout`,
    {
      method: "POST",
      body: JSON.stringify(logoutData),
    },
    "Gagal logout."
  );

  return result;
}

/* =========================
   LOGIN ACTIVITIES API
========================= */

export async function getLoginActivities(params = {}) {
  const queryString = buildQueryParams(params);

  const url = queryString
    ? `${API_BASE_URL}/login-activities?${queryString}`
    : `${API_BASE_URL}/login-activities`;

  const result = await request(
    url,
    {
      method: "GET",
    },
    "Gagal mengambil data aktivitas login."
  );

  return result.data;
}

export async function forceLogoutActivity(id) {
  const result = await request(
    `${API_BASE_URL}/login-activities/${id}/force-logout`,
    {
      method: "PUT",
    },
    "Gagal melakukan force logout."
  );

  return result.data;
}

export async function deleteLoginActivity(id) {
  const result = await request(
    `${API_BASE_URL}/login-activities/${id}`,
    {
      method: "DELETE",
    },
    "Gagal menghapus aktivitas login."
  );

  return result;
}

/* =========================
   USERS API
========================= */

export async function getUsers(params = {}) {
  const queryString = buildQueryParams(params);

  const url = queryString
    ? `${API_BASE_URL}/users?${queryString}`
    : `${API_BASE_URL}/users`;

  const result = await request(
    url,
    {
      method: "GET",
    },
    "Gagal mengambil data user."
  );

  return result.data;
}

export async function getUserById(id) {
  const result = await request(
    `${API_BASE_URL}/users/${id}`,
    {
      method: "GET",
    },
    "Gagal mengambil detail user."
  );

  return result.data;
}

export async function createUser(userData) {
  const result = await request(
    `${API_BASE_URL}/users`,
    {
      method: "POST",
      body: JSON.stringify(userData),
    },
    "Gagal menambahkan user."
  );

  return result.data;
}

export async function updateUser(id, userData) {
  const result = await request(
    `${API_BASE_URL}/users/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(userData),
    },
    "Gagal memperbarui user."
  );

  return result.data;
}

export async function deleteUser(id) {
  const result = await request(
    `${API_BASE_URL}/users/${id}`,
    {
      method: "DELETE",
    },
    "Gagal menghapus user."
  );

  return result;
}

/* =========================
   PERMISSIONS API
========================= */

export async function getPermissionsApi() {
  const result = await request(
    `${API_BASE_URL}/permissions`,
    {
      method: "GET",
    },
    "Gagal mengambil data permission."
  );

  return result.data;
}

export async function updatePermissionsApi(permissions) {
  const result = await request(
    `${API_BASE_URL}/permissions`,
    {
      method: "PUT",
      body: JSON.stringify({
        permissions,
      }),
    },
    "Gagal memperbarui permission."
  );

  return result.data;
}

export async function updateSinglePermissionApi(permissionId, kasirAccess) {
  const result = await request(
    `${API_BASE_URL}/permissions/${permissionId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        kasir_access: kasirAccess,
      }),
    },
    "Gagal memperbarui permission."
  );

  return result.data;
}

export async function resetPermissionsApi() {
  const result = await request(
    `${API_BASE_URL}/permissions/reset`,
    {
      method: "POST",
    },
    "Gagal reset permission."
  );

  return result.data;
}

/* =========================
   SETTINGS API
========================= */

export async function getSettingsApi() {
  const result = await request(
    `${API_BASE_URL}/settings`,
    {
      method: "GET",
    },
    "Gagal mengambil data pengaturan."
  );

  return result.data;
}

export async function updateSettingsApi(settingsData) {
  const result = await request(
    `${API_BASE_URL}/settings`,
    {
      method: "PUT",
      body: JSON.stringify(settingsData),
    },
    "Gagal menyimpan data pengaturan."
  );

  return result.data;
}

export async function resetSettingsApi() {
  const result = await request(
    `${API_BASE_URL}/settings/reset`,
    {
      method: "POST",
    },
    "Gagal reset data pengaturan."
  );

  return result.data;
}

/* =========================
   HELPER
========================= */

export function getApiBaseUrl() {
  return API_BASE_URL;
}