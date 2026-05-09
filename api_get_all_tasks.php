<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'db_config.php';

session_start();
try {
    $quyenHan = $_SESSION['quyen_han'] ?? 3;
    $phongBan = $_SESSION['phong_ban'] ?? '';

    $whereClause = "";
    if ($quyenHan == 2) {
        $whereClause = " WHERE nv.phong_ban = " . $conn->quote($phongBan);
    }

    $stmt = $conn->prepare("
        SELECT 
            cv.*,
            nv.ten_nv as ten_nguoi_phu_trach,
            nv.phong_ban,
            tt.ten_trang_thai as trang_thai_text,
            cd.ten_cap_do
        FROM cong_viec_dinh_ky cv
        LEFT JOIN nhan_vien nv ON cv.nguoi_phu_trach = nv.ma_nv
        LEFT JOIN trang_thai tt ON cv.trang_thai_id = tt.id
        LEFT JOIN cap_do cd ON cv.cap_do_id = cd.id
        $whereClause
        ORDER BY cv.ma_cv ASC
    ");
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["success" => true, "data" => $results]);
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi: " . $e->getMessage()]);
}
?>
