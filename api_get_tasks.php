<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';
try {
    $quyenHan = $_SESSION['quyen_han'] ?? 3;
    $phongBan = $_SESSION['phong_ban'] ?? '';

    $whereClause = "";
    if ($quyenHan == 2) {
        $whereClause = " WHERE nv.phong_ban = " . $conn->quote($phongBan);
    }

    // Lấy danh sách công việc và thông tin nhân viên phụ trách
    $stmt = $conn->prepare("
        SELECT 
            cv.ma_cv,
            nv.ma_nv, 
            nv.ten_nv, 
            nv.vi_tri_cong_viec as vi_tri, 
            nv.quyen_han,
            nv.phong_ban,
            cd.ten_cap_do as cap_do_text,
            cd.id as cap_do_id,
            tt.ten_trang_thai as trang_thai_text,
            tt.id as trang_thai_id,
            cv.ngay_hoan_thanh,
            cv.ten_cv,
            cv.mo_ta_cv,
            cv.tien_do
        FROM cong_viec_dinh_ky cv
        JOIN nhan_vien nv ON cv.nguoi_phu_trach = nv.ma_nv
        LEFT JOIN cap_do cd ON cv.cap_do_id = cd.id
        LEFT JOIN trang_thai tt ON cv.trang_thai_id = tt.id
        $whereClause
        ORDER BY cv.ma_cv ASC
    ");
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["success" => true, "data" => $results]);
    
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
