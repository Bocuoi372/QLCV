document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('id');
    const empName = urlParams.get('name');

    const displayEmpName = document.getElementById('displayEmpName');
    const tbody = document.getElementById('reportTableBody');
    const lastSync = document.getElementById('lastSync');
    
    // Thống kê elements
    const statTotal = document.getElementById('statTotal');
    const statDone = document.getElementById('statDone');
    const statOverdue = document.getElementById('statOverdue');
    const statHelp = document.getElementById('statHelp');

    if (empName && displayEmpName) {
        displayEmpName.textContent = empName.toUpperCase();
    }

    let currentTasks = [];
    let isEditMode = false;
    const modalTitle = document.querySelector('#addTaskModal h2');
    const inputTenCv = document.getElementById('modal_ten_cv');
    const textareaMoTa = document.getElementById('modal_mo_ta');

    // === HÀM LẤY VÀ HIỂN THỊ DANH SÁCH CÔNG VIỆC ===
    const loadEmployeeTasks = async () => {
        try {
            if (!tbody) return;
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 60px;">Đang tải dữ liệu...</td></tr>';

            const url = empId ? `api_get_employee_tasks.php?id=${empId}` : `api_get_employee_tasks.php`;
            const response = await fetch(url);
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

                currentTasks = sortedData;
                tbody.innerHTML = '';
                
                if (currentTasks.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 60px; color: var(--text-muted);">Nhân viên này chưa có công việc nào.</td></tr>';
                }

                currentTasks.forEach((task, index) => {
                    const row = document.createElement('tr');
                    row.dataset.task = JSON.stringify(task);
                    
                    const levelStyle = task.cap_do_id == 1 ? 'color: #ef4444; font-weight: 700;' : 
                                      (task.cap_do_id == 2 ? 'color: #f59e0b; font-weight: 700;' : '');

                    row.innerHTML = `
                        <td style="text-align: center; color: var(--text-muted);">${index + 1}</td>
                        <td class="bold" style="color: var(--primary-light); font-family: monospace;">${task.ma_cv}</td>
                        <td class="bold" style="color: var(--text-main);">${task.ten_cv || ''}</td>
                        <td style="max-width: 400px; text-align: left;">${formatChecklist(task.mo_ta_cv)}</td>
                        <td>${getLevelBadge(task.cap_do_id)}</td>
                        <td><span class="badge" style="background: #f1f5f9; color: var(--text-muted);">${task.loai_cv || ''}</span></td>
                        <td style="font-weight: 600;">${formatDate(task.ngay_bat_dau)}</td>
                        <td style="font-weight: 600; color: #6366f1;">${formatDate(task.ngay_hoan_thanh)}</td>
                        <td style="text-align: center;">
                            ${(() => {
                                let sId = task.trang_thai_id;
                                let sText = task.trang_thai_text;
                                if (parseInt(task.tien_do || 0) >= 100) {
                                    sId = 1;
                                    sText = 'Hoàn thành';
                                }
                                return getStatusBadge(sId, sText);
                            })()}
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                if (result.stats) {
                    statTotal.textContent = result.stats.tong_so || 0;
                    statDone.textContent = result.stats.hoan_thanh || 0;
                    statOverdue.textContent = result.stats.qua_han || 0;
                    statHelp.textContent = result.stats.can_chi_dao || 0;
                }
                
                lastSync.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            }
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
            showToast('Lỗi kết nối máy chủ!', 'error');
        }
    };

    // Tabs logic
    const tabTimeline = document.getElementById('tabTimeline');
    if (tabTimeline) {
        tabTimeline.addEventListener('click', () => {
            window.location.href = `timeline.html?id=${empId}`;
        });
    }

    const tabReport = document.getElementById('tabReport');
    if (tabReport) {
        tabReport.addEventListener('click', () => {
            window.location.href = 'dashboard.html?mode=standalone';
        });
    }

    function getStatusBadge(id, text) {
        if (!id && text) {
            const t = text.toLowerCase();
            if (t.includes('hoàn thành')) id = 1;
            else if (t.includes('đang làm') || t.includes('thực hiện')) id = 2;
            else if (t.includes('tạm dừng')) id = 3;
            else id = 2;
        }
        const mapping = {
            '1': { text: 'Hoàn thành', color: '#166534', bg: '#dcfce7', border: '#bbf7d0' },
            '2': { text: 'Đang làm', color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
            '3': { text: 'Tạm dừng', color: '#92400e', bg: '#fef3c7', border: '#fde68a' }
        };
        const config = mapping[id] || mapping[String(id)] || mapping['2'];
        const style = `padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; display: inline-block; background: ${config.bg}; color: ${config.color}; border: 1px solid ${config.border};`;
        return `<span style="${style}">${config.text}</span>`;
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

    // Modal Add Task
    const btnAddTask = document.getElementById('btnAddTask');
    const taskModal = document.getElementById('addTaskModal');
    const btnCloseTaskModal = document.getElementById('btnCloseTaskModal');
    const btnCancelTaskModal = document.getElementById('btnCancelTaskModal');
    const btnApplyTask = document.getElementById('btnApplyTask');
    const addTaskForm = document.getElementById('addTaskForm');

    const openModal = () => { if (taskModal) taskModal.style.display = 'flex'; };
    const closeModal = () => { if (taskModal) taskModal.style.display = 'none'; };

    if (btnAddTask && empId) {
        btnAddTask.addEventListener('click', () => {
            isEditMode = false;
            modalTitle.textContent = 'Thêm Công Việc Mới';
            addTaskForm.reset();
            openModal();
            // Cho phép nhập mã công việc tự do
            document.getElementById('modal_ma_cv').value = '';
            document.getElementById('modal_ma_cv').readOnly = false;
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
            if (predefinedTasks.includes(val)) {
                textareaMoTa.value = "";
                let checklist = "";
                for (let i = 1; i <= 6; i++) {
                    checklist += `[ ] Hạng mục công việc ${i}\n`;
                }
                textareaMoTa.value = checklist.trim();
            }
        });
    }

    if (tbody) {
        tbody.addEventListener('click', async (e) => {
            const btnEdit = e.target.closest('.btn-edit');
            const btnDelete = e.target.closest('.btn-delete');

            if (btnEdit) {
                isEditMode = true;
                modalTitle.textContent = 'Cập Nhật Công Việc';
                const row = btnEdit.closest('tr');
                const task = JSON.parse(row.dataset.task);

                document.getElementById('edit_id').value = task.ma_cv;
                document.getElementById('modal_ma_cv').value = task.ma_cv;
                document.getElementById('modal_ma_cv').readOnly = false;
                document.getElementById('modal_ten_cv').value = task.ten_cv;
                document.getElementById('modal_mo_ta').value = task.mo_ta_cv || '';
                document.getElementById('modal_loai_cv').value = task.loai_cv || 'Định kỳ';
                document.getElementById('modal_cap_do_cv').value = task.cap_do_id || 3;
                document.getElementById('modal_ngay_bat_dau').value = task.ngay_bat_dau || '';
                document.getElementById('modal_ngay_hoan_thanh').value = task.ngay_hoan_thanh || '';
                document.getElementById('modal_trang_thai_cv').value = task.trang_thai_id || 2;
                document.getElementById('modal_tien_do').value = task.tien_do || 0;
                document.getElementById('modal_ghi_chu').value = task.ghi_chu || '';

                openModal();
            }

            if (btnDelete) {
                const ma_cv = btnDelete.getAttribute('data-macv');
                if (confirm(`Bạn có chắc chắn muốn xóa công việc ${ma_cv}?`)) {
                    try {
                        const formData = new FormData();
                        formData.append('ma_cv', ma_cv);
                        const response = await fetch('api_delete_task.php', { method: 'POST', body: formData });
                        const result = await response.json();
                        if (result.success) {
                            showToast("Đã xóa công việc!");
                            loadEmployeeTasks();
                        } else {
                            showToast("Lỗi: " + result.message, "error");
                        }
                    } catch (error) {
                        showToast("Lỗi kết nối!", "error");
                    }
                }
            }
        });
    }

    if (btnCloseTaskModal) btnCloseTaskModal.addEventListener('click', closeModal);
    if (btnCancelTaskModal) btnCancelTaskModal.addEventListener('click', closeModal);

    if (btnApplyTask) {
        btnApplyTask.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const ma_cv = document.getElementById('modal_ma_cv').value;
            const ten_cv = document.getElementById('modal_ten_cv').value;
            
            if (!empId) {
                showToast("Lỗi: Không xác định được nhân viên!", "error");
                return;
            }

            if (!ma_cv || !ten_cv) {
                showToast("Vui lòng điền mã và tên công việc!", "warning");
                return;
            }

            // Disable button
            const originalText = btnApplyTask.textContent;
            btnApplyTask.disabled = true;
            btnApplyTask.textContent = 'Đang lưu...';

            try {
                const formData = new FormData(addTaskForm);
                formData.append('ma_nv', empId);
                if (isEditMode) {
                    formData.append('old_ma_cv', document.getElementById('edit_id').value);
                }

                const endpoint = isEditMode ? 'api_update_task_detail.php' : 'api_add_task.php';
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    showToast(isEditMode ? "Cập nhật thành công!" : "Phân công công việc thành công!", "success");
                    closeModal();
                    addTaskForm.reset();
                    loadEmployeeTasks();
                } else {
                    showToast("Lỗi: " + result.message, "error");
                }
            } catch (error) {
                showToast("Lỗi kết nối server!", "error");
            } finally {
                btnApplyTask.disabled = false;
                btnApplyTask.textContent = originalText;
            }
        });
    }

    loadEmployeeTasks();
});
