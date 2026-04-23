<?php
$servername = "localhost";
$username = "root";
$password = "";

try {
    // Kết nối đến MySQL server (chưa chọn database)
    $conn = new PDO("mysql:host=$servername;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Đọc nội dung file database.sql
    $sql = file_get_contents('database.sql');
    
    // Thực thi toàn bộ lệnh SQL để tạo Database và các Bảng
    $conn->exec($sql);
    
    echo "<div style='font-family: Arial, sans-serif; text-align: center; margin-top: 50px;'>";
    echo "<h1 style='color: #4CAF50;'>🎉 Khởi tạo Cơ sở dữ liệu THÀNH CÔNG!</h1>";
    echo "<p style='font-size: 18px;'>Hệ thống đã tự động tạo Database <b>quanly_congviec_dinhky</b> và các bảng dữ liệu cho bạn.</p>";
    echo "<a href='login.html' style='display: inline-block; padding: 10px 20px; background-color: #7030A0; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;'>Quay lại trang Đăng nhập</a>";
    echo "</div>";

} catch(PDOException $e) {
    echo "<div style='font-family: Arial, sans-serif; text-align: center; margin-top: 50px;'>";
    echo "<h1 style='color: #f44336;'>❌ Có lỗi xảy ra</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}
?>
