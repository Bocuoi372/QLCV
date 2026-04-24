document.addEventListener('DOMContentLoaded', () => {
    // === Variables ===
    let isEditMode = false;
    let currentRow = null;
    let currentMaCv = null;
    let allTasksData = [];

    // === DOM Elements ===
    const UI = {
        btnAdd: document.querySelector('.btn-add'),
        modal: document.getElementById('addModal'),
        form: document.getElementById('addForm'),
        modalTitle: document.querySelector('.modal-header h2'),
        btnClose: document.getElementById('btnCloseModal'),
        btnCancel: document.getElementById('btnCancelModal'),
        btnApply: document.getElementById('btnApply'),
        tableBody: document.querySelector('tbody'),
        group_ngay_cu_the: document.getElementById('group_ngay_cu_the'),
        inputs: {
            ma_nv: document.getElementById('modal_ma_nv'),
            ten_nv: document.getElementById('modal_ten_nv'),
            vi_tri: document.getElementById('modal_vi_tri'),
            cap_do: document.getElementById('modal_cap_do'),
            trang_thai: document.getElementById('modal_trang_thai'),
            ngay_cu_the: document.getElementById('modal_ngay_cu_the')
        }
    };

    // === Event Listeners ===
    const initEvents = () => {
        if (UI.btnAdd) UI.btnAdd.addEventListener('click', () => openModal(false));
        if (UI.btnClose) UI.btnClose.addEventListener('click', closeModal);
        if (UI.btnCancel) UI.btnCancel.addEventListener('click', closeModal);
        if (UI.btnApply) UI.btnApply.addEventListener('click', handleApply);

        window.addEventListener('click', (e) => {
            if (e.target === UI.modal) closeModal();
        });

        if (UI.inputs.cap_do) {
            UI.inputs.cap_do.addEventListener('change', (e) => {
                if (e.target.value === '5') {
                    UI.group_ngay_cu_the.style.display = 'block';
                } else {
                    UI.group_ngay_cu_the.style.display = 'none';
                    UI.inputs.ngay_cu_the.value = '';
                }
            });
        }

        if (UI.tableBody) {
            UI.tableBody.addEventListener('click', async (e) => {
                const btnEdit = e.target.closest('.btn-edit');
                const btnDelete = e.target.closest('.btn-delete');

                if (btnEdit) {
                    const row = btnEdit.closest('tr');
                    handleEditRow(row);
                }

                if (btnDelete) {
                    const row = btnDelete.closest('tr');
                    const ma_cv = btnDelete.getAttribute('data-macv');
                    const ten_nv = btnDelete.getAttribute('data-tennv');

                    if (ma_cv && confirm(`Bạn có chắc chắn muốn xóa nhân viên ${ten_nv} (Mã CV: ${ma_cv}) khỏi danh sách này không?`)) {
                        try {
                            const formData = new FormData();
                            formData.append('ma_cv', ma_cv);

                            const response = await fetch('api_delete_task.php', {
                                method: 'POST',
                                body: formData
                            });
                            const result = await response.json();

                            if (result.success) {
                                showToast("Đã xóa thành công!");
                                loadInitialData();
                            } else {
                                showToast('Lỗi: ' + result.message, 'error');
                            }
                        } catch (error) {
                            console.error(error);
                            showToast('Lỗi kết nối khi xóa!', 'error');
                        }
                    }
                }
            });
        }
    };

    // === UI Rendering (Simplified) ===
    const renderTable = (data) => {
        if (!UI.tableBody) return;
        UI.tableBody.innerHTML = '';
        data.forEach((task, index) => {
            const row = document.createElement('tr');
            row.dataset.task = JSON.stringify(task);
            const reportUrl = `report.html?id=${task.ma_nv}&name=${encodeURIComponent(task.ten_nv)}`;
            
            row.innerHTML = `
                <td style="text-align: center;">${index + 1}</td>
                <td><a href="${reportUrl}" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">${task.ma_nv}</a></td>
                <td><a href="${reportUrl}" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">${task.ten_nv}</a></td>
                <td>${task.vi_tri}</td>
                <td>${getLevelBadge(task.cap_do_id || task.cap_do, task.cap_do_text)}</td>
                <td>${getStatusBadge(task.trang_thai_text)}</td>
                <td>
                    <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                        <button class="btn-action btn-schedule" onclick="window.location.href='timeline.html?id=${task.ma_nv}&name=${encodeURIComponent(task.ten_nv)}'" title="Xem lịch công việc Gantt" style="background: #d2691e; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Xem lịch</button>
                        <button class="btn-action btn-edit" title="Sửa nhân viên" style="color: #4f46e5; background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; gap: 4px;">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            <span style="font-weight: 800; font-size: 0.9rem;">Sửa</span>
                        </button>
                        ${task.ma_nv !== 'ADMIN' ? `
                        <button class="btn-action btn-delete" data-macv="${task.ma_cv}" data-tennv="${task.ten_nv}" title="Xóa nhân viên" style="color: #ef4444; background: none; border: none; cursor: pointer; padding: 4px;">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;
            UI.tableBody.appendChild(row);
        });
    };

    // === Modal Actions ===
    const openModal = (isEdit = false) => {
        if (!UI.modal) return;
        isEditMode = isEdit;
        UI.modalTitle.textContent = isEditMode ? 'Cập nhật Công Việc' : 'Thêm Công Việc Mới';
        UI.inputs.ma_nv.readOnly = isEditMode;
        UI.inputs.ma_nv.style.backgroundColor = isEditMode ? '#f1f5f9' : '';
        UI.modal.style.display = 'flex';
        UI.group_ngay_cu_the.style.display = UI.inputs.cap_do.value === '5' ? 'block' : 'none';
        if (!isEditMode) UI.inputs.ma_nv.focus();
    };

    const closeModal = () => {
        if (!UI.modal) return;
        UI.modal.style.display = 'none';
        UI.form.reset();
        isEditMode = false;
        currentRow = null;
        currentMaCv = null;
    };

    const handleEditRow = (row) => {
        currentRow = row;
        const task = JSON.parse(row.dataset.task || '{}');
        currentMaCv = task.ma_cv || null;
        UI.inputs.ma_nv.value = task.ma_nv || '';
        UI.inputs.ten_nv.value = task.ten_nv || '';
        UI.inputs.vi_tri.value = task.vi_tri || '';
        UI.inputs.ngay_cu_the.value = (task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '0000-00-00') ? task.ngay_hoan_thanh : '';
        if (task.cap_do_id) UI.inputs.cap_do.value = task.cap_do_id;
        if (task.trang_thai_id) UI.inputs.trang_thai.value = task.trang_thai_id;
        UI.inputs.cap_do.dispatchEvent(new Event('change'));
        openModal(true);
    };

    const handleApply = async () => {
        const formDataObj = {
            ma_nv: UI.inputs.ma_nv.value.trim(),
            ten_nv: UI.inputs.ten_nv.value.trim(),
            vi_tri: UI.inputs.vi_tri.value.trim(),
            cap_do_id: UI.inputs.cap_do.value,
            cap_do_text: UI.inputs.cap_do.options[UI.inputs.cap_do.selectedIndex].text,
            trang_thai_id: UI.inputs.trang_thai.value,
            trang_thai_text: UI.inputs.trang_thai.options[UI.inputs.trang_thai.selectedIndex].text,
            ngay_hoan_thanh: UI.inputs.ngay_cu_the ? UI.inputs.ngay_cu_the.value : ''
        };
        if (!formDataObj.ma_nv || !formDataObj.ten_nv) {
            showToast("Vui lòng nhập Mã và Tên nhân viên!", 'error');
            return;
        }
        if (isEditMode) formDataObj.ma_cv = currentMaCv;
        UI.btnApply.textContent = 'Đang xử lý...';
        UI.btnApply.disabled = true;
        try {
            const formData = new FormData();
            Object.keys(formDataObj).forEach(key => formData.append(key, formDataObj[key]));
            const endpoint = isEditMode ? 'api_update_task.php' : 'api_add_task.php';
            const response = await fetch(endpoint, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                showToast(isEditMode ? "Đã cập nhật!" : "Đã thêm mới!");
                loadInitialData();
                closeModal();
            } else {
                showToast('Lỗi: ' + result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Lỗi kết nối máy chủ!', 'error');
        } finally {
            UI.btnApply.textContent = 'Apply';
            UI.btnApply.disabled = false;
        }
    };

    const loadInitialData = async () => {
        try {
            const response = await fetch('api_get_tasks.php');
            const result = await response.json();
            if (result.success && result.data) {
                allTasksData = result.data;
                renderTable(allTasksData);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        }
    };

    function getStatusBadge(text) {
        let style = "background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; display: inline-block;";
        if (text && (text.includes('Đang làm việc') || text.includes('Hoạt động'))) {
            style = "background: #dcfce7; color: #10b981; border: 1px solid #bbf7d0; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; display: inline-block;";
        } else if (text && (text.includes('Đã nghỉ') || text.includes('Tạm dừng') || text.includes('Quá hạn'))) {
            style = "background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; display: inline-block;";
        }
        return `<span style="${style}">${text || 'N/A'}</span>`;
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
            '1': 'Khẩn cấp',
            '2': 'Quan trọng',
            '3': 'Bình thường',
            '4': 'Thấp',
            '5': 'Đặc biệt'
        };
        const label = mapping[id] || mapping[String(id)] || text || 'Bình thường';
        return label;
    }

    initEvents();
    loadInitialData();
});
