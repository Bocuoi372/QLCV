-- Tạo cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS quanly_congviec_dinhky CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quanly_congviec_dinhky;

-- 1. Bảng Cấp độ công việc
CREATE TABLE cap_do (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_cap_do VARCHAR(100) NOT NULL
);

-- 2. Bảng Trạng thái công việc
CREATE TABLE trang_thai (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_trang_thai VARCHAR(100) NOT NULL
);

-- 3. Bảng Nhân viên
CREATE TABLE nhan_vien (
    ma_nv VARCHAR(20) PRIMARY KEY,
    ten_nv VARCHAR(100) NOT NULL,
    vi_tri_cong_viec VARCHAR(100)
);

-- 4. Bảng Công việc định kỳ (Dựa trên cấu trúc hình ảnh)
CREATE TABLE cong_viec_dinh_ky (
    ma_cv VARCHAR(20) PRIMARY KEY,
    ten_cv VARCHAR(255),
    mo_ta_cv TEXT,
    nguoi_phu_trach VARCHAR(20),
    thoi_gian_bat_dau TIME, -- Sử dụng TIME nếu chỉ quan tâm giờ trong ngày, hoặc DATE nếu là ngày trong tháng
    thoi_gian_ket_thuc TIME,
    cap_do_id INT,
    trang_thai_id INT,
    tien_do INT DEFAULT 0,
    FOREIGN KEY (nguoi_phu_trach) REFERENCES nhan_vien(ma_nv) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (cap_do_id) REFERENCES cap_do(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (trang_thai_id) REFERENCES trang_thai(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ==========================================
-- DỮ LIỆU MẪU DỰA TRÊN HÌNH ẢNH
-- ==========================================

-- Chèn dữ liệu Cấp độ
INSERT INTO cap_do (ten_cap_do) VALUES 
('Khẩn cấp'), 
('Cao'), 
('Bình thường'), 
('Thấp'), 
('Có thời gian cụ thể');

-- Chèn dữ liệu Trạng thái
INSERT INTO trang_thai (ten_trang_thai) VALUES 
('Đã hoàn thành'), 
('Đang thực hiện'), 
('Quá hạn'), 
('Tạm dừng'), 
('Xin chỉ đạo');

-- Chèn dữ liệu mẫu cho danh sách mã công việc từ hình ảnh
-- Chú ý: Các cột khác đang để trống vì hình ảnh không cung cấp chi tiết
INSERT INTO cong_viec_dinh_ky (ma_cv, ten_cv) VALUES
('NS.NV.1', 'Tên công việc NS.NV.1'),
('NS.NV.2', 'Tên công việc NS.NV.2'),
('NS.NV.3', 'Tên công việc NS.NV.3'),
('NS.TS.1', 'Tên công việc NS.TS.1'),
('NS.TS.2', 'Tên công việc NS.TS.2'),
('NS.TS.3', 'Tên công việc NS.TS.3');
