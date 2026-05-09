<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';
error_reporting(0);
ini_set('display_errors', 0);

session_start();
try {
    $quyenHan = $_SESSION['quyen_han'] ?? 3;
    $phongBan = $_SESSION['phong_ban'] ?? '';

    $whereClause = "";
    if ($quyenHan == 2) {
        $whereClause = " WHERE phong_ban = " . $conn->quote($phongBan);
    }

    $stmt = $conn->prepare("
        SELECT ma_nv, ten_nv, quyen_han, vi_tri_cong_viec, phong_ban 
        FROM nhan_vien 
        $whereClause
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
