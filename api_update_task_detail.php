<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';

try {

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
        $id = $_POST['id'] ?? null;
        $is_duplicate = ($_POST['is_duplicate'] ?? 0) == 1;

        if ($is_duplicate || empty($id)) {
            // New record: Either a duplicate or a brand new task
            $stmt = $conn->prepare("
                INSERT INTO cong_viec_dinh_ky (
                    ma_cv, ten_cv, mo_ta_cv, nguoi_phu_trach, cap_do_id, 
                    trang_thai_id, loai_cv, ngay_bat_dau, ngay_hoan_thanh, ghi_chu, tien_do
                ) VALUES (
                    :ma_cv, :ten_cv, :mo_ta_cv, :nguoi_phu_trach, :cap_do_id, 
                    :trang_thai_id, :loai_cv, :ngay_bat_dau, :ngay_hoan_thanh, :ghi_chu, :tien_do
                )
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
                ':tien_do' => $tien_do
            ]);
            $msg = $is_duplicate ? "Đã tạo bản sao công việc cho tháng mới!" : "Đã thêm công việc mới thành công!";
            echo json_encode(["success" => true, "message" => $msg]);
        } else {
            // Update by ID
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
                WHERE id = :id
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
                ':id' => $id
            ]);
            echo json_encode(["success" => true, "message" => "Cập nhật công việc thành công!"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
