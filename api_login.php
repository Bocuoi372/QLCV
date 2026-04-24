<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Thông tin kết nối mặc định của XAMPP
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "quanly_congviec_dinhky";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $ma_nv = $_POST['ma_nv'] ?? '';
        $pass = $_POST['password'] ?? '';

        if (empty($ma_nv) || empty($pass)) {
            echo json_encode(["success" => false, "message" => "Vui lòng nhập đầy đủ mã nhân viên và mật khẩu."]);
            exit;
        }

        // Tự động tạo tài khoản ADMIN mẫu nếu chưa có
        $stmt_check_admin = $conn->query("SELECT COUNT(*) FROM nhan_vien WHERE ma_nv = 'ADMIN'");
        if ($stmt_check_admin->fetchColumn() == 0) {
            $conn->exec("INSERT INTO nhan_vien (ma_nv, ten_nv, vi_tri_cong_viec) VALUES ('ADMIN', 'Quản trị viên', 'Quản lý Hệ thống')");
        }

        // Tự động tạo tài khoản STAFF mẫu (Nhân viên) nếu chưa có
        $stmt_check_staff = $conn->query("SELECT COUNT(*) FROM nhan_vien WHERE ma_nv = 'NV01'");
        if ($stmt_check_staff->fetchColumn() == 0) {
            $conn->exec("INSERT INTO nhan_vien (ma_nv, ten_nv, vi_tri_cong_viec) VALUES ('NV01', 'Nhân viên Test', 'Nhân viên')");
            
            // Tạo kèm một công việc mẫu cho nhân viên này luôn để dễ hình dung
            $conn->exec("INSERT INTO cong_viec_dinh_ky (ma_cv, ten_cv, mo_ta_cv, nguoi_phu_trach, cap_do_id, trang_thai_id, loai_cv) 
                         VALUES ('CV_MAU_01', 'Báo cáo doanh thu', 'Làm báo cáo cuối tuần', 'NV01', 2, 2, 'Định kỳ')");
        }

        // Truy vấn lấy thông tin nhân viên từ Database
        $stmt = $conn->prepare("SELECT * FROM nhan_vien WHERE ma_nv = :ma_nv");
        $stmt->bindParam(':ma_nv', $ma_nv);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Kiểm tra mật khẩu từ cơ sở dữ liệu
        if ($user && $pass === $user['mat_khau']) {
            $_SESSION['ma_nv'] = $user['ma_nv'];
            $_SESSION['ten_nv'] = $user['ten_nv'];
            $_SESSION['vi_tri'] = $user['vi_tri_cong_viec'];
            
            // Phân quyền dựa trên cột quyen_han (1: Admin, 2: Manager, 3: Staff)
            // Cả Admin (1) và Manager (2) đều có quyền vào trang Quản trị (ADMIN role)
            $role = 'STAFF';
            if ($user['quyen_han'] == 1 || $user['quyen_han'] == 2) {
                $role = 'ADMIN';
            }

            echo json_encode([
                "success" => true, 
                "message" => "Đăng nhập thành công",
                "role" => $role
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Mã nhân viên không tồn tại hoặc sai mật khẩu!"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Yêu cầu không hợp lệ"]);
    }

} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Lỗi CSDL: Vui lòng đảm bảo bạn đã Import file database.sql vào MySQL (phpMyAdmin)"]);
}
?>
