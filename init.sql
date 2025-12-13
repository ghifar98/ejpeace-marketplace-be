-- Disable foreign key checks to avoid ordering issues during creation
SET FOREIGN_KEY_CHECKS = 0;

-- Create Database
CREATE DATABASE IF NOT EXISTS peacetifal_db;
USE peacetifal_db;

-- Drop tables if they exist to ensure fresh start
DROP TABLE IF EXISTS `user_voucher_claims`;
DROP TABLE IF EXISTS `purchase_vouchers`;
DROP TABLE IF EXISTS `ticket_vouchers`;
DROP TABLE IF EXISTS `barcodes`;
DROP TABLE IF EXISTS `order_addresses`;
DROP TABLE IF EXISTS `carts`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `purchases`;
DROP TABLE IF EXISTS `vouchers`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;

-- 1. Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(20),
  `address` TEXT,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL
);

-- 2. Products Table
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `size` VARCHAR(50) DEFAULT NULL,
  `quantity` INT DEFAULT 0,
  `image` JSON,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL
);

-- 3. Events Table
CREATE TABLE `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10, 2) DEFAULT 0,
  `image` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL
);

-- 4. Vouchers Table
CREATE TABLE `vouchers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL,
  `discount_value` DECIMAL(10, 2) NOT NULL,
  `max_usage` INT DEFAULT NULL,
  `used_count` INT DEFAULT 0,
  `min_order_value` DECIMAL(10, 2) DEFAULT NULL,
  `valid_from` DATETIME NOT NULL,
  `valid_until` DATETIME NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `voucher_type` ENUM('product', 'event') DEFAULT 'product',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Purchases Table
CREATE TABLE `purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `product_id` INT DEFAULT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'paid', 'cancelled', 'shipped', 'completed') DEFAULT 'pending',
  `payment_id` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
);

-- 6. Carts Table
CREATE TABLE `carts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT DEFAULT 1,
  `purchase_id` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE SET NULL
);

-- 7. Tickets Table
CREATE TABLE `tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `event_id` INT NOT NULL,
  `ticket_type` VARCHAR(50) DEFAULT 'general',
  `price` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'paid', 'cancelled', 'checked_in') DEFAULT 'pending',
  `payment_id` VARCHAR(255) DEFAULT NULL,
  `attendee_name` VARCHAR(255) NOT NULL,
  `attendee_email` VARCHAR(255) NOT NULL,
  `attendee_phone` VARCHAR(20),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
);

-- 8. Barcodes Table
CREATE TABLE `barcodes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT NOT NULL,
  `event_id` INT NOT NULL,
  `barcode_data` VARCHAR(255) NOT NULL,
  `qr_code_image` TEXT,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
);

-- 9. Order Addresses Table
CREATE TABLE `order_addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_id` INT DEFAULT NULL,
  `ticket_id` INT DEFAULT NULL,
  `product_id` INT DEFAULT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `address_line1` VARCHAR(255) NOT NULL,
  `address_line2` VARCHAR(255),
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100),
  `postal_code` VARCHAR(20) NOT NULL,
  `country` VARCHAR(100) DEFAULT 'Indonesia',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE cascade,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
);

-- 10. Voucher Relation Tables
CREATE TABLE `ticket_vouchers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT NOT NULL,
  `voucher_id` INT NOT NULL,
  `discount_amount` DECIMAL(10, 2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE CASCADE
);

CREATE TABLE `purchase_vouchers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_id` INT NOT NULL,
  `voucher_id` INT NOT NULL,
  `discount_amount` DECIMAL(10, 2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE CASCADE
);

CREATE TABLE `user_voucher_claims` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `voucher_id` INT NOT NULL,
  `claimed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `is_used` BOOLEAN DEFAULT FALSE,
  `used_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE CASCADE
);


-- =============================================
-- SEEDERS (Dummy Data)
-- =============================================

-- Seed Users
-- Password 'password123' hashed (approximate bcrypt hash used for example, in real app should be properly hashed)
INSERT INTO `users` (`username`, `email`, `phone`, `address`, `password`, `role`) VALUES
('admin', 'admin@peacetifal.com', '081234567890', 'Admin HQ, Jakarta', '$2b$10$YourHashedPasswordHereForAdmin123', 'admin'),
('johndoe', 'user@example.com', '08987654321', 'Jl. Sudirman No. 1, Jakarta', '$2b$10$YourHashedPasswordHereForUser123', 'user');

-- Seed Products
INSERT INTO `products` (`name`, `description`, `price`, `category`, `size`, `quantity`, `image`) VALUES
('Kaos Peace', 'Kaos berbahan katun nyaman dengan desain Peace.', 150000.00, 'Apparel', 'L', 100, '["uploads/products/tshirt_peace.jpg"]'),
('Topi Snapback', 'Topi keren untuk gaya sehari-hari.', 75000.00, 'Accessories', NULL, 50, '["uploads/products/hat.jpg"]'),
('Totebag Canvas', 'Tas belanja ramah lingkungan.', 50000.00, 'Bags', NULL, 200, '["uploads/products/totebag.jpg"]');

-- Seed Events
INSERT INTO `events` (`title`, `description`, `start_date`, `end_date`, `location`, `price`, `image`) VALUES
('Peacetifal Music Festival 2025', 'Festival musik tahunan terbesar.', '2025-06-01 10:00:00', '2025-06-01 23:00:00', 'GBK Senayan', 500000.00, 'uploads/events/music_fest.jpg'),
('Workshop Art & Peace', 'Belajar seni sambil menyebarkan kedamaian.', '2025-07-15 09:00:00', '2025-07-15 15:00:00', 'Art Center Jakarta', 100000.00, 'uploads/events/workshop.jpg');

-- Seed Vouchers
INSERT INTO `vouchers` (`code`, `discount_type`, `discount_value`, `max_usage`, `min_order_value`, `valid_from`, `valid_until`, `voucher_type`) VALUES
('WELCOME10', 'percentage', 10.00, 100, 50000.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 'product'),
('EARLYBIRD', 'fixed', 50000.00, 50, 300000.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'event');

-- Seed Purchases (Example)
INSERT INTO `purchases` (`user_id`, `product_id`, `total_amount`, `status`) VALUES
(2, 1, 150000.00, 'paid');

-- Seed Carts (Example)
INSERT INTO `carts` (`user_id`, `product_id`, `quantity`) VALUES
(2, 2, 1);

-- Seed Tickets (Example)
INSERT INTO `tickets` (`user_id`, `event_id`, `ticket_type`, `price`, `status`, `attendee_name`, `attendee_email`, `attendee_phone`) VALUES
(2, 1, 'VIP', 750000.00, 'paid', 'John Doe', 'user@example.com', '08987654321');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
