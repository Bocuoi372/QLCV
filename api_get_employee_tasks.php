<?php
header('Content-Type: application/json; charset=utf-8');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "quanly_congviec_dinhky";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $ma_nv = isset($_GET['id']) ? trim($_GET['id']) : '';
    if ($ma_nv === 'null' || $ma_nv === 'undefined') $ma_nv = '';

    $whereClause = "";
    $params = [];
    if (!empty($ma_nv)) {
        $whereClause = "WHERE cv.nguoi_phu_trach = :ma_nv";
        $params[':ma_nv'] = $ma_nv;
    }

    // Lấy danh sách công việc
    $stmt = $conn->prepare("
        SELECT 
            cv.*,
            nv.ten_nv,
            cd.ten_cap_do as cap_do_text,
            tt.ten_trang_thai as trang_thai_text
        FROM cong_viec_dinh_ky cv
        LEFT JOIN nhan_vien nv ON cv.nguoi_phu_trach = nv.ma_nv
        LEFT JOIN cap_do cd ON cv.cap_do_id = cd.id
        LEFT JOIN trang_thai tt ON cv.trang_thai_id = tt.id
        $whereClause
        ORDER BY cv.ma_cv ASC
    ");
    $stmt->execute($params);
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Xử lý giá trị mặc định cho các cột có thể chưa tồn tại trong DB cũ
    foreach ($results as &$row) {
        $row['loai_cv'] = isset($row['loai_cv']) ? $row['loai_cv'] : 'Định kỳ';
        $row['ngay_bat_dau'] = isset($row['ngay_bat_dau']) ? $row['ngay_bat_dau'] : '';
        $row['ngay_hoan_thanh'] = isset($row['ngay_hoan_thanh']) ? $row['ngay_hoan_thanh'] : '';
        $row['mo_ta_ket_qua'] = isset($row['mo_ta_ket_qua']) ? $row['mo_ta_ket_qua'] : '';
        $row['ghi_chu'] = isset($row['ghi_chu']) ? $row['ghi_chu'] : '';
        $row['mo_ta_cv'] = isset($row['mo_ta_cv']) ? $row['mo_ta_cv'] : '';
    }
    
    // Thống kê
    $tong_so = count($results);
    $hoan_thanh = 0;
    $qua_han = 0;
    $can_chi_dao = 0;

    foreach ($results as $task) {
        $is_done = ($task['trang_thai_id'] == 1 || (isset($task['tien_do']) && $task['tien_do'] >= 100));
        
        if ($is_done) {
            $hoan_thanh++;
        } else {
            if ($task['trang_thai_id'] == 3) $qua_han++;    // Quá hạn
            if ($task['trang_thai_id'] == 5) $can_chi_dao++; // Xin chỉ đạo
        }
    }
    
    echo json_encode([
        "success" => true, 
        "data" => $results,
        "stats" => [
            "tong_so" => $tong_so,
            "hoan_thanh" => $hoan_thanh,
            "qua_han" => $qua_han,
            "can_chi_dao" => $can_chi_dao
        ]
    ]);
    
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
