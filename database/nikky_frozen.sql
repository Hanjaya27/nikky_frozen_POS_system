CREATE DATABASE IF NOT EXISTS nikky_frozen;
USE nikky_frozen;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS transaction_details;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS stocks;
DROP TABLE IF EXISTS product_batches;
DROP TABLE IF EXISTS storage_locations;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE branches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    address TEXT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL
);

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NULL,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL
);

CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE storage_locations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(20) NOT NULL,
    location_name VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    capacity INT NOT NULL DEFAULT 0,
    status VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE product_batches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    batch_code VARCHAR(100) NOT NULL,
    expired_date DATE NOT NULL,
    initial_qty INT NOT NULL DEFAULT 0,
    remaining_qty INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE stocks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NOT NULL,
    storage_location_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES product_batches(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (storage_location_id) REFERENCES storage_locations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE stock_movements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stock_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NOT NULL,
    movement_type ENUM('in', 'out', 'adjustment', 'expired') NOT NULL,
    quantity INT NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES product_batches(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE shifts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    opening_cash DECIMAL(12,2) NOT NULL DEFAULT 0,
    closing_cash DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('open', 'closed') DEFAULT 'open',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NOT NULL,
    shift_id BIGINT UNSIGNED NULL,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    transaction_date DATETIME NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    transaction_status ENUM('completed', 'cancelled') DEFAULT 'completed',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE transaction_details (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT UNSIGNED NOT NULL,
    payment_method ENUM('cash', 'qris', 'debit', 'transfer', 'e-wallet') NOT NULL,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    change_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_status ENUM('paid', 'pending', 'failed') DEFAULT 'paid',
    created_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE expenses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method ENUM('cash', 'qris', 'debit', 'transfer', 'e-wallet') NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

INSERT INTO roles (id, role_name) VALUES
(1, 'owner'),
(2, 'admin'),
(3, 'kasir');

INSERT INTO branches (id, branch_name, address, status, created_at, updated_at) VALUES
(1, 'Cabang Utama', 'Klaten', 'active', NOW(), NOW()),
(2, 'Cabang 2', 'Klaten', 'active', NOW(), NOW());

INSERT INTO users (id, role_id, branch_id, name, username, password, status, created_at, updated_at) VALUES
(1, 1, 1, 'Owner Nikky Frozen', 'owner', '$2y$10$examplepasswordhash', 'active', NOW(), NOW()),
(2, 2, 1, 'Admin Nikky Frozen', 'admin', '$2y$10$examplepasswordhash', 'active', NOW(), NOW()),
(3, 3, 1, 'Ahmad Baihaqi', 'kasir', '$2y$10$examplepasswordhash', 'active', NOW(), NOW());

INSERT INTO categories (id, category_name, description, created_at, updated_at) VALUES
(1, 'Frozen Food', 'Produk makanan beku', NOW(), NOW()),
(2, 'Snack', 'Produk camilan', NOW(), NOW()),
(3, 'Dessert', 'Produk makanan penutup', NOW(), NOW());

INSERT INTO products (id, category_id, product_name, sku, price, minimum_stock, status, created_at, updated_at) VALUES
(1, 1, 'Chicken Nugget', 'NF-001', 28000, 10, 'active', NOW(), NOW()),
(2, 1, 'Sosis Ayam', 'NF-002', 25000, 10, 'active', NOW(), NOW()),
(3, 1, 'Bakso Sapi', 'NF-003', 32000, 10, 'active', NOW(), NOW()),
(4, 2, 'Kentang Frozen', 'NF-004', 22000, 8, 'active', NOW(), NOW()),
(5, 1, 'Dimsum Ayam', 'NF-005', 30000, 10, 'active', NOW(), NOW());

INSERT INTO storage_locations (id, branch_id, code, location_name, type, capacity, status, created_at, updated_at) VALUES
(1, 1, 'A1', 'Freezer A1', 'Frozen Food', 60, 'Penuh / Prioritas Cek', NOW(), NOW()),
(2, 1, 'A2', 'Freezer A2', 'Frozen Food', 50, 'Aman', NOW(), NOW()),
(3, 1, 'A3', 'Freezer A3', 'Frozen Food', 45, 'Aman', NOW(), NOW()),
(4, 1, 'A4', 'Freezer A4', 'Frozen Food', 50, 'Penuh / Prioritas Cek', NOW(), NOW()),
(5, 2, 'B1', 'Freezer B1', 'Frozen Food', 55, 'Tidak Aktif', NOW(), NOW()),
(6, 2, 'B2', 'Freezer B2', 'Snack', 40, 'Penuh / Prioritas Cek', NOW(), NOW()),
(7, 2, 'B3', 'Freezer B3', 'Frozen Food', 45, 'Aman', NOW(), NOW()),
(8, 2, 'B4', 'Freezer B4', 'Dessert', 35, 'Kosong / Tersedia', NOW(), NOW()),
(9, 1, 'C1', 'Rak Pendingin C1', 'Dessert', 35, 'Aman', NOW(), NOW()),
(10, 1, 'C2', 'Rak Pendingin C2', 'Dessert', 35, 'Kosong / Tersedia', NOW(), NOW()),
(11, 1, 'C3', 'Rak Pendingin C3', 'Snack', 40, 'Perlu Dicek', NOW(), NOW()),
(12, 1, 'C4', 'Rak Pendingin C4', 'Frozen Food', 45, 'Penuh / Prioritas Cek', NOW(), NOW()),
(13, 2, 'D1', 'Freezer D1', 'Dessert', 35, 'Kosong / Tersedia', NOW(), NOW()),
(14, 2, 'D2', 'Freezer D2', 'Frozen Food', 50, 'Penuh / Prioritas Cek', NOW(), NOW()),
(15, 2, 'D3', 'Freezer D3', 'Frozen Food', 50, 'Aman', NOW(), NOW()),
(16, 2, 'D4', 'Freezer D4', 'Frozen Food', 50, 'Aman', NOW(), NOW()),
(17, 1, 'E1', 'Rak E1', 'Snack', 40, 'Aman', NOW(), NOW()),
(18, 1, 'E2', 'Rak E2', 'Snack', 40, 'Aman', NOW(), NOW()),
(19, 1, 'E3', 'Rak E3', 'Frozen Food', 50, 'Penuh / Prioritas Cek', NOW(), NOW()),
(20, 1, 'E4', 'Rak E4', 'Snack', 40, 'Perlu Dicek', NOW(), NOW());

INSERT INTO product_batches (id, product_id, batch_code, expired_date, initial_qty, remaining_qty, created_at, updated_at) VALUES
(1, 1, 'BT-NF001-001', '2026-08-12', 35, 35, NOW(), NOW()),
(2, 2, 'BT-NF002-001', '2026-07-20', 8, 8, NOW(), NOW()),
(3, 3, 'BT-NF003-001', '2026-09-05', 20, 20, NOW(), NOW()),
(4, 4, 'BT-NF004-001', '2026-06-30', 5, 5, NOW(), NOW()),
(5, 5, 'BT-NF005-001', '2026-10-15', 25, 25, NOW(), NOW());

INSERT INTO stocks (id, branch_id, product_id, batch_id, storage_location_id, quantity, updated_at) VALUES
(1, 1, 1, 1, 1, 35, NOW()),
(2, 1, 2, 2, 2, 8, NOW()),
(3, 2, 3, 3, 5, 20, NOW()),
(4, 2, 4, 4, 6, 5, NOW()),
(5, 1, 5, 5, 3, 25, NOW());

INSERT INTO shifts (id, user_id, branch_id, start_time, end_time, opening_cash, closing_cash, status, created_at, updated_at) VALUES
(1, 3, 1, '2026-05-21 08:00:00', NULL, 500000, 0, 'open', NOW(), NOW());

INSERT INTO expenses (branch_id, user_id, category, description, amount, payment_method, expense_date, created_at, updated_at) VALUES
(1, 2, 'Operasional', 'Pembelian plastik kemasan', 150000, 'cash', '2026-05-21', NOW(), NOW()),
(1, 2, 'Listrik', 'Pembayaran listrik toko', 350000, 'transfer', '2026-05-21', NOW(), NOW());