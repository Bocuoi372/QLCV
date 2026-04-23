<?php
header('Content-Type: application/json; charset=utf-8');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "quanly_congviec_dinhky";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Lấy toàn bộ danh sách công việc (có thể lọc loai_cv = 'Định kỳ' nếu muốn)
    $stmt = $conn->prepare("
        SELECT 
            cv.ma_cv,
            cv.ten_cv,
            cv.mo_ta_cv,
            cv.ngay_bat_dau,
            cv.ngay_hoan_thanh,
            cv.loai_cv,
            cv.ghi_chu,
            cv.cap_do_id,
            cv.trang_thai_id,
            nv.ten_nv as nguoi_phu_trach,
            nv.ma_nv,
            tt.ten_trang_thai as trang_thai_text
        FROM cong_viec_dinh_ky cv
        LEFT JOIN nhan_vien nv ON cv.nguoi_phu_trach = nv.ma_nv
        LEFT JOIN trang_thai tt ON cv.trang_thai_id = tt.id
        ORDER BY cv.ma_cv ASC
    ");
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["success" => true, "data" => $results]);
    
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
