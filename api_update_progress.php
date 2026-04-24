<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "quanly_congviec_dinhky";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $ma_cv = $_POST['ma_cv'] ?? '';
        $tien_do = $_POST['tien_do'] ?? 0;

        if (empty($ma_cv)) {
            echo json_encode(["success" => false, "message" => "Mã công việc không hợp lệ!"]);
            exit;
        }

        // Cập nhật tiến độ và mô tả (nếu có)
        $mo_ta_cv = $_POST['mo_ta_cv'] ?? null;
        
        if ($mo_ta_cv !== null) {
            $stmt = $conn->prepare("UPDATE cong_viec_dinh_ky SET tien_do = :tien_do, mo_ta_cv = :mo_ta_cv WHERE ma_cv = :ma_cv");
            $stmt->execute([
                ':tien_do' => $tien_do,
                ':mo_ta_cv' => $mo_ta_cv,
                ':ma_cv' => $ma_cv
            ]);
        } else {
            $stmt = $conn->prepare("UPDATE cong_viec_dinh_ky SET tien_do = :tien_do WHERE ma_cv = :ma_cv");
            $stmt->execute([
                ':tien_do' => $tien_do,
                ':ma_cv' => $ma_cv
            ]);
        }

        echo json_encode(["success" => true, "message" => "Cập nhật tiến độ thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }

} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
