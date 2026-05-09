<?php
$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "quanly_congviec_dinhky";

// Tắt hoàn toàn việc tự tạo database/bảng để tránh bị treo
try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(["success" => false, "message" => "Lỗi kết nối Database: " . $e->getMessage()]));
}
?>
