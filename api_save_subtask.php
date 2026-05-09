<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'db_config.php';

try {
    if (!isset($_SESSION['ma_nv'])) {
        echo json_encode(["success" => false, "unauthorized" => true, "message" => "Chưa đăng nhập! Vui lòng đăng nhập lại."]);
        exit;
    }

    // 1. Nhận và làm sạch dữ liệu đầu vào
    $id = $_POST['id'] ?? null;
    if ($id === 'undefined' || $id === 'null' || $id === '') $id = null;
    if ($id !== null) $id = (int)$id;

    $id_cv_cha = $_POST['id_cv_cha'] ?? null;
    if ($id_cv_cha === 'undefined' || $id_cv_cha === 'null' || $id_cv_cha === '') $id_cv_cha = null;
    if ($id_cv_cha !== null) $id_cv_cha = (int)$id_cv_cha;

    $action = $_POST['action'] ?? 'save';
    $ma_cv_cha = $_POST['ma_cv_cha'] ?? '';
    if ($ma_cv_cha === 'undefined' || $ma_cv_cha === 'null') $ma_cv_cha = '';
    $ma_cv_cha = trim($ma_cv_cha);
    $ten_buoc = $_POST['ten_buoc'] ?? '';
    $ma_nv = !empty($_POST['ma_nv']) ? $_POST['ma_nv'] : null;
    $ngay_bd = !empty($_POST['ngay_bat_dau']) ? $_POST['ngay_bat_dau'] : null;
    $ngay_kt = !empty($_POST['ngay_hoan_thanh']) ? $_POST['ngay_hoan_thanh'] : null;
    $tien_do = (int)($_POST['tien_do'] ?? 0);
    $trang_thai = (int)($_POST['trang_thai_id'] ?? 2);
    $cap_do = (int)($_POST['cap_do_id'] ?? 3);

    // 2. Xử lý hành động Xóa
    if ($action === 'delete' && $id) {
        $stmt = $conn->prepare("DELETE FROM cong_viec_con WHERE id = :id");
        $stmt->execute([':id' => $id]);
        
        // Sau khi xóa, cập nhật lại tiến độ cha
        updateParentProgress($conn, $id_cv_cha, $ma_cv_cha);
        echo json_encode(["success" => true, "message" => "Đã xóa bước công việc!"]);
        exit;
    }

    if ((!$id_cv_cha && !$ma_cv_cha) || !$ten_buoc) {
        echo json_encode(["success" => false, "message" => "Thiếu thông tin bắt buộc (ID/Mã công việc cha hoặc tên bước)!"]);
        exit;
    }

    // 3. Lưu hoặc cập nhật bước công việc con
    if ($id) {
        // Cập nhật bước hiện có
        $stmt = $conn->prepare("
            UPDATE cong_viec_con 
            SET ten_buoc = :ten_buoc, ma_nv_thuc_hien = :ma_nv, 
                ngay_bat_dau = :ngay_bd, ngay_hoan_thanh = :ngay_kt, 
                tien_do = :tien_do, trang_thai_id = :trang_thai, cap_do_id = :cap_do,
                id_cv_cha = :id_cv_cha, ma_cv_cha = :ma_cv_cha
            WHERE id = :id
        ");
        $stmt->execute([
            ':ten_buoc' => $ten_buoc, ':ma_nv' => $ma_nv, ':ngay_bd' => $ngay_bd, 
            ':ngay_kt' => $ngay_kt, ':tien_do' => $tien_do, ':trang_thai' => $trang_thai, 
            ':cap_do' => $cap_do, ':id_cv_cha' => $id_cv_cha, ':ma_cv_cha' => $ma_cv_cha, ':id' => $id
        ]);
    } else {
        // Thêm bước mới
        $stmt = $conn->prepare("
            INSERT INTO cong_viec_con (ma_cv_cha, id_cv_cha, ten_buoc, ma_nv_thuc_hien, ngay_bat_dau, ngay_hoan_thanh, tien_do, trang_thai_id, cap_do_id)
            VALUES (:ma_cv_cha, :id_cv_cha, :ten_buoc, :ma_nv, :ngay_bd, :ngay_kt, :tien_do, :trang_thai, :cap_do)
        ");
        $stmt->execute([
            ':ma_cv_cha' => $ma_cv_cha, ':id_cv_cha' => $id_cv_cha, ':ten_buoc' => $ten_buoc, ':ma_nv' => $ma_nv, 
            ':ngay_bd' => $ngay_bd, ':ngay_kt' => $ngay_kt, ':tien_do' => $tien_do, 
            ':trang_thai' => $trang_thai, ':cap_do' => $cap_do
        ]);
        $id = $conn->lastInsertId();
    }

    // 4. Đồng bộ hóa logic tháng mới (nếu có)
    // Đã được xử lý qua việc cập nhật ngày bắt đầu/kết thúc cho cha
    $parent_ngay_kt = $_POST['parent_ngay_hoan_thanh'] ?? null;
    $parent_ngay_bd = $_POST['parent_ngay_bat_dau'] ?? null;

    // 5. Cập nhật tiến độ cha
    $newProg = updateParentProgress($conn, $id_cv_cha, $ma_cv_cha, $parent_ngay_bd, $parent_ngay_kt);

    echo json_encode(["success" => true, "message" => "Cập nhật thành công!", "newProgress" => $newProg, "id" => $id]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Lỗi: " . $e->getMessage()]);
}

/**
 * Hàm cập nhật tiến độ công việc cha
 */
function updateParentProgress($conn, $id_cv_cha, $ma_cv_cha, $ngay_bd = null, $ngay_kt = null) {
    // 3. Cập nhật tiến độ trung bình cho công việc cha
    // Sử dụng LOWER và TRIM để đối soát chính xác tuyệt đối, không phân biệt hoa thường
    $stmtCount = $conn->prepare("
        SELECT AVG(tien_do) as avg_progress 
        FROM cong_viec_con 
        WHERE (id_cv_cha = :id_cv_cha AND :id_cv_cha > 0) 
           OR (LOWER(TRIM(ma_cv_cha)) = LOWER(TRIM(:ma_cv_cha)) AND :ma_cv_cha != '')
    ");
    $stmtCount->execute([':id_cv_cha' => $id_cv_cha, ':ma_cv_cha' => $ma_cv_cha]);
    $avg = $stmtCount->fetch(PDO::FETCH_ASSOC)['avg_progress'];
    
    // Nếu không tìm thấy bất kỳ bước con nào (avg là null), 
    // chúng ta lấy tiến độ hiện tại của cha để trả về thay vì reset về 0.
    if ($avg === null) {
        $stmtOld = $conn->prepare("
            SELECT tien_do FROM cong_viec_dinh_ky 
            WHERE (id = :id AND :id > 0) 
               OR (LOWER(TRIM(ma_cv)) = LOWER(TRIM(:ma)) AND :ma != '') 
            ORDER BY id DESC LIMIT 1
        ");
        $stmtOld->execute([':id' => $id_cv_cha, ':ma' => $ma_cv_cha]);
        return (int)($stmtOld->fetch(PDO::FETCH_ASSOC)['tien_do'] ?? 0);
    }

    // HEAL LINKAGE: Cập nhật id_cv_cha cho các bước con nếu chúng chưa có hoặc sai (để đồng bộ tháng mới)
    if ($id_cv_cha > 0) {
        $stmtHeal = $conn->prepare("UPDATE cong_viec_con SET id_cv_cha = :id WHERE id_cv_cha != :id AND LOWER(TRIM(ma_cv_cha)) = LOWER(TRIM(:ma))");
        $stmtHeal->execute([':id' => $id_cv_cha, ':ma' => $ma_cv_cha]);
    }
    
    $newProg = round($avg);

    // Xây dựng câu lệnh cập nhật công việc cha
    $sql = "UPDATE cong_viec_dinh_ky SET tien_do = :prog";
    $params = [':prog' => $newProg];

    if ($ngay_bd) { $sql .= ", ngay_bat_dau = :bd"; $params[':bd'] = $ngay_bd; }
    if ($ngay_kt) { $sql .= ", ngay_hoan_thanh = :kt"; $params[':kt'] = $ngay_kt; }

    // Tự động chuyển trạng thái
    if ($newProg >= 100) {
        $sql .= ", trang_thai_id = 6"; // Chờ phê duyệt
    } else {
        $sql .= ", trang_thai_id = 2"; // Đang thực hiện
    }

    // Ưu tiên cập nhật theo ID bản ghi cụ thể để tránh nhầm tháng
    if ($id_cv_cha > 0) {
        $sql .= " WHERE id = :id";
        $params[':id'] = $id_cv_cha;
    } else {
        $sql .= " WHERE LOWER(TRIM(ma_cv)) = LOWER(TRIM(:ma))";
        $params[':ma'] = $ma_cv_cha;
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    return $newProg;
}
?>
