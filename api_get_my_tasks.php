<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';
error_reporting(0);
ini_set('display_errors', 0);

try {

    // Kiểm tra xem đã đăng nhập chưa
    if (!isset($_SESSION['ma_nv']) || empty($_SESSION['ma_nv'])) {
        echo json_encode([
            "success" => false, 
            "unauthorized" => true,
            "message" => "Chưa đăng nhập! Vui lòng đăng nhập lại."
        ]);
        exit;
    }

    $ma_nv = $_SESSION['ma_nv'];
    $ten_nv = $_SESSION['ten_nv'] ?? 'Nhân viên';

    // Lấy danh sách công việc riêng của nhân viên này
    $stmt = $conn->prepare("
        SELECT 
            cv.id,
            cv.ma_cv,
            cv.ten_cv,
            cv.mo_ta_cv,
            cv.loai_cv,
            cv.ngay_bat_dau,
            cv.ngay_hoan_thanh,
            cv.ghi_chu,
            cv.tien_do,
            cv.cap_do_id,
            cv.trang_thai_id,
            cd.ten_cap_do as cap_do_text,
            tt.ten_trang_thai as trang_thai_text
        FROM cong_viec_dinh_ky cv
        LEFT JOIN cap_do cd ON cv.cap_do_id = cd.id
        LEFT JOIN trang_thai tt ON cv.trang_thai_id = tt.id
        WHERE cv.nguoi_phu_trach = :ma_nv
        ORDER BY cv.ma_cv ASC
    ");
    $stmt->execute([':ma_nv' => $ma_nv]);
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "success" => true, 
        "data" => $results,
        "userInfo" => [
            "ma_nv" => $ma_nv,
            "ten_nv" => $ten_nv
        ]
    ]);
    
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
