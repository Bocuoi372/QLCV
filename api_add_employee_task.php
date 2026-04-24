<?php
header('Content-Type: application/json; charset=utf-8');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "quanly_congviec_dinhky";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Tự động thêm các cột mới nếu chưa tồn tại trong Database
    $columnsToAdd = [
        "loai_cv" => "VARCHAR(50) DEFAULT 'Định kỳ'",
        "ngay_bat_dau" => "DATE NULL",
        "ngay_hoan_thanh" => "DATE NULL",
        "ghi_chu" => "TEXT NULL",
        "mo_ta_ket_qua" => "TEXT NULL",
        "tien_do" => "INT DEFAULT 0"
    ];

    foreach ($columnsToAdd as $col => $type) {
        try {
            $conn->exec("ALTER TABLE cong_viec_dinh_ky ADD COLUMN $col $type");
        } catch (PDOException $e) {
            // Cột đã tồn tại, bỏ qua lỗi
        }
    }

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $ma_nv = $_POST['ma_nv'] ?? '';
        $ma_cv = $_POST['ma_cv'] ?? '';
        $ten_cv = $_POST['ten_cv'] ?? '';
        $mo_ta_cv = $_POST['mo_ta_cv'] ?? '';
        $loai_cv = $_POST['loai_cv'] ?? 'Định kỳ';
        $cap_do_id = $_POST['cap_do_id'] ?? 3;
        $trang_thai_id = $_POST['trang_thai_id'] ?? 2;
        $ngay_bat_dau = !empty($_POST['ngay_bat_dau']) ? $_POST['ngay_bat_dau'] : date('Y-m-d');
        $ngay_hoan_thanh = !empty($_POST['ngay_hoan_thanh']) ? $_POST['ngay_hoan_thanh'] : null;
        $ghi_chu = $_POST['ghi_chu'] ?? '';
        $tien_do = $_POST['tien_do'] ?? 0;

        if (empty($ma_nv) || empty($ma_cv) || empty($ten_cv)) {
            echo json_encode(["success" => false, "message" => "Dữ liệu không hợp lệ! Vui lòng nhập đủ Mã NV, Mã CV và Tên CV."]);
            exit;
        }

        // Kiểm tra xem mã công việc đã tồn tại chưa
        $checkStmt = $conn->prepare("SELECT ma_cv FROM cong_viec_dinh_ky WHERE ma_cv = :ma_cv");
        $checkStmt->execute([':ma_cv' => $ma_cv]);
        if ($checkStmt->rowCount() > 0) {
            echo json_encode(["success" => false, "message" => "Mã công việc này đã tồn tại! Vui lòng chọn mã khác."]);
            exit;
        }

        $stmt = $conn->prepare("
            INSERT INTO cong_viec_dinh_ky (
                ma_cv, ten_cv, mo_ta_cv, nguoi_phu_trach, 
                cap_do_id, trang_thai_id, loai_cv, ngay_bat_dau, ngay_hoan_thanh, ghi_chu, tien_do
            ) VALUES (
                :ma_cv, :ten_cv, :mo_ta_cv, :nguoi_phu_trach, 
                :cap_do_id, :trang_thai_id, :loai_cv, :ngay_bat_dau, :ngay_hoan_thanh, :ghi_chu, :tien_do
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

        echo json_encode(["success" => true, "message" => "Thêm công việc thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }

} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
