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

        // 1. Lưu hoặc Cập nhật Nhân Viên
        // Dùng ON DUPLICATE KEY UPDATE để nếu mã NV đã tồn tại thì chỉ cập nhật Tên và Vị trí
        $stmt_nv = $conn->prepare("
            INSERT INTO nhan_vien (ma_nv, ten_nv, vi_tri_cong_viec) 
            VALUES (:ma_nv, :ten_nv, :vi_tri)
            ON DUPLICATE KEY UPDATE ten_nv = :ten_nv_update, vi_tri_cong_viec = :vi_tri_update
        ");
        $stmt_nv->execute([
            ':ma_nv' => $ma_nv,
            ':ten_nv' => $ten_nv,
            ':vi_tri' => $vi_tri,
            ':ten_nv_update' => $ten_nv,
            ':vi_tri_update' => $vi_tri
        ]);

        // 2. Thêm Công việc mới cho nhân viên này
        // Tạo Mã công việc tự động (VD: CV_1678901234)
        $ma_cv = 'CV_' . time();
        $ten_cv = "Công việc cho " . $ten_nv;

        $stmt_cv = $conn->prepare("
            INSERT INTO cong_viec_dinh_ky (ma_cv, ten_cv, nguoi_phu_trach, cap_do_id, trang_thai_id) 
            VALUES (:ma_cv, :ten_cv, :nguoi_phu_trach, :cap_do_id, :trang_thai_id)
        ");
        $stmt_cv->execute([
            ':ma_cv' => $ma_cv,
            ':ten_cv' => $ten_cv,
            ':nguoi_phu_trach' => $ma_nv,
            ':cap_do_id' => $cap_do_id,
            ':trang_thai_id' => $trang_thai_id
        ]);

        // Hoàn tất transaction
        $conn->commit();

        echo json_encode(["success" => true, "message" => "Đã lưu vào cơ sở dữ liệu thành công!"]);
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
