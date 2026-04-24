<?php
header('Content-Type: application/json; charset=utf-8');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "quanly_congviec_dinhky";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->prepare("
        SELECT ma_nv, ten_nv, quyen_han 
        FROM nhan_vien 
        ORDER BY 
            CASE 
                WHEN quyen_han IN (1, '1', 'Admin', 'ADMIN') THEN 1
                WHEN quyen_han IN (2, '2', 'Quản lý', 'MANAGER') THEN 2
                WHEN quyen_han IN (3, '3', 'Nhân viên', 'STAFF') THEN 3
                ELSE 4
            END ASC, 
            ten_nv ASC
    ");
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["success" => true, "data" => $results]);
    
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>
