<?php
header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';

try {

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $ma_nv = $_POST['ma_nv'] ?? '';

        if (empty($ma_nv)) {
            echo json_encode(["success" => false, "message" => "Vui lòng cung cấp mã nhân viên!"]);
            exit;
        }

        if (strtolower($ma_nv) === 'admin') {
            echo json_encode(["success" => false, "message" => "Không thể xóa tài khoản Quản trị viên gốc!"]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM nhan_vien WHERE ma_nv = :ma_nv");
        $stmt->execute([':ma_nv' => $ma_nv]);

        echo json_encode(["success" => true, "message" => "Xóa tài khoản thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }

} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
