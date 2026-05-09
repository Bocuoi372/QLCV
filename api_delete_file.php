<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');

ob_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid method']);
    exit;
}

$filePath = $_POST['filePath'] ?? '';

if (empty($filePath)) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Thiếu đường dẫn file']);
    exit;
}

// Bảo mật: Chỉ cho phép xóa file trong thư mục uploads/
if (strpos($filePath, 'uploads/') !== 0) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Không có quyền xóa file này']);
    exit;
}

if (file_exists($filePath)) {
    if (unlink($filePath)) {
        ob_end_clean();
        echo json_encode(['success' => true, 'message' => 'Đã xóa file thành công']);
    } else {
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'Không thể xóa file vật lý trên server']);
    }
} else {
    ob_end_clean();
    echo json_encode(['success' => true, 'message' => 'File không tồn tại trên server, đã dọn dẹp link']);
}
?>
