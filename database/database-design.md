# Database Design - Nikky Frozen POS System

## 1. Deskripsi Database

Database **Nikky Frozen POS System** dirancang untuk mendukung kebutuhan sistem kasir, manajemen barang dan stok, tempat penyimpanan, transaksi penjualan, pembayaran, shift kasir, pengeluaran toko, dan laporan.

Database ini menggunakan pendekatan relasional, sehingga setiap data utama dipisahkan ke dalam tabel yang saling terhubung melalui primary key dan foreign key.

## 2. Tujuan Perancangan Database

Tujuan dari perancangan database ini adalah:

1. Menyimpan data pengguna sistem berdasarkan role.
2. Menyimpan data cabang toko Nikky Frozen.
3. Menyimpan data kategori dan produk.
4. Mengelola stok produk berdasarkan cabang, batch, dan tempat penyimpanan.
5. Mencatat pergerakan stok masuk dan keluar.
6. Mencatat transaksi penjualan dan detail barang yang dibeli.
7. Mencatat pembayaran transaksi.
8. Mencatat shift kerja kasir.
9. Mencatat pengeluaran operasional toko.
10. Mendukung pembuatan laporan penjualan, stok, dan pengeluaran.

## 3. Daftar Tabel

Database terdiri dari beberapa tabel utama, yaitu:

1. `roles`
2. `users`
3. `branches`
4. `categories`
5. `products`
6. `storage_locations`
7. `product_batches`
8. `stocks`
9. `stock_movements`
10. `shifts`
11. `transactions`
12. `transaction_details`
13. `payments`
14. `expenses`

---

# 4. Detail Tabel

## 4.1 Tabel roles

Tabel `roles` digunakan untuk menyimpan data hak akses pengguna sistem.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| role_name | string | Nama role pengguna |

### Contoh Data

| id | role_name |
|---|---|
| 1 | owner |
| 2 | admin |
| 3 | kasir |

### Relasi

- Satu role dapat dimiliki oleh banyak user.
- Relasi: `roles.id` → `users.role_id`

---

## 4.2 Tabel users

Tabel `users` digunakan untuk menyimpan data pengguna sistem seperti owner, admin, dan kasir.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| role_id | int | Foreign key ke tabel roles |
| branch_id | int | Foreign key ke tabel branches |
| name | string | Nama lengkap pengguna |
| username | string | Username untuk login |
| password | string | Password pengguna |
| status | string | Status akun pengguna |
| created_at | datetime | Waktu data dibuat |
| updated_at | datetime | Waktu data diperbarui |

### Relasi

- Satu user memiliki satu role.
- Satu user berada pada satu cabang.
- Satu user dapat menangani banyak transaksi.
- Satu user dapat mencatat banyak pengeluaran.
- Satu user dapat mencatat banyak pergerakan stok.
- Satu user dapat memiliki banyak shift.

---

## 4.3 Tabel branches

Tabel `branches` digunakan untuk menyimpan data cabang toko Nikky Frozen.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| branch_name | string | Nama cabang |
| address | string | Alamat cabang |
| status | string | Status cabang |
| created_at | datetime | Waktu data dibuat |
| updated_at | datetime | Waktu data diperbarui |

### Relasi

- Satu cabang memiliki banyak user.
- Satu cabang memiliki banyak tempat penyimpanan.
- Satu cabang memiliki banyak stok.
- Satu cabang memiliki banyak transaksi.
- Satu cabang memiliki banyak pengeluaran.
- Satu cabang memiliki banyak shift.

---

## 4.4 Tabel categories

Tabel `categories` digunakan untuk menyimpan kategori produk.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| category_name | string | Nama kategori produk |
| description | string | Deskripsi kategori |
| created_at | datetime | Waktu data dibuat |
| updated_at | datetime | Waktu data diperbarui |

### Contoh Data

| id | category_name | description |
|---|---|---|
| 1 | Frozen Food | Produk makanan beku |
| 2 | Snack | Produk camilan |
| 3 | Dessert | Produk makanan penutup |

### Relasi

- Satu kategori dapat memiliki banyak produk.
- Relasi: `categories.id` → `products.category_id`

---

## 4.5 Tabel products

Tabel `products` digunakan untuk menyimpan data produk yang dijual di toko.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| category_id | int | Foreign key ke tabel categories |
| product_name | string | Nama produk |
| sku | string | Kode unik produk |
| price | decimal | Harga produk |
| minimum_stock | int | Batas minimal stok |
| status | string | Status produk |
| created_at | datetime | Waktu data dibuat |
| updated_at | datetime | Waktu data diperbarui |

