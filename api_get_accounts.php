<?php
header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';

try {

    $stmt = $conn->prepare("
        SELECT ma_nv, ten_nv, phong_ban, mat_khau, quyen_han 
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
