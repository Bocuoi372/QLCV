<?php
header('Content-Type: text/plain; charset=utf-8');
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "quanly_congviec_dinhky";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Kiểm tra xem cột mat_khau đã tồn tại chưa
    $stmt = $conn->query("SHOW COLUMNS FROM nhan_vien LIKE 'mat_khau'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("ALTER TABLE nhan_vien ADD COLUMN mat_khau VARCHAR(255) DEFAULT '123456'");
        echo "Đã thêm cột mat_khau thành công.\n";
    } else {
        echo "Cột mat_khau đã tồn tại.\n";
    }

} catch(PDOException $e) {
    echo "Lỗi: " . $e->getMessage();
}
?>