### Relasi

- Satu produk memiliki satu kategori.
- Satu produk dapat memiliki banyak batch.
- Satu produk dapat memiliki banyak data stok.
- Satu produk dapat muncul pada banyak detail transaksi.
- Satu produk dapat memiliki banyak riwayat pergerakan stok.

---

## 4.6 Tabel storage_locations

Tabel `storage_locations` digunakan untuk menyimpan data tempat penyimpanan barang seperti freezer atau rak pendingin.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| branch_id | int | Foreign key ke tabel branches |
| code | string | Kode lokasi, contoh A1, A2, B1 |
| location_name | string | Nama lokasi penyimpanan |
| type | string | Jenis tempat penyimpanan |
| capacity | int | Kapasitas maksimal penyimpanan |
| status | string | Status lokasi penyimpanan |
| created_at | datetime | Waktu data dibuat |
| updated_at | datetime | Waktu data diperbarui |

### Contoh Data

| code | location_name | type | status |
|---|---|---|---|
| A1 | Freezer A1 | Frozen Food | Penuh / Prioritas Cek |
| A2 | Freezer A2 | Frozen Food | Aman |
| B4 | Freezer B4 | Dessert | Kosong / Tersedia |

### Relasi

- Satu cabang memiliki banyak tempat penyimpanan.
- Satu tempat penyimpanan dapat menyimpan banyak stok produk.
- Relasi: `storage_locations.id` → `stocks.storage_location_id`

---

## 4.7 Tabel product_batches

Tabel `product_batches` digunakan untuk menyimpan informasi batch produk dan tanggal kedaluwarsa.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| product_id | int | Foreign key ke tabel products |
| batch_code | string | Kode batch produk |
| expired_date | date | Tanggal kedaluwarsa |
| initial_qty | int | Jumlah stok awal batch |
| remaining_qty | int | Jumlah stok tersisa |
| created_at | datetime | Waktu data dibuat |
| updated_at | datetime | Waktu data diperbarui |

### Relasi

- Satu produk dapat memiliki banyak batch.
- Satu batch dapat memiliki banyak data stok.
- Satu batch dapat dicatat pada pergerakan stok.

---

## 4.8 Tabel stocks

Tabel `stocks` digunakan untuk menyimpan jumlah stok produk berdasarkan cabang, batch, dan lokasi penyimpanan.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| branch_id | int | Foreign key ke tabel branches |
| product_id | int | Foreign key ke tabel products |
| batch_id | int | Foreign key ke tabel product_batches |
| storage_location_id | int | Foreign key ke tabel storage_locations |
| quantity | int | Jumlah stok tersedia |
| updated_at | datetime | Waktu data diperbarui |

### Relasi

- Satu cabang memiliki banyak stok.
- Satu produk dapat memiliki banyak data stok.
- Satu batch dapat memiliki banyak data stok.
- Satu lokasi penyimpanan dapat menyimpan banyak stok.
- Satu stok dapat memiliki banyak riwayat pergerakan stok.

---

## 4.9 Tabel stock_movements

Tabel `stock_movements` digunakan untuk mencatat riwayat pergerakan stok, baik stok masuk maupun stok keluar.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| stock_id | int | Foreign key ke tabel stocks |
| product_id | int | Foreign key ke tabel products |
| branch_id | int | Foreign key ke tabel branches |
| user_id | int | Foreign key ke tabel users |
| batch_id | int | Foreign key ke tabel product_batches |
| movement_type | string | Jenis pergerakan stok |
| quantity | int | Jumlah barang yang bergerak |
| description | string | Keterangan pergerakan stok |
| created_at | datetime | Waktu data dibuat |

### Contoh movement_type

| movement_type | Keterangan |
|---|---|
| in | Stok masuk |
| out | Stok keluar |
| adjustment | Penyesuaian stok |
| expired | Barang kedaluwarsa |

### Relasi

- Satu stok dapat memiliki banyak pergerakan.
- Satu user dapat mencatat banyak pergerakan stok.
- Satu produk dapat memiliki banyak pergerakan stok.

---

## 4.10 Tabel shifts

Tabel `shifts` digunakan untuk mencatat shift kerja kasir.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| user_id | int | Foreign key ke tabel users |
| branch_id | int | Foreign key ke tabel branches |
| start_time | datetime | Waktu mulai shift |
| end_time | datetime | Waktu selesai shift |
| opening_cash | decimal | Kas awal shift |
| closing_cash | decimal | Kas akhir shift |
| status | string | Status shift |
| created_at | datetime | Waktu data dibuat |
| updated_at | datetime | Waktu data diperbarui |

