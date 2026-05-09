<?php
require_once 'db_config.php';
$id = 44;
$stmt = $conn->prepare("SELECT id, ma_cv, tien_do, mo_ta_cv, nguoi_phu_trach, ngay_bat_dau, ngay_hoan_thanh, loai_cv FROM cong_viec_dinh_ky WHERE id = ?");
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($row, JSON_PRETTY_PRINT);
?>
