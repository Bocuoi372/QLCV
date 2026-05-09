<?php
header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';

try {

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $ma_nv = $_POST['ma_nv'] ?? '';
        $ten_nv = $_POST['ten_nv'] ?? '';
        $mat_khau = $_POST['mat_khau'] ?? '';
        $phong_ban = $_POST['phong_ban'] ?? '';
        $quyen_han = $_POST['quyen_han'] ?? 3;

        if (empty($ma_nv) || empty($ten_nv) || empty($mat_khau)) {
            echo json_encode(["success" => false, "message" => "Vui lòng nhập đầy đủ thông tin!"]);
            exit;
        }

        $stmt = $conn->prepare("UPDATE nhan_vien SET ten_nv = :ten_nv, phong_ban = :phong_ban, mat_khau = :mat_khau, quyen_han = :quyen_han WHERE ma_nv = :ma_nv");
        $stmt->execute([
            ':ten_nv' => $ten_nv,
            ':phong_ban' => $phong_ban,
            ':mat_khau' => $mat_khau,
            ':quyen_han' => $quyen_han,
            ':ma_nv' => $ma_nv
        ]);

        echo json_encode(["success" => true, "message" => "Cập nhật tài khoản thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }

} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
