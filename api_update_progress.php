<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';

try {
    if (!isset($_SESSION['ma_nv'])) {
        echo json_encode(["success" => false, "unauthorized" => true, "message" => "Chưa đăng nhập!"]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $ma_nv = $_SESSION['ma_nv'];
        $id = $_POST['id'] ?? null;
        $ma_cv = $_POST['ma_cv'] ?? '';
        $tien_do = (int)($_POST['tien_do'] ?? 0);
        $mo_ta_cv = $_POST['mo_ta_cv'] ?? null;
        $ngay_hoan_thanh = $_POST['ngay_hoan_thanh'] ?? null;
        $ngay_bat_dau = $_POST['ngay_bat_dau'] ?? null;

        if (empty($id) && empty($ma_cv)) {
            echo json_encode(["success" => false, "message" => "Thiếu thông tin công việc!"]);
            exit;
        }

        // Kiểm tra quyền: Admin/Manager (quyen_han 1,2,4) có thể cập nhật bất kỳ công việc nào
        $quyen_han = $_SESSION['quyen_han'] ?? '3';
        $isAdmin = in_array($quyen_han, ['1', '2', '4', 'admin', 'manager', 'quản lý', 'ban giám đốc']);

        // 1. Tìm bản ghi cụ thể để xác định trạng thái hiện tại
        $where = "";
        $find_params = [];
        
        if (!empty($id) && is_numeric($id)) {
            if ($isAdmin) {
                // Admin/Manager: tìm theo ID, không cần kiểm tra nguoi_phu_trach
                $where = "id = :id";
                $find_params[':id'] = $id;
            } else {
                // Nhân viên: chỉ cập nhật công việc của mình
                $where = "id = :id AND nguoi_phu_trach = :ma_nv";
                $find_params[':id'] = $id;
                $find_params[':ma_nv'] = $ma_nv;
            }
        } else {
            if ($isAdmin) {
                $where = "ma_cv = :ma_cv";
                $find_params[':ma_cv'] = $ma_cv;
            } else {
                $where = "ma_cv = :ma_cv AND nguoi_phu_trach = :ma_nv";
                $find_params[':ma_cv'] = $ma_cv;
                $find_params[':ma_nv'] = $ma_nv;
            }
        }

        $stmt_find = $conn->prepare("SELECT id, trang_thai_id, tien_do FROM cong_viec_dinh_ky WHERE $where ORDER BY id DESC LIMIT 1");
        $stmt_find->execute($find_params);
        $task = $stmt_find->fetch(PDO::FETCH_ASSOC);

        if (!$task) {
            echo json_encode(["success" => false, "message" => "Không tìm thấy công việc phù hợp! (ID: $id, ma_cv: $ma_cv)"]);
            exit;
        }

        $actual_id = $task['id'];
        $current_status = $task['trang_thai_id'];

        // 2. Xây dựng câu lệnh UPDATE
        $sql = "UPDATE cong_viec_dinh_ky SET tien_do = :tien_do";
        $update_params = [':tien_do' => $tien_do, ':id' => $actual_id];

        // Tự động chuyển trạng thái
        if ($tien_do >= 100) {
            if ($current_status != 1) { // Nếu chưa "Hoàn thành" thì chuyển sang "Chờ phê duyệt"
                $sql .= ", trang_thai_id = 6";
            }
        } else {
            // Nếu tiến độ < 100 mà đang là "Hoàn thành" hoặc "Chờ phê duyệt" thì chuyển về "Đang thực hiện"
            if ($current_status == 1 || $current_status == 6) {
                $sql .= ", trang_thai_id = 2";
            }
        }

        if ($mo_ta_cv !== null) {
            $sql .= ", mo_ta_cv = :mo_ta_cv";
            $update_params[':mo_ta_cv'] = $mo_ta_cv;
        }
        
        if ($ngay_hoan_thanh !== null) {
            $sql .= ", ngay_hoan_thanh = :ngay_hoan_thanh";
            $update_params[':ngay_hoan_thanh'] = $ngay_hoan_thanh;
        }

        if ($ngay_bat_dau !== null) {
            $sql .= ", ngay_bat_dau = :ngay_bat_dau";
            $update_params[':ngay_bat_dau'] = $ngay_bat_dau;
        }

        $sql .= " WHERE id = :id";
        
        $stmt_update = $conn->prepare($sql);
        $stmt_update->execute($update_params);

        echo json_encode([
            "success" => true, 
            "message" => "Đã cập nhật tiến độ!",
            "id_updated" => $actual_id,
            "new_tien_do" => $tien_do
        ]);
    }
} catch(Exception $e) {
    echo json_encode(["success" => false, "message" => "Lỗi: " . $e->getMessage()]);
}
?>
