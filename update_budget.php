<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id'], $input['allocated'], $input['spent'], $input['status'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit;
}

$id = (int) $input['id'];
$allocated = (float) $input['allocated'];
$spent = (float) $input['spent'];
$status = trim($input['status']);

if ($allocated < $spent) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Allocated must be greater than spent.']);
    exit;
}

require_once __DIR__ . '/db.php';

$stmt = $conn->prepare('UPDATE budget_allocations SET allocated = ?, spent = ?, status = ? WHERE id = ?');
$stmt->bind_param('ddsi', $allocated, $spent, $status, $id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Update failed: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();

$selectStmt = $conn->prepare('SELECT id, category, allocated, spent, status FROM budget_allocations WHERE id = ? LIMIT 1');
$selectStmt->bind_param('i', $id);
$selectStmt->execute();
$result = $selectStmt->get_result();
$updatedItem = $result->fetch_assoc();
$selectStmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'updatedItem' => $updatedItem,
]);

