<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'db_config.php';

try {
    $id_cv_cha = $_GET['id_cv_cha'] ?? '';
    $ma_cv_cha = $_GET['ma_cv_cha'] ?? '';

    if (!$id_cv_cha && !$ma_cv_cha) {
        echo json_encode(["success" => false, "message" => "Thiếu mã định danh công việc cha!"]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT cvc.*, nv.ten_nv as ten_nguoi_thuc_hien, tt.ten_trang_thai, cd.ten_cap_do
        FROM cong_viec_con cvc
        LEFT JOIN nhan_vien nv ON cvc.ma_nv_thuc_hien = nv.ma_nv
        LEFT JOIN trang_thai tt ON cvc.trang_thai_id = tt.id
        LEFT JOIN cap_do cd ON cvc.cap_do_id = cd.id
        WHERE (cvc.id_cv_cha = :id_cv_cha AND :id_cv_cha > 0)
           OR (LOWER(TRIM(cvc.ma_cv_cha)) = LOWER(TRIM(:ma_cv_cha)) AND :ma_cv_cha != '')
        ORDER BY cvc.id ASC
    ");
    $stmt->execute([':id_cv_cha' => $id_cv_cha, ':ma_cv_cha' => $ma_cv_cha]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "data" => $data]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi: " . $e->getMessage()]);
}
?>
