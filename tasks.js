document.addEventListener('DOMContentLoaded', () => {
    // === CÁC BIẾN TOÀN CỤC ===
    const tbody = document.querySelector('#tasksTable tbody');
    const monthFilterDisplay = document.getElementById('monthFilterDisplay');
    const btnPrevMonth = document.getElementById('btnPrevMonth');
    const btnNextMonth = document.getElementById('btnNextMonth');
    const taskSearch = document.getElementById('taskSearch');

    const taskModal = document.getElementById('addModal');
    const taskForm = document.getElementById('addForm');

    let allFetchedTasks = [];
    let employeeList = [];
    let isEditMode = false;
    let currentGlobalMonthDate = new Date();

    // === FILTER & SORT STATE ===
    const state = {
        sortCol: null,
        sortDir: 'asc',
        filterAssignees: [],
        filterStatuses: [],
        filterDateStart: '', // YYYY-MM-DD
        filterDateEnd: '',   // YYYY-MM-DD
        filterType: 'all',
        currentFilterCol: null
    };

    // === INITIALIZATION ===
    const init = () => {
        setupEventListeners();
        loadAllTasks();
        loadEmployees();
    };

    const setupEventListeners = () => {
        if (btnPrevMonth) btnPrevMonth.addEventListener('click', () => { currentGlobalMonthDate.setMonth(currentGlobalMonthDate.getMonth() - 1); updateMonthDisplay(); applyFilter(); });
        if (btnNextMonth) btnNextMonth.addEventListener('click', () => { currentGlobalMonthDate.setMonth(currentGlobalMonthDate.getMonth() + 1); updateMonthDisplay(); applyFilter(); });
        if (taskSearch) taskSearch.addEventListener('input', applyFilter);
        const filterStatusGlobal = document.getElementById('filterStatus');
        if (filterStatusGlobal) filterStatusGlobal.addEventListener('change', (e) => {
            state.filterType = e.target.value;
            applyFilter();
        });

        // Header Listeners
        const headers = {
            'headerAssignee': 'ten_nguoi_phu_trach',
            'headerStart': 'ngay_bat_dau',
            'headerEnd': 'ngay_hoan_thanh',
            'headerStatus': 'trang_thai_id'
        };

        Object.entries(headers).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', () => handleHeaderClick(id, key));
            }
        });
    };

    const handleHeaderClick = (id, key) => {
        const th = document.getElementById(id);
        const rect = th.getBoundingClientRect();
        
        // Sorting logic
        if (state.sortCol === key) {
            state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortCol = key;
            state.sortDir = 'asc';
        }

        // Show Filter Dropdown for all columns except the generic ones
        if (['ten_nguoi_phu_trach', 'trang_thai_id', 'ngay_bat_dau', 'ngay_hoan_thanh'].includes(key)) {
            state.currentFilterCol = key;
            showFilterDropdown(rect.left, rect.bottom, key);
        } else {
            closeFilterDropdown();
        }

        // Update Sorting UI
        document.querySelectorAll('th .sort-icon, th .filter-icon').forEach(icon => {
            icon.style.color = '#94a3b8';
            icon.style.transform = 'none';
        });
        
        const icon = th.querySelector('svg');
        if (icon) {
            icon.style.color = 'var(--primary)';
            if (state.sortDir === 'desc' && icon.classList.contains('sort-icon')) {
                icon.style.transform = 'rotate(180deg)';
            }
        }

        applyFilter();
    };

    const showFilterDropdown = (x, y, key) => {
        const dropdown = document.getElementById('filterDropdown');
        const list = document.getElementById('filterList');
        const dateUI = document.getElementById('dateFilterUI');
        const title = document.getElementById('filterTitle');
        if (!dropdown || !list || !dateUI) return;

        const isDateCol = key === 'ngay_bat_dau' || key === 'ngay_hoan_thanh';
        
        if (title) {
            if (key === 'trang_thai_id') title.textContent = 'Lọc trạng thái';
            else if (key === 'ten_nguoi_phu_trach') title.textContent = 'Lọc nhân viên';
            else if (key === 'ngay_bat_dau') title.textContent = 'Lọc ngày bắt đầu';
            else if (key === 'ngay_hoan_thanh') title.textContent = 'Lọc ngày kết thúc';
        }

        if (isDateCol) {
            list.style.display = 'none';
            dateUI.style.display = 'flex';
            const input = document.getElementById('filterDateInput');
            if (input) input.value = key === 'ngay_bat_dau' ? state.filterDateStart : state.filterDateEnd;
        } else {
            list.style.display = 'flex';
            dateUI.style.display = 'none';
            
            // Populate unique values
            const uniqueValues = [];
            const seen = new Set();
            const selectedMonth = `${currentGlobalMonthDate.getFullYear()}-${String(currentGlobalMonthDate.getMonth() + 1).padStart(2, '0')}`;

            allFetchedTasks.forEach(t => {
                let val, text;
                if (key === 'trang_thai_id') {
                    const { statusId, statusText } = getTaskDisplayStatus(t, selectedMonth);
                    val = String(statusId);
                    text = statusText;
                } else {
                    val = t[key];
                    text = val;
                }

                if (val && !seen.has(val)) {
                    seen.add(val);
                    uniqueValues.push({ id: val, text: text || 'Chưa giao' });
                }
            });
            uniqueValues.sort((a, b) => a.text.localeCompare(b.text));
            list.innerHTML = uniqueValues.map(v => {
                const isChecked = key === 'trang_thai_id' ? state.filterStatuses.includes(String(v.id)) : state.filterAssignees.includes(v.id);
                return `
                    <label class="filter-item">
                        <input type="checkbox" value="${v.id}" ${isChecked ? 'checked' : ''} onchange="toggleColumnFilter(this, '${key}')">
                        <span>${v.text}</span>
                    </label>
                `;
            }).join('');
        }

        dropdown.style.left = `${x}px`;
        dropdown.style.top = `${y + 5}px`;
        dropdown.style.display = 'flex';
    };

    window.applySpecificDateFilter = (val) => {
        if (state.currentFilterCol === 'ngay_bat_dau') state.filterDateStart = val;
        else if (state.currentFilterCol === 'ngay_hoan_thanh') state.filterDateEnd = val;
        applyFilter();
    };

    window.setFilterToday = () => {
        const today = new Date().toISOString().split('T')[0];
        const input = document.getElementById('filterDateInput');
        if (input) input.value = today;
        applySpecificDateFilter(today);
    };

    window.toggleColumnFilter = (checkbox, key) => {
        const val = checkbox.value;
        if (key === 'trang_thai_id') {
            if (checkbox.checked) state.filterStatuses.push(String(val));
            else state.filterStatuses = state.filterStatuses.filter(s => s !== String(val));
        } else {
            if (checkbox.checked) state.filterAssignees.push(val);
            else state.filterAssignees = state.filterAssignees.filter(s => s !== val);
        }
        applyFilter();
    };

    window.clearColumnFilter = () => {
        if (state.currentFilterCol === 'trang_thai_id') state.filterStatuses = [];
        else if (state.currentFilterCol === 'ten_nguoi_phu_trach') state.filterAssignees = [];
        else if (state.currentFilterCol === 'ngay_bat_dau') { state.filterDateStart = ''; if(document.getElementById('filterDateInput')) document.getElementById('filterDateInput').value = ''; }
        else if (state.currentFilterCol === 'ngay_hoan_thanh') { state.filterDateEnd = ''; if(document.getElementById('filterDateInput')) document.getElementById('filterDateInput').value = ''; }
        
        applyFilter();
        
        // Refresh UI if checklist
        if (['trang_thai_id', 'ten_nguoi_phu_trach'].includes(state.currentFilterCol)) {
            const checkboxes = document.querySelectorAll('#filterList input');
            checkboxes.forEach(c => c.checked = false);
        }
    };

    window.closeFilterDropdown = () => {
        const dropdown = document.getElementById('filterDropdown');
        if (dropdown) dropdown.style.display = 'none';
    };

    const getStatusLabel = (id) => {
        const labels = { '1': 'Hoàn thành', '2': 'Đang thực hiện', '3': 'Quá hạn', '4': 'Tạm dừng', '5': 'Xin chỉ đạo', '6': 'Chờ duyệt' };
        return labels[id] || 'Khác';
    };

    const parseMonth = (dateStr) => {
        if (!dateStr || dateStr === '-' || dateStr === '0000-00-00') return null;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}`;
        }
        return (dateStr && dateStr.length >= 7) ? dateStr.substring(0, 7) : null;
    };

    const updateMonthDisplay = () => {
        if (monthFilterDisplay) {
            const m = String(currentGlobalMonthDate.getMonth() + 1).padStart(2, '0');
            const y = currentGlobalMonthDate.getFullYear();
            monthFilterDisplay.textContent = `THÁNG ${m} / ${y}`;
        }
    };

    const getTaskDisplayStatus = (task, viewMonth = null) => {
        const typeStr = (task.loai_cv || 'Phát sinh').toLowerCase();
        const isPeriodic = typeStr.includes('định kỳ') || typeStr.includes('dinh ky');
        let taskMonth = parseMonth(task.ngay_bat_dau);
        let taskEndMonth = parseMonth(task.ngay_hoan_thanh) || taskMonth;
        
        const isNewMonthView = isPeriodic && viewMonth && taskEndMonth && viewMonth > taskEndMonth;

        let prog = parseInt(task.tien_do || 0);
        let statusId = task.trang_thai_id || 2;
        let statusText = task.trang_thai_text || 'Đang thực hiện';

        if (isNewMonthView) {
            prog = 0;
            statusId = 2;
            statusText = "Đang thực hiện";
        } else {
            if (task.trang_thai_id == 6) {
                statusId = 6;
                statusText = "Chờ phê duyệt";
            } else if (prog >= 100) {
                statusId = 1;
                statusText = "Hoàn thành";
            } else if (task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '0000-00-00') {
                const deadline = new Date(task.ngay_hoan_thanh);
                deadline.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (deadline < today) {
                    statusId = 3;
                    statusText = "Quá hạn";
                }
            }
        }
        return { statusId, statusText, prog, isNewMonthView };
    };

    const isNewMonthForTask = (task) => {
        if (!task) return false;
        const selectedMonth = `${currentGlobalMonthDate.getFullYear()}-${String(currentGlobalMonthDate.getMonth() + 1).padStart(2, '0')}`;
        return getTaskDisplayStatus(task, selectedMonth).isNewMonthView;
    };

    const getProgressColor = (val) => {
        if (val >= 100) return '#10b981';
        if (val >= 50) return '#f59e0b';
        return '#3b82f6';
    };

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 12px 24px; border-radius: 12px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'}; color: white;
            font-weight: 700; z-index: 9999; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            toast.style.transition = 'all 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // === RENDER BẢNG DỮ LIỆU ===
    const renderTable = (data, viewMonth = null) => {
        if (!tbody) return;
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 100px; color: #94a3b8;">Không tìm thấy công việc nào!</td></tr>';
            return;
        }

        data.forEach((task, index) => {
            const { statusId, statusText, prog, isNewMonthView } = getTaskDisplayStatus(task, viewMonth);
            
            const row = document.createElement('tr');
            let displayStart = task.ngay_bat_dau;
            let displayEnd = task.ngay_hoan_thanh;

            if (isNewMonthView) {
                displayStart = null;
                displayEnd = null;
            }

            let timeIcon = "";
            let timeClass = "";
            let daysLeft = null;

            if (!isNewMonthView && task.ngay_hoan_thanh && prog < 100) {
                const deadline = new Date(task.ngay_hoan_thanh);
                deadline.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const diffTime = deadline - today;
                daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (daysLeft < 0) {
                    timeIcon = "🚩 ";
                    timeClass = "alert-urgent";
                } else if (daysLeft === 0 || daysLeft === 1) {
                    timeIcon = "🔥 ";
                    timeClass = "alert-urgent";
                } else if (daysLeft <= 3) {
                    timeIcon = "⌛ ";
                    timeClass = "alert-warning";
                }
            }

            const progColor = prog >= 100 ? '#10b981' : (prog >= 50 ? '#f59e0b' : '#3b82f6');

            row.innerHTML = `
                <td style="text-align: center; color: #94a3b8; font-weight: 700;">${index + 1}</td>
                <td style="font-family: 'JetBrains Mono', monospace; color: var(--primary); font-weight: 800; font-size: 0.8rem; width: 100px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${task.ma_cv}">${task.ma_cv}</td>
                <td style="width: 300px; max-width: 300px;">
                    <a href="javascript:void(0);" onclick="event.preventDefault();" class="task-link" style="color: #1e293b; font-weight: 700; text-decoration: none; cursor: pointer; transition: all 0.2s; display: block; padding: 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='#1e293b'" title="${task.ten_cv}">
                        ${timeIcon}${task.ten_cv}
                    </a>
                    <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                        ${(() => {
                    const type = task.loai_cv || 'Phát sinh';
                    const isP = type.includes('Định kỳ');
                    const bgColor = isP ? '#e0e7ff' : '#fef3c7';
                    const textColor = isP ? '#4338ca' : '#b45309';
                    return `<span style="font-size: 0.65rem; padding: 1px 8px; border-radius: 4px; background: ${bgColor}; color: ${textColor}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid ${textColor}20;">${type}</span>`;
                })()}
                    </div>
                </td>
                <td style="width: 180px; max-width: 180px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 30px; height: 30px; min-width: 30px; flex-shrink: 0; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                            ${(task.ten_nguoi_phu_trach || '?').charAt(0).toUpperCase()}
                        </div>
                        <span style="font-weight: 700; font-size: 0.85rem; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;" title="${task.ten_nguoi_phu_trach}">${task.ten_nguoi_phu_trach || 'Chưa giao'}</span>
                    </div>
                </td>
                <td style="text-align: center; font-size: 0.85rem; color: #64748b; font-weight: 600;">${formatDate(displayStart)}</td>
                <td style="text-align: center; font-size: 0.85rem; font-weight: 700;"><span class="${timeClass}">${formatDate(displayEnd)}</span></td>
                <td style="text-align: center;">
                    <div class="premium-progress-wrapper" style="width: 100px; margin: 0 auto;">
                        <div class="premium-progress-text">
                            <span style="color: ${progColor}; font-size: 0.75rem;">${prog}%</span>
                        </div>
                        <div class="premium-progress-bar">
                            <div class="premium-progress-fill" style="width: ${prog}%; background: ${progColor};"></div>
                        </div>
                    </div>
                </td>
                <td style="text-align: center;">
                    ${(() => {
                    let bg = '#f1f5f9', color = '#64748b', label = statusText;
                    if (statusId == 1) { bg = '#d1fae5'; color = '#059669'; }
                    else if (statusId == 2) { bg = '#eff6ff'; color = '#2563eb'; }
                    else if (statusId == 3) { bg = '#fee2e2'; color = '#dc2626'; }
                    else if (statusId == 4) { bg = '#fef3c7'; color = '#d97706'; }
                    else if (statusId == 6) { bg = '#fef3c7'; color = '#d97706'; label = 'CHỜ DUYỆT'; }
                    return `<span class="status-badge" style="background: ${bg}; color: ${color}; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 0.7rem; border: 1px solid ${color}30; white-space: nowrap;">${label}</span>`;
                })()}
                </td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                        ${statusId == 6 ? `
                            <button onclick="approveTask('${task.ma_cv}')" class="btn-approve" style="background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 800; font-size: 0.7rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                                PHÊ DUYỆT
                            </button>
                        ` : ''}
                        <button type="button" class="btn-edit-action" style="width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);" title="Sửa">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button type="button" class="btn-delete-action" style="width: 36px; height: 36px; border-radius: 10px; border: 1px solid #fee2e2; background: #fef2f2; cursor: pointer; color: #ef4444; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.05);" title="Xóa">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            `;

            row.querySelector('.btn-edit-action').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openEditModal(task); });
            row.querySelector('.btn-delete-action').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); deleteTask(task.ma_cv); });
            const link = row.querySelector('.task-link');
            if (link) link.addEventListener('click', (e) => { e.preventDefault(); openSubTaskModal(task); });
            tbody.appendChild(row);
        });
    };


    // === CHỨC NĂNG SỬA ===
    window.openEditModal = (task) => {
        isEditMode = true;
        if (taskForm) taskForm.reset();
        document.getElementById('modalTitle').textContent = 'Chỉnh Sửa Công Việc';

        const { statusId, prog } = getTaskDisplayStatus(task, `${currentGlobalMonthDate.getFullYear()}-${String(currentGlobalMonthDate.getMonth() + 1).padStart(2, '0')}`);

        const fields = {
            'modal_ma_cv': task.ma_cv,
            'modal_ten_cv': task.ten_cv,
            'modal_mo_ta': task.mo_ta_cv,
            'modal_ma_nv': task.nguoi_phu_trach,
            'modal_loai_cv': task.loai_cv || 'Định kỳ',
            'modal_cap_do_cv': task.cap_do_id || 3,
            'modal_ngay_bat_dau': task.ngay_bat_dau,
            'modal_ngay_hoan_thanh': task.ngay_hoan_thanh,
            'modal_trang_thai_cv': statusId,
            'modal_tien_do': prog,
            'modal_ghi_chu': task.ghi_chu
        };

        for (const [id, val] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        }

        const modalMaCv = document.getElementById('modal_ma_cv');
        if (modalMaCv) modalMaCv.readOnly = true;

        updateModalSliderUI(task.tien_do || 0);
        const inputMoTa = document.getElementById('modal_mo_ta');
        if (inputMoTa) inputMoTa.dispatchEvent(new Event('input'));

        if (taskModal) taskModal.style.display = 'flex';
    };

    // === CHỨC NĂNG XÓA ===
    window.deleteTask = async (ma_cv) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa công việc ${ma_cv}?`)) return;
        try {
            const formData = new FormData();
            formData.append('ma_cv', ma_cv);
            const res = await fetch('api_delete_task.php', { method: 'POST', body: formData });
            const result = await res.json();
            if (result.success) {
                alert('Đã xóa thành công!');
                loadAllTasks();
            } else {
                alert('Lỗi: ' + result.message);
            }
        } catch (e) {
            alert('Lỗi kết nối khi xóa!');
        }
    };

    function formatDate(d) {
        if (!d || d === '0000-00-00') return '-';
        const parts = d.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // === API CALLS ===
    const loadAllTasks = async (isBackground = false) => {
        if (tbody && !isBackground) tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 50px;">⏳ Đang tải...</td></tr>';
        try {
            const res = await fetch('api_get_all_tasks.php?t=' + Date.now());
            const result = await res.json();
            if (result.success) {
                allFetchedTasks = result.data;
                updateHotspotBoard();
                if (!isBackground) checkAndShowNotifications();
                applyFilter();
            }
        } catch (e) { }
    };

    const updateHotspotBoard = (tasks = allFetchedTasks) => {
        const hotspotWidget = document.getElementById('hotspotWidget');
        const hotspotList = document.getElementById('hotspotList');
        const hotspotCount = document.getElementById('hotspotCount');
        if (!hotspotWidget || !hotspotList) return;

        const selectedMonth = `${currentGlobalMonthDate.getFullYear()}-${String(currentGlobalMonthDate.getMonth() + 1).padStart(2, '0')}`;

        const urgentTasks = tasks.filter(t => {
            if (!t.ngay_hoan_thanh || t.ngay_hoan_thanh === '-' || t.ngay_hoan_thanh === '0000-00-00' || parseInt(t.tien_do) >= 100) return false;

            // Chỉ xét các công việc thuộc tháng đang chọn
            if (t.ngay_hoan_thanh.substring(0, 7) !== selectedMonth) return false;

            const deadline = new Date(t.ngay_hoan_thanh);
            deadline.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 2;
        });

        if (urgentTasks.length > 0) {
            hotspotWidget.style.display = 'block';
            if (hotspotCount) hotspotCount.textContent = `${urgentTasks.length} việc khẩn cấp`;
            hotspotList.innerHTML = urgentTasks.map(t => {
                const deadline = new Date(t.ngay_hoan_thanh);
                deadline.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                const label = diffDays < 0 ? 'Đã quá hạn' : (diffDays === 0 ? 'Hết hạn hôm nay' : `Còn ${diffDays} ngày`);
                return `
                    <div style="background: white; padding: 16px; border-radius: 16px; border: 1px solid #fee2e2; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s; cursor: default;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <span style="font-weight: 800; color: #991b1b; font-size: 0.95rem; line-height: 1.3;">${t.ten_cv}</span>
                            <span style="font-size: 0.65rem; padding: 4px 10px; border-radius: 20px; background: #fee2e2; color: #dc2626; font-weight: 900; text-transform: uppercase;">${label}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <div style="font-size: 0.8rem; color: #475569; display: flex; align-items: center; gap: 6px;">
                                <span style="opacity: 0.7;">👤</span> <b>${t.ten_nguoi_phu_trach || '...'}</b>
                            </div>
                            <div style="font-size: 0.8rem; color: #475569; display: flex; align-items: center; gap: 6px;">
                                <span style="opacity: 0.7;">📅</span> <b>${formatDate(t.ngay_hoan_thanh)}</b>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            hotspotWidget.style.display = 'none';
        }
    };

    const checkAndShowNotifications = () => {
        const urgentCount = allFetchedTasks.filter(t => {
            if (!t.ngay_hoan_thanh || parseInt(t.tien_do) >= 100) return false;
            const deadline = new Date(t.ngay_hoan_thanh).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            return deadline === today;
        }).length;
        if (urgentCount > 0) showToast(`Bạn có ${urgentCount} công việc hết hạn hôm nay!`, 'error');
    };

    const loadEmployees = async () => {
        try {
            const res = await fetch('api_get_employees_list.php');
            const result = await res.json();
            if (result.success) {
                employeeList = result.data;
                const sel = document.getElementById('modal_ma_nv');
                const subSel = document.getElementById('sub_ma_nv');
                const options = '<option value="">-- Chọn nhân viên --</option>' + employeeList.map(nv => `<option value="${nv.ma_nv}">${nv.ten_nv} (${nv.ma_nv})</option>`).join('');
                if (sel) sel.innerHTML = options;
                if (subSel) subSel.innerHTML = options;
            }
        } catch (e) { }
    };

    const applyFilter = () => {
        const term = (taskSearch?.value || '').toLowerCase();
        const selectedMonth = `${currentGlobalMonthDate.getFullYear()}-${String(currentGlobalMonthDate.getMonth() + 1).padStart(2, '0')}`;

        // Prepare Relay Logic (similar to staff.js)
        const maxStartMonthPerMaCv = {};
        const specificRecordsCount = {};
        allFetchedTasks.forEach(t => {
            const startMonth = parseMonth(t.ngay_bat_dau) || parseMonth(t.ngay_hoan_thanh);
            const isRecurring = (t.loai_cv || '').toLowerCase().includes('định kỳ') || (t.loai_cv || '').toLowerCase().includes('dinh ky');
            if (isRecurring && startMonth) {
                if (!maxStartMonthPerMaCv[t.ma_cv] || startMonth > maxStartMonthPerMaCv[t.ma_cv]) {
                    maxStartMonthPerMaCv[t.ma_cv] = startMonth;
                }
                if (startMonth === selectedMonth) {
                    specificRecordsCount[t.ma_cv] = (specificRecordsCount[t.ma_cv] || 0) + 1;
                }
            }
        });

        let filtered = allFetchedTasks.filter(t => {
            const typeStr = (t.loai_cv || 'Phát sinh').toLowerCase();
            const isPeriodic = typeStr.includes('định kỳ') || typeStr.includes('dinh ky');
            const isArising = !isPeriodic;
            let taskOriginalMonth = parseMonth(t.ngay_bat_dau);
            if (!taskOriginalMonth) taskOriginalMonth = parseMonth(t.ngay_hoan_thanh);

            let isVisible = false;
            if (!isPeriodic) {
                isVisible = (taskOriginalMonth === selectedMonth);
            } else if (taskOriginalMonth === selectedMonth) {
                isVisible = true;
            } else if (taskOriginalMonth && selectedMonth > taskOriginalMonth) {
                // Relay: Only carry over the LATEST past record if no current month record exists
                isVisible = (taskOriginalMonth === maxStartMonthPerMaCv[t.ma_cv]) && (!specificRecordsCount[t.ma_cv]);
            }

            if (!isVisible) return false;
            
            // Global Filter (Type)
            if (state.filterType === 'periodic') { if (!isPeriodic) return false; }
            else if (state.filterType === 'arising') { if (!isArising) return false; }
            else if (state.filterType === 'due-soon') {
                if (parseInt(t.tien_do) >= 100 || !t.ngay_hoan_thanh || t.ngay_hoan_thanh === '0000-00-00') return false;
                const deadline = new Date(t.ngay_hoan_thanh);
                deadline.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)) > 2) return false;
            }

            // Column Filters (Checklist Multi-select)
            const { statusId: displayStatusId } = getTaskDisplayStatus(t, selectedMonth);

            if (state.filterAssignees.length > 0) {
                if (!state.filterAssignees.includes(t.ten_nguoi_phu_trach)) return false;
            }
            if (state.filterStatuses.length > 0) {
                if (!state.filterStatuses.includes(String(displayStatusId))) return false;
            }
            
            // Column Filters (Date Specific)
            if (state.filterDateStart) {
                if (t.ngay_bat_dau !== state.filterDateStart) return false;
            }
            if (state.filterDateEnd) {
                if (t.ngay_hoan_thanh !== state.filterDateEnd) return false;
            }

            // Search Term
            const searchContent = `${t.ma_cv} ${t.ten_cv} ${t.ten_nguoi_phu_trach} ${t.ghi_chu || ''}`.toLowerCase();
            return searchContent.includes(term);
        });

        // Apply Sorting
        if (state.sortCol) {
            filtered.sort((a, b) => {
                let valA = a[state.sortCol];
                let valB = b[state.sortCol];

                // Special handling for nulls or empty dates
                if (!valA) valA = '';
                if (!valB) valB = '';

                if (state.sortCol === 'trang_thai_id' || state.sortCol === 'tien_do') {
                    valA = parseInt(valA);
                    valB = parseInt(valB);
                }

                if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
                if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        renderTable(filtered, selectedMonth);
        updateHotspotBoard(filtered);
    };

    init();

    const closeAllModals = () => { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); };
    const closeButtons = ['btnCancelModal', 'btnCloseModal', 'btnCloseSubTaskModal', 'btnCloseSubTaskModalFooter'];
    closeButtons.forEach(id => { const btn = document.getElementById(id); if (btn) btn.onclick = (e) => { e.preventDefault(); closeAllModals(); }; });

    // Riêng các nút đóng modal con (sub-task edit) thì chỉ đóng chính nó
    ['btnCloseSubTaskEditModal', 'btnCancelSubEdit'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = (e) => { e.preventDefault(); if (subEditModal) subEditModal.style.display = 'none'; };
    });
    window.onclick = (e) => { if (e.target.classList.contains('modal-overlay')) e.target.style.display = 'none'; };

    const btnApply = document.getElementById('btnApply');
    if (btnApply) {
        btnApply.onclick = async () => {
            const maNv = document.getElementById('modal_ma_nv').value;
            const maCv = document.getElementById('modal_ma_cv').value;
            const tenCv = document.getElementById('modal_ten_cv').value;
            if (!maNv || !maCv || !tenCv) { alert('Vui lòng điền đầy đủ các trường có dấu sao (*)'); return; }
            const fd = new FormData();
            fd.append('ma_nv', maNv);
            fd.append('ma_cv', maCv);
            fd.append('ten_cv', tenCv);
            fd.append('mo_ta_cv', document.getElementById('modal_mo_ta').value);
            fd.append('loai_cv', document.getElementById('modal_loai_cv').value);
            fd.append('cap_do_id', document.getElementById('modal_cap_do_cv').value);
            fd.append('ngay_bat_dau', document.getElementById('modal_ngay_bat_dau').value);
            fd.append('ngay_hoan_thanh', document.getElementById('modal_ngay_hoan_thanh').value);
            fd.append('trang_thai_id', document.getElementById('modal_trang_thai_cv').value);
            fd.append('tien_do', document.getElementById('modal_tien_do').value);
            fd.append('ghi_chu', document.getElementById('modal_ghi_chu').value);
            if (isEditMode) fd.append('old_ma_cv', maCv);
            const originalText = btnApply.textContent;
            btnApply.disabled = true; btnApply.textContent = '⏳ Đang lưu...';
            const endpoint = isEditMode ? 'api_update_task_detail.php' : 'api_add_employee_task.php';
            try {
                const res = await fetch(endpoint, { method: 'POST', body: fd });
                const result = await res.json();
                if (result.success) { alert('Lưu thành công!'); taskModal.style.display = 'none'; loadAllTasks(); }
                else alert('Lỗi: ' + result.message);
            } catch (e) { alert('Lỗi kết nối máy chủ!'); }
            finally { btnApply.disabled = false; btnApply.textContent = originalText; }
        };
    }

    const btnAdd = document.getElementById('btnAddTaskGlobal');
    if (btnAdd) {
        btnAdd.onclick = () => {
            isEditMode = false; taskForm.reset();
            document.getElementById('modalTitle').textContent = 'Thêm Công Việc Mới';
            document.getElementById('modal_ma_cv').readOnly = false;
            const today = new Date().toISOString().split('T')[0];
            const startDateInput = document.getElementById('modal_ngay_bat_dau');
            if (startDateInput) startDateInput.value = today;
            updateModalSliderUI(0);
            taskModal.style.display = 'flex';
        };
    }

    // === QUẢN LÝ SUB-TASKS & CHECKLIST ===
    const subModal = document.getElementById('subTaskModal');
    const subBody = document.getElementById('subTaskTableBody');
    const btnAddSubTask = document.getElementById('btnAddSubTask');
    const subEditModal = document.getElementById('subTaskEditModal');
    const subForm = document.getElementById('subTaskForm');
    let currentParentMaCv = null;
    let editingSubId = null;

    window.openSubTaskModal = async (task) => {
        currentParentMaCv = task.ma_cv;
        const parentInfo = document.getElementById('parentTaskName');
        if (parentInfo) parentInfo.textContent = `Công việc: ${task.ten_cv}`;
        if (subModal) subModal.style.display = 'flex';
        loadSubTasks(task.ma_cv, false, task); // Pass task object
    };

    const loadSubTasks = async (ma_cv_cha, isBackground = false, taskOverride = null) => {
        if (subBody && !isBackground) subBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">⏳ Đang tải dữ liệu...</td></tr>';
        try {
            const res = await fetch(`api_get_subtasks.php?ma_cv_cha=${encodeURIComponent(ma_cv_cha)}&t=` + Date.now());
            const result = await res.json();
            if (result.success) renderSubTasks(result.data, taskOverride);
            else subBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">❌ ${result.message}</td></tr>`;
        } catch (e) { subBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">❌ Lỗi kết nối!</td></tr>'; }
    };

    const handleModalChecklistToggle = async (isChecked, lineIdx, task) => {
        let lines = task.mo_ta_cv.replace(/\r/g, '').split('\n');
        const isNewMonth = isNewMonthForTask(task);

        // Nếu là tháng mới, ta reset toàn bộ các ô checkbox khác về [ ] trước khi xử lý ô hiện tại
        if (isNewMonth) {
            lines = lines.map(line => line.replace(/^(\s*\[)\s*[xX]\s*(\]\s*)/i, '$1 $2'));
        }

        if (lines[lineIdx] && lines[lineIdx].trim().match(/^\[\s*[xX\s]*\s*\]/)) {
            lines[lineIdx] = lines[lineIdx].replace(/^(\s*\[)\s*[xX\s]*\s*(\]\s*)/, `$1${isChecked ? 'x' : ' '}$2`);
        }
        const newDesc = lines.join('\n');
        task.mo_ta_cv = newDesc;
        const checklistLines = lines.filter(l => l.trim().match(/^\[\s*[xX\s]*\s*\]/));
        const checkedCount = checklistLines.filter(l => l.trim().match(/^\[\s*[xX]\s*\]/i)).length;
        const newProgress = checklistLines.length > 0 ? Math.round((checkedCount / checklistLines.length) * 100) : 0;
        task.tien_do = newProgress;
        const fd = new FormData();
        if (task.id) fd.append('id', task.id); // Priority: update by ID
        fd.append('ma_cv', task.ma_cv);
        fd.append('tien_do', newProgress);
        fd.append('mo_ta_cv', newDesc);

        // QUAN TRỌNG: Luôn gửi ngay_hoan_thanh về hôm nay khi có bất kỳ ô nào được tích
        // để đảm bảo sau khi reload, isNewMonth = false và checklist không bị reset
        if (newProgress > 0) {
            const today = new Date().toISOString().split('T')[0];
            fd.append('ngay_hoan_thanh', today);
            task.ngay_hoan_thanh = today;
            if (!task.ngay_bat_dau || task.ngay_bat_dau === '0000-00-00') {
                fd.append('ngay_bat_dau', today);
                task.ngay_bat_dau = today;
            }
        }

        if (isNewMonth) {
            const selectedMonthStr = `${currentGlobalMonthDate.getFullYear()}-${String(currentGlobalMonthDate.getMonth() + 1).padStart(2, '0')}`;
            const newDate = selectedMonthStr + '-01';
            fd.append('ngay_bat_dau', newDate);
            task.ngay_bat_dau = newDate;
            if (!isChecked) {
                fd.append('ngay_hoan_thanh', newDate);
                task.ngay_hoan_thanh = newDate;
            } else {
                task.ngay_hoan_thanh = new Date().toISOString().split('T')[0];
                fd.append('ngay_hoan_thanh', task.ngay_hoan_thanh);
            }
        }

        try { 
            // 1. Cập nhật giao diện Modal ngay lập tức
            renderSubTasks(null, task); 
            
            // 2. Đồng bộ mảng tổng để bảng bên ngoài và Thống kê nhảy số ngay
            const globalIdx = allFetchedTasks.findIndex(t => t.id === task.id || t.ma_cv === task.ma_cv);
            if (globalIdx !== -1) {
                allFetchedTasks[globalIdx].tien_do = newProgress;
                allFetchedTasks[globalIdx].mo_ta_cv = newDesc;
                if (task.ngay_hoan_thanh) allFetchedTasks[globalIdx].ngay_hoan_thanh = task.ngay_hoan_thanh;
                if (task.ngay_bat_dau) allFetchedTasks[globalIdx].ngay_bat_dau = task.ngay_bat_dau;
            }
            applyFilter(); // Vẽ lại bảng ngoài & thống kê stats

            // 3. Gửi lên server
            const response = await fetch('api_update_progress.php', { method: 'POST', body: fd }); 
            const resData = await response.json();
            
            if (!resData.success) {
                console.error('Lỗi khi lưu:', resData.message);
                loadSubTasks(task.ma_cv); 
            } else {
                loadAllTasks(true); // Đồng bộ nền để cập nhật các dữ liệu khác nếu có
            }
        } catch (e) { 
            console.error('Lỗi kết nối:', e);
            loadSubTasks(task.ma_cv);
        }
    };

    const saveChecklistAfterEdit = async (newMoTa, task) => {
        const lines = newMoTa.replace(/\r/g, '').split('\n');
        const checklistLines = lines.filter(l => l.trim().match(/^\[\s*[xX\s]*\s*\]/));
        const checkedCount = checklistLines.filter(l => l.trim().match(/^\[\s*[xX]\s*\]/i)).length;
        const newProgress = checklistLines.length > 0 ? Math.round((checkedCount / checklistLines.length) * 100) : 0;

        task.mo_ta_cv = newMoTa;
        task.tien_do = newProgress;

        const fd = new FormData();
        if (task.id) fd.append('id', task.id);
        fd.append('ma_cv', task.ma_cv);
        fd.append('tien_do', newProgress);
        fd.append('mo_ta_cv', newMoTa);

        try {
            await fetch('api_update_progress.php', { method: 'POST', body: fd });
            loadSubTasks(task.ma_cv, true, task);
            loadAllTasks(true);
        } catch (e) { }
    };

    const renderSubTasks = (data, taskOverride = null) => {
        if (!subBody) return;
        subBody.innerHTML = '';
        const parentTask = taskOverride || allFetchedTasks.find(t => t.ma_cv === currentParentMaCv);
        const rawDesc = parentTask?.mo_ta_cv || '';
        const lines = rawDesc.replace(/\r/g, '').split('\n');
        const checklistItems = lines.map((l, idx) => ({ line: l, idx: idx }))
                                   .filter(item => item.line.trim().match(/^\[\s*[xX\s]*\s*\]/));

        const isNewMonth = isNewMonthForTask(parentTask);

        // Nếu không có sub-task từ DB và không có checklist, nhưng có mô tả chính -> Hiện mô tả chính như 1 dòng
        if ((!data || data.length === 0) && checklistItems.length === 0 && rawDesc && rawDesc.trim()) {
            const row = document.createElement('tr');
            let prog = parseInt(parentTask.tien_do || 0);
            if (isNewMonth) prog = 0;
            const progColor = getProgressColor(prog);
            
            row.innerHTML = `
                <td style="padding-left: 20px; vertical-align: middle; max-width: 400px; word-break: break-word; white-space: normal;">
                    <div style="display: flex; align-items: center; gap: 16px; padding: 14px 0;">
                        <span style="font-weight: 700; color: #1e293b; line-height: 1.5; font-size: 0.95rem;">${rawDesc.replace(/\n/g, '<br>')}</span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                            ${(parentTask.ten_nguoi_phu_trach || '?').charAt(0).toUpperCase()}
                        </div>
                        <span style="font-size: 0.9rem; font-weight: 700; color: #475569;">${parentTask.ten_nguoi_phu_trach || '-'}</span>
                    </div>
                </td>
                <td style="color: #64748b; font-size: 0.85rem; font-weight: 600;">${formatDate(parentTask.ngay_bat_dau)}</td>
                <td style="color: #64748b; font-size: 0.85rem; font-weight: 600;">${formatDate(parentTask.ngay_hoan_thanh)}</td>
                <td>
                    ${(() => {
                        const capDo = parentTask.ten_cap_do || 'BT';
                        let bCls = 'badge-info';
                        if (capDo.includes('Khẩn') || capDo.includes('Cao')) bCls = 'badge-danger';
                        else if (capDo.includes('Thấp')) bCls = 'badge-warning';
                        return `<span class="badge-pill ${bCls}" style="font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 20px;">${capDo}</span>`;
                    })()}
                </td>
                <td style="padding: 12px 0;">
                    <div class="premium-progress-wrapper" style="width: 110px;">
                        <div class="premium-progress-text" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="color: ${progColor}; font-weight: 800; font-size: 0.85rem;">${prog}%</span>
                        </div>
                        <div class="premium-progress-bar" style="height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                            <div class="premium-progress-fill" style="width: ${prog}%; background: ${progColor}; height: 100%;"></div>
                        </div>
                    </div>
                </td>
                <td>
                    ${(() => {
                        let statusId = parentTask.trang_thai_id || 2;
                        let statusText = parentTask.trang_thai_text || 'Đang thực hiện';
                        const prog = parseInt(parentTask.tien_do || 0);
                        
                        if (prog >= 100) {
                            statusId = 1;
                            statusText = 'Hoàn thành';
                        } else if (parentTask.ngay_hoan_thanh && parentTask.ngay_hoan_thanh !== '-' && parentTask.ngay_hoan_thanh !== '0000-00-00') {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const parts = parentTask.ngay_hoan_thanh.split('-');
                            if (parts.length === 3) {
                                const deadline = new Date(parts[0], parts[1] - 1, parts[2]);
                                deadline.setHours(0, 0, 0, 0);
                                if (deadline < today) {
                                    statusId = 3;
                                    statusText = 'Quá hạn';
                                }
                            }
                        }
                        
                        let bCls = 'badge-primary';
                        if (statusId == 1) bCls = 'badge-success';
                        else if (statusId == 3) bCls = 'badge-danger';
                        
                        return `<span class="badge-pill ${bCls}" style="font-size: 0.75rem; font-weight: 800; padding: 6px 12px; border-radius: 12px;">${statusText}</span>`;
                    })()}
                </td>
                <td style="text-align: center; color: #94a3b8; font-size: 0.8rem;"><i>Thông tin chính</i></td>
            `;
            subBody.appendChild(row);
            return;
        }

        // TRƯỜNG HỢP 1: DỮ LIỆU TỪ BẢNG SUB-TASKS TRONG DB
        if (data && data.length > 0) {
            data.forEach(sub => {
                const row = document.createElement('tr');
                const isEditing = editingSubId === sub.id;
                let prog = parseInt(sub.tien_do || 0);
                // Chỉ reset sub-task nếu là công việc định kỳ VÀ sang tháng mới
                const parentLoai = (parentTask?.loai_cv || '').toLowerCase();
                if (isNewMonth && parentLoai.includes('định kỳ')) prog = 0;

                const isDone = prog >= 100;
                const progColor = getProgressColor(prog);

                // UX/UI: Row styling
                row.style.background = isDone ? 'rgba(16, 185, 129, 0.04)' : 'transparent';
                row.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                row.className = 'premium-sub-row';

                if (isEditing) {
                    row.style.background = '#fffbeb';
                    row.innerHTML = `
                        <td style="padding: 10px;"><input type="text" class="edit-sub-name" value="${sub.ten_buoc}" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #f59e0b; font-weight: 700;"></td>
                        <td><select class="edit-sub-nv" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #f59e0b;">
                            ${employeeList.map(nv => `<option value="${nv.ma_nv}" ${nv.ma_nv === sub.ma_nv_thuc_hien ? 'selected' : ''}>${nv.ten_nv}</option>`).join('')}
                        </select></td>
                        <td><input type="date" class="edit-sub-bd" value="${sub.ngay_bat_dau || ''}" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #f59e0b;"></td>
                        <td><input type="date" class="edit-sub-kt" value="${sub.ngay_hoan_thanh || ''}" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #f59e0b;"></td>
                        <td><select class="edit-sub-capdo" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #f59e0b;"><option value="1" ${sub.cap_do_id == 1 ? 'selected' : ''}>Khẩn cấp</option><option value="2" ${sub.cap_do_id == 2 ? 'selected' : ''}>Cao</option><option value="3" ${sub.cap_do_id == 3 ? 'selected' : ''}>Bình thường</option><option value="4" ${sub.cap_do_id == 4 ? 'selected' : ''}>Thấp</option></select></td>
                        <td style="padding: 12px 0;"><div class="premium-progress-wrapper" style="width: 160px;"><div class="premium-progress-text" style="margin-bottom:6px;"><span class="edit-sub-prog-val" style="color: ${progColor}; font-weight: 900;">${prog}%</span></div><input type="range" class="edit-sub-prog-slider premium-slider" min="0" max="100" value="${prog}" style="background: linear-gradient(to right, ${progColor} ${prog}%, #f1f5f9 ${prog}%); height: 10px; border-radius:10px;"></div></td>
                        <td><select class="edit-sub-trangthai" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #f59e0b;"><option value="1" ${sub.trang_thai_id == 1 ? 'selected' : ''}>Hoàn thành</option><option value="2" ${sub.trang_thai_id == 2 ? 'selected' : ''}>Đang thực hiện</option><option value="3" ${sub.trang_thai_id == 3 ? 'selected' : ''}>Quá hạn</option><option value="4" ${sub.trang_thai_id == 4 ? 'selected' : ''}>Tạm dừng</option></select></td>
                        <td style="text-align: center;"><div style="display: flex; gap: 8px; justify-content: center;"><button class="btn-save-row" style="background: #10b981; color: white; border: none; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></button><button class="btn-cancel-row" style="background: #ef4444; color: white; border: none; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div></td>
                    `;
                    const slider = row.querySelector('.edit-sub-prog-slider');
                    slider.oninput = (e) => {
                        const v = e.target.value; const c = getProgressColor(v);
                        row.querySelector('.edit-sub-prog-val').textContent = v + '%';
                        row.querySelector('.edit-sub-prog-val').style.color = c;
                        slider.style.background = `linear-gradient(to right, ${c} ${v}%, #f1f5f9 ${v}%)`;
                    };
                    row.querySelector('.btn-cancel-row').onclick = () => { editingSubId = null; loadSubTasks(sub.ma_cv_cha); };
                    row.querySelector('.btn-save-row').onclick = async () => {
                        const sBd = row.querySelector('.edit-sub-bd').value;
                        const sKt = row.querySelector('.edit-sub-kt').value;
                        const pBd = parentTask.ngay_bat_dau;
                        const pKt = parentTask.ngay_hoan_thanh;

                        if (sBd && pBd && sBd < pBd) { showToast(`Ngày bắt đầu bước không được nhỏ hơn ngày bắt đầu công việc (${formatDate(pBd)})`, 'error'); return; }
                        if (sKt && pKt && sKt > pKt) { showToast(`Ngày hoàn thành bước không được lớn hơn ngày kết thúc công việc (${formatDate(pKt)})`, 'error'); return; }

                        const fd = new FormData();
                        fd.append('id', sub.id); fd.append('ma_cv_cha', sub.ma_cv_cha);
                        fd.append('ten_buoc', row.querySelector('.edit-sub-name').value);
                        fd.append('ma_nv', row.querySelector('.edit-sub-nv').value);
                        fd.append('ngay_bat_dau', sBd);
                        fd.append('ngay_hoan_thanh', sKt);
                        fd.append('tien_do', row.querySelector('.edit-sub-prog-slider').value);
                        fd.append('trang_thai_id', row.querySelector('.edit-sub-trangthai').value);
                        fd.append('cap_do_id', row.querySelector('.edit-sub-capdo').value);
                        fd.append('id_cv_cha', parentTask.id);
                        try {
                            const res = await fetch('api_save_subtask.php', { method: 'POST', body: fd });
                            const result = await res.json();
                            if (result.success) { showToast("Đã cập nhật!"); editingSubId = null; loadSubTasks(sub.ma_cv_cha); loadAllTasks(true); }
                            else showToast(result.message, 'error');
                        } catch (e) { showToast("Lỗi khi lưu!", 'error'); }
                    };
                } else {
                    const statusText = isDone ? 'Hoàn thành' : (sub.ten_trang_thai || 'Đang thực hiện');
                    const statusBadgeCls = isDone ? 'badge-success' : (statusText === 'Quá hạn' ? 'badge-danger' : 'badge-primary');

                    row.innerHTML = `
                        <td style="padding-left: 20px; vertical-align: middle; max-width: 400px; word-break: break-word; white-space: normal;">
                            <div style="display: flex; align-items: center; gap: 16px; padding: 14px 0;">
                                <div class="custom-checkbox-wrapper" style="position: relative; width: 24px; height: 24px; flex-shrink: 0;">
                                    <input type="checkbox" class="modal-sub-checkbox" ${isDone ? 'checked' : ''} style="width: 100%; height: 100%; cursor: pointer; opacity: 0; position: absolute; z-index: 2;">
                                    <div class="custom-checkbox-inner" style="width: 100%; height: 100%; border: 2px solid ${isDone ? '#10b981' : '#cbd5e1'}; border-radius: 8px; background: ${isDone ? '#10b981' : 'white'}; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: ${isDone ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none'};">
                                        ${isDone ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                                    </div>
                                </div>
                                <span style="font-weight: 700; color: ${isDone ? '#94a3b8' : '#1e293b'}; text-decoration: ${isDone ? 'line-through' : 'none'}; line-height: 1.5; font-size: 0.95rem; transition: all 0.3s;">${sub.ten_buoc}</span>
                            </div>
                        </td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                                    ${(sub.ten_nguoi_thuc_hien || '?').charAt(0).toUpperCase()}
                                </div>
                                <span style="font-size: 0.9rem; font-weight: 700; color: #475569;">${sub.ten_nguoi_thuc_hien || '-'}</span>
                            </div>
                        </td>
                        <td style="color: #64748b; font-size: 0.85rem; font-weight: 600;">${formatDate(sub.ngay_bat_dau)}</td>
                        <td style="color: #64748b; font-size: 0.85rem; font-weight: 600;">${formatDate(sub.ngay_hoan_thanh)}</td>
                        <td>${(() => {
                            let capDo = sub.ten_cap_do || 'BT';
                            if (capDo === 'Hoàn thành') capDo = 'BT';
                            let bCls = 'badge-info';
                            if (capDo.includes('Khẩn') || capDo.includes('Cao')) bCls = 'badge-danger';
                            else if (capDo.includes('Thấp')) bCls = 'badge-warning';
                            return `<span class="badge-pill ${bCls}" style="font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 20px;">${capDo}</span>`;
                        })()}</td>
                        <td style="padding: 12px 0;">
                            <div class="premium-progress-wrapper" style="width: 110px;">
                                <div class="premium-progress-text" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <span class="sub-prog-val" style="color: ${progColor}; font-weight: 800; font-size: 0.85rem;">${prog}%</span>
                                </div>
                                <div class="premium-progress-bar" style="height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                                    <div class="premium-progress-fill" style="width: ${prog}%; background: ${progColor}; height: 100%; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="status-cell-wrapper">
                                <span class="badge-pill ${statusBadgeCls}" style="font-size: 0.75rem; font-weight: 800; padding: 6px 12px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px;">
                                    ${isDone ? '<span style="width: 6px; height: 6px; border-radius: 50%; background: white;"></span>' : ''}${statusText}
                                </span>
                            </div>
                        </td>
                        <td style="text-align: center;">
                            <div style="display: flex; gap: 8px; justify-content: center;">
                                <button class="btn-edit-sub" title="Sửa" style="width: 34px; height: 34px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button class="btn-delete-sub" title="Xóa" style="width: 34px; height: 34px; border-radius: 10px; background: #fef2f2; border: 1px solid #fee2e2; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </td>
                    `;

                    row.querySelector('.btn-edit-sub').onclick = () => { openSubTaskEditModal(sub); };
                    row.querySelector('.btn-delete-sub').onclick = async () => {
                        if (confirm(`Bạn có chắc chắn muốn xóa bước "${sub.ten_buoc}"?`)) {
                            const fdDel = new FormData();
                            fdDel.append('action', 'delete');
                            fdDel.append('id', sub.id);
                            fdDel.append('ma_cv_cha', sub.ma_cv_cha);
                            try {
                                const res = await fetch('api_save_subtask.php', { method: 'POST', body: fdDel });
                                const result = await res.json();
                                if (result.success) { showToast("Đã xóa bước!"); loadSubTasks(sub.ma_cv_cha); loadAllTasks(true); }
                                else showToast(result.message, 'error');
                            } catch (e) { showToast("Lỗi khi xóa!", 'error'); }
                        }
                    };
                    const chkSub = row.querySelector('.modal-sub-checkbox');
                    if (chkSub) {
                        chkSub.onchange = async (e) => {
                            e.stopPropagation();
                            const done = chkSub.checked;
                            const fd = new FormData();
                            fd.append('id', sub.id); 
                            fd.append('ma_cv_cha', sub.ma_cv_cha);
                            fd.append('ten_buoc', sub.ten_buoc);
                            fd.append('ma_nv', sub.ma_nv_thuc_hien || '');
                            fd.append('ngay_bat_dau', sub.ngay_bat_dau || '');
                            fd.append('cap_do_id', sub.cap_do_id || 3);
                            fd.append('tien_do', done ? 100 : 0);
                            fd.append('trang_thai_id', done ? 1 : 2);
                            fd.append('id_cv_cha', parentTask.id);
                            
                            const isNewMonth = isNewMonthForTask(parentTask);
                            const today = new Date().toISOString().split('T')[0];
                            
                            if (done) {
                                fd.append('ngay_hoan_thanh', today);
                            }

                            if (isNewMonth) {
                                const selectedMonthStr = `${currentGlobalMonthDate.getFullYear()}-${String(currentGlobalMonthDate.getMonth() + 1).padStart(2, '0')}`;
                                const newDate = selectedMonthStr + '-01';
                                fd.append('parent_ngay_bat_dau', newDate);
                                fd.append('parent_ngay_hoan_thanh', newDate);
                                parentTask.ngay_bat_dau = newDate;
                                parentTask.ngay_hoan_thanh = newDate;
                            }

                            try {
                                const res = await fetch('api_save_subtask.php', { method: 'POST', body: fd });
                                const result = await res.json();
                                if (result.success) { 
                                    showToast("Đã cập nhật!"); 

                                    // Cập nhật tiến độ công việc cha ngay lập tức vào bộ nhớ
                                    if (result.newProgress !== undefined) {
                                        const parentIdx = allFetchedTasks.findIndex(t => t.id === parentTask.id || t.ma_cv === parentTask.ma_cv);
                                        if (parentIdx !== -1) {
                                            allFetchedTasks[parentIdx].tien_do = result.newProgress;
                                        }
                                        parentTask.tien_do = result.newProgress;
                                    }

                                    // Vẽ lại bảng ngoài ngay lập tức
                                    applyFilter();
                                    
                                    // Nạp lại danh sách công việc con trong modal (truyền parentTask đã cập nhật)
                                    loadSubTasks(sub.ma_cv_cha, true, parentTask); 
                                }
                            } catch (e) { }
                        };
                    }
                }
                subBody.appendChild(row);
            });
        }

        // TRƯỜNG HỢP 2: DÙNG CHECKLIST TRONG MÔ TẢ
        if (checklistItems.length > 0) {
            checklistItems.forEach(item => {
                const trimLine = item.line.trim();
                let isChecked = !!trimLine.match(/^\[\s*[xX]\s*\]/);
                
                // Chỉ reset nếu là công việc định kỳ và sang tháng mới
                const loai = (parentTask.loai_cv || '').toLowerCase();
                if (isNewMonth && loai.includes('định kỳ')) {
                    isChecked = false;
                }

                const content = trimLine.replace(/^\[\s*[xX\s]*\s*\]/, '').trim();
                const row = document.createElement('tr');

                // UX/UI: Row styling
                row.style.background = isChecked ? 'rgba(16, 185, 129, 0.04)' : 'transparent';
                row.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                row.className = 'premium-sub-row';

                // Parse metadata tags from content
                const startMatch = content.match(/\|start:(.*?)\|/);
                const endMatch = content.match(/\|end:(.*?)\|/);
                const levelMatch = content.match(/\|level:(.*?)\|/);

                const itemStart = startMatch ? startMatch[1] : parentTask.ngay_bat_dau;
                const itemEnd = endMatch ? endMatch[1] : parentTask.ngay_hoan_thanh;
                const itemLevel = levelMatch ? levelMatch[1] : (parentTask.cap_do_id || 3);

                // Clean content for display
                const cleanContent = content.replace(/\|start:.*?\|/g, '')
                                          .replace(/\|end:.*?\|/g, '')
                                          .replace(/\|level:.*?\|/g, '')
                                          .replace(/\|file:.*?\|/g, '')
                                          .trim();

                row.innerHTML = `
                    <td style="padding-left: 20px; vertical-align: middle;">
                        <div style="display: flex; align-items: center; gap: 16px; padding: 14px 0;">
                            <div class="custom-checkbox-wrapper" style="position: relative; width: 24px; height: 24px; flex-shrink: 0;">
                                <input type="checkbox" class="modal-checklist-item" data-line="${item.idx}" ${isChecked ? 'checked' : ''} style="width: 100%; height: 100%; cursor: pointer; opacity: 0; position: absolute; z-index: 2;">
                                <div class="custom-checkbox-inner" style="width: 100%; height: 100%; border: 2px solid ${isChecked ? '#10b981' : '#cbd5e1'}; border-radius: 8px; background: ${isChecked ? '#10b981' : 'white'}; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: ${isChecked ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none'};">
                                    ${isChecked ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                                </div>
                            </div>
                            <span style="font-weight: 700; color: ${isChecked ? '#94a3b8' : '#1e293b'}; text-decoration: ${isChecked ? 'line-through' : 'none'}; line-height: 1.5; font-size: 0.95rem; transition: all 0.3s;">${cleanContent}</span>
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                                ${(parentTask.ten_nguoi_phu_trach || '?').charAt(0).toUpperCase()}
                            </div>
                            <span style="font-size: 0.9rem; font-weight: 700; color: #475569;">${parentTask.ten_nguoi_phu_trach || '-'}</span>
                        </div>
                    </td>
                    <td style="color: #64748b; font-size: 0.85rem; font-weight: 600;">${formatDate(itemStart)}</td>
                    <td style="color: #64748b; font-size: 0.85rem; font-weight: 600;">${formatDate(itemEnd)}</td>
                    <td>
                        ${(() => {
                            let capDo = 'BT';
                            if (itemLevel == 1) capDo = 'Khẩn cấp';
                            else if (itemLevel == 2) capDo = 'Cao';
                            else if (itemLevel == 4) capDo = 'Thấp';
                            
                            let bCls = 'badge-info';
                            if (capDo.includes('Khẩn') || capDo.includes('Cao')) bCls = 'badge-danger';
                            else if (capDo.includes('Thấp')) bCls = 'badge-warning';
                            return `<span class="badge-pill ${bCls}" style="font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 20px;">${capDo}</span>`;
                        })()}
                    </td>
                    <td style="padding: 12px 0;">
                        <div class="premium-progress-wrapper" style="width: 110px;">
                            <div class="premium-progress-text" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span style="color: ${isChecked ? '#10b981' : '#6366f1'}; font-weight: 800; font-size: 0.85rem;">${isChecked ? '100%' : '0%'}</span>
                            </div>
                            <div class="premium-progress-bar" style="height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                                <div class="premium-progress-fill" style="width: ${isChecked ? '100%' : '0%'}; background: ${isChecked ? 'linear-gradient(to right, #10b981, #34d399)' : '#e2e8f0'}; height: 100%; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="status-cell-wrapper">
                            <span class="badge-pill ${isChecked ? 'badge-success' : 'badge-primary'}" style="font-size: 0.75rem; font-weight: 800; padding: 6px 12px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px;">
                                ${isChecked ? '<span style="width: 6px; height: 6px; border-radius: 50%; background: white;"></span>Hoàn thành' : 'Đang thực hiện'}
                            </span>
                        </div>
                    </td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="btn-edit-checklist" title="Sửa" style="width: 34px; height: 34px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-delete-checklist" title="Xóa" style="width: 34px; height: 34px; border-radius: 10px; background: #fef2f2; border: 1px solid #fee2e2; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                `;

                row.querySelector('.btn-edit-checklist').onclick = () => {
                    openSubTaskEditModal(null, {
                        ten_buoc: cleanContent,
                        startDate: itemStart,
                        endDate: itemEnd,
                        level: itemLevel,
                        lineIdx: item.idx,
                        parentTask: parentTask
                    });
                };

                row.querySelector('.btn-delete-checklist').onclick = () => {
                    if (confirm("Bạn có chắc chắn muốn xóa bước này khỏi danh sách?")) {
                        const linesArr = parentTask.mo_ta_cv.replace(/\r/g, '').split('\n');
                        linesArr.splice(item.idx, 1);
                        saveChecklistAfterEdit(linesArr.join('\n'), parentTask);
                    }
                };

                row.querySelector('.modal-checklist-item').onclick = (e) => {
                    e.stopPropagation();
                    const chk = e.target.checked;
                    row.style.background = chk ? 'rgba(16, 185, 129, 0.04)' : 'transparent';
                    const text = row.querySelector('span');
                    if (text) {
                        text.style.color = chk ? '#94a3b8' : '#1e293b';
                        text.style.textDecoration = chk ? 'line-through' : 'none';
                    }
                    const inner = row.querySelector('.custom-checkbox-inner');
                    if (inner) {
                        inner.style.background = chk ? '#10b981' : 'white';
                        inner.style.borderColor = chk ? '#10b981' : '#cbd5e1';
                        inner.style.boxShadow = chk ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none';
                        inner.innerHTML = chk ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '';
                    }

                    const pVal = row.querySelector('.premium-progress-text span');
                    const pFill = row.querySelector('.premium-progress-fill');
                    if (pVal) {
                        pVal.textContent = chk ? '100%' : '0%';
                        pVal.style.color = chk ? '#10b981' : '#6366f1';
                    }
                    if (pFill) {
                        pFill.style.width = chk ? '100%' : '0%';
                        pFill.style.background = chk ? 'linear-gradient(to right, #10b981, #34d399)' : '#e2e8f0';
                    }

                    const statusCell = row.cells[6];
                    if (statusCell) {
                        const sBadge = statusCell.querySelector('.badge-pill');
                        if (sBadge) {
                            sBadge.textContent = '';
                            if (chk) {
                                sBadge.innerHTML = '<span style="width: 6px; height: 6px; border-radius: 50%; background: white;"></span>Hoàn thành';
                                sBadge.className = 'badge-pill badge-success';
                            } else {
                                sBadge.textContent = 'Đang thực hiện';
                                sBadge.className = 'badge-pill badge-primary';
                            }
                            sBadge.style.fontSize = '0.75rem';
                            sBadge.style.fontWeight = '800';
                            sBadge.style.padding = '6px 12px';
                            sBadge.style.borderRadius = '12px';
                        }
                    }

                    handleModalChecklistToggle(chk, item.idx, parentTask);
                };
                subBody.appendChild(row);
            });
        }

        if (checklistItems.length === 0 && (!data || data.length === 0)) {
            if (parentTask?.mo_ta_cv) {
                const row = document.createElement('tr');
                const prog = parentTask.tien_do || 0;
                const progColor = getProgressColor(prog);
                row.innerHTML = `
                    <td colspan="5" style="padding-left: 25px;"><div style="font-weight: 700; color: #1e293b; font-size: 1rem; padding: 10px 0;">${parentTask.mo_ta_cv.replace(/\n/g, '<br>')}</div></td>
                    <td style="padding: 12px 0;"><div class="premium-progress-wrapper" style="width: 160px;"><div class="premium-progress-text"><span style="color: ${progColor}; font-weight: 800;">${prog}%</span></div><div class="premium-progress-bar" style="height: 6px; background: #f1f5f9;"><div class="premium-progress-fill" style="width: ${prog}%; background: ${progColor}; height: 100%;"></div></div></div></td>
                    <td><span class="badge-pill ${prog == 100 ? 'badge-success' : 'badge-primary'}">${parentTask.trang_thai_text || 'Đang thực hiện'}</span></td>
                    <td style="text-align: center;">-</td>
                `;
                subBody.appendChild(row);
            } else {
                subBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8;">Chưa có bước thực hiện nào.</td></tr>';
            }
        }
    };

    let currentChecklistConversion = null; // Store info if we're converting a checklist item

    const openSubTaskEditModal = (sub = null, conversionInfo = null) => {
        if (subForm) subForm.reset();
        currentChecklistConversion = conversionInfo;

        if (sub) {
            document.getElementById('subTaskEditTitle').textContent = 'Chỉnh sửa bước thực hiện';
            document.getElementById('sub_id').value = sub.id;
            document.getElementById('sub_ma_cv_cha').value = sub.ma_cv_cha;
            document.getElementById('sub_ten_buoc').value = sub.ten_buoc;
            document.getElementById('sub_ma_nv').value = sub.ma_nv_thuc_hien || '';
            const bd = document.getElementById('sub_ngay_bd'); const kt = document.getElementById('sub_ngay_hoan_thanh');
            if (bd) bd.value = sub.ngay_bat_dau || ''; if (kt) kt.value = sub.ngay_hoan_thanh || '';
            document.getElementById('sub_cap_do').value = sub.cap_do_id || 3;
            document.getElementById('sub_trang_thai').value = sub.trang_thai_id || 2;
            document.getElementById('sub_tien_do').value = sub.tien_do || 0;
        } else if (conversionInfo) {
            document.getElementById('subTaskEditTitle').textContent = 'Nâng cấp bước thực hiện';
            document.getElementById('sub_id').value = '';
            document.getElementById('sub_ma_cv_cha').value = conversionInfo.parentTask.ma_cv;
            document.getElementById('sub_ten_buoc').value = conversionInfo.ten_buoc;
            document.getElementById('sub_ma_nv').value = conversionInfo.parentTask.nguoi_phu_trach || '';
            const bd = document.getElementById('sub_ngay_bd'); if (bd) bd.value = conversionInfo.startDate || conversionInfo.parentTask.ngay_bat_dau || '';
            const kt = document.getElementById('sub_ngay_hoan_thanh'); if (kt) kt.value = conversionInfo.endDate || conversionInfo.parentTask.ngay_hoan_thanh || '';
            document.getElementById('sub_cap_do').value = conversionInfo.level || 3;
            document.getElementById('sub_trang_thai').value = 2;
            document.getElementById('sub_tien_do').value = 0;
        } else {
            document.getElementById('subTaskEditTitle').textContent = 'Thêm bước mới';
            document.getElementById('sub_id').value = '';
            document.getElementById('sub_ma_cv_cha').value = currentParentMaCv;
            const bd = document.getElementById('sub_ngay_bd'); if (bd) bd.value = new Date().toISOString().split('T')[0];
        }
        if (subEditModal) subEditModal.style.display = 'flex';
    };

    if (btnAddSubTask) btnAddSubTask.onclick = () => openSubTaskEditModal();

    const btnSaveSubTask = document.getElementById('btnSaveSubTask');
    if (btnSaveSubTask) {
        btnSaveSubTask.addEventListener('click', async function (e) {
            e.preventDefault(); e.stopPropagation();
            const parentTask = allFetchedTasks.find(t => t.ma_cv === currentParentMaCv);
            const sBd = document.getElementById('sub_ngay_bd').value;
            const sKt = document.getElementById('sub_ngay_hoan_thanh').value;
            const pBd = parentTask?.ngay_bat_dau;
            const pKt = parentTask?.ngay_hoan_thanh;

            if (sBd && pBd && sBd < pBd) { showToast(`Ngày bắt đầu bước không được nhỏ hơn ngày bắt đầu công việc (${formatDate(pBd)})`, 'error'); return; }
            if (sKt && pKt && sKt > pKt) { showToast(`Ngày hoàn thành bước không được lớn hơn ngày kết thúc công việc (${formatDate(pKt)})`, 'error'); return; }

            const fd = new FormData();
            fd.append('id', document.getElementById('sub_id').value);
            fd.append('ma_cv_cha', document.getElementById('sub_ma_cv_cha').value);
            fd.append('ten_buoc', document.getElementById('sub_ten_buoc').value);
            fd.append('ma_nv', document.getElementById('sub_ma_nv').value);
            fd.append('ngay_bat_dau', sBd);
            fd.append('ngay_hoan_thanh', sKt);
            fd.append('cap_do_id', document.getElementById('sub_cap_do').value);
            const tId = document.getElementById('sub_trang_thai').value;
            let tDo = document.getElementById('sub_tien_do').value;
            if (tId == 1) tDo = 100; else if (tDo == 100) tDo = 0;
            fd.append('trang_thai_id', tId); fd.append('tien_do', tDo);
            fd.append('id_cv_cha', parentTask.id);
            try {
                const isNewMonth = isNewMonthForTask(parentTask);
                if (isNewMonth) {
                    const selectedMonthStr = `${currentGlobalMonthDate.getFullYear()}-${String(currentGlobalMonthDate.getMonth() + 1).padStart(2, '0')}`;
                    fd.append('parent_ngay_hoan_thanh', selectedMonthStr + '-01');
                }
                const res = await fetch('api_save_subtask.php', { method: 'POST', body: fd });
                const result = await res.json();
                if (result.success) {
                    // If it was a conversion, remove the line from description
                    if (currentChecklistConversion) {
                        const linesArr = currentChecklistConversion.parentTask.mo_ta_cv.replace(/\r/g, '').split('\n');
                        linesArr.splice(currentChecklistConversion.lineIdx, 1);
                        await saveChecklistAfterEdit(linesArr.join('\n'), currentChecklistConversion.parentTask);
                    }
                    subEditModal.style.display = 'none';
                    loadSubTasks(currentParentMaCv);
                    loadAllTasks(true);
                }
                else showToast(result.message, 'error');
            } catch (e) { showToast("Lỗi khi lưu!", 'error'); }
        });
    }

    const progressInputModal = document.getElementById('modal_tien_do');
    const progressDisplayModal = document.getElementById('progressValue');
    const statusSelectModal = document.getElementById('modal_trang_thai_cv');

    const updateModalSliderUI = (val) => {
        if (!progressInputModal) return;
        let color = val >= 70 ? '#10b981' : (val >= 30 ? '#f59e0b' : '#ef4444');
        progressInputModal.style.background = `linear-gradient(to right, ${color} ${val}%, #e2e8f0 ${val}%)`;
        if (progressDisplayModal) { progressDisplayModal.textContent = val + '%'; progressDisplayModal.style.color = color; }
    };

    const inputMoTa = document.getElementById('modal_mo_ta');
    if (inputMoTa && progressInputModal) {
        inputMoTa.addEventListener('input', () => {
            const lines = inputMoTa.value.replace(/\r/g, '').split('\n');
            const checklistLines = lines.filter(l => l.trim().match(/^\[([xX\s])\]/));
            if (checklistLines.length > 0) {
                progressInputModal.disabled = true;
                const checkedCount = checklistLines.filter(l => l.trim().match(/^\[[xX]\]/)).length;
                const newProgress = Math.round((checkedCount / checklistLines.length) * 100);
                progressInputModal.value = newProgress; updateModalSliderUI(newProgress);
            } else { progressInputModal.disabled = false; }
        });
    }

    if (progressInputModal) {
        progressInputModal.addEventListener('input', (e) => {
            const val = parseInt(e.target.value); updateModalSliderUI(val);
            if (val === 100 && statusSelectModal) statusSelectModal.value = "1";
            else if (val < 100 && statusSelectModal) {
                const dInput = document.getElementById('modal_ngay_hoan_thanh');
                let tStatus = "2"; if (dInput && dInput.value && new Date(dInput.value).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) tStatus = "3";
                statusSelectModal.value = tStatus;
            }
        });
    }

    if (taskSearch) taskSearch.addEventListener('input', applyFilter);
    if (document.getElementById('filterStatus')) document.getElementById('filterStatus').addEventListener('change', applyFilter);

    const inputTenCv = document.getElementById('modal_ten_cv');
    if (inputTenCv && inputMoTa) {
        const taskTemplates = {
            "Kiểm tra hệ thống định kỳ": "[ ] Kiểm tra log máy chủ\n[ ] Kiểm tra dung lượng ổ đĩa\n[ ] Kiểm tra kết nối mạng",
            "Báo cáo doanh thu tháng": "[ ] Thu thập dữ liệu từ các bộ phận\n[ ] Đối soát số liệu\n[ ] Lập biểu đồ so sánh\n[ ] Gửi báo cáo cho Ban Giám Đốc",
            "Bảo trì máy chủ": "[ ] Sao lưu dữ liệu (Backup)\n[ ] Cập nhật bản vá bảo mật\n[ ] Khởi động lại dịch vụ",
            "Hỗ trợ khách hàng": "[ ] Tiếp nhận yêu cầu\n[ ] Phân loại mức độ ưu tiên\n[ ] Phản hồi giải pháp\n[ ] Xác nhận hoàn thành"
        };
        inputTenCv.addEventListener('input', () => {
            const val = inputTenCv.value.trim();
            if (taskTemplates[val] && (!inputMoTa.value || inputMoTa.value.trim() === "" || inputMoTa.value.trim() === "Mô tả nội dung công việc...")) {
                inputMoTa.value = taskTemplates[val]; inputMoTa.dispatchEvent(new Event('input'));
            }
        });
    }

    loadEmployees(); loadAllTasks();
});

window.approveTask = async function(ma_cv) {
    if (!confirm('Xác nhận phê duyệt công việc này đã hoàn thành?')) return;
    try {
        const fd = new FormData();
        fd.append('ma_cv', ma_cv);
        const res = await fetch('api_approve_task.php', { method: 'POST', body: fd });
        const result = await res.json();
        if (result.success) {
            showToast("Đã phê duyệt hoàn thành!", "success");
            if (typeof loadAllTasks === 'function') loadAllTasks(true);
            else window.location.reload();
        } else {
            showToast(result.message || "Lỗi phê duyệt", "error");
        }
    } catch (e) {
        showToast("Lỗi kết nối", "error");
    }
};
