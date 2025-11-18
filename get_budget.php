<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

$sql = 'SELECT id, category, allocated, spent, status FROM budget_allocations ORDER BY id ASC';
$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'id' => (int) $row['id'],
        'category' => $row['category'],
        'allocated' => (float) $row['allocated'],
        'spent' => (float) $row['spent'],
        'status' => $row['status'],
    ];
}

echo json_encode($data);
$conn->close();

