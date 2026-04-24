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
        $quyen_han = $_POST['quyen_han'] ?? 3; // Mặc định là Staff
        $cap_do_id = $_POST['cap_do_id'] ?? 3;
        $trang_thai_id = $_POST['trang_thai_id'] ?? 2;
        $ngay_hoan_thanh = !empty($_POST['ngay_hoan_thanh']) ? $_POST['ngay_hoan_thanh'] : null;

        if (empty($ma_nv) || empty($ten_nv)) {
            echo json_encode(["success" => false, "message" => "Dữ liệu không hợp lệ!"]);
            exit;
        }

        // Bắt đầu transaction để đảm bảo dữ liệu toàn vẹn
        $conn->beginTransaction();

        // 1. Lưu hoặc Cập nhật Nhân Viên
        $stmt_nv = $conn->prepare("
            INSERT INTO nhan_vien (ma_nv, ten_nv, vi_tri_cong_viec, quyen_han) 
            VALUES (:ma_nv, :ten_nv, :vi_tri, :quyen_han)
            ON DUPLICATE KEY UPDATE ten_nv = :ten_nv_update, vi_tri_cong_viec = :vi_tri_update, quyen_han = :quyen_han_update
        ");
        $stmt_nv->execute([
            ':ma_nv' => $ma_nv,
            ':ten_nv' => $ten_nv,
            ':vi_tri' => $vi_tri,
            ':quyen_han' => $quyen_han,
            ':ten_nv_update' => $ten_nv,
            ':vi_tri_update' => $vi_tri,
            ':quyen_han_update' => $quyen_han
        ]);

        // 2. Thêm Công việc mới cho nhân viên này
        // Tạo Mã công việc tự động (VD: CV_1678901234)
        $ma_cv = 'CV_' . time();
        $ten_cv = "Công việc cho " . $ten_nv;

        $stmt_cv = $conn->prepare("
            INSERT INTO cong_viec_dinh_ky (ma_cv, ten_cv, nguoi_phu_trach, cap_do_id, trang_thai_id, ngay_hoan_thanh) 
            VALUES (:ma_cv, :ten_cv, :nguoi_phu_trach, :cap_do_id, :trang_thai_id, :ngay_hoan_thanh)
        ");
        $stmt_cv->execute([
            ':ma_cv' => $ma_cv,
            ':ten_cv' => $ten_cv,
            ':nguoi_phu_trach' => $ma_nv,
            ':cap_do_id' => $cap_do_id,
            ':trang_thai_id' => $trang_thai_id,
            ':ngay_hoan_thanh' => $ngay_hoan_thanh
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
