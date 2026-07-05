export async function getOwnerUsers(params = {}) {
  const queryString = buildQueryParams(params);
  const url = queryString
    ? `${API_BASE_URL}/owner/users?${queryString}`
    : `${API_BASE_URL}/owner/users`;

  const result = await request(url, { method: "GET" }, "Gagal mengambil data user.");

  return result.data;
}