### Relasi

- Satu user dapat memiliki banyak shift.
- Satu cabang dapat memiliki banyak shift.
- Satu shift dapat memiliki banyak transaksi.

---

## 4.11 Tabel transactions

Tabel `transactions` digunakan untuk menyimpan data transaksi penjualan.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| user_id | int | Foreign key ke tabel users |
| branch_id | int | Foreign key ke tabel branches |
| shift_id | int | Foreign key ke tabel shifts |
| invoice_number | string | Nomor invoice transaksi |
| transaction_date | datetime | Tanggal dan waktu transaksi |
| subtotal | decimal | Total sebelum pajak dan diskon |
| tax | decimal | Pajak transaksi |
| discount | decimal | Diskon transaksi |
| grand_total | decimal | Total akhir transaksi |
| transaction_status | string | Status transaksi |
| created_at | datetime | Waktu data dibuat |
| updated_at | datetime | Waktu data diperbarui |

### Relasi

- Satu transaksi dibuat oleh satu user.
- Satu transaksi terjadi pada satu cabang.
- Satu transaksi berada pada satu shift.
- Satu transaksi memiliki banyak detail transaksi.
- Satu transaksi memiliki satu atau lebih pembayaran.

---

## 4.12 Tabel transaction_details

Tabel `transaction_details` digunakan untuk menyimpan detail barang yang dibeli dalam setiap transaksi.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| transaction_id | int | Foreign key ke tabel transactions |
| product_id | int | Foreign key ke tabel products |
| quantity | int | Jumlah barang yang dibeli |
| price | decimal | Harga barang saat transaksi |
| subtotal | decimal | Total harga per barang |

### Relasi

- Satu transaksi memiliki banyak detail transaksi.
- Satu produk dapat muncul pada banyak detail transaksi.

---

## 4.13 Tabel payments

Tabel `payments` digunakan untuk menyimpan data pembayaran transaksi.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| transaction_id | int | Foreign key ke tabel transactions |
| payment_method | string | Metode pembayaran |
| paid_amount | decimal | Jumlah uang dibayar |
| change_amount | decimal | Jumlah kembalian |
| payment_status | string | Status pembayaran |
| created_at | datetime | Waktu data dibuat |

### Contoh payment_method

| payment_method | Keterangan |
|---|---|
| cash | Tunai |
| qris | QRIS |
| debit | Kartu debit |
| transfer | Transfer bank |
| e-wallet | Dompet digital |

### Relasi

- Satu transaksi dapat memiliki satu atau lebih pembayaran.
- Relasi: `transactions.id` → `payments.transaction_id`

---

## 4.14 Tabel expenses

Tabel `expenses` digunakan untuk menyimpan data pengeluaran operasional toko.

### Struktur Tabel

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | int | Primary key |
| branch_id | int | Foreign key ke tabel branches |
| user_id | int | Foreign key ke tabel users |
| category | string | Kategori pengeluaran |
| description | string | Keterangan pengeluaran |
| amount | decimal | Nominal pengeluaran |
| payment_method | string | Metode pembayaran pengeluaran |
| expense_date | date | Tanggal pengeluaran |
| created_at | datetime | Waktu data dibuat |
| updated_at | datetime | Waktu data diperbarui |

### Contoh Kategori Pengeluaran

| category | Keterangan |
|---|---|
| Operasional | Pengeluaran kebutuhan operasional |
| Listrik | Pembayaran listrik |
| Transportasi | Biaya pengiriman atau transportasi |
| Perawatan | Perawatan freezer atau peralatan toko |
| Lainnya | Pengeluaran lain-lain |

### Relasi

- Satu cabang dapat memiliki banyak pengeluaran.
- Satu user dapat mencatat banyak pengeluaran.

---

# 5. Relasi Antar Tabel

Berikut relasi utama pada database Nikky Frozen POS System:

