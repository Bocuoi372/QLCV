<?php
header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';

try {

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $ma_nv = $_POST['ma_nv'] ?? '';
        $ten_nv = $_POST['ten_nv'] ?? '';
        $mat_khau = $_POST['mat_khau'] ?? '';
        $quyen_han = $_POST['quyen_han'] ?? 3;

        $phong_ban = $_POST['phong_ban'] ?? 'Kỹ thuật';

        if (empty($ma_nv) || empty($ten_nv)) {
            echo json_encode(["success" => false, "message" => "Vui lòng nhập đầy đủ mã và tên!"]);
            exit;
        }

        if (empty($mat_khau)) {
            $mat_khau = '123456';
        }

        // Kiểm tra xem mã nhân viên đã tồn tại chưa
        $stmt_check = $conn->prepare("SELECT COUNT(*) FROM nhan_vien WHERE ma_nv = :ma_nv");
        $stmt_check->execute([':ma_nv' => $ma_nv]);
        if ($stmt_check->fetchColumn() > 0) {
            echo json_encode(["success" => false, "message" => "Mã nhân viên (tài khoản) này đã tồn tại! Vui lòng chọn mã khác."]);
            exit;
        }

        // Thêm nhân viên mới
        $stmt = $conn->prepare("INSERT INTO nhan_vien (ma_nv, ten_nv, phong_ban, vi_tri_cong_viec, mat_khau, quyen_han) VALUES (:ma_nv, :ten_nv, :phong_ban, 'Nhân viên', :mat_khau, :quyen_han)");
        $stmt->execute([
            ':ma_nv' => $ma_nv,
            ':ten_nv' => $ten_nv,
            ':phong_ban' => $phong_ban,
            ':mat_khau' => $mat_khau,
            ':quyen_han' => $quyen_han
        ]);

        echo json_encode(["success" => true, "message" => "Thêm tài khoản thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }

} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
