<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'db_config.php';

try {
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $ma_cv = $_POST['ma_cv'] ?? '';
        
        if (empty($ma_cv)) {
            echo json_encode(["success" => false, "message" => "Mã công việc không hợp lệ!"]);
            exit;
        }

        // Kiểm tra quyền (Chỉ Admin và Manager mới được duyệt)
        $quyen_han = $_SESSION['quyen_han'] ?? 3;
        if ($quyen_han != 1 && $quyen_han != 2) {
            echo json_encode(["success" => false, "message" => "Bạn không có quyền thực hiện thao tác này!"]);
            exit;
        }

        // Cập nhật trạng thái thành Đã hoàn thành (1)
        $stmt = $conn->prepare("UPDATE cong_viec_dinh_ky SET trang_thai_id = 1, tien_do = 100 WHERE ma_cv = :ma_cv");
        $stmt->execute([':ma_cv' => $ma_cv]);

        echo json_encode(["success" => true, "message" => "Đã phê duyệt công việc thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
