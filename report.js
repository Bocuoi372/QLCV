document.addEventListener('DOMContentLoaded', () => {
    // Lấy thông số từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('id');
    const empName = urlParams.get('name');

    // Cập nhật Tiêu đề Nhân viên
    const displayEmpName = document.getElementById('displayEmpName');
    if (empName) {
        if (displayEmpName) {
            displayEmpName.textContent = empName.toUpperCase();
        }
    } else {
        if (displayEmpName) {
            displayEmpName.textContent = "BÁO CÁO TỔNG HỢP TOÀN BỘ NHÂN VIÊN";
        }
    }

    // Nút điều hướng Tab (UI)
    const tabs = document.querySelectorAll('.btn-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // === HÀM LẤY VÀ HIỂN THỊ DANH SÁCH CÔNG VIỆC TỪ DB ===
    const loadEmployeeTasks = async () => {
        try {
            const url = empId ? `api_get_employee_tasks.php?id=${empId}` : `api_get_employee_tasks.php`;
            const response = await fetch(url);
            const result = await response.json();

            if (result.success && result.data) {
                // 1. Cập nhật bảng chi tiết
                const tbody = document.querySelector('.report-table tbody');
                tbody.innerHTML = ''; // Xóa sạch dữ liệu mẫu

                result.data.forEach(task => {
                    const row = document.createElement('tr');

                    // Format lại ngày tháng (nếu có)
                    const formatDt = (dtStr) => {
                        if (!dtStr || dtStr === '0000-00-00' || dtStr === 'null') return '';
                        const d = new Date(dtStr);
                        if (isNaN(d.getTime())) return dtStr; // Trả về nguyên bản nếu không parse được
                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    };

                    row.innerHTML = `
                        <td class="bold" style="color: var(--primary-color);">${task.ma_cv}</td>
                        <td class="bold">${task.ten_cv || ''}</td>
                        <td class="bold">${task.mo_ta_cv || ''}</td>
                        <td class="bold">${task.ten_nv || empName || ''}</td>
                        <td class="bold">${task.cap_do_text || ''}</td>
                        <td class="bold">${task.loai_cv || ''}</td>
                        <td>${formatDt(task.ngay_bat_dau)}</td>
                        <td>${formatDt(task.ngay_hoan_thanh)}</td>
                        <td class="bold">${task.mo_ta_ket_qua || ''}</td>
                        <td>${task.ghi_chu || ''}</td>
                    `;
                    tbody.appendChild(row);
                });

                // 2. Cập nhật các thẻ Thống Kê (Cards)
                if (result.stats) {
                    const statNumbers = document.querySelectorAll('.stat-number');
                    if (statNumbers.length >= 4) {
                        statNumbers[0].textContent = result.stats.tong_so;       // TỔNG SỐ
                        statNumbers[1].textContent = result.stats.hoan_thanh;    // HOÀN THÀNH
                        statNumbers[2].textContent = result.stats.qua_han;       // QUÁ HẠN
                        statNumbers[3].textContent = result.stats.can_chi_dao;   // CẦN CHỈ ĐẠO
                    }
                }
            } else {
                console.warn(result.message);
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu công việc:', error);
        }
    };

    // Load dữ liệu lần đầu
    loadEmployeeTasks();


    // === LOGIC QUẢN LÝ MODAL THÊM CÔNG VIỆC MỚI ===
    const btnAddTask = document.getElementById('btnAddTask');
    const taskModal = document.getElementById('addTaskModal');
    const btnCloseTaskModal = document.getElementById('btnCloseTaskModal');
    const btnCancelTaskModal = document.getElementById('btnCancelTaskModal');
    const btnApplyTask = document.getElementById('btnApplyTask');
    const taskForm = document.getElementById('addTaskForm');

    // Mở Modal
    if (btnAddTask) {
        if (!empId) {
            // Nếu ở trang báo cáo tổng hợp thì ẩn nút thêm việc (vì giao diện này được thiết kế để thêm cho 1 người cụ thể)
            btnAddTask.style.display = 'none';
        } else {
            btnAddTask.addEventListener('click', () => {
                if (taskModal) taskModal.style.display = 'flex';
            });
        }
    }

    // Đóng Modal
    const closeTaskModal = () => {
        if (taskModal) taskModal.style.display = 'none';
        if (taskForm) taskForm.reset();
    };

    if (btnCloseTaskModal) btnCloseTaskModal.addEventListener('click', closeTaskModal);
    if (btnCancelTaskModal) btnCancelTaskModal.addEventListener('click', closeTaskModal);
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) closeTaskModal();
    });

    // Xử lý Lưu form
    if (btnApplyTask) {
        btnApplyTask.addEventListener('click', async (e) => {
            e.preventDefault();

            // Validate sơ bộ
            const ma_cv = document.getElementById('modal_ma_cv').value.trim();
            const ten_cv = document.getElementById('modal_ten_cv').value.trim();
            if (!ma_cv || !ten_cv) {
                alert("Vui lòng điền Mã công việc và Tên công việc!");
                return;
            }

            btnApplyTask.textContent = "Đang xử lý...";
            btnApplyTask.disabled = true;

            const formData = new FormData();
            formData.append('ma_nv', empId);
            formData.append('ma_cv', ma_cv);
            formData.append('ten_cv', ten_cv);
            formData.append('mo_ta_cv', document.getElementById('modal_mo_ta').value.trim());
            formData.append('loai_cv', document.getElementById('modal_loai_cv').value);
            formData.append('cap_do_id', document.getElementById('modal_cap_do_cv').value);
            formData.append('trang_thai_id', document.getElementById('modal_trang_thai_cv').value);
            formData.append('ngay_bat_dau', document.getElementById('modal_ngay_bat_dau').value);
            formData.append('ngay_hoan_thanh', document.getElementById('modal_ngay_hoan_thanh').value);
            formData.append('ghi_chu', document.getElementById('modal_ghi_chu').value.trim());

            try {
                const response = await fetch('api_add_employee_task.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    closeTaskModal();
                    // Tải lại bảng để thấy công việc mới ngay lập tức
                    loadEmployeeTasks();
                } else {
                    alert("Lỗi: " + result.message);
                }
            } catch (error) {
                console.error(error);
                alert("Đã xảy ra lỗi kết nối với máy chủ!");
            } finally {
                btnApplyTask.textContent = "Lưu Công Việc";
                btnApplyTask.disabled = false;
            }
        });
    }
});
