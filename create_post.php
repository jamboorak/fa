<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['title'], $input['body'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Title and body are required.']);
    exit;
}

$title = trim($input['title']);
$body = trim($input['body']);
$imageUrl = isset($input['imageUrl']) ? trim($input['imageUrl']) : null;

if ($title === '' || $body === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Title and body must not be empty.']);
    exit;
}

require_once __DIR__ . '/db.php';

$stmt = $conn->prepare('INSERT INTO posts (title, body, image_url) VALUES (?, ?, ?)');
$stmt->bind_param('sss', $title, $body, $imageUrl);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create post: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

$newId = $stmt->insert_id;
$stmt->close();

$selectStmt = $conn->prepare('SELECT * FROM posts WHERE id = ? LIMIT 1');
$selectStmt->bind_param('i', $newId);
$selectStmt->execute();
$result = $selectStmt->get_result();
$post = $result->fetch_assoc();

$selectStmt->close();
$conn->close();

echo json_encode(['success' => true, 'post' => $post]);

