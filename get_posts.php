<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

$sql = 'SELECT id, title, body, image_url, created_at FROM posts ORDER BY created_at DESC';
$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load posts: ' . $conn->error]);
    $conn->close();
    exit;
}

$posts = [];
while ($row = $result->fetch_assoc()) {
    $posts[] = $row;
}

echo json_encode($posts);
$conn->close();