| Relasi | Keterangan |
|---|---|
| roles → users | Satu role dapat dimiliki oleh banyak user |
| branches → users | Satu cabang memiliki banyak user |
| branches → storage_locations | Satu cabang memiliki banyak lokasi penyimpanan |
| branches → stocks | Satu cabang memiliki banyak stok |
| branches → transactions | Satu cabang memiliki banyak transaksi |
| branches → expenses | Satu cabang memiliki banyak pengeluaran |
| branches → shifts | Satu cabang memiliki banyak shift |
| categories → products | Satu kategori memiliki banyak produk |
| products → product_batches | Satu produk memiliki banyak batch |
| products → stocks | Satu produk memiliki banyak stok |
| products → transaction_details | Satu produk dapat muncul pada banyak detail transaksi |
| storage_locations → stocks | Satu lokasi penyimpanan memiliki banyak stok |
| product_batches → stocks | Satu batch memiliki banyak stok |
| stocks → stock_movements | Satu stok memiliki banyak pergerakan stok |
| users → transactions | Satu user dapat menangani banyak transaksi |
| users → expenses | Satu user dapat mencatat banyak pengeluaran |
| users → stock_movements | Satu user dapat mencatat banyak pergerakan stok |
| users → shifts | Satu user dapat memiliki banyak shift |
| shifts → transactions | Satu shift memiliki banyak transaksi |
| transactions → transaction_details | Satu transaksi memiliki banyak detail transaksi |
| transactions → payments | Satu transaksi memiliki data pembayaran |

---

# 6. Keterangan Primary Key dan Foreign Key

## Primary Key

Primary key adalah kolom utama yang digunakan sebagai identitas unik pada setiap tabel.

Contoh:

| Tabel | Primary Key |
|---|---|
| roles | id |
| users | id |
| branches | id |
| products | id |
| transactions | id |

## Foreign Key

Foreign key adalah kolom yang digunakan untuk menghubungkan satu tabel dengan tabel lain.

Contoh:

| Tabel | Foreign Key | Referensi |
|---|---|---|
| users | role_id | roles.id |
| users | branch_id | branches.id |
| products | category_id | categories.id |
| stocks | product_id | products.id |
| stocks | branch_id | branches.id |
| stocks | storage_location_id | storage_locations.id |
| transactions | user_id | users.id |
| transaction_details | transaction_id | transactions.id |
| payments | transaction_id | transactions.id |
| expenses | user_id | users.id |

---

# 7. Alur Data Sistem

## 7.1 Alur Manajemen Produk dan Stok

1. Admin menambahkan kategori produk.
2. Admin menambahkan data produk.
3. Admin memasukkan data batch produk.
4. Produk ditempatkan pada cabang dan lokasi penyimpanan tertentu.
5. Jumlah stok dicatat pada tabel `stocks`.
6. Setiap perubahan stok dicatat pada tabel `stock_movements`.

## 7.2 Alur Transaksi Penjualan

1. Kasir login ke sistem.
2. Kasir membuka shift.
3. Kasir memilih produk pada halaman kasir.
4. Sistem membuat data transaksi pada tabel `transactions`.
5. Barang yang dibeli disimpan pada tabel `transaction_details`.
6. Sistem mencatat pembayaran pada tabel `payments`.
7. Stok barang berkurang dan dicatat pada tabel `stock_movements`.

## 7.3 Alur Pengeluaran Toko

1. Admin atau kasir mencatat pengeluaran toko.
2. Data pengeluaran disimpan pada tabel `expenses`.
3. Pengeluaran dapat dikelompokkan berdasarkan kategori.
4. Data pengeluaran digunakan dalam laporan keuangan.

## 7.4 Alur Laporan

1. Data transaksi diambil dari tabel `transactions`.
2. Detail penjualan diambil dari tabel `transaction_details`.
3. Data pembayaran diambil dari tabel `payments`.
4. Data pengeluaran diambil dari tabel `expenses`.
5. Sistem menghitung pendapatan, pengeluaran, dan laba.

---

# 8. Kesimpulan

Database Nikky Frozen POS System dirancang untuk mendukung kebutuhan sistem POS dan manajemen stok secara terstruktur. Dengan adanya tabel produk, stok, batch, lokasi penyimpanan, transaksi, pembayaran, shift, dan pengeluaran, sistem dapat mengelola data toko secara lebih rapi dan mudah dikembangkan.

Rancangan database ini juga mendukung fitur utama aplikasi, yaitu:

1. Manajemen user dan role.
2. Manajemen cabang.
3. Manajemen kategori dan produk.
4. Manajemen stok dan lokasi penyimpanan.
5. Monitoring batch dan tanggal kedaluwarsa.
6. Transaksi penjualan.
7. Pembayaran.
8. Shift kasir.
9. Pengeluaran toko.
10. Laporan penjualan dan keuangan.