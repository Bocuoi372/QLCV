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
        $vi_tri = $_POST['vi_tri'] ?? '';
        $cap_do_id = $_POST['cap_do_id'] ?? 3;
        $trang_thai_id = $_POST['trang_thai_id'] ?? 2;

        if (empty($ma_nv) || empty($ten_nv)) {
            echo json_encode(["success" => false, "message" => "Dữ liệu không hợp lệ!"]);
            exit;
        }

        // Bắt đầu transaction để đảm bảo dữ liệu toàn vẹn
        $conn->beginTransaction();

        // 1. Cập nhật thông tin nhân viên
        $stmt_nv = $conn->prepare("UPDATE nhan_vien SET ten_nv = :ten_nv, vi_tri_cong_viec = :vi_tri WHERE ma_nv = :ma_nv");
        $stmt_nv->execute([
            ':ten_nv' => $ten_nv,
            ':vi_tri' => $vi_tri,
            ':ma_nv' => $ma_nv
        ]);

        // 2. Cập nhật trạng thái và cấp độ công việc
        // Lưu ý: Update tất cả các công việc của nhân viên này do giao diện chưa phân tách chi tiết Mã CV
        $stmt_cv = $conn->prepare("UPDATE cong_viec_dinh_ky SET cap_do_id = :cap_do_id, trang_thai_id = :trang_thai_id WHERE nguoi_phu_trach = :ma_nv");
        $stmt_cv->execute([
            ':cap_do_id' => $cap_do_id,
            ':trang_thai_id' => $trang_thai_id,
            ':ma_nv' => $ma_nv
        ]);

        // Hoàn tất transaction
        $conn->commit();

        echo json_encode(["success" => true, "message" => "Đã cập nhật cơ sở dữ liệu thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }

} catch(PDOException $e) {
    // Nếu có lỗi thì hoàn tác
    if(isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
