<?php
header('Content-Type: application/json; charset=utf-8');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "quanly_congviec_dinhky";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $ma_nv = $_POST['ma_nv'] ?? '';
        $ten_nv = $_POST['ten_nv'] ?? '';
        $mat_khau = $_POST['mat_khau'] ?? '';

        if (empty($ma_nv) || empty($ten_nv) || empty($mat_khau)) {
            echo json_encode(["success" => false, "message" => "Vui lòng nhập đầy đủ thông tin!"]);
            exit;
        }

        // Kiểm tra xem mã nhân viên đã tồn tại chưa
        $stmt_check = $conn->prepare("SELECT COUNT(*) FROM nhan_vien WHERE ma_nv = :ma_nv");
        $stmt_check->execute([':ma_nv' => $ma_nv]);
        if ($stmt_check->fetchColumn() > 0) {
            echo json_encode(["success" => false, "message" => "Mã nhân viên (tài khoản) này đã tồn tại! Vui lòng chọn mã khác."]);
            exit;
        }

        // Thêm nhân viên mới
        $stmt = $conn->prepare("INSERT INTO nhan_vien (ma_nv, ten_nv, vi_tri_cong_viec, mat_khau) VALUES (:ma_nv, :ten_nv, 'Nhân viên', :mat_khau)");
        $stmt->execute([
            ':ma_nv' => $ma_nv,
            ':ten_nv' => $ten_nv,
            ':mat_khau' => $mat_khau
        ]);

        echo json_encode(["success" => true, "message" => "Thêm tài khoản thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }

} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
