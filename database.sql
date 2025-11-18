CREATE DATABASE IF NOT EXISTS brgy_budget CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE brgy_budget;

CREATE TABLE IF NOT EXISTS budget_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    allocated DECIMAL(15,2) NOT NULL DEFAULT 0,
    spent DECIMAL(15,2) NOT NULL DEFAULT 0,
    status ENUM('Initial', 'Ongoing', 'Pending', 'Completed') NOT NULL DEFAULT 'Initial',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO budget_allocations (category, allocated, spent, status) VALUES
('Personnel Services (Salaries)', 3200000, 2800000, 'Ongoing'),
('Maintenance and Operating Expenses (MOOE)', 4500000, 2100000, 'Ongoing'),
('20% Development Fund (Infrastructure)', 2000000, 1500000, 'Completed'),
('Calamity Fund (5%)', 600000, 0, 'Initial'),
('SK Fund (Youth Programs)', 800000, 300000, 'Pending'),
('Gender and Development (GAD)', 900000, 450000, 'Ongoing');

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admins (username, password_hash) VALUES
('admin', '$2y$10$o8nV/uV1S9BNS.eZ39HDp.mpe8me/qgQ8t/VcaZZGC0PPSXI9U5Ie')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO posts (title, body) VALUES
('Road Rehabilitation Update', 'Ongoing works along the main thoroughfare will continue nightly to minimize daytime disruptions. Expect completion by Q2.'),
('Health Center Expansion', 'The barangay health center is adding two additional consultation rooms and a dedicated vaccination area. Construction starts next week.');

