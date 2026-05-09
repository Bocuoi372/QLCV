<?php
header('Content-Type: text/plain; charset=utf-8');
require_once 'db_config.php';

echo "--- BẮT ĐẦU KIỂM TRA VÀ SỬA LỖI DATABASE ---\n\n";

$tables = ['cong_viec_dinh_ky', 'nhan_vien', 'cap_do', 'trang_thai', 'cong_viec_con'];

foreach ($tables as $table) {
    echo "Kiểm tra bảng: $table...\n";
    try {
        $check = $conn->query("SHOW TABLES LIKE '$table'");
        if ($check->rowCount() == 0) {
            echo "  [!] CẢNH BÁO: Bảng '$table' không tồn tại!\n";
            continue;
        }
        echo "  [OK] Bảng tồn tại.\n";
        
        // Liệt kê các cột hiện có
        $columns = $conn->query("SHOW COLUMNS FROM $table")->fetchAll(PDO::FETCH_COLUMN);
        echo "  Các cột hiện có: " . implode(", ", $columns) . "\n";
        
        if ($table === 'cong_viec_dinh_ky') {
            // Migration: Add auto-increment ID as PK if not exists
            if (!in_array('id', $columns)) {
                echo "  [+] Đang nâng cấp bảng: Thêm cột 'id' làm Primary Key...\n";
                try {
                    // 0. Drop FK in cong_viec_con that points to ma_cv
                    echo "    - Đang tạm gỡ Foreign Key từ bảng cong_viec_con...\n";
                    try {
                        $conn->exec("ALTER TABLE cong_viec_con DROP FOREIGN KEY cong_viec_con_ibfk_1");
                    } catch (Exception $e) { /* ignore if not exists */ }

                    // 1. Drop old PK
                    $conn->exec("ALTER TABLE cong_viec_dinh_ky DROP PRIMARY KEY");
                    // 2. Add new id PK
                    $conn->exec("ALTER TABLE cong_viec_dinh_ky ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST");
                    echo "    [OK] Đã chuyển đổi Primary Key sang 'id'.\n";
                } catch (PDOException $e) {
                    echo "    [X] LỖI khi nâng cấp PK: " . $e->getMessage() . "\n";
                }
            }

            $requiredColumns = [
                "loai_cv" => "VARCHAR(50) DEFAULT 'Định kỳ'",
                "ngay_bat_dau" => "DATE NULL",
                "ngay_hoan_thanh" => "DATE NULL",
                "ghi_chu" => "TEXT NULL",
                "mo_ta_ket_qua" => "TEXT NULL",
                "tien_do" => "INT DEFAULT 0",
                "mo_ta_cv" => "TEXT NULL"
            ];
            
            foreach ($requiredColumns as $col => $type) {
                if (!in_array($col, $columns)) {
                    echo "  [+] Đang thêm cột thiếu: $col ($type)...\n";
                    try {
                        $conn->exec("ALTER TABLE $table ADD COLUMN $col $type");
                        echo "    [OK] Đã thêm cột $col.\n";
                    } catch (PDOException $e) {
                        echo "    [X] LỖI khi thêm cột $col: " . $e->getMessage() . "\n";
                    }
                } else {
                    echo "  [OK] Cột $col đã tồn tại.\n";
                }
            }
        }

        if ($table === 'cong_viec_con') {
            if (!in_array('id_cv_cha', $columns)) {
                echo "  [+] Đang thêm cột 'id_cv_cha' để liên kết chính xác...\n";
                try {
                    $conn->exec("ALTER TABLE cong_viec_con ADD COLUMN id_cv_cha INT NULL AFTER ma_cv_cha");
                } catch (PDOException $e) {}
            }
            
            // Always try to sync if columns exist
            echo "  [+] Đang đồng bộ hóa liên kết công việc con...\n";
            try {
                $conn->exec("
                    UPDATE cong_viec_con c 
                    JOIN cong_viec_dinh_ky p ON c.ma_cv_cha = p.ma_cv 
                    SET c.id_cv_cha = p.id
                    WHERE c.id_cv_cha IS NULL
                ");
                echo "    [OK] Đã đồng bộ thành công.\n";
            } catch (PDOException $e) {
                echo "    [X] LỖI khi đồng bộ: " . $e->getMessage() . "\n";
            }
        }

        if ($table === 'nhan_vien') {
            $requiredNV = [
                'quyen_han' => "VARCHAR(50) DEFAULT 'Nhân viên'",
                'mat_khau' => "VARCHAR(255) DEFAULT '123456'"
            ];
            foreach ($requiredNV as $col => $type) {
                if (!in_array($col, $columns)) {
                    echo "  [+] Đang thêm cột thiếu: $col...\n";
                    try {
                        $conn->exec("ALTER TABLE nhan_vien ADD COLUMN $col $type");
                        echo "    [OK] Đã thêm cột $col.\n";
                    } catch (PDOException $e) {
                        echo "    [X] LỖI khi thêm cột $col: " . $e->getMessage() . "\n";
                    }
                } else {
                    echo "  [OK] Cột $col đã tồn tại.\n";
                }
            }
        }
    } catch (PDOException $e) {
        echo "  [X] LỖI khi kiểm tra bảng $table: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

echo "--- HOÀN TẤT KIỂM TRA ---\n";
echo "Vui lòng tải lại trang Dashboard để kiểm tra kết quả.\n";
?>
