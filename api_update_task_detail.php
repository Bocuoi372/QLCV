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
        $ma_cv = $_POST['ma_cv'] ?? '';
        $ten_cv = $_POST['ten_cv'] ?? '';
        $mo_ta_cv = $_POST['mo_ta_cv'] ?? '';
        $loai_cv = $_POST['loai_cv'] ?? 'Định kỳ';
        $cap_do_id = $_POST['cap_do_id'] ?? 3;
        $trang_thai_id = $_POST['trang_thai_id'] ?? 2;
        $ngay_bat_dau = !empty($_POST['ngay_bat_dau']) ? $_POST['ngay_bat_dau'] : null;
        $ngay_hoan_thanh = !empty($_POST['ngay_hoan_thanh']) ? $_POST['ngay_hoan_thanh'] : null;
        $ghi_chu = $_POST['ghi_chu'] ?? '';
        $tien_do = $_POST['tien_do'] ?? 0;
        $old_ma_cv = $_POST['old_ma_cv'] ?? $ma_cv;

        if (empty($ma_cv) || empty($ten_cv)) {
            echo json_encode(["success" => false, "message" => "Thiếu thông tin Mã công việc hoặc Tên công việc!"]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE cong_viec_dinh_ky SET 
                ma_cv = :ma_cv,
                ten_cv = :ten_cv, 
                mo_ta_cv = :mo_ta_cv, 
                nguoi_phu_trach = :nguoi_phu_trach, 
                cap_do_id = :cap_do_id, 
                trang_thai_id = :trang_thai_id, 
                loai_cv = :loai_cv, 
                ngay_bat_dau = :ngay_bat_dau, 
                ngay_hoan_thanh = :ngay_hoan_thanh, 
                ghi_chu = :ghi_chu,
                tien_do = :tien_do
            WHERE ma_cv = :old_ma_cv
        ");

        $stmt->execute([
            ':ma_cv' => $ma_cv,
            ':ten_cv' => $ten_cv,
            ':mo_ta_cv' => $mo_ta_cv,
            ':nguoi_phu_trach' => $ma_nv,
            ':cap_do_id' => $cap_do_id,
            ':trang_thai_id' => $trang_thai_id,
            ':loai_cv' => $loai_cv,
            ':ngay_bat_dau' => $ngay_bat_dau,
            ':ngay_hoan_thanh' => $ngay_hoan_thanh,
            ':ghi_chu' => $ghi_chu,
            ':tien_do' => $tien_do,
            ':old_ma_cv' => $old_ma_cv
        ]);

        echo json_encode(["success" => true, "message" => "Cập nhật công việc thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }

} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
