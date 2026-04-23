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
        $ma_cv = $_POST['ma_cv'] ?? '';

        if (empty($ma_cv)) {
            echo json_encode(["success" => false, "message" => "Thiếu mã công việc cần xóa!"]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM cong_viec_dinh_ky WHERE ma_cv = :ma_cv");
        $stmt->execute([':ma_cv' => $ma_cv]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "Đã xóa công việc thành công!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Không tìm thấy công việc để xóa!"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ!"]);
    }

} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
