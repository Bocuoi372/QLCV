document.addEventListener('DOMContentLoaded', () => {

    const tbody = document.querySelector('#tasksTable tbody');
    let isEditMode = false;
    let currentRow = null;
    let employeeList = [];

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
            const response = await fetch('api_get_all_tasks.php?t=' + Date.now());
            const result = await response.json();

            if (result.success && result.data) {
                // Sắp xếp: Khẩn cấp/Cao (chưa xong) lên đầu, Hoàn thành xuống cuối
                const sortedData = result.data.sort((a, b) => {
                    const aDone = (a.trang_thai_id == 1 || parseInt(a.tien_do || 0) >= 100);
                    const bDone = (b.trang_thai_id == 1 || parseInt(b.tien_do || 0) >= 100);
                    
                    if (aDone !== bDone) return aDone ? 1 : -1;
                    if (!aDone) {
                        if (a.cap_do_id !== b.cap_do_id) return a.cap_do_id - b.cap_do_id;
                    }
                    return 0;
                });

                tbody.innerHTML = '';
                if (sortedData.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 100px; color: var(--text-muted);">Chưa có công việc nào trong hệ thống!</td></tr>';
                    return;
                }

                sortedData.forEach((task, index) => {
                    try {
                        const row = document.createElement('tr');
                        const reportUrl = `report.html?id=${task.ma_nv}&name=${encodeURIComponent(task.nguoi_phu_trach || task.ten_nv || '')}`;

                        row.dataset.task = JSON.stringify(task);

                        // --- AUTO-CORRECT LOGIC ---
                        let displayStatusText = task.trang_thai_text;
                        let displayStatusId = task.trang_thai_id;
                        if (parseInt(task.tien_do || 0) >= 100) {
                            displayStatusText = "Hoàn thành";
                            displayStatusId = 1;
                        }

                        row.innerHTML = `
                            <td style="text-align: center; color: var(--text-muted);">${index + 1}</td>
                            <td class="bold" style="color: var(--primary); font-family: monospace;">${task.ma_cv || '-'}</td>
                            <td class="bold" style="color: var(--text-main);">${task.ten_cv || ''}</td>
                            <td style="max-width: 400px; text-align: left;">${formatChecklist(task.mo_ta_cv)}</td>
                            <td class="bold"><a href="${reportUrl}" style="color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 5px;">👤 ${task.nguoi_phu_trach || 'Chưa phân công'}</a></td>
                            <td style="font-weight: 600;">${formatDate(task.ngay_bat_dau)}</td>
                            <td style="font-weight: 600; color: var(--primary);">${formatDate(task.ngay_hoan_thanh)}</td>
                            <td style="text-align: center;">${getLevelBadge(task.cap_do_id || task.cap_do, task.cap_do_text)}</td>
                            <td style="font-weight: 800; color: ${getProgressColor(task.tien_do)}; text-align: center;">${task.tien_do || 0}%</td>
                            <td class="bold">${getStatusBadge(displayStatusId, displayStatusText)}</td>
                            <td style="text-align: center;">
                                <div style="display: flex; gap: 8px; justify-content: center;">
                                    <button class="btn-edit" title="Sửa" style="color: #4f46e5; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        <span style="font-weight: 800; font-size: 0.85rem;">Sửa</span>
                                    </button>
                                    <button class="btn-delete" data-macv="${task.ma_cv}" title="Xóa" style="color: #ef4444; background: none; border: none; cursor: pointer;">
                                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                            </td>
                        `;
                        tbody.appendChild(row);
                    } catch (err) {
                        console.error("Lỗi render dòng:", task, err);
                    }
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="10" style="color: red; text-align: center; padding: 2rem;">Lỗi: ${result.message}</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="10" style="color: red; text-align: center; padding: 2rem;">Lỗi kết nối máy chủ!</td></tr>`;
        }
    };

    function getStatusBadge(id, text) {
        // Fallback: Nếu không có ID nhưng có text
        if (!id && text) {
            const t = text.toLowerCase();
            if (t.includes('hoàn thành')) id = 1;
            else if (t.includes('đang làm') || t.includes('thực hiện')) id = 2;
            else if (t.includes('tạm dừng') || t.includes('treo')) id = 3;
            else if (t.includes('hủy')) id = 4;
            else id = 2;
        }

        const mapping = {
            '1': { text: 'Hoàn thành', color: '#166534', bg: '#dcfce7', border: '#bbf7d0' },
            '2': { text: 'Đang làm', color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
            '3': { text: 'Tạm dừng', color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
            '4': { text: 'Đã hủy', color: '#991b1b', bg: '#fee2e2', border: '#fecaca' }
        };

        const config = mapping[id] || mapping[String(id)] || mapping['2'];
        const style = `padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; display: inline-block; background: ${config.bg}; color: ${config.color}; border: 1px solid ${config.border};`;
        return `<span style="${style}">${config.text}</span>`;
    }

    function getProgressColor(percent) {
        if (percent >= 100) return '#10b981';
        if (percent >= 50) return '#f59e0b';
        return '#ef4444';
    }

    function getLevelBadge(id, text) {
        if (!id && text) {
            const t = text.toLowerCase();
            if (t.includes('khẩn cấp')) id = 1;
            else if (t.includes('quan trọng') || t.includes('cao')) id = 2;
            else if (t.includes('thấp')) id = 4;
            else id = 3;
        }
        const mapping = {
            '1': { text: 'Khẩn cấp', color: '#ef4444', bg: '#fee2e2', border: '#fecaca' },
            '2': { text: 'Quan trọng', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
            '3': { text: 'Bình thường', color: '#4f46e5', bg: '#e0e7ff', border: '#c7d2fe' },
            '4': { text: 'Thấp', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' }
        };
        const config = mapping[id] || mapping[String(id)] || mapping['3'];
        const style = `padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; display: inline-block; background: ${config.bg}; color: ${config.color}; border: 1px solid ${config.border};`;
        return `<span style="${style}">${config.text}</span>`;
    }

    loadEmployees();
    loadAllTasks();

    const btnAddTaskGlobal = document.getElementById('btnAddTaskGlobal');
    const taskModal = document.getElementById('addModal');
    const taskForm = document.getElementById('addForm');
    const btnCancelTask = document.getElementById('btnCancelModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const modalTaskTitle = document.getElementById('modalTitle');
    const btnApply = document.getElementById('btnApply');
    const inputTenCv = document.getElementById('modal_ten_cv');
    const textareaMoTa = document.getElementById('modal_mo_ta');

    if (btnAddTaskGlobal) {
        btnAddTaskGlobal.addEventListener('click', () => {
            isEditMode = false;
            currentRow = null;
            modalTaskTitle.textContent = 'Thêm Công Việc Mới';
            taskForm.reset();
            document.getElementById('modal_ma_cv').readOnly = false;
            document.getElementById('progressValue').textContent = '0%';
            document.getElementById('modal_tien_do').value = 0;
            if (window.updateModalSliderUI) window.updateModalSliderUI();
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('modal_ngay_bat_dau').value = today;
            
            // Cho phép nhập mã công việc tự do
            document.getElementById('modal_ma_cv').value = '';
            
            taskModal.style.display = 'flex';
        });
    }

    if (inputTenCv) {
        inputTenCv.addEventListener('input', (e) => {
            const val = e.target.value;
            const predefinedTasks = [
                "Kiểm tra hệ thống định kỳ", "Báo cáo doanh thu tháng", "Bảo trì máy chủ",
                "Hỗ trợ khách hàng", "Cập nhật dữ liệu", "Đào tạo nhân viên mới",
                "Thiết kế Banner quảng cáo", "Lập kế hoạch Marketing"
            ];
            
            // Nếu chọn từ danh sách có sẵn thì xóa mô tả cũ và thêm checklist mới
            if (predefinedTasks.includes(val)) {
                textareaMoTa.value = ""; // Xóa trắng trước khi chèn mới
                let checklist = "";
                for (let i = 1; i <= 6; i++) {
                    checklist += `[ ] Hạng mục công việc ${i}\n`;
                }
                textareaMoTa.value = checklist.trim();
            }
        });
    }

    const closeModal = () => { 
        taskModal.style.display = 'none'; 
        isEditMode = false;
        currentRow = null;
    };
    if (btnCancelTask) btnCancelTask.addEventListener('click', closeModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);

    // Tìm kiếm trong bảng
    const taskSearch = document.getElementById('taskSearch');
    if (taskSearch) {
        taskSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const btnEdit = e.target.closest('.btn-edit');
            const btnDelete = e.target.closest('.btn-delete');

            if (btnEdit) {
                isEditMode = true;
                currentRow = btnEdit.closest('tr');
                modalTaskTitle.textContent = 'Cập Nhật Công Việc';
                const task = JSON.parse(currentRow.dataset.task);

                document.getElementById('edit_id').value = task.ma_cv; // Dùng ma_cv cũ làm key
                document.getElementById('modal_ma_cv').value = task.ma_cv;
                document.getElementById('modal_ma_cv').readOnly = false; // Cho phép sửa mã CV
                document.getElementById('modal_ten_cv').value = task.ten_cv;
                document.getElementById('modal_mo_ta').value = task.mo_ta_cv || '';
                document.getElementById('modal_ma_nv').value = task.ma_nv;
                document.getElementById('modal_ngay_bat_dau').value = task.ngay_bat_dau || '';
                document.getElementById('modal_ngay_hoan_thanh').value = task.ngay_hoan_thanh || '';
                document.getElementById('modal_tien_do').value = task.tien_do || 0;
                document.getElementById('modal_loai_cv').value = task.loai_cv || 'Định kỳ';
                document.getElementById('modal_cap_do_cv').value = task.cap_do_id || 3;
                document.getElementById('modal_trang_thai_cv').value = task.trang_thai_id || 2;
                document.getElementById('modal_ghi_chu').value = task.ghi_chu || '';

                document.getElementById('progressValue').textContent = (task.tien_do || 0) + '%';
                if (window.updateModalSliderUI) window.updateModalSliderUI();
                taskModal.style.display = 'flex';
            }

            if (btnDelete) {
                const ma_cv = btnDelete.getAttribute('data-macv');
                if (confirm(`Bạn có chắc chắn muốn xóa công việc ${ma_cv}?`)) {
                    handleDeleteTask(ma_cv);
                }
            }
        });
    }

    const handleDeleteTask = async (ma_cv) => {
        try {
            const formData = new FormData();
            formData.append('ma_cv', ma_cv);
            const response = await fetch('api_delete_task.php', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                showToast('Đã xóa công việc!');
                loadAllTasks();
            } else {
                showToast('Lỗi: ' + result.message, 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối máy chủ!', 'error');
        }
    };

    if (btnApply && taskForm) {
        btnApply.addEventListener('click', async () => {
            const ma_nv = document.getElementById('modal_ma_nv').value;
            const ma_cv = document.getElementById('modal_ma_cv').value;
            const ten_cv = document.getElementById('modal_ten_cv').value;

            if (!ma_nv || !ma_cv || !ten_cv) {
                showToast("Vui lòng chọn Người phụ trách và điền Mã/Tên CV!", "warning");
                return;
            }

            // Disable button to prevent multiple clicks
            const originalText = btnApply.textContent;
            btnApply.disabled = true;
            btnApply.textContent = 'Đang lưu...';

            const formData = new FormData();
            formData.append('ma_nv', ma_nv);
            formData.append('ma_cv', ma_cv); // Mã CV mới
            if (isEditMode) {
                formData.append('old_ma_cv', document.getElementById('edit_id').value);
            }
            formData.append('ten_cv', ten_cv);
            formData.append('mo_ta_cv', document.getElementById('modal_mo_ta').value);
            formData.append('loai_cv', document.getElementById('modal_loai_cv').value);
            formData.append('cap_do_id', document.getElementById('modal_cap_do_cv').value);
            formData.append('ngay_bat_dau', document.getElementById('modal_ngay_bat_dau').value);
            formData.append('ngay_hoan_thanh', document.getElementById('modal_ngay_hoan_thanh').value);
            formData.append('trang_thai_id', document.getElementById('modal_trang_thai_cv').value);
            formData.append('tien_do', document.getElementById('modal_tien_do').value);
            formData.append('ghi_chu', document.getElementById('modal_ghi_chu').value);

            const endpoint = isEditMode ? 'api_update_task_detail.php' : 'api_add_employee_task.php';

            try {
                const response = await fetch(endpoint, { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    showToast(isEditMode ? 'Đã cập nhật công việc!' : 'Đã thêm công việc!');
                    closeModal();
                    // Xóa tìm kiếm để thấy công việc mới cập nhật
                    if (taskSearch) taskSearch.value = '';
                    
                    // Thêm độ trễ nhỏ để DB kịp cập nhật trước khi load lại
                    setTimeout(() => {
                        loadAllTasks();
                    }, 500);
                } else {
                    showToast('Lỗi: ' + result.message, 'error');
                }
            } catch (error) {
                showToast('Lỗi kết nối!', 'error');
            } finally {
                btnApply.disabled = false;
                btnApply.textContent = originalText;
            }
        });
    }
});
