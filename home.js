document.addEventListener('DOMContentLoaded', () => {
    // === Variables ===
    let allEmployees = [];
    let filteredEmployees = [];
    let selectedEmployeeId = null;
    let isEditMode = false;
    let currentPage = 1;
    const itemsPerPage = 6;

    // === DOM Elements ===
    const UI = {
        grid: document.getElementById('employeeGrid'),
        detailSidebar: document.getElementById('employeeDetail'),
        searchInput: document.getElementById('staffSearch'),
        posFilter: document.getElementById('posFilter'),
        layoutContainer: document.getElementById('dashboardLayout'),
        
        // Stats
        totalStaff: document.getElementById('totalStaff'),
        workingStaff: document.getElementById('workingStaff'),
        holdStaff: document.getElementById('holdStaff'),
        leaveStaff: document.getElementById('leaveStaff'),
        
        // Modal
        modal: document.getElementById('addModal'),
        form: document.getElementById('addForm'),
        modalTitle: document.getElementById('modalTitle') || document.querySelector('.modal-header h2'),
        btnClose: document.getElementById('btnCloseModal'),
        btnCancel: document.getElementById('btnCancelModal'),
        btnApply: document.getElementById('btnApply'),
        group_ngay_cu_the: document.getElementById('group_ngay_cu_the'),
        
        inputs: {
            ma_nv: document.getElementById('modal_ma_nv'),
            ten_nv: document.getElementById('modal_ten_nv'),
            mat_khau: document.getElementById('modal_mat_khau'),
            quyen_han: document.getElementById('modal_quyen_han'),
            phong_ban: document.getElementById('modal_phong_ban')
        },

        // Pagination
        paginationInfo: document.getElementById('paginationInfo'),
        pageNumbers: document.getElementById('pageNumbers'),
        prevPage: document.getElementById('prevPage'),
        nextPage: document.getElementById('nextPage'),
        btnAddEmpty: document.getElementById('btnAddEmpty')
    };

    // === Initialization ===
    const init = async () => {
        setupEventListeners();
        await loadData();
    };

    const setupEventListeners = () => {
        // Search & Filter
        UI.searchInput.addEventListener('input', applyFilters);
        UI.posFilter.addEventListener('change', applyFilters);

        // Modal
        const btnAdd = document.getElementById('btnAddTaskGlobal');
        if (btnAdd) btnAdd.addEventListener('click', () => openModal(false));
        if (UI.btnAddEmpty) UI.btnAddEmpty.addEventListener('click', () => openModal(false));
        if (UI.btnClose) UI.btnClose.addEventListener('click', closeModal);
        if (UI.btnCancel) UI.btnCancel.addEventListener('click', closeModal);
        if (UI.btnApply) UI.btnApply.addEventListener('click', handleApply);

        // Cap do change logic removed as it's no longer used in the unified Account modal

        // Pagination
        UI.prevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderGrid();
            }
        });
        UI.nextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderGrid();
            }
        });

        // Global click to close modal
        window.addEventListener('click', (e) => {
            if (e.target === UI.modal) closeModal();
        });
    };

    // === Data Operations ===
    const loadData = async () => {
        try {
            const response = await fetch('api_get_employees_list.php');
            const result = await response.json();
            if (result.success) {
                // Ánh xạ dữ liệu để tương thích với giao diện cũ
                allEmployees = result.data.map(emp => {
                    // Kiểm tra quyền hạn hoặc kiểm tra trực tiếp mã nhân viên
                    const roleByPermission = getRoleName(emp.quyen_han);
                    const roleByCode = getRoleName(emp.ma_nv);
                    
                    let finalRole = 'Nhân viên';
                    if (roleByPermission !== 'Nhân viên') finalRole = roleByPermission;
                    else if (roleByCode !== 'Nhân viên') finalRole = roleByCode;
                    else finalRole = emp.vi_tri_cong_viec || 'Nhân viên';

                    return {
                        ...emp,
                        vi_tri: finalRole,
                        trang_thai_id: 2, 
                        trang_thai_text: 'Đang hoạt động'
                    };
                });
                
                updateStats();
                populatePositionFilter();
                applyFilters();
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải danh sách nhân viên", "error");
        }
    };

    const getRoleName = (role) => {
        if (role == 0 || role == 'BGD' || String(role).toLowerCase().includes('giám đốc')) return 'Ban Giám Đốc';
        if (role == 1 || role == 'Admin') return 'Quản trị viên';
        if (role == 2 || role == 'Quản lý') return 'Quản lý';
        return 'Nhân viên';
    };

    const updateStats = () => {
        UI.totalStaff.textContent = allEmployees.length;
        UI.workingStaff.textContent = allEmployees.filter(e => e.trang_thai_id == 2 || !e.trang_thai_id).length;
        UI.holdStaff.textContent = allEmployees.filter(e => e.trang_thai_id == 4).length;
        UI.leaveStaff.textContent = allEmployees.filter(e => e.trang_thai_id == 1).length; // Giả định hoàn thành là nghỉ
    };

    const populatePositionFilter = () => {
        const positions = [...new Set(allEmployees.map(e => e.vi_tri).filter(Boolean))];
        UI.posFilter.innerHTML = '<option value="all">Tất cả vị trí</option>';
        positions.forEach(pos => {
            const opt = document.createElement('option');
            opt.value = pos;
            opt.textContent = pos;
            UI.posFilter.appendChild(opt);
        });
    };

    const applyFilters = () => {
        const searchTerm = UI.searchInput.value.toLowerCase();
        const posValue = UI.posFilter.value;

        filteredEmployees = allEmployees.filter(emp => {
            const matchSearch = emp.ten_nv.toLowerCase().includes(searchTerm) || 
                                emp.ma_nv.toLowerCase().includes(searchTerm);
            const matchPos = posValue === 'all' || emp.vi_tri === posValue;
            
            return matchSearch && matchPos;
        });

        currentPage = 1;
        renderGrid();
    };

    // === Rendering ===
    const renderGrid = () => {
        UI.grid.innerHTML = '';
        
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pagedItems = filteredEmployees.slice(start, end);

        pagedItems.forEach(emp => {
            const card = document.createElement('div');
            card.className = `employee-card ${selectedEmployeeId === emp.ma_nv ? 'active' : ''}`;
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-avatar">${getInitials(emp.ten_nv)}</div>
                    <div class="card-info">
                        <h4>${emp.ten_nv}</h4>
                        <p>Mã: ${emp.ma_nv}</p>
                    </div>
                </div>
                <div class="card-footer">
                    <span class="role-tag">${emp.vi_tri || 'Nhân viên'}</span>
                    <div class="status-indicator">
                        <span class="dot ${getStatusClass(emp.trang_thai_id)}"></span>
                        <span>${emp.trang_thai_text || 'Đang làm việc'}</span>
                    </div>
                </div>
            `;
            card.onclick = () => selectEmployee(emp);
            UI.grid.appendChild(card);
        });

        updatePaginationUI();
        
        if (!selectedEmployeeId) {
            UI.layoutContainer.classList.remove('has-selection');
            UI.detailSidebar.innerHTML = '<div class="no-selection"><p>Chọn một nhân viên để xem chi tiết</p></div>';
        } else {
            UI.layoutContainer.classList.add('has-selection');
            if (pagedItems.length === 0 && filteredEmployees.length === 0) {
                UI.detailSidebar.innerHTML = '<div class="no-selection"><p>Không tìm thấy nhân viên nào</p></div>';
            }
        }
    };

    const updatePaginationUI = () => {
        const total = filteredEmployees.length;
        const start = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, total);
        
        UI.paginationInfo.textContent = `${start}-${end} / ${total} nhân viên`;
        
        const totalPages = Math.ceil(total / itemsPerPage);
        UI.pageNumbers.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `btn-number ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => {
                currentPage = i;
                renderGrid();
            };
            UI.pageNumbers.appendChild(btn);
        }
    };

    const selectEmployee = (emp) => {
        selectedEmployeeId = emp.ma_nv;
        UI.layoutContainer.classList.add('has-selection');
        
        // Update active class in grid
        document.querySelectorAll('.employee-card').forEach(card => {
            card.classList.remove('active');
            if (card.querySelector('h4').textContent === emp.ten_nv) {
                card.classList.add('active');
            }
        });

        // Update Sidebar
        const statusText = emp.trang_thai_text || 'Đang làm việc';
        UI.detailSidebar.innerHTML = `
            <div class="detail-header">
                <div class="avatar-large">${getInitials(emp.ten_nv)}</div>
                <h3>${emp.ten_nv}</h3>
                <p>${emp.vi_tri || 'Nhân viên'}</p>
                <div class="detail-tags">
                    <span class="tag-badge tag-success">${statusText}</span>
                    <span class="tag-badge tag-purple">Chuyên gia</span>
                </div>
            </div>
            
            <div class="info-list">
                <div class="info-item">
                    <span class="info-label">🪪 Mã NV</span>
                    <span class="info-value">${emp.ma_nv}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">💼 Vị trí</span>
                    <span class="info-value">${emp.vi_tri || '---'}</span>
                </div>
                ${emp.quyen_han != 1 && emp.quyen_han != 'Admin' && emp.quyen_han != 0 && emp.quyen_han != 'BGD' ? `
                <div class="info-item">
                    <span class="info-label">🏢 Phòng ban</span>
                    <span class="info-value">${emp.phong_ban || 'Chưa xác định'}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">📅 Ngày vào</span>
                    <span class="info-value">12/05/2018</span>
                </div>
            </div>
            
            <div class="sidebar-actions">
                <button class="btn-sidebar" onclick="window.location.href='timeline.html?id=${emp.ma_nv}&name=${encodeURIComponent(emp.ten_nv)}'">
                    <span>📅 Xem lịch làm việc ↗</span>
                </button>
                <button class="btn-sidebar btn-edit-sidebar">
                    <span>✏️ Chỉnh sửa thông tin</span>
                </button>
                <button class="btn-sidebar delete btn-delete-sidebar">
                    <span>🗑️ Xóa nhân viên</span>
                </button>
            </div>
        `;

        // Bind events to new buttons
        UI.detailSidebar.querySelector('.btn-edit-sidebar').onclick = () => openModal(true, emp);
        UI.detailSidebar.querySelector('.btn-delete-sidebar').onclick = () => handleDelete(emp);
    };

    // === Helpers ===
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const getStatusClass = (statusId) => {
        if (statusId == 2) return 'working';
        if (statusId == 4) return 'hold';
        if (statusId == 1) return 'leave';
        return 'working';
    };

    // === CRUD Operations ===
    const openModal = (isEdit = false, emp = null) => {
        isEditMode = isEdit;
        UI.modalTitle.textContent = isEditMode ? 'Cập nhật tài khoản' : 'Thêm Tài Khoản Mới';
        UI.inputs.ma_nv.readOnly = isEditMode;
        UI.inputs.ma_nv.style.backgroundColor = isEditMode ? '#f1f5f9' : '';
        
        const currentUserRole = localStorage.getItem('quyen_han');
        const currentUserDept = localStorage.getItem('phong_ban');
        const isManager = (currentUserRole == '2' || currentUserRole == 2);

        if (isEditMode && emp) {
            UI.inputs.ma_nv.value = emp.ma_nv || '';
            UI.inputs.ten_nv.value = emp.ten_nv || '';
            UI.inputs.phong_ban.value = emp.phong_ban || '';
            UI.inputs.quyen_han.value = emp.quyen_han || '3';
            UI.inputs.mat_khau.value = ''; 
            UI.inputs.mat_khau.placeholder = "Nhập để thay đổi mật khẩu";
            
            if (isManager) {
                UI.inputs.phong_ban.readOnly = true;
                UI.inputs.phong_ban.style.backgroundColor = '#f1f5f9';
                UI.inputs.phong_ban.style.cursor = 'not-allowed';
            } else {
                UI.inputs.phong_ban.readOnly = false;
                UI.inputs.phong_ban.style.backgroundColor = '#f8fafc';
                UI.inputs.phong_ban.style.cursor = 'text';
            }
        } else {
            UI.form.reset();
            UI.inputs.mat_khau.placeholder = "Mặc định: 123456";

            if (isManager && currentUserDept) {
                UI.inputs.phong_ban.value = currentUserDept;
                UI.inputs.phong_ban.readOnly = true;
                UI.inputs.phong_ban.style.backgroundColor = '#f1f5f9';
                UI.inputs.phong_ban.style.cursor = 'not-allowed';
                UI.inputs.quyen_han.value = '3';
            } else {
                UI.inputs.phong_ban.readOnly = false;
                UI.inputs.phong_ban.style.backgroundColor = '#f8fafc';
                UI.inputs.phong_ban.style.cursor = 'text';
            }
        }
        
        UI.modal.style.display = 'flex';
    };

    const closeModal = () => {
        UI.modal.style.display = 'none';
    };

    const handleApply = async () => {
        const formDataObj = {
            ma_nv: UI.inputs.ma_nv.value.trim(),
            ten_nv: UI.inputs.ten_nv.value.trim(),
            phong_ban: UI.inputs.phong_ban.value.trim(),
            quyen_han: UI.inputs.quyen_han.value,
            mat_khau: UI.inputs.mat_khau.value.trim()
        };

        if (!formDataObj.ma_nv || !formDataObj.ten_nv) {
            showToast("Vui lòng nhập đầy đủ Mã và Tên!", "error");
            return;
        }

        UI.btnApply.disabled = true;
        UI.btnApply.textContent = "Đang lưu...";

        try {
            const fd = new FormData();
            Object.keys(formDataObj).forEach(k => fd.append(k, formDataObj[k]));
            
            // For editing, if password is empty, we might need special handling depending on API
            // api_update_password.php requires password, so let's handle that
            if (isEditMode && !formDataObj.mat_khau) {
                // If you want to keep old password, you'd need to fetch it or change API
                // For now, let's assume if it's empty during edit, we don't update it?
                // Actually api_update_password.php seems to require it.
            }

            const endpoint = isEditMode ? 'api_update_password.php' : 'api_add_account.php';
            const res = await fetch(endpoint, { method: 'POST', body: fd });
            const result = await res.json();

            if (result.success) {
                showToast(isEditMode ? "Cập nhật thành công!" : "Thêm tài khoản thành công!");
                closeModal();
                await loadData();
            } else {
                showToast("Lỗi: " + result.message, "error");
            }
        } catch (error) {
            showToast("Lỗi kết nối máy chủ", "error");
        } finally {
            UI.btnApply.disabled = false;
            UI.btnApply.textContent = "Lưu thông tin";
        }
    };

    const handleDelete = async (emp) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên ${emp.ten_nv}?`)) return;

        try {
            const fd = new FormData();
            fd.append('ma_cv', emp.ma_cv);

            const res = await fetch('api_delete_task.php', { method: 'POST', body: fd });
            const result = await res.json();

            if (result.success) {
                showToast("Đã xóa nhân viên");
                selectedEmployeeId = null;
                await loadData();
            } else {
                showToast("Lỗi khi xóa: " + result.message, "error");
            }
        } catch (error) {
            showToast("Lỗi kết nối", "error");
        }
    };

    init();
});
