<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');

ob_start(); // Buffer any accidental output

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid method']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Không có file hoặc lỗi tải lên (Mã lỗi: ' . ($_FILES['file']['error'] ?? 'Unknown') . ')']);
    exit;
}

$uploadDir = 'uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$fileInfo = pathinfo($_FILES['file']['name']);
$extension = strtolower($fileInfo['extension']);
$allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip', 'rar'];

if (!in_array($extension, $allowedExts)) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Định dạng file không được hỗ trợ']);
    exit;
}

$newFileName = time() . '_' . uniqid() . '.' . $extension;
$destination = $uploadDir . $newFileName;

if (move_uploaded_file($_FILES['file']['tmp_name'], $destination)) {
    ob_end_clean();
    echo json_encode(['success' => true, 'filePath' => $destination, 'fileName' => $_FILES['file']['name']]);
} else {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Lỗi lưu file vào máy chủ (Kiểm tra quyền ghi thư mục)']);
}
?>
