<?php
require_once 'db_config.php';
try {
    $conn->exec("ALTER TABLE nhan_vien ADD COLUMN phong_ban VARCHAR(255) DEFAULT 'Kỹ thuật' AFTER ten_nv");
    echo "Success: Column 'phong_ban' added.";
} catch(Exception $e) {
    echo "Error or Already exists: " . $e->getMessage();
}
?>
