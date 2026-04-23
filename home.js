document.addEventListener('DOMContentLoaded', () => {
    // === Variables ===
    let isEditMode = false;
    let currentRow = null;

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
        inputs: {
            ma_nv: document.getElementById('modal_ma_nv'),
            ten_nv: document.getElementById('modal_ten_nv'),
            vi_tri: document.getElementById('modal_vi_tri'),
            cap_do: document.getElementById('modal_cap_do'),
            trang_thai: document.getElementById('modal_trang_thai')
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

        // Event delegation cho nút Sửa và Xóa trong bảng
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
                    if (ma_cv && confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
                        try {
                            const formData = new FormData();
                            formData.append('ma_cv', ma_cv);

                            const response = await fetch('api_delete_task.php', {
                                method: 'POST',
                                body: formData
                            });
                            const result = await response.json();

                            if (result.success) {
                                row.remove();
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
    };

    // === Modal Actions ===
    const openModal = (isEdit = false) => {
        if (!UI.modal) return;

        isEditMode = isEdit;
        UI.modalTitle.textContent = isEditMode ? 'Cập nhật Công Việc' : 'Thêm Công Việc Mới';

        // Nếu là update thì khóa không cho sửa mã NV (Primary Key)
        UI.inputs.ma_nv.readOnly = isEditMode;
        if (isEditMode) {
            UI.inputs.ma_nv.style.backgroundColor = '#f1f5f9';
        } else {
            UI.inputs.ma_nv.style.backgroundColor = '';
        }

        UI.modal.style.display = 'flex';
        if (!isEditMode) UI.inputs.ma_nv.focus();
    };

    const closeModal = () => {
        if (!UI.modal) return;
        UI.modal.style.display = 'none';
        UI.form.reset();
        isEditMode = false;
        currentRow = null;
    };

    const handleEditRow = (row) => {
        currentRow = row;
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return;

        // Đổ dữ liệu từ bảng lên Modal
        UI.inputs.ma_nv.value = cells[0].textContent.trim();
        UI.inputs.ten_nv.value = cells[1].textContent.trim();
        UI.inputs.vi_tri.value = cells[2].textContent.trim();

        const capDoText = cells[3].textContent.trim();
        for (let option of UI.inputs.cap_do.options) {
            if (option.text === capDoText) {
                option.selected = true;
                break;
            }
        }

        const trangThaiText = cells[4].textContent.trim();
        for (let option of UI.inputs.trang_thai.options) {
            if (option.text === trangThaiText) {
                option.selected = true;
                break;
            }
        }

        openModal(true);
    };

    // === Data Handling ===
    const getFormData = () => {
        return {
            ma_nv: UI.inputs.ma_nv.value.trim(),
            ten_nv: UI.inputs.ten_nv.value.trim(),
            vi_tri: UI.inputs.vi_tri.value.trim(),
            cap_do_id: UI.inputs.cap_do.value,
            cap_do_text: UI.inputs.cap_do.options[UI.inputs.cap_do.selectedIndex].text,
            trang_thai_id: UI.inputs.trang_thai.value,
            trang_thai_text: UI.inputs.trang_thai.options[UI.inputs.trang_thai.selectedIndex].text
        };
    };

    const validateData = (data) => {
        if (!data.ma_nv || !data.ten_nv) {
            alert("Vui lòng nhập Mã nhân viên và Tên nhân viên!");
            return false;
        }
        return true;
    };

    const setApplyButtonState = (isProcessing) => {
        UI.btnApply.textContent = isProcessing ? 'Đang xử lý...' : 'Apply';
        UI.btnApply.disabled = isProcessing;
    };

    // === API Calls ===
    const submitToAPI = async (data, isEdit) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));

        const endpoint = isEdit ? 'api_update_task.php' : 'api_add_task.php';

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });

        return await response.json();
    };

    // === UI Updates ===
    const appendRowToTable = (data) => {
        const newRow = document.createElement('tr');
        const reportUrl = `report.html?id=${data.ma_nv}&name=${encodeURIComponent(data.ten_nv)}`;
        newRow.innerHTML = `
            <td><a href="${reportUrl}" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">${data.ma_nv}</a></td>
            <td><a href="${reportUrl}" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">${data.ten_nv}</a></td>
            <td>${data.vi_tri}</td>
            <td>${data.cap_do_text}</td>
            <td>${data.trang_thai_text}</td>
            <td>
                <button class="btn-edit" title="Sửa dòng này" style="color: #4CAF50; background: none; border: none; cursor: pointer; padding: 4px;">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button class="btn-delete" data-macv="${data.ma_cv}" title="Xóa dòng này" style="color: #f44336; background: none; border: none; cursor: pointer; padding: 4px;">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        `;
        newRow.style.animation = 'fadeInUp 0.3s ease-out';
        UI.tableBody.appendChild(newRow);
    };

    const updateExistingRow = (data) => {
        if (!currentRow) return;
        const cells = currentRow.querySelectorAll('td');
        const reportUrl = `report.html?id=${data.ma_nv}&name=${encodeURIComponent(data.ten_nv)}`;

        cells[0].innerHTML = `<a href="${reportUrl}" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">${data.ma_nv}</a>`;
        cells[1].innerHTML = `<a href="${reportUrl}" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">${data.ten_nv}</a>`;
        cells[2].textContent = data.vi_tri;
        cells[3].textContent = data.cap_do_text;
        cells[4].textContent = data.trang_thai_text;

        // Add a highlight animation
        currentRow.style.animation = 'none';
        currentRow.offsetHeight; /* trigger reflow */
        currentRow.style.animation = 'fadeInUp 0.3s ease-out';
    };

    // === Main Handlers ===
    const handleApply = async () => {
        const data = getFormData();

        if (!validateData(data)) return;

        setApplyButtonState(true);

        try {
            const result = await submitToAPI(data, isEditMode);

            if (result.success) {
                if (isEditMode) {
                    updateExistingRow(data);
                } else {
                    appendRowToTable(data);
                }
                closeModal();
            } else {
                alert('Lỗi khi lưu: ' + result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối đến máy chủ. Vui lòng kiểm tra lại!');
        } finally {
            setApplyButtonState(false);
        }
    };

    // === Initialization ===
    const loadInitialData = async () => {
        try {
            const response = await fetch('api_get_tasks.php');
            const result = await response.json();

            if (result.success && result.data) {
                // Xóa các dòng cũ trên bảng nếu có
                UI.tableBody.innerHTML = '';

                // Đổ dữ liệu từ CSDL vào bảng
                result.data.forEach(task => {
                    appendRowToTable(task);
                });
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu từ server:", error);
        }
    };

    // Bắt đầu khởi tạo sự kiện và dữ liệu
    initEvents();
    loadInitialData();
});
