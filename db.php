<?php
$dbHost = 'localhost';
$dbUser = 'root';
$dbPass = '';
$dbName = 'brgy_budget';

function abortWithDatabaseError($message)
{
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    http_response_code(500);
    echo json_encode(['error' => $message]);
    exit;
}

$serverConn = new mysqli($dbHost, $dbUser, $dbPass);
if ($serverConn->connect_error) {
    abortWithDatabaseError('Database server connection failed: ' . $serverConn->connect_error);
}

$createDbSql = sprintf(
    'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    $serverConn->real_escape_string($dbName)
);
if (!$serverConn->query($createDbSql)) {
    abortWithDatabaseError('Failed creating database: ' . $serverConn->error);
}
$serverConn->close();

$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($conn->connect_error) {
    abortWithDatabaseError('Database connection failed: ' . $conn->connect_error);
}

$conn->set_charset('utf8mb4');

$schemaStatements = [
    "CREATE TABLE IF NOT EXISTS budget_allocations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(255) NOT NULL,
        allocated DECIMAL(15,2) NOT NULL DEFAULT 0,
        spent DECIMAL(15,2) NOT NULL DEFAULT 0,
        status ENUM('Initial', 'Ongoing', 'Pending', 'Completed') NOT NULL DEFAULT 'Initial',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )"
];

foreach ($schemaStatements as $sql) {
    if (!$conn->query($sql)) {
        abortWithDatabaseError('Failed applying schema: ' . $conn->error);
    }
}

$defaultAdminHash = '$2y$10$o8nV/uV1S9BNS.eZ39HDp.mpe8me/qgQ8t/VcaZZGC0PPSXI9U5Ie'; // admin012
$adminStmt = $conn->prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)');
$defaultAdminUser = 'admin';
$adminStmt->bind_param('ss', $defaultAdminUser, $defaultAdminHash);
if (!$adminStmt->execute()) {
    abortWithDatabaseError('Failed ensuring admin account: ' . $adminStmt->error);
}
$adminStmt->close();

$seedBudgetCheck = $conn->query('SELECT COUNT(*) AS total FROM budget_allocations');
if ($seedBudgetCheck && (int) $seedBudgetCheck->fetch_assoc()['total'] === 0) {
    $budgetSeedData = [
        ['Personnel Services (Salaries)', 3200000, 2800000, 'Ongoing'],
        ['Maintenance and Operating Expenses (MOOE)', 4500000, 2100000, 'Ongoing'],
        ['20% Development Fund (Infrastructure)', 2000000, 1500000, 'Completed'],
        ['Calamity Fund (5%)', 600000, 0, 'Initial'],
        ['SK Fund (Youth Programs)', 800000, 300000, 'Pending'],
        ['Gender and Development (GAD)', 900000, 450000, 'Ongoing'],
    ];
    $budgetStmt = $conn->prepare('INSERT INTO budget_allocations (category, allocated, spent, status) VALUES (?, ?, ?, ?)');
    foreach ($budgetSeedData as [$category, $allocated, $spent, $status]) {
        $budgetStmt->bind_param('sdds', $category, $allocated, $spent, $status);
        $budgetStmt->execute();
    }
    $budgetStmt->close();
}

$seedPostCheck = $conn->query('SELECT COUNT(*) AS total FROM posts');
if ($seedPostCheck && (int) $seedPostCheck->fetch_assoc()['total'] === 0) {
    $postSeedData = [
        ['Road Rehabilitation Update', 'Nightly works continue along the main thoroughfare to minimize daytime congestion. Expect partial lane closures until completion in Q2.', null],
        ['Health Center Expansion', 'The barangay health center is adding two consultation rooms and a dedicated vaccination bay. Construction kicks off next week.', null],
    ];
    $postStmt = $conn->prepare('INSERT INTO posts (title, body, image_url) VALUES (?, ?, ?)');
    foreach ($postSeedData as [$title, $body, $imageUrl]) {
        $postStmt->bind_param('sss', $title, $body, $imageUrl);
        $postStmt->execute();
    }
    $postStmt->close();
}
