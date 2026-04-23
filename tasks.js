document.addEventListener('DOMContentLoaded', () => {
    
    const tbody = document.getElementById('allTasksBody');
    let isEditMode = false;
    let currentRow = null;
    let employeeList = [];

    // Tải danh sách nhân viên để cho vào Dropdown
    const loadEmployees = async () => {
        try {
            const response = await fetch('api_get_employees_list.php');
            const result = await response.json();
            if (result.success && result.data) {
                employeeList = result.data;
                const selectNV = document.getElementById('modal_ma_nv');
                if (selectNV) {
                    selectNV.innerHTML = '<option value="">-- Chọn nhân viên --</option>';
                    employeeList.forEach(nv => {
                        const option = document.createElement('option');
                        option.value = nv.ma_nv;
                        option.textContent = nv.ten_nv;
                        selectNV.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách NV:", error);
        }
    };

    const loadAllTasks = async () => {
        try {
            const response = await fetch('api_get_all_tasks.php');
            const result = await response.json();

            if (result.success && result.data) {
                tbody.innerHTML = ''; 

                if (result.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Chưa có công việc nào!</td></tr>';
                    return;
                }

                result.data.forEach(task => {
                    const row = document.createElement('tr');
                    
                    // Format lại ngày tháng
                    const formatDt = (dtStr) => {
                        if (!dtStr || dtStr === '0000-00-00' || dtStr === 'null') return '';
                        const d = new Date(dtStr);
                        if (isNaN(d.getTime())) return dtStr;
                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
                    };

                    const reportUrl = `report.html?id=${task.ma_nv}&name=${encodeURIComponent(task.nguoi_phu_trach)}`;

                    // Lưu toàn bộ data vào dataset để dùng lúc Sửa
                    row.dataset.task = JSON.stringify(task);

                    row.innerHTML = `
                        <td class="bold" style="color: var(--primary-color);">${task.ma_cv}</td>
                        <td class="bold">${task.ten_cv || ''}</td>
                        <td style="max-width: 300px; text-align: left;">${task.mo_ta_cv || ''}</td>
                        <td class="bold"><a href="${reportUrl}" style="color: #0b5394; text-decoration: none;">${task.nguoi_phu_trach || 'Chưa phân công'}</a></td>
                        <td>${formatDt(task.ngay_bat_dau)}</td>
                        <td>${formatDt(task.ngay_hoan_thanh)}</td>
                        <td class="bold">${task.trang_thai_text || ''}</td>
                        <td>
                            <button class="btn-edit" title="Sửa dòng này" style="color: #4CAF50; background: none; border: none; cursor: pointer; padding: 4px;">
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button class="btn-delete" data-macv="${task.ma_cv}" title="Xóa dòng này" style="color: #f44336; background: none; border: none; cursor: pointer; padding: 4px;">
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                console.warn(result.message);
                tbody.innerHTML = `<tr><td colspan="8" style="color: red;">Lỗi: ${result.message}</td></tr>`;
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu công việc:', error);
            tbody.innerHTML = `<tr><td colspan="8" style="color: red;">Lỗi kết nối máy chủ!</td></tr>`;
        }
    };

    // Khởi động
    loadEmployees();
    loadAllTasks();


    // ==========================================
    // LOGIC MODAL & EVENTS
    // ==========================================
    const btnAddTaskGlobal = document.getElementById('btnAddTaskGlobal');
    const taskModal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modalTitle');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const btnApplyTask = document.getElementById('btnApplyTask');
    const taskForm = document.getElementById('taskForm');

    const openModal = (isEdit = false, taskData = null) => {
        isEditMode = isEdit;
        modalTitle.textContent = isEditMode ? 'Cập Nhật Công Việc' : 'Thêm Công Việc Mới';
        
        const maCvInput = document.getElementById('modal_ma_cv');
        maCvInput.readOnly = isEditMode;
        maCvInput.style.backgroundColor = isEditMode ? '#f1f5f9' : '';

        if (isEditMode && taskData) {
            // Fill data
            document.getElementById('modal_ma_nv').value = taskData.ma_nv || '';
            document.getElementById('modal_ma_cv').value = taskData.ma_cv || '';
            document.getElementById('modal_ten_cv').value = taskData.ten_cv || '';
            document.getElementById('modal_mo_ta').value = taskData.mo_ta_cv || '';
            document.getElementById('modal_loai_cv').value = taskData.loai_cv || 'Định kỳ';
            document.getElementById('modal_ngay_bat_dau').value = taskData.ngay_bat_dau && taskData.ngay_bat_dau !== '0000-00-00' ? taskData.ngay_bat_dau : '';
            document.getElementById('modal_ngay_hoan_thanh').value = taskData.ngay_hoan_thanh && taskData.ngay_hoan_thanh !== '0000-00-00' ? taskData.ngay_hoan_thanh : '';
            
            // Gán Cấp độ và Trạng thái dựa trên ID
            if (taskData.cap_do_id) document.getElementById('modal_cap_do_cv').value = taskData.cap_do_id;
            if (taskData.trang_thai_id) document.getElementById('modal_trang_thai_cv').value = taskData.trang_thai_id;
            document.getElementById('modal_ghi_chu').value = taskData.ghi_chu || '';
        } else {
            taskForm.reset();
        }

        taskModal.style.display = 'flex';
    };

    const closeModal = () => {
        taskModal.style.display = 'none';
        taskForm.reset();
        currentRow = null;
    };

    if (btnAddTaskGlobal) btnAddTaskGlobal.addEventListener('click', () => openModal(false));
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal();
    });

    // Delegate Sửa / Xóa
    if (tbody) {
        tbody.addEventListener('click', async (e) => {
            const btnEdit = e.target.closest('.btn-edit');
            const btnDelete = e.target.closest('.btn-delete');
            
            if (btnEdit) {
                const row = btnEdit.closest('tr');
                currentRow = row;
                const taskData = JSON.parse(row.dataset.task);
                openModal(true, taskData);
            }
            
            if (btnDelete) {
                const ma_cv = btnDelete.getAttribute('data-macv');
                if (ma_cv && confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
                    try {
                        const formData = new FormData();
                        formData.append('ma_cv', ma_cv);
                        const response = await fetch('api_delete_task.php', { method: 'POST', body: formData });
                        const result = await response.json();
                        if (result.success) {
                            btnDelete.closest('tr').remove();
                        } else {
                            alert('Lỗi: ' + result.message);
                        }
                    } catch (error) {
                        console.error(error);
                        alert('Lỗi kết nối khi xóa!');
                    }
                }
            }
        });
    }

    // Submit form (Thêm mới hoặc Cập nhật)
    if (btnApplyTask) {
        btnApplyTask.addEventListener('click', async (e) => {
            e.preventDefault();

            const ma_nv = document.getElementById('modal_ma_nv').value;
            const ma_cv = document.getElementById('modal_ma_cv').value.trim();
            const ten_cv = document.getElementById('modal_ten_cv').value.trim();

            if (!ma_nv || !ma_cv || !ten_cv) {
                alert("Vui lòng nhập đầy đủ Người phụ trách, Mã công việc và Tên công việc!");
                return;
            }

            btnApplyTask.textContent = "Đang xử lý...";
            btnApplyTask.disabled = true;

            const formData = new FormData();
            formData.append('ma_nv', ma_nv);
            formData.append('ma_cv', ma_cv);
            formData.append('ten_cv', ten_cv);
            formData.append('mo_ta_cv', document.getElementById('modal_mo_ta').value.trim());
            formData.append('loai_cv', document.getElementById('modal_loai_cv').value);
            formData.append('cap_do_id', document.getElementById('modal_cap_do_cv').value);
            formData.append('trang_thai_id', document.getElementById('modal_trang_thai_cv').value);
            formData.append('ngay_bat_dau', document.getElementById('modal_ngay_bat_dau').value);
            formData.append('ngay_hoan_thanh', document.getElementById('modal_ngay_hoan_thanh').value);
            formData.append('ghi_chu', document.getElementById('modal_ghi_chu').value.trim());

            const endpoint = isEditMode ? 'api_update_task_detail.php' : 'api_add_employee_task.php';

            try {
                const response = await fetch(endpoint, { method: 'POST', body: formData });
                const result = await response.json();

                if (result.success) {
                    closeModal();
                    loadAllTasks(); // Tải lại bảng để update dữ liệu
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
