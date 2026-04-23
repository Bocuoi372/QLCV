<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "quanly_congviec_dinhky";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->prepare("DESCRIBE cong_viec_dinh_ky");
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result);

} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
