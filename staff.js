document.addEventListener('DOMContentLoaded', () => {
    // Sync version: 8 - Refactored to Event Delegation & Fixed Layout

    const tbody = document.getElementById('myTasksBody');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userAvatar = document.getElementById('userAvatar');
    const taskSearch = document.getElementById('taskSearch');
    const lastUpdate = document.getElementById('lastUpdate');

    const parseMonth = (dateStr) => {
        if (!dateStr || dateStr === '-' || dateStr === '0000-00-00') return null;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}`;
        }
        return (dateStr && dateStr.length >= 7) ? dateStr.substring(0, 7) : null;
    };

    // Thống kê elements
    const statTotal = document.getElementById('statTotal');
    const statDone = document.getElementById('statDone');
    const statDoing = document.getElementById('statDoing');
    const statHigh = document.getElementById('statHigh');

    // Modal elements
    const addModal = document.getElementById('addModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const btnApply = document.getElementById('btnApply');

    let allMyTasks = [];
    let currentTasks = [];
    let currentStaffMonthDate = new Date();
    let currentMaNv = ''; // Global storage for current employee ID

    // View Switching Logic
    const btnSwitchToList = document.getElementById('btnSwitchToList');
    const btnSwitchToCalendar = document.getElementById('btnSwitchToCalendar');
    const listView = document.getElementById('listView');
    const calendarView = document.getElementById('calendarView');

    function switchView(target) {
        // Clear active classes from sections
        const views = ['listView', 'calendarView', 'ganttView'];
        views.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.classList.remove('active');
        });

        // Clear active classes from buttons
        const btns = ['btnSwitchToList', 'btnSwitchToCalendar', 'btnSwitchToGantt', 'btnSwitchToCalendarTop', 'btnSwitchToGanttTop'];
        btns.forEach(b => {
            const el = document.getElementById(b);
            if (el) el.classList.remove('active');
        });

        // Activate target
        const targetView = document.getElementById(target + 'View');
        if (targetView) targetView.classList.add('active');
        
        const suffix = target.charAt(0).toUpperCase() + target.slice(1);
        const sidebarBtn = document.getElementById('btnSwitchTo' + suffix);
        const topBtn = document.getElementById('btnSwitchTo' + suffix + 'Top');
        
        if (sidebarBtn) sidebarBtn.classList.add('active');
        if (topBtn) topBtn.classList.add('active');

        // Show/Hide switcher based on view
        const switcher = document.querySelector('.view-switcher');
        if (switcher) {
            switcher.style.display = (target === 'list') ? 'none' : 'inline-flex';
        }

        // Render data if needed
        if (target === 'calendar') renderCalendar();
        if (target === 'gantt') renderGantt();
    }

    // Set initial active state for buttons
    switchView('calendar');

    btnSwitchToList?.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('list');
    });

    btnSwitchToCalendar?.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('calendar');
    });

    document.getElementById('btnSwitchToCalendarTop')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('calendar');
    });

    const btnSwitchToGanttTop = document.getElementById('btnSwitchToGanttTop');
    btnSwitchToGanttTop?.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('gantt');
    });

    // Calendar Rendering Logic
    function renderCalendar() {
        const gridBody = document.getElementById('calendarGridBody');
        const title = document.getElementById('calendarMonthTitle');
        const calYear = document.getElementById('calFilterYear');
        const calMonth = document.getElementById('calFilterMonth');
        const calHideDone = document.getElementById('calHideDone');
        const calProject = document.getElementById('calFilterProject');
        const calLeader = document.getElementById('calFilterLeader');

        if (!gridBody) return;

        gridBody.innerHTML = '';
        
        const year = calYear ? parseInt(calYear.value) : currentStaffMonthDate.getFullYear();
        const month = calMonth ? parseInt(calMonth.value) - 1 : currentStaffMonthDate.getMonth();
        
        if (title) {
            title.textContent = `THEO DÕI LỊCH CÔNG VIỆC THÁNG ${month + 1} NĂM ${year}`;
        }

        const calStartDay = document.getElementById('calStartDay');
        const startDaySetting = calStartDay ? parseInt(calStartDay.value) : 0; // 0: Sunday, 1: Monday

        const firstDayActual = new Date(year, month, 1).getDay(); // 0 is Sunday
        const firstDay = (firstDayActual - startDaySetting + 7) % 7; 
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Update Week Headers based on start day setting
        const weekHeaders = document.querySelectorAll('.calendar-week-header th');
        if (weekHeaders.length === 7) {
            const dayNames = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];
            for (let i = 0; i < 7; i++) {
                const dayIdx = (i + startDaySetting) % 7;
                weekHeaders[i].textContent = dayNames[dayIdx];
            }
        }

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        let date = 1;
        for (let i = 0; i < 6; i++) { // Max 6 rows
            let row = document.createElement('tr');
            let hasDate = false;

            for (let j = 0; j < 7; j++) {
                let cell = document.createElement('td');
                if (i === 0 && j < firstDay) {
                    // Empty cell
                } else if (date > daysInMonth) {
                    // Empty cell
                } else {
                    hasDate = true;
                    const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    
                    if (currentDateStr === todayStr) {
                        cell.classList.add('calendar-day-today');
                    }

                    const dayHeader = document.createElement('div');
                    dayHeader.className = 'calendar-day-header';
                    
                    const dateSpan = document.createElement('span');
                    dateSpan.textContent = `${String(date).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`;
                    dayHeader.appendChild(dateSpan);

                    const quickAddBtn = document.createElement('button');
                    quickAddBtn.className = 'btn-quick-add';
                    quickAddBtn.title = 'Thêm công việc cho ngày này';
                    quickAddBtn.textContent = '+';
                    quickAddBtn.onclick = (e) => {
                        e.stopPropagation();
                        openEditModal({
                            ngay_bat_dau: currentDateStr,
                            loai_cv: 'Phát sinh'
                        });
                    };
                    dayHeader.appendChild(quickAddBtn);
                    
                    cell.appendChild(dayHeader);

                    const dayContent = document.createElement('div');
                    dayContent.className = 'calendar-day-content';

                    const searchTerm = document.getElementById('taskSearch')?.value.toLowerCase().trim() || '';

                    // Filter and Sort tasks for this day
                    let hasHotTask = false;
                    const dayTasks = allMyTasks.filter(t => {
                        if (!t.ngay_bat_dau || t.ngay_bat_dau === '0000-00-00' || t.ngay_bat_dau === '-') return false;
                        
                        const isThisDay = t.ngay_bat_dau === currentDateStr;
                        if (!isThisDay) return false;

                        // Sidebar filters
                        if (calHideDone && calHideDone.checked && parseInt(t.tien_do) === 100) return false;
                        if (calProject && calProject.value !== 'all' && t.ma_cv.indexOf(calProject.value) === -1) return false;
                        
                        // Search filter
                        if (searchTerm) {
                            const content = `${t.ma_cv} ${t.ten_cv}`.toLowerCase();
                            if (!content.includes(searchTerm)) return false;
                        }

                        return true;
                    }).map(t => {
                        // Calculate urgency
                        let isUrgent = false;
                        let urgentLevel = 0; // 0: Normal, 1: Due in 48h, 2: Due in 24h
                        if (parseInt(t.tien_do) < 100 && t.ngay_hoan_thanh && t.ngay_hoan_thanh !== '0000-00-00') {
                            const p = t.ngay_hoan_thanh.split('-');
                            const d = new Date(p[0], p[1] - 1, p[2]);
                            d.setHours(0,0,0,0);
                            
                            const todayCopy = new Date(today);
                            todayCopy.setHours(0,0,0,0);
                            
                            const diff = Math.round((d - todayCopy) / (1000 * 60 * 60 * 24));
                            if (diff < 0) urgentLevel = 3; // Overdue
                            else if (diff <= 1) urgentLevel = 2; // Urgent
                            else if (diff <= 2) urgentLevel = 1; // Soon
                            
                            if (urgentLevel >= 2) {
                                isUrgent = true;
                                if (parseInt(t.tien_do) < 50) hasHotTask = true;
                            }
                        }
                        return { ...t, isUrgent, urgentLevel };
                    }).sort((a, b) => {
                        const aDone = parseInt(a.tien_do) === 100;
                        const bDone = parseInt(b.tien_do) === 100;
                        if (aDone && !bDone) return 1;
                        if (!aDone && bDone) return -1;
                        return b.urgentLevel - a.urgentLevel;
                    });

                    if (hasHotTask) {
                        cell.classList.add('calendar-day-hot');
                    }

                    dayTasks.forEach(t => {
                        let statusClass = 'task-status-doing';
                        let statusText = 'Đang thực hiện';
                        let urgentIndicator = '';

                        if (parseInt(t.tien_do) === 100) {
                            statusClass = 'task-status-done';
                            statusText = 'Hoàn thành';
                        } else {
                            if (t.urgentLevel === 3) {
                                statusClass = 'task-status-overdue';
                                statusText = 'Quá hạn!';
                            } else if (t.urgentLevel === 2) {
                                statusClass = 'task-status-overdue task-urgent-pulse';
                                statusText = 'Khẩn cấp!';
                                urgentIndicator = '<span class="urgent-badge">⚠️ GẤP</span>';
                            } else if (t.urgentLevel === 1) {
                                statusClass = 'task-status-overdue';
                                statusText = 'Sắp hạn';
                                urgentIndicator = '<span class="urgent-badge" style="background: #f59e0b;">⚠️</span>';
                            } else if (t.trang_thai_id == 3) {
                                statusClass = 'task-status-overdue';
                                statusText = 'Quá hạn';
                            } else if (t.trang_thai_id == 4) {
                                statusClass = 'task-status-paused';
                                statusText = 'Tạm dừng';
                            }
                        }

                        const shortName = t.ten_cv.length > 35 ? t.ten_cv.substring(0, 35) + '...' : t.ten_cv;

                        const taskItem = document.createElement('div');
                        taskItem.className = `calendar-task-item ${statusClass}`;
                        taskItem.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 4px;">
                                <div class="calendar-task-name" style="font-size: 0.75rem; line-height: 1.2;">${shortName}</div>
                                ${urgentIndicator}
                            </div>
                            <div class="calendar-task-meta" style="margin-top: 4px; display: flex; align-items: center; gap: 4px; opacity: 0.8;">
                                <span style="background: rgba(0,0,0,0.05); padding: 1px 4px; border-radius: 3px;">${t.ma_cv}</span>
                                <span>•</span>
                                <span>${statusText} (${t.tien_do}%)</span>
                            </div>
                        `;
                        taskItem.title = `${t.ma_cv}: ${t.ten_cv}`;
                        taskItem.onclick = () => openEditModal(t);
                        dayContent.appendChild(taskItem);
                    });

                    cell.appendChild(dayContent);

                    // Add summary if tasks exist
                    if (dayTasks.length > 0) {
                        const totalProgress = dayTasks.reduce((sum, t) => sum + parseInt(t.tien_do || 0), 0);
                        const avgProgress = Math.round(totalProgress / dayTasks.length);
                        const summary = document.createElement('div');
                        summary.className = 'cell-summary';
                        summary.textContent = `${dayTasks.length} CV • ${avgProgress}%`;
                        cell.appendChild(summary);
                    }

                    date++;
                }
                row.appendChild(cell);
            }
            if (hasDate) gridBody.appendChild(row);
            if (date > daysInMonth) break;
        }

        // Update Project Filter Dropdown for the current calendar month
        const projects = new Set();
        allMyTasks.forEach(t => {
            if (!t.ngay_bat_dau || t.ngay_bat_dau === '0000-00-00' || t.ngay_bat_dau === '-') return;
            
            // Basic visibility check for the month
            const startMonth = t.ngay_bat_dau.substring(0, 7);
            const endMonth = t.ngay_hoan_thanh && t.ngay_hoan_thanh !== '0000-00-00' ? t.ngay_hoan_thanh.substring(0, 7) : startMonth;
            const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
            
            if (currentMonthStr >= startMonth && currentMonthStr <= endMonth) {
                if (t.ma_cv) {
                    const parts = t.ma_cv.split('-');
                    projects.add(parts[0]);
                }
            }
        });

        const calProjectSelect = document.getElementById('calFilterProject');
        if (calProjectSelect) {
            const currentVal = calProjectSelect.value;
            calProjectSelect.innerHTML = '<option value="all">Tất cả dự án</option>';
            Array.from(projects).sort().forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                calProjectSelect.appendChild(opt);
            });
            calProjectSelect.value = projects.has(currentVal) ? currentVal : 'all';
        }

        renderUrgentWidget();
    }

    // Gantt Rendering Logic
    function renderGantt() {
        const container = document.getElementById('ganttContainer');
        const statsContainer = document.getElementById('ganttStats');
        if (!container) return;

        // Robust date safety check
        if (!currentStaffMonthDate || isNaN(currentStaffMonthDate.getTime())) {
            currentStaffMonthDate = new Date();
        }

        const year = currentStaffMonthDate.getFullYear();
        const month = currentStaffMonthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayNamesShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        const selectedMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
        const searchTerm = document.getElementById('taskSearch')?.value.toLowerCase().trim() || '';

        const taskSelector = document.getElementById('ganttTaskSelector');
        const selectedMaCvFilter = taskSelector?.value || '';

        const startDateInput = document.getElementById('ganttStartDateInput');
        const endDateInput = document.getElementById('ganttEndDateInput');

        if (startDateInput && endDateInput) {
            const startVal = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const endVal = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
            
            if (startDateInput.value !== startVal && !startDateInput.dataset.manualSet) {
                startDateInput.value = startVal;
            }
            if (endDateInput.value !== endVal && !endDateInput.dataset.manualSet) {
                endDateInput.value = endVal;
            }
        }

        const dateRangeStart = startDateInput?.value ? new Date(startDateInput.value) : new Date(year, month, 1);
        const dateRangeEnd = endDateInput?.value ? new Date(endDateInput.value) : new Date(year, month, daysInMonth);
        dateRangeStart.setHours(0,0,0,0);
        dateRangeEnd.setHours(0,0,0,0);

        const diffTime = Math.abs(dateRangeEnd - dateRangeStart);
        const totalDaysInRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Filter tasks using the selected range
        let displayTasks = currentTasks.filter(t => {
            const startStr = t.ngay_bat_dau && t.ngay_bat_dau !== '0000-00-00' ? t.ngay_bat_dau : null;
            const endStr = t.ngay_hoan_thanh && t.ngay_hoan_thanh !== '0000-00-00' ? t.ngay_hoan_thanh : null;
            
            if (!startStr && !endStr) return true;
            
            const taskStart = startStr ? new Date(startStr) : dateRangeStart;
            const taskEnd = endStr ? new Date(endStr) : dateRangeEnd;
            taskStart.setHours(0,0,0,0);
            taskEnd.setHours(0,0,0,0);

            return (taskStart <= dateRangeEnd && taskEnd >= dateRangeStart);
        });
        
        const calProject = document.getElementById('calFilterProject');
        if (calProject && calProject.value !== 'all') {
            displayTasks = displayTasks.filter(t => t.ma_cv && t.ma_cv.indexOf(calProject.value) !== -1);
        }

        if (selectedMaCvFilter) {
            displayTasks = displayTasks.filter(t => t.ma_cv === selectedMaCvFilter);
        }

        // Stats calculation should match displayTasks if filtered, or filteredTasks if we want overall stats
        const filteredTasks = displayTasks; // For consistency in stats calculation below

        // Calculate Stats
        const total = filteredTasks.length;
        const done = filteredTasks.filter(t => parseInt(t.tien_do) === 100).length;
        const doing = filteredTasks.filter(t => parseInt(t.tien_do) > 0 && parseInt(t.tien_do) < 100).length;
        const overdue = filteredTasks.filter(t => {
            if (parseInt(t.tien_do) === 100) return false;
            if (!t.ngay_hoan_thanh || t.ngay_hoan_thanh === '0000-00-00') return false;
            return new Date(t.ngay_hoan_thanh) < new Date();
        }).length;

        // Calculate Overall Progress (Average of all filtered tasks)
        const totalWeight = filteredTasks.length;
        const totalProgressSum = filteredTasks.reduce((sum, t) => sum + (parseInt(t.tien_do) || 0), 0);
        const avgProgress = totalWeight ? (totalProgressSum / totalWeight) : 0;
        
        const overallFill = document.getElementById('overallGanttProgressFill');
        const overallText = document.getElementById('overallGanttProgressText');
        if (overallFill) overallFill.style.width = avgProgress + '%';
        if (overallText) overallText.textContent = avgProgress.toFixed(2).replace('.', ',') + '%';

        // Populate Header Stats Cards
        const headerCards = document.getElementById('ganttHeaderCards');
        if (headerCards) {
            headerCards.innerHTML = `
                <div class="gantt-stat-card" style="background: #10b981; border: none; min-width: 120px; padding: 12px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);">
                    <div class="gantt-stat-label" style="color: rgba(255,255,255,0.85);">Đã hoàn thành</div>
                    <div class="gantt-stat-value" style="color: white; font-size: 1.4rem;">${total ? (done/total*100).toFixed(2).replace('.', ',') : '0,00'}%</div>
                </div>
                <div class="gantt-stat-card" style="background: #f59e0b; border: none; min-width: 120px; padding: 12px; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.2);">
                    <div class="gantt-stat-label" style="color: rgba(255,255,255,0.85);">Đang thực hiện</div>
                    <div class="gantt-stat-value" style="color: white; font-size: 1.4rem;">${total ? (doing/total*100).toFixed(2).replace('.', ',') : '0,00'}%</div>
                </div>
                <div class="gantt-stat-card" style="background: #ef4444; border: none; min-width: 120px; padding: 12px; box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.2);">
                    <div class="gantt-stat-label" style="color: rgba(255,255,255,0.85);">Quá hạn</div>
                    <div class="gantt-stat-value" style="color: white; font-size: 1.4rem;">${total ? (overdue/total*100).toFixed(2).replace('.', ',') : '0,00'}%</div>
                </div>
                <div class="gantt-stat-card" style="background: #64748b; border: none; min-width: 120px; padding: 12px; box-shadow: 0 10px 15px -3px rgba(100, 116, 139, 0.2);">
                    <div class="gantt-stat-label" style="color: rgba(255,255,255,0.85);">Đã Hủy</div>
                    <div class="gantt-stat-value" style="color: white; font-size: 1.4rem;">0,00%</div>
                </div>
            `;
        }

        // Populate Task Selector Bar (taskSelector already declared at top)
        const selectedMaCvSpan = document.getElementById('selectedTaskMaCv');

        if (startDateInput && !startDateInput.dataset.listenerAdded) {
            const updateRange = () => {
                startDateInput.dataset.manualSet = 'true';
                if (endDateInput) endDateInput.dataset.manualSet = 'true';
                renderGantt();
            };
            startDateInput.addEventListener('change', updateRange);
            if (endDateInput) endDateInput.addEventListener('change', updateRange);
            startDateInput.dataset.listenerAdded = 'true';

            const btnFilter = document.getElementById('btnGanttFilter');
            if (btnFilter) {
                btnFilter.onclick = () => {
                    startDateInput.dataset.manualSet = 'true';
                    if (endDateInput) endDateInput.dataset.manualSet = 'true';
                    renderGantt();
                };
            }

            const btnToday = document.getElementById('btnGanttToday');
            if (btnToday) {
                btnToday.onclick = () => {
                    currentStaffMonthDate = new Date();
                    startDateInput.dataset.manualSet = '';
                    if (endDateInput) endDateInput.dataset.manualSet = '';
                    renderGantt();
                };
            }
        }

        if (taskSelector) {
            const currentSelected = taskSelector.value;
            taskSelector.innerHTML = '<option value="">-- Chọn công việc trong danh sách --</option>';
            filteredTasks.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.ma_cv;
                opt.textContent = t.ten_cv;
                taskSelector.appendChild(opt);
            });
            taskSelector.value = currentSelected;
            
            if (currentSelected && selectedMaCvSpan) selectedMaCvSpan.textContent = currentSelected;

            if (!taskSelector.dataset.listenerAdded) {
                taskSelector.addEventListener('change', (e) => {
                    const maCv = e.target.value;
                    renderGantt();
                    
                    if (maCv) {
                        setTimeout(() => {
                            const task = currentTasks.find(t => t.ma_cv === maCv);
                            if (task && task.ngay_bat_dau && task.ngay_bat_dau !== '0000-00-00') {
                                const startDay = parseInt(task.ngay_bat_dau.split('-')[2]);
                                const timelinePane = document.querySelector('.gantt-pane-timeline');
                                if (timelinePane) {
                                    const cellWidth = 50; 
                                    timelinePane.scrollLeft = (startDay - 1) * cellWidth - 50;
                                }
                            }
                        }, 100);
                    }
                });
                taskSelector.dataset.listenerAdded = 'true';
            }
        }

        if (allMyTasks.length === 0) {
            container.innerHTML = `
                <div style="padding: 100px; text-align: center; color: #64748b; background: white; border-radius: 20px; border: 2px dashed #e2e8f0;">
                    <div class="loading-spinner" style="margin-bottom: 20px;"></div>
                    <p style="font-weight: 700; font-size: 1.1rem; letter-spacing: 1px;">ĐANG TẢI DỮ LIỆU TỪ MÁY CHỦ...</p>
                </div>`;
            return;
        }

        if (displayTasks.length === 0) {
            container.innerHTML = `
                <div style="padding: 100px; text-align: center; color: #64748b; background: white; border-radius: 20px; border: 2px dashed #e2e8f0;">
                    <p style="font-weight: 700; font-size: 1.1rem;">Không có công việc nào khớp với bộ lọc trong tháng ${month + 1}/${year}.</p>
                    <p style="font-size: 0.9rem; opacity: 0.7; margin-top: 10px;">Thử thay đổi Ngày bắt đầu hoặc bộ lọc Dự án.</p>
                </div>`;
            return;
        }

        let leftHtml = `<table class="gantt-pane-table">
            <thead>
                <tr>
                    <th style="width: 50px; text-align: center;">XONG</th>
                    <th style="width: 250px; text-align: left;">TÊN CÔNG VIỆC</th>
                    <th style="width: 140px; text-align: center;">TIẾN ĐỘ</th>
                    <th style="width: 100px; text-align: center;">NGÀY GIAO</th>
                    <th style="width: 100px; text-align: center;">HẠN CHÓT</th>
                    <th style="width: 80px; text-align: center;">CÒN LẠI</th>
                    <th style="width: 120px; text-align: center;">TRẠNG THÁI</th>
                    <th style="width: 100px; text-align: center;">MỨC ĐỘ</th>
                </tr>
            </thead>
            <tbody>`;

        let rightHtml = `<div class="gantt-timeline-header">`;
        
        // Header Row 1: Weeks & Months
        rightHtml += `<div class="week-row">`;
        let dayCounter = 0;
        let weekCount = 1;
        while (dayCounter < totalDaysInRange) {
            const currentDay = new Date(dateRangeStart);
            currentDay.setDate(dateRangeStart.getDate() + dayCounter);
            
            // Calculate how many days left in this week (to next Monday or end of range)
            let daysInThisWeek = 0;
            let tempDay = new Date(currentDay);
            while (dayCounter + daysInThisWeek < totalDaysInRange) {
                daysInThisWeek++;
                tempDay.setDate(tempDay.getDate() + 1);
                if (tempDay.getDay() === 1) break; // Stop at Monday
            }
            
            const width = daysInThisWeek * 30;
            rightHtml += `<div class="week-cell" style="width: ${width}px; font-style: normal; font-family: inherit;">
                <div class="week-label" style="font-weight: 800; font-size: 0.75rem; color: #1e293b;">TUẦN ${weekCount}</div>
            </div>`;
            weekCount++;
            dayCounter += daysInThisWeek;
        }
        rightHtml += `</div>`;

        // Header Row 2: Day Letters (T2, T3, T4, T5, T6, T7, CN)
        const vnDayLetters = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        rightHtml += `<div class="day-letter-row">`;
        for (let i = 0; i < totalDaysInRange; i++) {
            const d = new Date(dateRangeStart);
            d.setDate(dateRangeStart.getDate() + i);
            const isSun = d.getDay() === 0;
            rightHtml += `<div class="day-letter-cell ${isSun ? 'sunday' : ''}">${vnDayLetters[d.getDay()]}</div>`;
        }
        rightHtml += `</div>`;

        // Header Row 3: Date Numbers
        rightHtml += `<div class="date-num-row">`;
        for (let i = 0; i < totalDaysInRange; i++) {
            const d = new Date(dateRangeStart);
            d.setDate(dateRangeStart.getDate() + i);
            const isSun = d.getDay() === 0;
            rightHtml += `<div class="date-num-cell ${isSun ? 'sunday' : ''}">${d.getDate()}</div>`;
        }
        rightHtml += `</div></div>`;

        // Use displayTasks for rendering the table and timeline
        displayTasks.forEach(t => {
            const isDone = parseInt(t.tien_do) === 100;
            const progress = parseInt(t.tien_do || 0);
            
            // Dates processing
            const startStr = t.ngay_bat_dau && t.ngay_bat_dau !== '0000-00-00' ? t.ngay_bat_dau : null;
            const endStr = t.ngay_hoan_thanh && t.ngay_hoan_thanh !== '0000-00-00' ? t.ngay_hoan_thanh : null;
            
            const taskStart = startStr ? new Date(startStr) : null;
            const taskEnd = endStr ? new Date(endStr) : null;
            if (taskStart) taskStart.setHours(0,0,0,0);
            if (taskEnd) taskEnd.setHours(0,0,0,0);

            let statusText = 'Đang thực hiện'; let statusBg = '#dbeafe'; let statusColor = '#1e40af';
            if (isDone) { statusText = 'Hoàn thành'; statusBg = '#d1fae5'; statusColor = '#065f46'; }
            else if (endStr && new Date(endStr) < new Date().setHours(0,0,0,0)) {
                statusText = 'Quá hạn'; statusBg = '#fee2e2'; statusColor = '#b91c1c';
            }

            let prioText = 'Bình thường'; let prioColor = '#3b82f6';
            if (t.cap_do == 1) { prioText = 'Khẩn cấp'; prioColor = '#ef4444'; }
            else if (t.cap_do == 2) { prioText = 'Cao'; prioColor = '#f59e0b'; }
            else if (t.cap_do == 4) { prioText = 'Thấp'; prioColor = '#10b981'; }

            let remaining = '-';
            if (endStr && !isDone) {
                const today = new Date(); today.setHours(0,0,0,0);
                const d = new Date(endStr); d.setHours(0,0,0,0);
                
                // Count business days (exclude Sundays)
                let diff = 0;
                let temp = new Date(today);
                if (temp <= d) {
                    while (temp < d) {
                        temp.setDate(temp.getDate() + 1);
                        if (temp.getDay() !== 0) diff++;
                    }
                } else {
                    while (temp > d) {
                        if (temp.getDay() !== 0) diff--;
                        temp.setDate(temp.getDate() - 1);
                    }
                }
                remaining = diff > 0 ? diff : (diff < 0 ? `Quá ${Math.abs(diff)}` : 'Hết hạn');
            }

            let barColor = '#fbbf24'; // Solid yellow like image 2
            if (isDone) barColor = '#10b981';
            else if (statusText === 'Quá hạn') barColor = '#ef4444';

            leftHtml += `<tr>
                <td style="text-align:center;">${isDone ? '✅' : '⬜'}</td>
                <td style="text-align:left; font-weight:700; cursor:pointer;" onclick="openEditModal(${JSON.stringify(t).replace(/"/g, '&quot;')})">
                    <div style="max-height: 48px; overflow: hidden; line-height: 1.1; font-size: 0.85rem; display: flex; align-items: center;">
                        ${t.ten_cv}
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <div class="mini-progress-container">
                            <div class="mini-progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text-label">${progress}%</span>
                    </div>
                </td>
                <td style="text-align: center;">${startStr ? formatDate(t.ngay_bat_dau) : '-'}</td>
                <td style="text-align: center;">${endStr ? formatDate(t.ngay_hoan_thanh) : '-'}</td>
                <td style="text-align: center; font-weight:700; color:${remaining.toString().includes('Quá') ? '#ef4444' : '#1e293b'}">${remaining}</td>
                <td style="text-align: center;"><span class="status-badge" style="background:${statusBg}; color:${statusColor}; font-size: 0.6rem; padding: 1px 4px;">${statusText}</span></td>
                <td style="text-align: center; font-weight:700; color:${prioColor}">${prioText}</td>
            </tr>`;

            const isOverdue = statusText === 'Quá hạn';

            rightHtml += `<div class="timeline-grid-row">`;
            // 1. Draw background grid
            for (let i = 0; i < totalDaysInRange; i++) {
                const cur = new Date(dateRangeStart);
                cur.setDate(dateRangeStart.getDate() + i);
                const isSun = cur.getDay() === 0;
                rightHtml += `<div class="timeline-cell ${isSun ? 'sunday' : ''}"></div>`;
            }
            
            // 2. Draw beautiful continuous bars (split by Sundays)
            let currentBlockStart = -1;
            let currentBlockLen = 0;

            for (let i = 0; i < totalDaysInRange; i++) {
                const cur = new Date(dateRangeStart);
                cur.setDate(dateRangeStart.getDate() + i);
                cur.setHours(0,0,0,0);
                const isSun = cur.getDay() === 0;
                
                let isTask = false;
                if (taskStart && taskEnd && cur >= taskStart && cur <= taskEnd) {
                    isTask = true;
                }

                if (isTask && !isSun) {
                    if (currentBlockStart === -1) currentBlockStart = i;
                    currentBlockLen++;
                } else {
                    // Render the accumulated block if any
                    if (currentBlockStart !== -1) {
                        const leftPos = currentBlockStart * 30 + 2; // Small margin
                        const barWidth = currentBlockLen * 30 - 4; // Small margin
                        let barClass = '';
                        if (isDone) barClass = 'done';
                        else if (statusText === 'Quá hạn') barClass = 'overdue';
                        
                        rightHtml += `<div class="gantt-bar-continuous ${barClass}" 
                            style="left: ${leftPos}px; width: ${barWidth}px;" 
                            title="${t.ten_cv}"></div>`;
                        
                        currentBlockStart = -1;
                        currentBlockLen = 0;
                    }
                }
            }
            // Final check for block at the end of range
            if (currentBlockStart !== -1) {
                const leftPos = currentBlockStart * 30 + 2;
                const barWidth = currentBlockLen * 30 - 4;
                let barClass = '';
                if (isDone) barClass = 'done';
                else if (statusText === 'Quá hạn') barClass = 'overdue';
                
                rightHtml += `<div class="gantt-bar-continuous ${barClass}" 
                    style="left: ${leftPos}px; width: ${barWidth}px;" 
                    title="${t.ten_cv}"></div>`;
            }

            rightHtml += `</div>`;
        });

        leftHtml += `</tbody></table>`;
        
        container.innerHTML = `
            <div class="gantt-layout">
                <div class="gantt-left-pane">${leftHtml}</div>
                <div class="gantt-right-pane">${rightHtml}</div>
            </div>
        `;
    }

    function renderUrgentWidget() {
        const list = document.getElementById('urgentTasksList');
        if (!list) return;

        const today = new Date();
        today.setHours(0,0,0,0);

        const urgent = allMyTasks.filter(t => {
            if (parseInt(t.tien_do) === 100) return false;
            if (!t.ngay_hoan_thanh || t.ngay_hoan_thanh === '0000-00-00') return false;
            
            const p = t.ngay_hoan_thanh.split('-');
            const d = new Date(p[0], p[1] - 1, p[2]);
            d.setHours(0,0,0,0);
            const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
            return diff <= 3; // Show tasks due in 3 days or less
        }).sort((a, b) => {
            const da = new Date(a.ngay_hoan_thanh);
            const db = new Date(b.ngay_hoan_thanh);
            return da - db;
        }).slice(0, 5);

        if (urgent.length === 0) {
            list.innerHTML = '<li style="font-size: 0.8rem; color: #94a3b8; text-align: center; font-weight: 600; padding: 10px;">Không có việc khẩn cấp</li>';
            return;
        }

        list.innerHTML = urgent.map(t => {
            const p = t.ngay_hoan_thanh.split('-');
            const d = new Date(p[0], p[1] - 1, p[2]);
            d.setHours(0,0,0,0);
            const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
            let color = '#f59e0b';
            let label = 'Sắp hạn';
            let bgColor = '#fff';
            let borderColor = '#f1f5f9';

            if (diff < 0) {
                color = '#ef4444';
                label = 'QUÁ HẠN!';
                bgColor = '#fef2f2';
                borderColor = '#fee2e2';
            } else if (diff <= 1) { 
                color = '#ef4444'; 
                label = 'CẦN XỬ LÝ GẤP!'; 
                bgColor = '#fff1f2';
                borderColor = '#fecaca';
            }

            // Truncate long ma_cv
            const shortMaCv = t.ma_cv.length > 10 ? t.ma_cv.substring(0, 10) + '...' : t.ma_cv;

            return `
                <li onclick="openEditModal(${JSON.stringify(t).replace(/"/g, '&quot;')})" 
                    style="cursor: pointer; background: ${bgColor}; padding: 12px; border-radius: 12px; border: 1px solid ${borderColor}; transition: all 0.2s; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.03); padding-bottom: 4px; margin-bottom: 2px;">
                        <span style="font-size: 0.65rem; font-weight: 900; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px;">${label}</span>
                        <span style="font-size: 0.65rem; font-weight: 700; color: #94a3b8; background: rgba(255,255,255,0.5); padding: 2px 6px; border-radius: 4px;">${shortMaCv}</span>
                    </div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b; line-height: 1.3;">${t.ten_cv}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px;">
                        <span style="font-size: 0.7rem; font-weight: 600; color: ${diff <= 1 ? '#e11d48' : '#64748b'};">Hạn: ${formatDate(t.ngay_hoan_thanh)}</span>
                        <span style="font-size: 0.7rem; font-weight: 900; color: ${color};">${t.tien_do}%</span>
                    </div>
                </li>
            `;
        }).join('');
    }

    // Add Sidebar Listeners
    document.getElementById('calFilterYear')?.addEventListener('change', renderCalendar);
    document.getElementById('calFilterMonth')?.addEventListener('change', renderCalendar);
    document.getElementById('calHideDone')?.addEventListener('change', renderCalendar);
    document.getElementById('calFilterProject')?.addEventListener('change', renderCalendar);
    document.getElementById('calFilterLeader')?.addEventListener('change', renderCalendar);
    document.getElementById('calStartDay')?.addEventListener('change', renderCalendar);

    const calNotes = document.getElementById('calNotes');
    if (calNotes) {
        calNotes.value = localStorage.getItem('cal_notes') || '';
        calNotes.addEventListener('input', () => {
            localStorage.setItem('cal_notes', calNotes.value);
        });
    }

    const monthFilterDisplay = document.getElementById('monthFilterDisplay');
    const btnPrevMonth = document.getElementById('btnPrevMonth');
    const btnNextMonth = document.getElementById('btnNextMonth');

    // === HELPER FUNCTIONS (STAFF SPECIFIC) ===
    function getLevelBadge(levelId, text) {
        const mapping = {
            '1': { text: 'Khẩn cấp', color: '#ef4444', bg: '#fee2e2', border: '#fecaca' },
            '2': { text: 'Cao', color: '#f59e0b', bg: '#fff7ed', border: '#fed7aa' },
            '3': { text: 'Bình thường', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
            '4': { text: 'Thấp', color: '#94a3b8', bg: '#f1f5f9', border: '#e2e8f0' }
        };
        const config = mapping[levelId] || mapping[String(levelId)] || { text: text || 'Thường', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
        return `<span style="padding: 6px 14px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; background: ${config.bg}; color: ${config.color}; border: 1px solid ${config.border}; display: inline-block; min-width: 80px; text-align: center;">${config.text}</span>`;
    }

    function getStatusBadgeStaff(id, text) {
        const mapping = {
            '1': { text: 'Hoàn thành', color: '#166534', bg: '#dcfce7', border: '#bbf7d0' },
            '2': { text: 'Đang làm', color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
            '3': { text: 'Quá hạn', color: '#ef4444', bg: '#fee2e2', border: '#fecaca' },
            '4': { text: 'Tạm dừng', color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
            '5': { text: 'Xin chỉ đạo', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' }
        };
        const config = mapping[id] || mapping[String(id)] || { text: text || 'Đang làm', color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' };
        return `<span class="status-label" style="padding: 6px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 800; background: ${config.bg}; color: ${config.color}; border: 1px solid ${config.border};">${config.text.toUpperCase()}</span>`;
    }

    function getTaskTypeBadge(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('định kỳ') || t.includes('dinh ky') || t.includes('dinh_ky')) {
            return `<span class="badge-task-type" style="font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 800; display: inline-block;">ĐỊNH KỲ</span>`;
        } else {
            return `<span class="badge-task-type" style="font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-weight: 800; display: inline-block;">PHÁT SINH</span>`;
        }
    }

    const updateMonthDisplay = () => {
        if (monthFilterDisplay) {
            monthFilterDisplay.textContent = `THÁNG ${String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0')} / ${currentStaffMonthDate.getFullYear()}`;
        }
        // Sync Sidebar
        const sidebarMonth = document.getElementById('sidebarMonth');
        const sidebarYear = document.getElementById('sidebarYear');
        if (sidebarMonth) sidebarMonth.value = currentStaffMonthDate.getMonth() + 1;
        if (sidebarYear) sidebarYear.value = currentStaffMonthDate.getFullYear();

        if (calendarView && calendarView.classList.contains('active')) {
            renderCalendar();
        }
        if (ganttView && ganttView.classList.contains('active')) {
            renderGantt();
        }
    };
    updateMonthDisplay(); // Init first time

    // Sidebar listeners
    document.getElementById('sidebarMonth')?.addEventListener('change', (e) => {
        currentStaffMonthDate.setMonth(parseInt(e.target.value) - 1);
        updateMonthDisplay();
        filterTasksByCurrentMonth();
    });
    document.getElementById('sidebarYear')?.addEventListener('change', (e) => {
        currentStaffMonthDate.setFullYear(parseInt(e.target.value));
        updateMonthDisplay();
        filterTasksByCurrentMonth();
    });
    document.getElementById('hideCompletedTasks')?.addEventListener('change', filterTasksByCurrentMonth);

    if (btnPrevMonth) {
        btnPrevMonth.addEventListener('click', () => {
            currentStaffMonthDate.setMonth(currentStaffMonthDate.getMonth() - 1);
            updateMonthDisplay();
            filterTasksByCurrentMonth();
        });
    }

    if (btnNextMonth) {
        btnNextMonth.addEventListener('click', () => {
            currentStaffMonthDate.setMonth(currentStaffMonthDate.getMonth() + 1);
            updateMonthDisplay();
            filterTasksByCurrentMonth();
        });
    }

    // Listeners moved down

    function filterTasksByCurrentMonth() {
        const currentMonthStr = `${currentStaffMonthDate.getFullYear()}-${String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const searchTerm = taskSearch ? taskSearch.value.toLowerCase().trim() : '';
        const filterStatus = document.getElementById('filterStatus');
        const filterVal = filterStatus ? filterStatus.value : 'all';
        const hideCompleted = document.getElementById('hideCompletedTasks')?.checked;

        currentTasks = [];
        const projects = new Set();
        const leaders = new Set();
        
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        // Pre-calculate latest months for recurring logic
        const maxStartMonthPerMaCv = {};
        allMyTasks.forEach(t => {
            if (t.ngay_bat_dau && t.ngay_bat_dau !== '-' && t.ngay_bat_dau !== '0000-00-00') {
                const m = parseMonth(t.ngay_bat_dau);
                if (!maxStartMonthPerMaCv[t.ma_cv] || m > maxStartMonthPerMaCv[t.ma_cv]) {
                    maxStartMonthPerMaCv[t.ma_cv] = m;
                }
            }
        });

        const specificRecordsCount = {};
        allMyTasks.forEach(t => {
            if (t.ngay_bat_dau && t.ngay_bat_dau !== '-' && t.ngay_bat_dau !== '0000-00-00') {
                if (parseMonth(t.ngay_bat_dau) === currentMonthStr) {
                    specificRecordsCount[t.ma_cv] = (specificRecordsCount[t.ma_cv] || 0) + 1;
                }
            }
        });

        const hotspots = [];

        allMyTasks.forEach(task => {

            const loaiRaw = task.loai_cv || 'Định kỳ';
            const loai = loaiRaw.trim().toLowerCase();
            const startMonth = parseMonth(task.ngay_bat_dau);
            const endMonth = parseMonth(task.ngay_hoan_thanh);

            const isRecurring = loai.includes('định kỳ') || loai.includes('dinh ky');

            let isVisible = false;
            if (startMonth && endMonth) {
                isVisible = (currentMonthStr >= startMonth && currentMonthStr <= endMonth);
            } else if (startMonth) {
                isVisible = (currentMonthStr === startMonth);
            } else {
                isVisible = true; 
            }

            // Carry-over logic for Recurring tasks:
            // Only carry over if it's the LATEST record for this ma_cv (relay logic)
            if (!isVisible && isRecurring && startMonth && currentMonthStr > startMonth) {
                const isLatest = (startMonth === maxStartMonthPerMaCv[task.ma_cv]);
                
                if (isLatest && (specificRecordsCount[task.ma_cv] || 0) <= 0) {
                    isVisible = true;
                } else if (isLatest) {
                    // Consume one specific record slot
                    specificRecordsCount[task.ma_cv]--;
                }
            }

            if (!isVisible) return;

            // Process Reset for Carry-over tasks:
            // Clear dates/progress if it's a recurring task and we are NOT in its specific primary month
            let processedTask = { ...task };
            const taskMonth = parseMonth(task.ngay_hoan_thanh) || parseMonth(task.ngay_bat_dau);
            
            if (isRecurring && taskMonth && currentMonthStr !== taskMonth && taskMonth < currentMonthStr) {
                processedTask.ngay_bat_dau = '-';
                processedTask.ngay_hoan_thanh = '-';
                processedTask.tien_do = 0;
                processedTask.trang_thai_id = 2;
                if (processedTask.mo_ta_cv) {
                    processedTask.mo_ta_cv = processedTask.mo_ta_cv.replace(/\[x\]/gi, '[ ]');
                }
            }

            // Status filter (Hide Completed)
            if (hideCompleted && parseInt(processedTask.tien_do) >= 100) return;

            // Search & Status filters
            if (searchTerm) {
                const searchContent = `${processedTask.ma_cv} ${processedTask.ten_cv}`.toLowerCase();
                if (!searchContent.includes(searchTerm)) return;
            }

            let isHotspot = false;
            let diffDays = null;
            if (parseInt(processedTask.tien_do || 0) < 100 && processedTask.ngay_hoan_thanh && processedTask.ngay_hoan_thanh !== '0000-00-00') {
                const d = new Date(processedTask.ngay_hoan_thanh);
                d.setHours(0, 0, 0, 0);
                diffDays = Math.ceil((d - todayDate) / (1000 * 60 * 60 * 24));
                if (diffDays <= 2) {
                    isHotspot = true;
                    hotspots.push({ task: processedTask, diffDays });
                }
            }

            if (filterVal === 'due-soon' && !isHotspot) return;

            // Collect projects for the dropdown (only for tasks visible in the selected month)
            if (processedTask.ma_cv) {
                const parts = processedTask.ma_cv.split('-');
                projects.add(parts[0]);
            }

            // DEDUPLICATION: Only keep the most relevant record for each ma_cv
            const existingIdx = currentTasks.findIndex(t => t.ma_cv === processedTask.ma_cv);
            if (existingIdx !== -1) {
                const existing = currentTasks[existingIdx];
                const existingMonth = parseMonth(existing.ngay_bat_dau);
                const currentMonth = parseMonth(processedTask.ngay_bat_dau);
                
                // Prioritize exact month match
                if (currentMonth === currentMonthStr && existingMonth !== currentMonthStr) {
                    currentTasks[existingIdx] = processedTask;
                } 
                // Or prioritize later start date (more recent)
                else if (currentMonth > existingMonth && existingMonth !== currentMonthStr) {
                    currentTasks[existingIdx] = processedTask;
                }
                return; // Skip adding as new
            }

            currentTasks.push(processedTask);
        });

        const hotspotWidget = document.getElementById('hotspotWidget');
        const hotspotList = document.getElementById('hotspotList');
        if (hotspotWidget && hotspotList) {
            if (hotspots.length > 0) {
                hotspotWidget.style.display = 'block';
                hotspotList.innerHTML = hotspots.map(h => {
                    const statusText = h.diffDays < 0 ? 'Quá hạn!' : (h.diffDays === 0 ? 'Hôm nay!' : `Còn ${h.diffDays} ngày`);
                    const color = h.diffDays <= 0 ? '#ef4444' : '#f59e0b';
                    return `<li style="display: flex; align-items: center; gap: 10px; background: white; padding: 10px 15px; border-radius: 8px; border-left: 3px solid ${color};">
                                <span style="font-weight: 800; color: var(--primary); font-family: monospace;">${h.task.ma_cv}</span>
                                <span style="flex: 1; font-weight: 600; color: var(--text-main);">${h.task.ten_cv}</span>
                                <span style="color: ${color}; font-weight: 800; font-size: 0.85rem; padding: 4px 8px; background: ${color}20; border-radius: 6px;">${statusText} (${h.task.tien_do}%)</span>
                            </li>`;
                }).join('');
            } else {
                hotspotWidget.style.display = 'none';
            }
        }

        const sortedTasks = currentTasks.sort((a, b) => {
            const aDone = parseInt(a.tien_do || 0) >= 100;
            const bDone = parseInt(b.tien_do || 0) >= 100;
            if (aDone !== bDone) return aDone ? 1 : -1;
            if (!aDone) {
                if (a.cap_do_id !== b.cap_do_id) return a.cap_do_id - b.cap_do_id;
            }
            return 0;
        });

        updateStats(sortedTasks);
        renderTable(sortedTasks);
        
        // Cập nhật các view khác nếu đang active để đảm bảo đồng bộ
        if (calendarView && calendarView.classList.contains('active')) renderCalendar();
        if (typeof ganttView !== 'undefined' && ganttView && ganttView.classList.contains('active')) renderGantt();

        // Populate Calendar Project Filter
        const calProjectSelect = document.getElementById('calFilterProject');
        if (calProjectSelect && typeof projects !== 'undefined') {
            const currentVal = calProjectSelect.value;
            calProjectSelect.innerHTML = '<option value="all">Tất cả dự án</option>';
            Array.from(projects).sort().forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                calProjectSelect.appendChild(opt);
            });
            calProjectSelect.value = currentVal;
        }

        // Sync calendar if active
        if (calendarView && calendarView.classList.contains('active')) {
            renderCalendar();
        }
    }

    if (taskSearch) {
        taskSearch.addEventListener('input', filterTasksByCurrentMonth);
    }
    const filterStatusSelect = document.getElementById('filterStatus');
    if (filterStatusSelect) {
        filterStatusSelect.addEventListener('change', filterTasksByCurrentMonth);
    }

    async function loadMyTasks() {
        if (!tbody) return;
        try {
            // Show loading state if it was cleared
            if (tbody.innerHTML === '' || !tbody.querySelector('.loading-spinner')) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 100px;">
                            <div class="loading-spinner"></div>
                            <p style="color: var(--text-muted); font-weight: 700; letter-spacing: 2px;">ĐANG TẢI DỮ LIỆU...</p>
                        </td>
                    </tr>`;
            }

            const response = await fetch('api_get_my_tasks.php?t=' + Date.now());
            const result = await response.json();

            if (result.unauthorized) {
                console.warn("Session lost, redirecting to login...");
                window.location.replace('login.html');
                return;
            }

            if (result.success) {
                allMyTasks = result.data || [];

                if (result.userInfo) {
                    const name = result.userInfo.ten_nv;
                    currentMaNv = result.userInfo.ma_nv;
                    if (userNameDisplay) userNameDisplay.textContent = name;
                    if (userAvatar) userAvatar.textContent = name.charAt(0).toUpperCase();
                }

                filterTasksByCurrentMonth();
                
                // Sync calendar or gantt if active
                if (calendarView && calendarView.classList.contains('active')) {
                    renderCalendar();
                }
                if (ganttView && ganttView.classList.contains('active')) {
                    renderGantt();
                }

                const lastUpdate = document.getElementById('lastUpdate');
                if (lastUpdate) {
                    lastUpdate.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                }
            } else {
                tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger); text-align: center; padding: 3rem;">Lỗi: ${result.message}</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger); text-align: center; padding: 3rem;">Lỗi kết nối máy chủ!</td></tr>`;
        }
    }

    function updateStats(tasksToStat) {
        const totalCount = tasksToStat.length;
        if(statTotal) statTotal.textContent = totalCount;
        
        const doneTasks = tasksToStat.filter(t => parseInt(t.tien_do) === 100);
        const doingTasks = tasksToStat.filter(t => parseInt(t.tien_do) > 0 && parseInt(t.tien_do) < 100);
        
        if(statDone) statDone.textContent = doneTasks.length;
        if(statDoing) statDoing.textContent = doingTasks.length;

        const pausedTasks = tasksToStat.filter(t => {
            const id = t.trang_thai_id || t.trang_thai;
            const text = (t.trang_thai_text || '').toLowerCase();
            return (id == 4 || text.includes('tạm dừng'));
        });
        if(statHigh) statHigh.textContent = pausedTasks.length;

        // === Calculate Overall Progress ===
        let totalProgress = 0;
        if (totalCount > 0) {
            totalProgress = tasksToStat.reduce((acc, t) => acc + parseInt(t.tien_do || 0), 0) / totalCount;
        }

        const overallPercentValue = document.getElementById('overallPercentValue');
        const overallProgressBar = document.getElementById('overallProgressBar');
        const overallPercentLabel = document.getElementById('overallPercentLabel');

        if (overallPercentValue) overallPercentValue.textContent = totalProgress.toFixed(2).replace('.', ',') + '%';
        if (overallPercentLabel) overallPercentLabel.textContent = totalProgress.toFixed(2) + '%';
        if (overallProgressBar) overallProgressBar.style.width = totalProgress + '%';

        // === Update Circular Charts ===
        const updateCircle = (id, percent, labelId) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(labelId);
            if (el) {
                const deg = (percent / 100) * 360;
                el.style.background = `conic-gradient(var(--chart-color) ${deg}deg, #f1f5f9 ${deg}deg)`;
            }
            if (valEl) valEl.textContent = Math.round(percent) + '%';
        };

        const donePercent = totalCount > 0 ? (doneTasks.length / totalCount) * 100 : 0;
        const doingPercent = totalCount > 0 ? (doingTasks.length / totalCount) * 100 : 0;

        // Calculate Overdue
        const today = new Date();
        today.setHours(0,0,0,0);
        const overdueTasks = tasksToStat.filter(t => {
            if (parseInt(t.tien_do) === 100) return false;
            if (!t.ngay_hoan_thanh || t.ngay_hoan_thanh === '0000-00-00') return false;
            return new Date(t.ngay_hoan_thanh) < today;
        });
        const overduePercent = totalCount > 0 ? (overdueTasks.length / totalCount) * 100 : 0;
        
        const pausedPercent = totalCount > 0 ? (pausedTasks.length / totalCount) * 100 : 0;

        updateCircle('circleDone', donePercent, 'valDonePercent');
        updateCircle('circleDoing', doingPercent, 'valDoingPercent');
        updateCircle('circleOverdue', overduePercent, 'valOverduePercent');
        updateCircle('circleUrgent', pausedPercent, 'valUrgentPercent');

        renderSecondaryCharts(tasksToStat);
    }

    let monthlyChart = null;
    let topTasksChartInstance = null;

    function renderSecondaryCharts(tasks) {
        // 1. Process Monthly Workload
        const monthStats = {};
        allMyTasks.forEach(t => {
            if (t.ngay_bat_dau && t.ngay_bat_dau !== '-' && t.ngay_bat_dau !== '0000-00-00') {
                const month = parseMonth(t.ngay_bat_dau); // YYYY-MM
                if (!monthStats[month]) monthStats[month] = { total: 0, done: 0, processing: 0 };
                
                monthStats[month].total++;
                if (parseInt(t.tien_do || 0) === 100) {
                    monthStats[month].done++;
                } else {
                    monthStats[month].processing++;
                }
            }
        });

        const sortedMonths = Object.keys(monthStats).sort().slice(-5); // Last 5 months as per image
        const monthlyLabels = sortedMonths.map(m => {
            const [y, mm] = m.split('-');
            return `Th${parseInt(mm)}/${y}`;
        });
        
        const totalData = sortedMonths.map(m => monthStats[m].total);
        const doneData = sortedMonths.map(m => monthStats[m].done);
        const processingData = sortedMonths.map(m => monthStats[m].processing);

        const ctxMonthly = document.getElementById('monthlyWorkloadChart');
        if (ctxMonthly) {
            if (monthlyChart) monthlyChart.destroy();
            monthlyChart = new Chart(ctxMonthly, {
                type: 'bar',
                data: {
                    labels: monthlyLabels,
                    datasets: [
                        {
                            label: 'Tổng công việc',
                            data: totalData,
                            backgroundColor: 'rgba(37, 99, 235, 0.7)',
                            borderColor: '#2563eb',
                            borderWidth: 1.5,
                            borderRadius: 4,
                            barPercentage: 0.8,
                            categoryPercentage: 0.6
                        },
                        {
                            label: 'Đã hoàn thành',
                            data: doneData,
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: '#10b981',
                            borderWidth: 1.5,
                            borderRadius: 4,
                            barPercentage: 0.8,
                            categoryPercentage: 0.6
                        },
                        {
                            label: 'Đang xử lý',
                            data: processingData,
                            backgroundColor: 'rgba(245, 158, 11, 0.7)',
                            borderColor: '#f59e0b',
                            borderWidth: 1.5,
                            borderRadius: 4,
                            barPercentage: 0.8,
                            categoryPercentage: 0.6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: true, 
                            position: 'top',
                            labels: { boxWidth: 15, padding: 15, font: { size: 11, weight: '700' } }
                        },
                        tooltip: { enabled: true }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: 'rgba(226, 232, 240, 0.5)' },
                            title: { display: true, text: 'Số công việc', font: { size: 11, weight: '600' } }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // 2. Process Top 5 Tasks by complexity (count of checklist items)
        const taskComplexity = tasks.map(t => {
            const lines = (t.mo_ta_cv || '').split('\n');
            const checklistItems = lines.map((l, idx) => ({ line: l, idx: idx }))
                                   .filter(item => item.line.trim().match(/^\[\s*[xX\s]*\s*\]/)).length;
            return {
                ten: t.ten_cv || 'Không tên',
                complexity: checklistItems || 5 
            };
        }).sort((a, b) => b.complexity - a.complexity).slice(0, 5);

        const topLabels = taskComplexity.map(t => t.ten.length > 20 ? t.ten.substring(0, 17) + '...' : t.ten);
        const topData = taskComplexity.map(t => t.complexity);

        const ctxTop = document.getElementById('topTasksChart');
        if (ctxTop) {
            if (topTasksChartInstance) topTasksChartInstance.destroy();
            topTasksChartInstance = new Chart(ctxTop, {
                type: 'bar',
                data: {
                    labels: topLabels,
                    datasets: [
                        {
                            label: 'Mức độ Task',
                            data: topData,
                            backgroundColor: 'rgba(99, 102, 241, 0.7)',
                            borderColor: '#6366f1',
                            borderWidth: 1.5,
                            borderRadius: 5,
                            barThickness: 40,
                            order: 2
                        },
                        {
                            label: 'Ngưỡng',
                            data: Array(topData.length).fill(Math.max(...topData) || 10),
                            type: 'line',
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            order: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { display: false },
                        tooltip: { enabled: true }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: '#f1f5f9' },
                            ticks: { font: { weight: 'bold' } }
                        },
                        x: { 
                            grid: { display: false },
                            ticks: { font: { size: 10 } }
                        }
                    }
                }
            });
        }
    }

    function renderTable(tasks) {
        if (!tbody) return;
        tbody.innerHTML = '';

        if (tasks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 6rem;">
                        <div style="font-size: 4rem; margin-bottom: 1.5rem; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));">✨</div>
                        <h3 style="color: var(--text-muted); font-weight: 600; letter-spacing: -0.5px;">Không tìm thấy công việc nào phù hợp.</h3>
                    </td>
                </tr>`;
            return;
        }

        tasks.forEach((task, index) => {
            const row = document.createElement('tr');
            row.style.animation = `fadeIn 0.3s ease-out forwards ${index * 0.05}s`;
            row.style.opacity = '0';
            row.dataset.task = JSON.stringify(task);

            const progress = parseInt(task.tien_do || 0);
            const progressColor = getProgressColor(progress);

            let displayStatusId = task.trang_thai_id || 2;
            let displayStatusText = task.trang_thai_text || 'Đang làm';

            if (progress >= 100) {
                displayStatusId = 1;
                displayStatusText = 'Hoàn thành';
            } else if (task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '-' && task.ngay_hoan_thanh !== '0000-00-00') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // Parse date robustly YYYY-MM-DD
                const parts = task.ngay_hoan_thanh.split('-');
                if (parts.length === 3) {
                    const deadline = new Date(parts[0], parts[1] - 1, parts[2]);
                    deadline.setHours(0, 0, 0, 0);
                    
                    if (deadline < today) {
                        displayStatusId = 3;
                        displayStatusText = 'Quá hạn';
                    }
                }
            }

            row.innerHTML = `
                <td style="text-align: center; color: #94a3b8; font-weight: 700;">${index + 1}</td>
                <td class="bold" style="color: #6366f1; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;">${task.ma_cv}</td>
                <td style="vertical-align: middle;">
                    <div class="task-name-click bold" style="color: #2563eb; font-size: 1rem; margin-bottom: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                        ${task.ten_cv || 'Không có tiêu đề'}
                    </div>
                    <div class="type-badge-container">${getTaskTypeBadge(task.loai_cv)}</div>
                </td>
                <td style="color: #475569; font-weight: 600; font-size: 0.9rem;">${formatDate(task.ngay_bat_dau) || '-'}</td>
                <td style="vertical-align: middle;">
                    ${(() => {
                        if (!task.ngay_hoan_thanh || task.ngay_hoan_thanh === '-' || task.ngay_hoan_thanh === '0000-00-00') return '<span style="color: #94a3b8;">-</span>';
                        
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const parts = task.ngay_hoan_thanh.split('-');
                        let deadline;
                        if (parts.length === 3) {
                            deadline = new Date(parts[0], parts[1] - 1, parts[2]);
                        } else {
                            deadline = new Date(task.ngay_hoan_thanh);
                        }
                        deadline.setHours(0, 0, 0, 0);
                        
                        const diffTime = deadline - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const isDone = progress === 100;
                        const formattedDate = formatDate(task.ngay_hoan_thanh);

                        if (isDone) return `<span style="color: #10b981; font-weight: 600;">${formattedDate}</span>`;

                        if (diffDays < 0) {
                            return `<span style="color: #ef4444; font-weight: 800; animation: pulseRed 2s infinite;">${formattedDate}</span>`;
                        } else if (diffDays === 0) {
                            return `<span style="color: #ef4444; font-weight: 800; animation: pulseRed 2s infinite;">${formattedDate} (Hôm nay)</span>`;
                        } else if (diffDays <= 2) {
                            return `<span style="color: #f59e0b; font-weight: 800;">${formattedDate}</span>`;
                        }
                        return `<span style="color: #475569; font-weight: 600;">${formattedDate}</span>`;
                    })()}
                </td>
                <td>
                    <div style="width: 100%; max-width: 120px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="font-weight: 800; color: ${progressColor}; font-size: 0.85rem;">${progress}%</span>
                        </div>
                        <div style="width: 100%; height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                            <div style="width: ${progress}%; height: 100%; background: ${progressColor}; border-radius: 10px;"></div>
                        </div>
                    </div>
                </td>
                <td style="text-align: center;">
                    ${getStatusBadgeStaff(displayStatusId, displayStatusText)}
                </td>
                <td style="text-align: center;">
                    ${getLevelBadge(task.cap_do_id || task.cap_do || 3)}
                </td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="btn-edit" title="Sửa" style="color: #94a3b8; background: white; border: 1px solid #e2e8f0; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-delete" data-macv="${task.ma_cv}" title="Xóa" style="color: #fca5a5; background: white; border: 1px solid #fee2e2; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });

        attachEvents();
    }

    const generateInteractiveChecklist = (desc, ma_cv) => {
        const safeDesc = desc || '';
        const lines = safeDesc.split('\n');
        let html = '';
        let hasChecklist = false;

        lines.forEach((line, idx) => {
            const match = line.trim().match(/^\[([xX\s])\]\s*(.*)/);
            if (match) {
                hasChecklist = true;
                const isChecked = match[1].toLowerCase() === 'x';
                const text = match[2];
                let cleanText = text;
                let fileHtml = '';
                const fileMatch = text.match(/\|file:(.*?)\|/);
                if (fileMatch) {
                    cleanText = text.replace(fileMatch[0], '').trim();
                    const filePath = fileMatch[1];
                    fileHtml = `
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <a href="${filePath}" target="_blank" download="${filePath.split('/').pop()}" style="color: #10b981; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; background: #d1fae5; transition: all 0.2s;" title="Tải về / Xem file">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            </a>
                            <button class="btn-delete-file" data-macv="${ma_cv}" data-line="${idx}" data-path="${filePath}" style="color: #ef4444; background: #fee2e2; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Xóa file">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    `;
                }

                const uploadHtml = `
                    <label style="cursor: pointer; color: #3b82f6; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: #eff6ff; transition: all 0.2s; flex-shrink: 0;" title="Tải lên file/ảnh" onmouseover="this.style.transform='scale(1.1)'; this.style.background='#dbeafe';" onmouseout="this.style.transform='scale(1)'; this.style.background='#eff6ff';">
                        <input type="file" class="file-upload-input" data-macv="${ma_cv}" data-line="${idx}" style="display: none;" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" />
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </label>
                `;

                html += `
                    <div style="display: flex; align-items: center; justify-content: flex-start; gap: 12px; margin: 0; padding: 4px 0; transition: all 0.2s;" class="checklist-item-row">
                        <input type="checkbox" class="checklist-item" data-macv="${ma_cv}" data-line="${idx}" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; border-radius: 4px; cursor: pointer; accent-color: var(--primary);">
                        <span style="font-size: 0.9rem; font-weight: 500; color: ${isChecked ? '#94a3b8' : '#475569'}; text-decoration: ${isChecked ? 'line-through' : 'none'}; flex: 1; word-break: break-word;">${cleanText}</span>
                        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                            ${fileHtml || uploadHtml}
                        </div>
                    </div>
                `;
            }
        });

        if (!hasChecklist) {
            const fileMatch = safeDesc.match(/\|file:(.*?)\|/);
            let fileHtml = '';
            if (fileMatch) {
                const filePath = fileMatch[1];
                fileHtml = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <a href="${filePath}" target="_blank" download="${filePath.split('/').pop()}" style="color: #10b981; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: #d1fae5; transition: all 0.2s;" title="Tải về / Xem file">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                        </a>
                        <button class="btn-delete-file" data-macv="${ma_cv}" data-line="0" data-path="${filePath}" style="color: #ef4444; background: #fee2e2; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Xóa file">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                `;
            } else {
                fileHtml = `
                    <label style="cursor: pointer; color: #3b82f6; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; background: #eff6ff; transition: all 0.2s;" title="Tải lên tài liệu">
                        <input type="file" class="file-upload-input" data-macv="${ma_cv}" data-line="0" style="display: none;" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" />
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </label>
                `;
            }
            const cleanDesc = safeDesc.replace(/\|file:.*?\|/g, '').trim();
            return `
                <div style="display: flex; align-items: center; justify-content: center; min-height: 80px; text-align: center;">
                    ${cleanDesc ? `<div style="font-size: 0.9rem; color: #94a3b8; font-style: italic;">${cleanDesc}</div>` : `<span style="color: #cbd5e1; font-size: 0.85rem; font-style: italic;">(Chưa có nội dung checklist)</span>`}
                    <div style="margin-left: 10px;">${fileHtml}</div>
                </div>
            `;
        }

        return html;
    };

    // Event Delegation on Table Body
    if (tbody) {
        tbody.addEventListener('change', async (e) => {
            // 1. Checklist Checkbox
            if (e.target.classList.contains('checklist-item')) {
                const cb = e.target;
                const ma_cv = cb.getAttribute('data-macv');
                const lineIdx = parseInt(cb.getAttribute('data-line'));
                const isChecked = cb.checked;

                const activeTask = allMyTasks.find(t => t.ma_cv === ma_cv);
                if (!activeTask) return;

                let lines = activeTask.mo_ta_cv.replace(/\r/g, '').split('\n');
        
                // Month Carry-over logic
                const currentMonthStr = `${currentStaffMonthDate.getFullYear()}-${String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0')}`;
                const endMonth = parseMonth(activeTask.ngay_hoan_thanh);
                const isNewMonth = endMonth && currentMonthStr > endMonth && (activeTask.loai_cv || '').toLowerCase().includes('định kỳ');

                if (isNewMonth) {
                    lines = lines.map(line => line.replace(/^(\s*\[)\s*[xX]\s*(\]\s*)/i, '$1 $2'));
                }

                if (lines[lineIdx] && lines[lineIdx].trim().match(/^\[\s*[xX\s]*\s*\]/)) {
                    lines[lineIdx] = lines[lineIdx].replace(/^(\s*\[)\s*[xX\s]*\s*(\]\s*)/, `$1${isChecked ? 'x' : ' '}$2`);
                }
                const newDesc = lines.join('\n');
                const checklistLines = lines.filter(l => l.trim().match(/^\[\s*[xX\s]*\s*\]/));
                const checkedCount = checklistLines.filter(l => l.trim().match(/^\[\s*[xX]\s*\]/i)).length;
                const totalCount = checklistLines.length;
                const newProgress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : activeTask.tien_do;

                activeTask.tien_do = newProgress;
                activeTask.mo_ta_cv = newDesc;

                const currentTask = currentTasks.find(t => t.ma_cv === ma_cv);
                if (currentTask) {
                    currentTask.tien_do = newProgress;
                    currentTask.mo_ta_cv = newDesc;
                }
                
                // Update Global Tasks array immediately
                const globalIdx = allMyTasks.findIndex(t => t.id === activeTask.id || t.ma_cv === activeTask.ma_cv);
                if (globalIdx !== -1) {
                    allMyTasks[globalIdx].tien_do = newProgress;
                    allMyTasks[globalIdx].mo_ta_cv = newDesc;
                }
                
                updateStats(currentTasks);
                renderTable(currentTasks);

                // UI Update locally
                const row = cb.closest('tr');
                const slider = row.querySelector('.progress-slider');
                const progressText = row.querySelector('.progress-text');
                const statusLabel = row.querySelector('.status-label');
                const labelSpan = cb.nextElementSibling;

                if (slider) { slider.value = newProgress; updateSliderBackground(slider); }
                if (progressText) { progressText.textContent = `${newProgress}%`; progressText.style.color = getProgressColor(newProgress); }
                if (statusLabel) {
                    statusLabel.textContent = newProgress === 100 ? 'HOÀN THÀNH' : 'ĐANG LÀM';
                    statusLabel.style.color = newProgress === 100 ? '#10b981' : '#64748b';
                }
                if (labelSpan) {
                    labelSpan.style.color = isChecked ? '#94a3b8' : '#334155';
                    labelSpan.style.textDecoration = isChecked ? 'line-through' : 'none';
                }

                // Đồng bộ dataset để Modal Edit dùng
                row.dataset.task = JSON.stringify(currentTask || activeTask);

                try {
                    const task = allMyTasks.find(t => t.ma_cv === ma_cv);
                    const formData = new FormData();
                    if (task && task.id) formData.append('id', task.id);
                    formData.append('ma_cv', ma_cv);
                    formData.append('tien_do', newProgress);
                    formData.append('mo_ta_cv', newDesc);
                    
                    // QUAN TRỌNG: Luôn gửi ngay_hoan_thanh về hôm nay khi có bất kỳ ô nào được tích
                    if (newProgress > 0 && !isNewMonth) {
                        const today = new Date().toISOString().split('T')[0];
                        formData.append('ngay_hoan_thanh', today);
                        activeTask.ngay_hoan_thanh = today;
                        if (!activeTask.ngay_bat_dau || activeTask.ngay_bat_dau === '0000-00-00') {
                            formData.append('ngay_bat_dau', today);
                            activeTask.ngay_bat_dau = today;
                        }
                        if (globalIdx !== -1) {
                            allMyTasks[globalIdx].ngay_hoan_thanh = activeTask.ngay_hoan_thanh;
                            allMyTasks[globalIdx].ngay_bat_dau = activeTask.ngay_bat_dau;
                        }
                    }

                    if (isNewMonth) {
                        const targetMonthStr = `${currentStaffMonthDate.getFullYear()}-${String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0')}`;
                        const newDate = targetMonthStr + '-01'; // Default to start of month
                        formData.append('ngay_bat_dau', newDate);
                        activeTask.ngay_bat_dau = newDate;
                        
                        if (!isChecked) {
                            formData.append('ngay_hoan_thanh', newDate);
                            activeTask.ngay_hoan_thanh = newDate;
                        } else {
                            activeTask.ngay_hoan_thanh = new Date().toISOString().split('T')[0];
                            formData.append('ngay_hoan_thanh', activeTask.ngay_hoan_thanh);
                        }
                        
                        if (currentTask) {
                            currentTask.ngay_bat_dau = activeTask.ngay_bat_dau;
                            currentTask.ngay_hoan_thanh = activeTask.ngay_hoan_thanh;
                        }
                        if (globalIdx !== -1) {
                            allMyTasks[globalIdx].ngay_hoan_thanh = activeTask.ngay_hoan_thanh;
                            allMyTasks[globalIdx].ngay_bat_dau = activeTask.ngay_bat_dau;
                        }
                    }

                    const response = await fetch('api_update_progress.php', { method: 'POST', body: formData });
                    const result = await response.json();
                    
                    if (result.unauthorized) {
                        window.location.replace('login.html');
                        return;
                    }

                    if (result.success) {
                        showToast(`Tiến độ: ${newProgress}% (${checkedCount}/${totalCount})`, 'success');
                        // Fetch in background to not block UI
                        loadMyTasks();
                    } else {
                        // Rollback
                        cb.checked = !isChecked;
                        showToast('Lỗi: ' + result.message, 'error');
                    }
                } catch (err) { 
                    cb.checked = !isChecked;
                }
            }

            // 2. File Upload
            if (e.target.classList.contains('file-upload-input')) {
                const input = e.target;
                const file = input.files[0];
                if (!file) return;

                const ma_cv = input.getAttribute('data-macv');
                const lineIdx = parseInt(input.getAttribute('data-line'));
                const task = allMyTasks.find(t => t.ma_cv === ma_cv);
                if (!task) return;

                showToast('Đang tải lên...', 'warning');
                const uploadData = new FormData();
                uploadData.append('file', file);

                try {
                    const res = await fetch('api_upload_file.php', { method: 'POST', body: uploadData });
                    const result = await res.json();

                    if (result.success) {
                        const filePath = result.filePath;
                        const cleanDesc = task.mo_ta_cv.replace(/\r/g, '');
                        const lines = cleanDesc.split('\n');

                        // Clean old tag and append new one
                        lines[lineIdx] = lines[lineIdx].replace(/ \|file:.*?\|/g, '') + ` |file:${filePath}|`;
                        const newDesc = lines.join('\n');
                        task.mo_ta_cv = newDesc;

                        const currentTask = currentTasks.find(t => t.ma_cv === ma_cv);
                        if (currentTask) {
                            currentTask.mo_ta_cv = newDesc;
                        }

                        const formData = new FormData();
                        if (task.id) formData.append('id', task.id);
                        formData.append('ma_cv', ma_cv);
                        formData.append('tien_do', task.tien_do);
                        formData.append('mo_ta_cv', newDesc);

                        const updateRes = await fetch('api_update_progress.php', { method: 'POST', body: formData });
                        const updateResult = await updateRes.json();

                        if (updateResult.success) {
                            showToast('Đã đính kèm file thành công!', 'success');
                            // Smooth update: re-render only the checklist cell
                            const row = input.closest('tr');
                            const checklistCell = row.querySelector('td:nth-child(4)');
                            if (checklistCell) {
                                checklistCell.innerHTML = generateInteractiveChecklist(task.mo_ta_cv, task.ma_cv);
                            }
                            // Update row dataset to keep sync
                            row.dataset.task = JSON.stringify(task);
                        }
                    } else {
                        showToast('Lỗi: ' + result.message, 'error');
                    }
                } catch (error) {
                    showToast('Lỗi kết nối máy chủ!', 'error');
                }
            }

            // 3. Slider Change
            if (e.target.classList.contains('progress-slider')) {
                const slider = e.target;
                const ma_cv = slider.getAttribute('data-macv');
                const tien_do = slider.value;

                try {
                    const task = allMyTasks.find(t => t.ma_cv === ma_cv);
                    const formData = new FormData();
                    if (task && task.id) formData.append('id', task.id);
                    formData.append('ma_cv', ma_cv);
                    formData.append('tien_do', tien_do);
                    const response = await fetch('api_update_progress.php', { method: 'POST', body: formData });
                    const result = await response.json();
                    if (result.success) {
                        showToast(`Đã lưu tiến độ: ${tien_do}%`, 'success');
                        const task = allMyTasks.find(t => t.ma_cv === ma_cv);
                        if (task) task.tien_do = tien_do;
                        const currentTask = currentTasks.find(t => t.ma_cv === ma_cv);
                        if (currentTask) currentTask.tien_do = tien_do;
                        updateStats(currentTasks);

                        const row = slider.closest('tr');
                        if (row) row.dataset.task = JSON.stringify(currentTask || task);
                    }
                } catch (err) { }
            }
        });

        // --- DELEGATED INPUT EVENTS (Real-time Slider) ---
        tbody.addEventListener('input', (e) => {
            if (e.target.classList.contains('premium-slider') || e.target.classList.contains('progress-slider')) {
                const slider = e.target;
                const val = parseInt(slider.value);
                const row = slider.closest('tr');
                const progressText = row.querySelector('.progress-text');
                const statusLabel = row.querySelector('.status-label');
                const color = val == 100 ? '#10b981' : (val >= 50 ? '#f59e0b' : '#3b82f6');

                if (progressText) {
                    progressText.textContent = `${val}%`;
                    let sText = 'Đang làm';
                    let sId = 2;

                    if (val === 100) {
                        sId = 1; sText = 'Hoàn thành';
                    } else {
                        const deadline = slider.getAttribute('data-deadline');
                        if (deadline && deadline !== '0000-00-00') {
                            const d = new Date(deadline);
                            d.setHours(0, 0, 0, 0);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (d < today) {
                                sId = 3; sText = 'Quá hạn';
                            }
                        }
                    }
                    const labelContainer = row.querySelector('.status-label-container');
                    if (labelContainer) {
                        labelContainer.innerHTML = getStatusBadgeStaff(sId, sText);
                    }
                }
                updateSliderBackground(slider);
            }
        });
    }

    function attachEvents() {
        document.querySelectorAll('.progress-slider').forEach(slider => updateSliderBackground(slider));
    }

    const updateSliderBackground = (slider) => {
        if (!slider) return;
        const val = slider.value;
        const color = getProgressColor(val);
        slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${val}%, #e2e8f0 ${val}%, #e2e8f0 100%)`;
    }



    const handleDeleteTask = async (ma_cv) => {
        try {
            const formData = new FormData();
            formData.append('ma_cv', ma_cv);
            const response = await fetch('api_delete_task.php', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                showToast('Đã xóa công việc!');
                loadMyTasks();
            } else {
                showToast('Lỗi: ' + result.message, 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối máy chủ!', 'error');
        }
    };

    let isEditMode = false;
    // Removed btnAddTaskGlobal logic as requested by removing the button from UI.

    const closeModal = () => { 
        if(addModal) addModal.style.display = 'none'; 
        isEditMode = false; 
        const maCvInput = document.getElementById('modal_ma_cv');
        if (maCvInput) {
            maCvInput.disabled = false;
            maCvInput.style.background = '#fff';
        }
    };
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);

    const progressInputModal = document.getElementById('modal_tien_do');
    const progressDisplayModal = document.getElementById('progressValue');
    const statusSelectModal = document.getElementById('modal_trang_thai_cv');
    const inputTenCv = document.getElementById('modal_ten_cv');
    const inputMoTa = document.getElementById('modal_mo_ta');

    if (inputTenCv && inputMoTa) {
        inputTenCv.addEventListener('input', (e) => {
            const val = e.target.value;
            const predefinedTasks = [
                "Kiểm tra hệ thống định kỳ", "Báo cáo doanh thu tháng", "Bảo trì máy chủ",
                "Hỗ trợ khách hàng", "Cập nhật dữ liệu", "Đào tạo nhân viên mới",
                "Thiết kế Banner quảng cáo", "Lập kế hoạch Marketing"
            ];

            // Nếu chọn từ danh sách có sẵn thì xóa mô tả cũ và thêm checklist mới
            if (predefinedTasks.includes(val)) {
                inputMoTa.value = ""; // Xóa trắng trước khi chèn mới
                let checklist = "";
                for (let i = 1; i <= 6; i++) {
                    checklist += `[ ] Hạng mục công việc ${i}\n`;
                }
                inputMoTa.value = checklist.trim();
                if (progressInputModal) {
                    progressInputModal.value = 0;
                    progressInputModal.disabled = true;
                    progressInputModal.classList.add('locked-slider');
                    progressInputModal.dispatchEvent(new Event('input'));
                }
            }
        });
    }

    if (progressInputModal) {
        // Visual feedback (Color & % text)
        progressInputModal.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            let color = '#ef4444';
            if (val >= 70) color = '#10b981';
            else if (val >= 30) color = '#f59e0b';

            e.target.style.background = `linear-gradient(to right, ${color} ${val}%, #e2e8f0 ${val}%)`;
            if (progressDisplayModal) {
                progressDisplayModal.textContent = val + '%';
                progressDisplayModal.style.color = color;
            }
        });

        // Auto-status logic (Only when user manually slides)
        progressInputModal.addEventListener('change', (e) => {
            const val = parseInt(e.target.value);
            if (!statusSelectModal) return;

            // Only auto-switch if currently in standard flow (Done, Doing, Overdue)
            // If it's Paused (4) or Guided (5), we assume the user wants it to stay that way 
            // unless they specifically reached 100%.
            const currentStatus = statusSelectModal.value;
            
            if (val === 100) {
                statusSelectModal.value = "1";
            } else if (val < 100) {
                // Only overwrite if it was one of the standard statuses
                if (["1", "2", "3"].includes(currentStatus)) {
                    const deadlineInput = document.getElementById('modal_ngay_hoan_thanh');
                    let targetStatus = "2"; 
                    if (deadlineInput && deadlineInput.value) {
                        const d = new Date(deadlineInput.value);
                        d.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (d < today) targetStatus = "3";
                    }
                    statusSelectModal.value = targetStatus;
                }
            }
        });
    }

    if (inputMoTa && progressInputModal) {
        inputMoTa.addEventListener('input', () => {
            const lines = inputMoTa.value.replace(/\r/g, '').split('\n');
            const checklistLines = lines.filter(l => l.trim().match(/^\[([xX\s])\]/));
            const hasChecklist = checklistLines.length > 0;

            progressInputModal.disabled = hasChecklist;
            if (hasChecklist) {
                progressInputModal.classList.add('locked-slider');
                const checkedCount = checklistLines.filter(l => l.trim().match(/^\[[xX]\]/)).length;
                const newProgress = Math.round((checkedCount / checklistLines.length) * 100);
                progressInputModal.value = newProgress;
                progressInputModal.dispatchEvent(new Event('input'));
            } else {
                progressInputModal.classList.remove('locked-slider');
            }
        });
    }

    if (btnApply) {
        btnApply.addEventListener('click', async () => {
            const ma_cv = document.getElementById('modal_ma_cv').value;
            const ten_cv = document.getElementById('modal_ten_cv').value;


            if (!ma_cv || !ten_cv) {
                showToast("Vui lòng điền Mã và Tên CV!", "warning");
                return;
            }

            const originalText = btnApply.textContent;
            btnApply.disabled = true;
            btnApply.textContent = 'Đang lưu...';

            const formData = new FormData();
            formData.append('ma_nv', currentMaNv);
            formData.append('id', document.getElementById('edit_id').value); // Use DB ID
            formData.append('ma_cv', ma_cv);
            formData.append('ten_cv', ten_cv);

            // Kết hợp text mới với các tag file cũ theo đúng dòng
            const newDesc = document.getElementById('modal_mo_ta').value;
            const newLines = newDesc.replace(/\r/g, '').split('\n');
            const fileMapping = JSON.parse(document.getElementById('modal_mo_ta').dataset.fileMapping || '{}');

            const finalLines = newLines.map((line, idx) => {
                if (fileMapping[idx]) return line + ' ' + fileMapping[idx];
                return line;
            });

            // Nhặt các file ở dòng bị xóa dồn xuống cuối
            let remainingFiles = [];
            Object.keys(fileMapping).forEach(key => {
                if (key >= newLines.length) remainingFiles.push(fileMapping[key]);
            });

            let finalDesc = finalLines.join('\n');
            if (remainingFiles.length > 0) finalDesc += '\n\n' + remainingFiles.join(' ');

            formData.append('mo_ta_cv', finalDesc);

            const loaiCv = document.getElementById('modal_loai_cv').value;
            const ngayHoanThanh = document.getElementById('modal_ngay_hoan_thanh').value;
            let isDuplicate = 0;

            if (isEditMode) {
                const taskId = document.getElementById('edit_id').value;
                const originalTask = allMyTasks.find(t => t.id == taskId);
                if (originalTask && (loaiCv.toLowerCase().includes('định kỳ') || loaiCv.toLowerCase().includes('dinh ky'))) {
                    const oldMonth = originalTask.ngay_hoan_thanh && originalTask.ngay_hoan_thanh !== '0000-00-00' ? originalTask.ngay_hoan_thanh.substring(0, 7) : null;
                    const newMonth = ngayHoanThanh ? ngayHoanThanh.substring(0, 7) : null;
                    
                    // Nếu đổi tháng ở công việc định kỳ -> Tạo bản sao mới (Duplicate)
                    if (oldMonth && newMonth && newMonth !== oldMonth) {
                        isDuplicate = 1;
                    }
                }
            }

            formData.append('loai_cv', loaiCv);
            formData.append('cap_do_id', document.getElementById('modal_cap_do_cv').value);
            formData.append('ngay_bat_dau', document.getElementById('modal_ngay_bat_dau').value);
            formData.append('ngay_hoan_thanh', ngayHoanThanh);
            formData.append('trang_thai_id', document.getElementById('modal_trang_thai_cv').value);
            formData.append('tien_do', document.getElementById('modal_tien_do').value);
            formData.append('ghi_chu', document.getElementById('modal_ghi_chu').value);
            formData.append('is_duplicate', isDuplicate);

            const endpoint = 'api_update_task_detail.php';

            try {
                const response = await fetch(endpoint, { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    const savedMaCv = document.getElementById('modal_ma_cv').value;
                    const savedTenCv = document.getElementById('modal_ten_cv').value;
                    const savedIsEdit = isEditMode;

                    showToast(isEditMode ? 'Đã cập nhật công việc!' : 'Đã thêm công việc!');
                    closeModal();

                    if (!savedIsEdit) {
                        setTimeout(() => {
                            loadMyTasks();
                        }, 500);
                    } else {
                        setTimeout(() => loadMyTasks(), 500);
                    }
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

    // === SUB-TASK MANAGEMENT ===
    const subTaskModal = document.getElementById('subTaskModal');
    const subTaskTableBody = document.getElementById('subTaskTableBody');
    const subTaskSubtitle = document.getElementById('subTaskSubtitle');
    const subTaskEditModal = document.getElementById('subTaskEditModal');
    const subTaskEditForm = document.getElementById('subTaskEditForm');

    let activeTask = null;

    async function openSubTaskModal(task) {
        // Fix: Find the actual reference in allMyTasks to ensure instant sync works
        const originalTask = allMyTasks.find(t => t.ma_cv === (task.ma_cv || task));
        activeTask = originalTask || task;
        
        subTaskSubtitle.textContent = `Công việc: ${activeTask.ten_cv || ''}`;
        subTaskModal.style.display = 'flex';
        await fetchAndRenderSubTasks(activeTask);
    };

    async function fetchAndRenderSubTasks(task) {
        subTaskTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Đang tải...</td></tr>';
        try {
            const res = await fetch(`api_get_subtasks.php?id_cv_cha=${task.id}`);
            const result = await res.json();

            if (result.success && result.data && result.data.length > 0) {
                renderSubTaskRows(result.data, task.ma_cv);
            } else {
                // FALLBACK: Parse checklist from description
                const checklistItems = parseChecklistFromDesc(task.mo_ta_cv, task);
                if (checklistItems.length > 0) {
                    renderChecklistAsSubTasks(checklistItems, task);
                } else {
                    const currentMonthStr = `${currentStaffMonthDate.getFullYear()}-${String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0')}`;
                    const startMonth = task.ngay_bat_dau && task.ngay_bat_dau !== '0000-00-00' ? task.ngay_bat_dau.substring(0, 7) : null;
                    const endMonth = task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '0000-00-00' ? task.ngay_hoan_thanh.substring(0, 7) : null;
                    let isNewMonth = false;
                    if (endMonth) isNewMonth = (currentMonthStr > endMonth);
                    else if (startMonth) isNewMonth = (currentMonthStr > startMonth);

                    // HIỂN THỊ THEO ĐÃ NHẬP (Nếu không có checklist)
                    let prog = parseInt(task.tien_do || 0);
                    let displayBd = (task.ngay_bat_dau && task.ngay_bat_dau !== '-') ? formatDate(task.ngay_bat_dau) : '-';
                    let displayKt = (task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '-') ? formatDate(task.ngay_hoan_thanh) : '-';

                    if (isNewMonth && (task.loai_cv || '').toLowerCase() === 'định kỳ') {
                        prog = 0;
                        displayBd = '-';
                        displayKt = '-';
                    }

                    const color = getProgressColor(prog);

                    subTaskTableBody.innerHTML = `
                        <tr style="border-bottom: 1px solid #f1f5f9; background: white;">
                            <td style="padding: 20px; vertical-align: top;">
                                <div style="font-weight: 700; color: #1e293b; font-size: 1.1rem; letter-spacing: -0.01em;">${task.ten_cv || 'Không có tiêu đề'}</div>
                                <div style="font-size: 0.85rem; color: #94a3b8; font-weight: 600; margin-top: 6px; display: flex; align-items: center; gap: 6px;">
                                    <span style="width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;"></span>
                                    CÔNG VIỆC ĐƠN LẺ
                                </div>
                            </td>
                            <td style="padding: 20px; text-align: center; color: #64748b; font-weight: 700;">${displayBd}</td>
                            <td style="padding: 20px; text-align: center; color: #64748b; font-weight: 700;">${displayKt}</td>
                            <td style="padding: 20px; text-align: center;">${getLevelBadge(task.cap_do_id || task.cap_do || 3)}</td>
                            <td style="padding: 20px;">
                                <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
                                    <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 2px;">
                                        <span id="simpleTaskProgValue" style="font-weight: 800; color: ${color}; font-size: 0.9rem;">${prog}%</span>
                                    </div>
                                    <input type="range" class="simple-task-progress-slider" 
                                           data-macv="${task.ma_cv}" 
                                           value="${prog}" min="0" max="100" 
                                           style="width: 100%; cursor: pointer; accent-color: ${color}; background: linear-gradient(to right, ${color} ${prog}%, #f1f5f9 ${prog}%); height: 8px; border-radius: 10px; appearance: none;">
                                </div>
                            </td>
                            <td style="padding: 20px; text-align: center;">
                                <span id="simpleTaskStatusBadge" style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; background: ${prog === 100 ? '#ecfdf5' : '#eff6ff'}; color: ${prog === 100 ? '#059669' : '#2563eb'};">
                                    ${prog === 100 ? 'HOÀN THÀNH' : (task.trang_thai_text || 'ĐANG LÀM')}
                                </span>
                            </td>
                            <td style="padding: 20px; text-align: center;">-</td>
                        </tr>
                    `;

                    // Add event listener for the slider
                    const slider = subTaskTableBody.querySelector('.simple-task-progress-slider');
                    if (slider) {
                        slider.addEventListener('input', (e) => {
                            const val = parseInt(e.target.value);
                            const c = getProgressColor(val);
                            e.target.style.background = `linear-gradient(to right, ${c} ${val}%, #e2e8f0 ${val}%)`;
                            e.target.style.accentColor = c;
                            document.getElementById('simpleTaskProgValue').textContent = val + '%';
                            document.getElementById('simpleTaskProgValue').style.color = c;
                            
                            const badge = document.getElementById('simpleTaskStatusBadge');
                            if (val === 100) {
                                badge.textContent = 'HOÀN THÀNH';
                                badge.style.background = '#d1fae5';
                                badge.style.color = '#059669';
                            } else {
                                badge.textContent = 'ĐANG LÀM';
                                badge.style.background = '#eff6ff';
                                badge.style.color = '#2563eb';
                            }
                        });

                        slider.addEventListener('change', async (e) => {
                            const val = parseInt(e.target.value);
                            const ma_cv = e.target.dataset.macv;
                            
                            const formData = new FormData();
                            formData.append('ma_cv', ma_cv);
                            formData.append('tien_do', val);
                            formData.append('trang_thai_id', val === 100 ? 1 : 2);

                            try {
                                const res = await fetch('api_update_progress.php', { method: 'POST', body: formData });
                                const result = await res.json();
                                if (result.success) {
                                    showToast("Đã cập nhật tiến độ!", "success");
                                    // Update local state
                                    const t = allMyTasks.find(item => item.ma_cv === ma_cv);
                                    if (t) {
                                        t.tien_do = val;
                                        t.trang_thai_id = val === 100 ? 1 : 2;
                                    }
                                    filterTasksByCurrentMonth();
                                }
                            } catch (err) {
                                showToast("Lỗi cập nhật!", "error");
                            }
                        });
                    }
                }
            }
        } catch (err) {
            subTaskTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #ef4444;">Lỗi kết nối!</td></tr>';
        }
    };

    function parseChecklistFromDesc(desc, task) {
        if (!desc) return [];
        // QUAN TRỌNG: Phải remove \r trước khi split để lineIdx khớp với toggle handler
        const lines = desc.replace(/\r/g, '').split('\n');
        return lines.map((line, idx) => {
            const match = line.trim().match(/^\[\s*([xX\s]*)\s*\]\s*(.*)/);
            if (match) {
                let content = match[2];
                
                // Extract metadata tags
                const startMatch = content.match(/\|start:(.*?)\|/);
                const endMatch = content.match(/\|end:(.*?)\|/);
                const levelMatch = content.match(/\|level:(.*?)\|/);

                const startDate = startMatch ? startMatch[1] : (task.ngay_bat_dau || '');
                const endDate = endMatch ? endMatch[1] : (task.ngay_hoan_thanh || '');
                const level = levelMatch ? levelMatch[1] : '3';

                // Clean content for display
                let cleanContent = content.replace(/\|start:.*?\|/g, '')
                                         .replace(/\|end:.*?\|/g, '')
                                         .replace(/\|level:.*?\|/g, '')
                                         .replace(/\|file:.*?\|/g, '')
                                         .trim();

                return {
                    id: `cl-${idx}`,
                    lineIdx: idx,
                    ten_buoc: cleanContent,
                    isDone: match[1].trim().toLowerCase() === 'x',
                    ngay_bat_dau: startDate,
                    ngay_hoan_thanh: endDate,
                    cap_do_id: level,
                    rawLine: line
                };
            }
            return null;
        }).filter(item => item !== null);
    }

    function renderChecklistAsSubTasks(items, task) {
        const currentMonthStr = `${currentStaffMonthDate.getFullYear()}-${String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const startMonth = task.ngay_bat_dau && task.ngay_bat_dau !== '0000-00-00' ? task.ngay_bat_dau.substring(0, 7) : null;
        const endMonth = task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '0000-00-00' ? task.ngay_hoan_thanh.substring(0, 7) : null;
        
        let isNewMonth = false;
        const loai = (task.loai_cv || '').toLowerCase();
        if (loai.includes('định kỳ')) {
            if (endMonth) {
                isNewMonth = (currentMonthStr > endMonth);
            } else if (startMonth) {
                isNewMonth = (currentMonthStr > startMonth);
            }
        }

        subTaskTableBody.innerHTML = items.map((item) => {
            let prog = item.isDone ? 100 : 0;
            let displayBd = item.ngay_bat_dau;
            let displayKt = item.ngay_hoan_thanh;
            let isDone = item.isDone;

            if (isNewMonth) {
                prog = 0;
                displayBd = '-';
                displayKt = '-';
                isDone = false;
            }

            const color = getProgressColor(prog);

            return `
                <tr class="cl-row" data-idx="${item.lineIdx}" style="border-bottom: 1px solid #f1f5f9; transition: all 0.2s;">
                    <td style="padding: 16px 20px;">
                        <label style="display: flex; align-items: center; gap: 15px; cursor: pointer; margin: 0; width: 100%;">
                            <input type="checkbox" class="cl-checkbox" 
                                   data-idx="${item.lineIdx}" 
                                   data-macv="${task.ma_cv}" 
                                   ${isDone ? 'checked' : ''} 
                                   style="width: 20px; height: 20px; cursor: pointer; accent-color: #6366f1; flex-shrink: 0;">
                            <span class="cl-name" style="font-weight: 600; font-size: 1.05rem; color: ${isDone ? '#94a3b8' : '#1e293b'}; ${isDone ? 'text-decoration: line-through' : ''}; line-height: 1.5;">${item.ten_buoc}</span>
                        </label>
                    </td>
                    <td style="padding: 16px 20px; text-align: center; font-size: 0.95rem; color: #64748b; font-weight: 500;">${isNewMonth ? '-' : (formatDate(displayBd) || '-')}</td>
                    <td style="padding: 16px 20px; text-align: center; font-size: 0.95rem; color: #64748b; font-weight: 500;">${isNewMonth ? '-' : (formatDate(displayKt) || '-')}</td>
                    <td style="padding: 16px 20px; text-align: center;">
                        ${getLevelBadge(item.cap_do_id)}
                    </td>
                    <td style="padding: 16px 20px;">
                        <div style="display: flex; flex-direction: column; gap: 6px; align-items: center;">
                            <span class="cl-prog-text" style="font-size: 0.8rem; font-weight: 800; color: ${color};">${prog}%</span>
                            <div style="width: 85%; height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                                <div class="cl-prog-fill" style="width: ${prog}%; height: 100%; background: ${color}; border-radius: 10px; transition: width 0.3s;"></div>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 16px 20px; text-align: center;">
                        <span class="cl-status-badge" style="display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; ${isDone ? 'background: #ecfdf5; color: #059669;' : 'background: #eff6ff; color: #2563eb;'}">
                            ${isDone ? 'HOÀN THÀNH' : 'ĐANG LÀM'}
                        </span>
                    </td>
                    <td style="padding: 16px 20px; text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="btn-cl-edit" 
                                    data-idx="${item.lineIdx}" 
                                    data-macv="${task.ma_cv}" 
                                    data-ten="${item.ten_buoc}"
                                    data-bd="${item.ngay_bat_dau}"
                                    data-kt="${item.ngay_hoan_thanh}"
                                    data-cd="${item.cap_do_id}"
                                    title="Sửa chi tiết bước này" 
                                    style="color: #6366f1; background: #eef2ff; border: 1px solid #e0e7ff; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-cl-delete" data-idx="${item.lineIdx}" data-macv="${task.ma_cv}" title="Xóa dòng này" style="color: #ef4444; background: #fff1f2; border: 1px solid #ffe4e6; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderSubTaskRows(subtasks, ma_cv) {
        const currentMonthStr = `${currentStaffMonthDate.getFullYear()}-${String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const mainTask = allMyTasks.find(t => t.ma_cv === ma_cv);
        const startMonth = parseMonth(mainTask?.ngay_bat_dau);
        const endMonth = parseMonth(mainTask?.ngay_hoan_thanh);
        let isNewMonth = false;
        if (endMonth) {
            isNewMonth = (currentMonthStr > endMonth);
        } else if (startMonth) {
            isNewMonth = (currentMonthStr > startMonth);
        }

        subTaskTableBody.innerHTML = subtasks.map((st, idx) => {
            let prog = parseInt(st.tien_do || 0);
            let displayBd = st.ngay_bat_dau;
            let displayKt = st.ngay_hoan_thanh;
            let isDone = prog === 100;

            if (isNewMonth) {
                prog = 0;
                displayBd = '-';
                displayKt = '-';
                isDone = false;
            }

            const color = getProgressColor(prog);

            return `
                <tr class="st-row" data-id="${st.id}" style="border-bottom: 1px solid #f1f5f9; transition: all 0.2s;">
                    <td style="padding: 16px 20px;">
                        <label style="display: flex; align-items: center; gap: 15px; cursor: pointer; margin: 0; width: 100%;">
                            <input type="checkbox" class="st-checkbox" 
                                   data-id="${st.id}" 
                                   data-macv="${ma_cv}" 
                                   data-name="${st.ten_buoc}"
                                   data-bd="${st.ngay_bat_dau || ''}"
                                   data-kt="${st.ngay_hoan_thanh || ''}"
                                   data-cd="${st.cap_do_id || 3}"
                                   data-manv="${st.ma_nv_thuc_hien || ''}"
                                   ${isDone ? 'checked' : ''} 
                                   style="width: 20px; height: 20px; cursor: pointer; accent-color: #6366f1; flex-shrink: 0;">
                            <span class="st-name" style="font-weight: 600; font-size: 1.05rem; color: ${isDone ? '#94a3b8' : '#1e293b'}; ${isDone ? 'text-decoration: line-through' : ''}; line-height: 1.5;">${st.ten_buoc}</span>
                        </label>
                    </td>
                    <td style="padding: 16px 20px; text-align: center; font-size: 0.95rem; color: #64748b; font-weight: 500;">${isNewMonth ? '-' : (formatDate(displayBd) || '-')}</td>
                    <td style="padding: 16px 20px; text-align: center; font-size: 0.95rem; color: #64748b; font-weight: 500;">${isNewMonth ? '-' : (formatDate(displayKt) || '-')}</td>
                    <td style="padding: 16px 20px; text-align: center;">
                        <span style="padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;">${st.ten_cap_do || 'BT'}</span>
                    </td>
                    <td style="padding: 16px 20px;">
                        <div style="display: flex; flex-direction: column; gap: 6px; align-items: center;">
                            <span class="st-prog-text" style="font-size: 0.8rem; font-weight: 800; color: ${color};">${prog}%</span>
                            <div style="width: 85%; height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                                <div class="st-prog-fill" style="width: ${prog}%; height: 100%; background: ${color}; border-radius: 10px; transition: width 0.3s;"></div>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 16px 20px; text-align: center;">
                        <span class="st-status-badge" style="display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; ${isDone ? 'background: #ecfdf5; color: #059669;' : 'background: #eff6ff; color: #2563eb;'}">
                            ${isDone ? 'HOÀN THÀNH' : 'ĐANG LÀM'}
                        </span>
                    </td>
                    <td style="padding: 16px 20px; text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="btn-st-edit-simple" data-st='${JSON.stringify(st).replace(/'/g, "&apos;")}' title="Sửa bước này" style="color: #6366f1; background: #eef2ff; border: 1px solid #e0e7ff; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-st-delete-simple" data-id="${st.id}" title="Xóa bước này" style="color: #ef4444; background: #fff1f2; border: 1px solid #ffe4e6; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0 auto; transition: all 0.2s;">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    const closeSubTaskModal = () => { subTaskModal.style.display = 'none'; activeTask = null; filterTasksByCurrentMonth(); };
    document.getElementById('btnCloseSubTaskModal').onclick = closeSubTaskModal;
    document.getElementById('btnCloseSubTaskFooter').onclick = closeSubTaskModal;

    // Sub-task table actions delegation
    subTaskTableBody.onclick = async (e) => {
        if (!activeTask) return;
        
        // Chỉ xử lý khi click trực tiếp vào INPUT (Checkbox) hoặc các nút bấm
        // Nếu click vào label/span, trình duyệt sẽ tự kích hoạt click vào input sau đó
        const isButton = e.target.closest('button') || e.target.closest('.btn-st-delete-simple') || e.target.closest('.btn-st-edit-simple') || e.target.closest('.btn-cl-delete') || e.target.closest('.btn-cl-edit');
        if (e.target.tagName !== 'INPUT' && !isButton) return;

        const checkbox = e.target.closest('.st-checkbox');
        const clCheckbox = e.target.closest('.cl-checkbox');
        const btnClDelete = e.target.closest('.btn-cl-delete');
        const btnClEdit = e.target.closest('.btn-cl-edit');
        const btnStDelete = e.target.closest('.btn-st-delete-simple');
        const btnStEdit = e.target.closest('.btn-st-edit-simple');

        // Pre-calculate month rollover logic for the current active task
        const currentMonthStr = `${currentStaffMonthDate.getFullYear()}-${String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const endMonthParent = parseMonth(activeTask.ngay_hoan_thanh);
        const isNewMonth = endMonthParent && currentMonthStr > endMonthParent && (activeTask.loai_cv || '').toLowerCase().includes('định kỳ');

        if (checkbox) {
            const id = checkbox.dataset.id;
            const ma_cv = checkbox.dataset.macv;
            const ten_buoc = checkbox.dataset.name;
            const isChecked = checkbox.checked;
            const newProgress = isChecked ? 100 : 0;
            
            // OPTIMISTIC UI: Update this row immediately
            const row = checkbox.closest('tr');
            const nameSpan = row.querySelector('.st-name');
            const progText = row.querySelector('.st-prog-text');
            const progFill = row.querySelector('.st-prog-fill');
            const statusBadge = row.querySelector('.st-status-badge');
            const color = getProgressColor(newProgress);

            if (nameSpan) {
                nameSpan.style.color = isChecked ? '#94a3b8' : '#1e293b';
                nameSpan.style.textDecoration = isChecked ? 'line-through' : 'none';
            }
            if (progText) {
                progText.textContent = newProgress + '%';
                progText.style.color = color;
            }
            if (progFill) {
                progFill.style.width = newProgress + '%';
                progFill.style.background = color;
            }
            if (statusBadge) {
                statusBadge.textContent = isChecked ? 'HOÀN THÀNH' : 'ĐANG LÀM';
                statusBadge.style.background = isChecked ? '#ecfdf5' : '#eff6ff';
                statusBadge.style.color = isChecked ? '#059669' : '#2563eb';
            }

            const formData = new FormData();
            formData.append('id', id);
            formData.append('id_cv_cha', activeTask.id);
            formData.append('ma_cv_cha', ma_cv);
            formData.append('tien_do', newProgress);
            formData.append('trang_thai_id', isChecked ? 1 : 2);
            formData.append('ten_buoc', ten_buoc);
            
            // Lấy các trường cũ để tránh ghi đè thành NULL gây lỗi SQL
            formData.append('ma_nv', checkbox.dataset.manv || '');
            formData.append('ngay_bat_dau', checkbox.dataset.bd || '');
            formData.append('cap_do_id', checkbox.dataset.cd || 3);
            
            const today = new Date().toISOString().split('T')[0];
            if (isChecked) {
                formData.append('ngay_hoan_thanh', today);
            } else {
                formData.append('ngay_hoan_thanh', checkbox.dataset.kt || '');
            }
            
            // Thêm logic cập nhật ngày hoàn thành cho công việc cha nếu là tháng mới
            if (isNewMonth) {
                const newDate = currentMonthStr + '-01';
                formData.append('parent_ngay_bat_dau', newDate);
                formData.append('parent_ngay_hoan_thanh', newDate);
                activeTask.ngay_bat_dau = newDate;
                activeTask.ngay_hoan_thanh = newDate; 
            }

            try {
                const res = await fetch('api_save_subtask.php', { method: 'POST', body: formData });
                const result = await res.json();
                if (result.success) {
                    showToast('Đã cập nhật bước thực hiện!', 'success');
                    await loadMyTasks();
                    // Sync the local reference and re-render modal
                    activeTask = allMyTasks.find(t => t.ma_cv === activeTask.ma_cv) || activeTask;
                    await fetchAndRenderSubTasks(activeTask);
                } else {
                    // ROLLBACK on error
                    checkbox.checked = !isChecked;
                    await fetchAndRenderSubTasks(activeTask);
                }
            } catch (err) { }
        }

        if (clCheckbox) {
            const lineIdx = parseInt(clCheckbox.dataset.idx);
            const isChecked = clCheckbox.checked;

            // OPTIMISTIC UI: Update this row immediately
            const row = clCheckbox.closest('tr');
            const nameSpan = row.querySelector('.cl-name');
            const progText = row.querySelector('.cl-prog-text');
            const progFill = row.querySelector('.cl-prog-fill');
            const statusBadge = row.querySelector('.cl-status-badge');
            const newProgress = isChecked ? 100 : 0;
            const color = getProgressColor(newProgress);

            if (nameSpan) {
                nameSpan.style.color = isChecked ? '#94a3b8' : '#1e293b';
                nameSpan.style.textDecoration = isChecked ? 'line-through' : 'none';
            }
            if (progText) {
                progText.textContent = newProgress + '%';
                progText.style.color = color;
            }
            if (progFill) {
                progFill.style.width = newProgress + '%';
                progFill.style.background = color;
            }
            if (statusBadge) {
                statusBadge.textContent = isChecked ? 'HOÀN THÀNH' : 'ĐANG LÀM';
                statusBadge.style.background = isChecked ? '#ecfdf5' : '#eff6ff';
                statusBadge.style.color = isChecked ? '#059669' : '#2563eb';
            }

            // Tách dòng và xử lý isNewMonth
            let lines = activeTask.mo_ta_cv.replace(/\r/g, '').split('\n');

            if (isNewMonth) {
                lines = lines.map(line => line.replace(/^(\s*\[)\s*[xX]\s*(\]\s*)/i, '$1 $2'));
            }

            // --- SỬA LỖI CHÍNH: Thay thế trạng thái checkbox trực tiếp trên từng dòng ---
            const targetLine = lines[lineIdx];
            if (targetLine !== undefined) {
                // Tìm phần [ ... ] ở đầu dòng và thay thế nội dung bên trong
                lines[lineIdx] = targetLine.replace(
                    /^(\s*\[)\s*[xX\s]*\s*(\])/,
                    (match, open, close) => `${open}${isChecked ? 'x' : ' '}${close}`
                );
            } else {
                console.error('[Checklist] lineIdx', lineIdx, 'out of range. Total lines:', lines.length);
                clCheckbox.checked = !isChecked; // Rollback UI
                return;
            }

            const newMoTa = lines.join('\n');

            // Đếm tiến độ
            const checklistLines = lines.filter(l => l.trim().match(/^\[\s*[xX\s]*\s*\]/));
            const checkedCount = checklistLines.filter(l => l.trim().match(/^\[\s*x\s*\]/i)).length;
            const finalProgress = checklistLines.length > 0 ? Math.round((checkedCount / checklistLines.length) * 100) : 0;

            console.log('[Checklist] Payload:', {
                id: activeTask.id,
                ma_cv: activeTask.ma_cv,
                tien_do: finalProgress,
                newMoTaSnippet: newMoTa.substring(0, 50) + '...'
            });

            const formData = new FormData();
            const finalId = activeTask.id || (allMyTasks.find(t => t.ma_cv === activeTask.ma_cv)?.id);
            if (finalId) formData.append('id', finalId);
            formData.append('ma_cv', activeTask.ma_cv);
            formData.append('mo_ta_cv', newMoTa);
            formData.append('tien_do', finalProgress);

            // QUAN TRỌNG: Luôn gửi ngay_hoan_thanh về hôm nay khi có bất kỳ ô nào được tích
            if (finalProgress > 0 && !isNewMonth) {
                const today = new Date().toISOString().split('T')[0];
                formData.append('ngay_hoan_thanh', today);
                activeTask.ngay_hoan_thanh = today;
                if (!activeTask.ngay_bat_dau || activeTask.ngay_bat_dau === '0000-00-00') {
                    formData.append('ngay_bat_dau', today);
                    activeTask.ngay_bat_dau = today;
                }
            }

            if (isNewMonth) {
                const newDate = currentMonthStr + '-01';
                formData.append('ngay_bat_dau', newDate);
                activeTask.ngay_bat_dau = newDate;
                if (!isChecked) {
                    formData.append('ngay_hoan_thanh', newDate);
                    activeTask.ngay_hoan_thanh = newDate;
                } else {
                    activeTask.ngay_hoan_thanh = new Date().toISOString().split('T')[0];
                    formData.append('ngay_hoan_thanh', activeTask.ngay_hoan_thanh);
                }
            }

            try {
                const res = await fetch('api_update_progress.php', { method: 'POST', body: formData });
                const result = await res.json();
                if (result.success) {
                    activeTask.mo_ta_cv = newMoTa;
                    activeTask.tien_do = finalProgress;
                    
                    // Tính toán tháng hiện tại đang xem để tìm đúng bản ghi trong mảng
                    const currentMonthStr = `${currentStaffMonthDate.getFullYear()}-${String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0')}`;
                    
                    // Cập nhật mảng tổng cục bộ để đồng bộ bảng bên ngoài ngay lập tức
                    const globalIdx = allMyTasks.findIndex(t => t.id === activeTask.id || (t.ma_cv === activeTask.ma_cv && parseMonth(t.ngay_bat_dau) === currentMonthStr));
                    if (globalIdx !== -1) {
                        allMyTasks[globalIdx].mo_ta_cv = newMoTa;
                        allMyTasks[globalIdx].tien_do = finalProgress;
                        if (activeTask.ngay_hoan_thanh) allMyTasks[globalIdx].ngay_hoan_thanh = activeTask.ngay_hoan_thanh;
                        if (activeTask.ngay_bat_dau) allMyTasks[globalIdx].ngay_bat_dau = activeTask.ngay_bat_dau;
                    }

                    // Vẽ lại bảng ngoài và thống kê ngay lập tức
                    filterTasksByCurrentMonth(); 
                    
                    // Giữ nguyên activeTask cục bộ để tránh bị trễ dữ liệu cũ từ server
                    await fetchAndRenderSubTasks(activeTask);
                    
                    // Vẫn gọi loadMyTasks để đồng bộ sâu với server (nhưng không làm gián đoạn UI)
                    loadMyTasks();
                } else {
                    // Rollback
                    clCheckbox.checked = !isChecked;
                    await fetchAndRenderSubTasks(activeTask);
                }
            } catch (err) {
                clCheckbox.checked = !isChecked;
                await fetchAndRenderSubTasks(activeTask);
            }
        }

        if (btnClEdit) {
            const idx = btnClEdit.dataset.idx;
            const ten = btnClEdit.dataset.ten;
            const bd = btnClEdit.dataset.bd;
            const kt = btnClEdit.dataset.kt;
            const cd = btnClEdit.dataset.cd;

            document.getElementById('edit_cl_idx').value = idx;
            document.getElementById('edit_cl_macv').value = btnClEdit.dataset.macv;
            document.getElementById('edit_cl_ten').value = ten;
            
            const bdInput = document.getElementById('edit_cl_ngay_bd');
            const ktInput = document.getElementById('edit_cl_ngay_kt');
            const rangeInfo = document.getElementById('clEditRangeInfo');

            // Set constraints from activeTask
            if (activeTask) {
                const mainBd = activeTask.ngay_bat_dau || '';
                const mainKt = activeTask.ngay_hoan_thanh || '';
                
                bdInput.min = mainBd;
                bdInput.max = mainKt;
                ktInput.min = mainBd;
                ktInput.max = mainKt;

                rangeInfo.textContent = `Phạm vi: ${formatDate(mainBd)} - ${formatDate(mainKt)}`;
            }

            bdInput.value = bd;
            ktInput.value = kt;
            document.getElementById('edit_cl_cap_do').value = cd;

            document.getElementById('clEditModal').style.display = 'flex';
        }

        if (btnClDelete) {
            if (confirm('Xóa dòng này khỏi mô tả công việc?')) {
                const lineIdx = parseInt(btnClDelete.dataset.idx);
                const lines = activeTask.mo_ta_cv.replace(/\r/g, '').split('\n');
                lines.splice(lineIdx, 1);
                const newMoTa = lines.join('\n');

                const checklistLines = lines.filter(l => l.trim().match(/^\[([xX\s])\]/));
                const checkedCount = checklistLines.filter(l => l.trim().match(/^\[([xX])\]/)).length;
                const newProgress = checklistLines.length > 0 ? Math.round((checkedCount / checklistLines.length) * 100) : 0;

                const formData = new FormData();
                if (activeTask.id) formData.append('id', activeTask.id);
                formData.append('ma_cv', activeTask.ma_cv);
                formData.append('mo_ta_cv', newMoTa);
                formData.append('tien_do', newProgress);

                try {
                    const res = await fetch('api_update_progress.php', { method: 'POST', body: formData });
                    if ((await res.json()).success) {
                        activeTask.mo_ta_cv = newMoTa;
                        activeTask.tien_do = newProgress;
                        activeTask.trang_thai_id = (newProgress === 100) ? 1 : 2;
                        filterTasksByCurrentMonth();
                        await fetchAndRenderSubTasks(activeTask);
                    }
                } catch (err) { }
            }
        }

        if (btnStEdit) {
            const st = JSON.parse(btnStEdit.dataset.st);
            document.getElementById('edit_subtask_id').value = st.id;
            document.getElementById('subtask_id_cv_cha').value = activeTask.id;
            document.getElementById('subtask_ma_cv').value = activeTask.ma_cv;
            document.getElementById('subtask_mo_ta').value = st.ten_buoc;
            
            const bdInput = document.getElementById('subtask_ngay_bat_dau');
            const ktInput = document.getElementById('subtask_ngay_hoan_thanh');
            const rangeInfo = document.getElementById('stEditRangeInfo');

            if (activeTask) {
                const mainBd = activeTask.ngay_bat_dau || '';
                const mainKt = activeTask.ngay_hoan_thanh || '';
                bdInput.min = mainBd;
                bdInput.max = mainKt;
                ktInput.min = mainBd;
                ktInput.max = mainKt;
                rangeInfo.textContent = `Phạm vi: ${formatDate(mainBd)} - ${formatDate(mainKt)}`;
            }

            bdInput.value = st.ngay_bat_dau;
            ktInput.value = st.ngay_hoan_thanh;
            document.getElementById('subtask_cap_do').value = st.cap_do_id || '3';
            document.getElementById('subtask_tien_do').value = st.tien_do;
            document.getElementById('subTaskEditModal').style.display = 'flex';
        }

        if (btnStDelete) {
            if (confirm('Xóa bước thực hiện này?')) {
                const id = btnStDelete.dataset.id;
                const formData = new FormData();
                formData.append('action', 'delete');
                formData.append('id', id);
                try {
                    const res = await fetch('api_save_subtask.php', { method: 'POST', body: formData });
                    if ((await res.json()).success) {
                        showToast('Đã xóa bước thực hiện!', 'success');
                        const newTienDo = await recalculateMainTaskProgress(activeTask.id);
                        activeTask.tien_do = newTienDo;
                        activeTask.trang_thai_id = (newTienDo === 100) ? 1 : 2;
                        filterTasksByCurrentMonth();
                        await fetchAndRenderSubTasks(activeTask);
                    }
                } catch (err) { }
            }
        }
    };

    // Helper to recalculate progress from DB for official sub-tasks
    async function recalculateMainTaskProgress(id_cv_cha) {
        try {
            const ma_cv = activeTask ? activeTask.ma_cv : '';
            const res = await fetch(`api_get_subtasks.php?id_cv_cha=${id_cv_cha}&ma_cv_cha=${encodeURIComponent(ma_cv)}`);
            const result = await res.json();
            const data = result.data || [];
            if (data.length === 0) return 0;
            const total = data.reduce((sum, s) => sum + parseInt(s.tien_do || 0), 0);
            return Math.round(total / data.length);
        } catch (e) {
            return activeTask ? (activeTask.tien_do || 0) : 0;
        }
    }

    const openEditModal = (task) => {
        isEditMode = !!task.id;
        document.getElementById('modalTitle').textContent = isEditMode ? 'Cập Nhật Công Việc' : 'Thêm Công Việc Mới';
        document.getElementById('edit_id').value = task.id || ''; // Store unique DB ID
        document.getElementById('modal_ma_cv').value = task.ma_cv || '';
        document.getElementById('modal_ma_cv').disabled = false; 
        document.getElementById('modal_ma_cv').style.background = '#fff';
        document.getElementById('modal_ten_cv').value = task.ten_cv || '';

        const rawDesc = task.mo_ta_cv || '';
        const descLines = rawDesc.replace(/\r/g, '').split('\n');
        const fileMapping = {};

        const cleanLines = descLines.map((line, idx) => {
            const tags = line.match(/\|file:.*?\|/g);
            if (tags) fileMapping[idx] = tags.join(' ');
            return line.replace(/\|file:.*?\|/g, '').trimRight();
        });

        const modalMoTa = document.getElementById('modal_mo_ta');
        if (modalMoTa) {
            modalMoTa.value = cleanLines.join('\n');
            modalMoTa.dataset.fileMapping = JSON.stringify(fileMapping);
        }

        document.getElementById('modal_loai_cv').value = task.loai_cv || 'Định kỳ';
        document.getElementById('modal_cap_do_cv').value = task.cap_do_id || task.cap_do || '3';
        document.getElementById('modal_ngay_bat_dau').value = task.ngay_bat_dau || '';
        document.getElementById('modal_ngay_hoan_thanh').value = task.ngay_hoan_thanh || '';
        document.getElementById('modal_trang_thai_cv').value = task.trang_thai_id || task.trang_thai || '2';
        document.getElementById('modal_ghi_chu').value = task.ghi_chu || '';

        const progressInput = document.getElementById('modal_tien_do');
        const val = parseInt(task.tien_do || 0);
        if (progressInput) {
            progressInput.value = val;
            const checklistLines = cleanLines.filter(l => l.trim().match(/^\[([xX\s])\]/));
            const hasChecklist = checklistLines.length > 0;
            progressInput.disabled = hasChecklist;
            if (hasChecklist) progressInput.classList.add('locked-slider');
            else progressInput.classList.remove('locked-slider');
            progressInput.dispatchEvent(new Event('input'));
        }

        if (addModal) addModal.style.display = 'flex';
    };

    const btnAddTask = document.getElementById('btnAddTask');
    if (btnAddTask) {
        btnAddTask.onclick = () => {
            document.getElementById('edit_id').value = '';
            
            // Set default dates to current visible month to ensure immediate visibility
            const year = currentStaffMonthDate.getFullYear();
            const month = String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentStaffMonthDate.getDate()).padStart(2, '0');
            const defaultDate = `${year}-${month}-${day}`;
            
            openEditModal({
                ngay_bat_dau: defaultDate,
                ngay_hoan_thanh: '',
                loai_cv: 'Định kỳ'
            });
        };
    }

    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const btnEdit = e.target.closest('.btn-edit');
            const btnDelete = e.target.closest('.btn-delete');
            const btnDeleteFile = e.target.closest('.btn-delete-file');
            const nameClick = e.target.closest('.task-name-click');

            if (nameClick) {
                e.preventDefault();
                const row = nameClick.closest('tr');
                try {
                    const task = JSON.parse(row.dataset.task);
                    openSubTaskModal(task);
                } catch (err) { }
            }

            if (btnEdit) {
                e.preventDefault();
                const row = btnEdit.closest('tr');
                try {
                    const task = JSON.parse(row.dataset.task);
                    openEditModal(task);
                } catch (err) { }
            }

            if (btnDelete) {
                const ma_cv = btnDelete.getAttribute('data-macv');
                if (confirm(`Bạn có chắc chắn muốn xóa công việc ${ma_cv}?`)) {
                    handleDeleteTask(ma_cv);
                }
            }

            if (btnDeleteFile) {
                const ma_cv = btnDeleteFile.getAttribute('data-macv');
                const lineIdx = parseInt(btnDeleteFile.getAttribute('data-line'));
                const filePath = btnDeleteFile.getAttribute('data-path');

                if (confirm('Bạn có chắc chắn muốn xóa file đính kèm này?')) {
                    const task = allMyTasks.find(t => t.ma_cv === ma_cv);
                    if (!task) return;

                    (async () => {
                        try {
                            const delData = new FormData();
                            delData.append('filePath', filePath);
                            await fetch('api_delete_file.php', { method: 'POST', body: delData });

                            const cleanDesc = task.mo_ta_cv.replace(/\r/g, '');
                            const lines = cleanDesc.split('\n');
                            lines[lineIdx] = lines[lineIdx].replace(/ \|file:.*?\|/g, '');
                            const newDesc = lines.join('\n');

                            const formData = new FormData();
                            formData.append('ma_cv', ma_cv);
                            formData.append('tien_do', task.tien_do);
                            formData.append('mo_ta_cv', newDesc);

                            const updateRes = await fetch('api_update_progress.php', { method: 'POST', body: formData });
                            const updateResult = await updateRes.json();

                            if (updateResult.success) {
                                showToast('Đã xóa file đính kèm!', 'success');
                                filterTasksByCurrentMonth();
                            }
                        } catch (error) {
                            showToast('Lỗi khi xóa file!', 'error');
                        }
                    })();
                }
            }
        });
    }


    const btnSaveClEdit = document.getElementById('btnSaveClEdit');
    if (btnSaveClEdit) {
        btnSaveClEdit.addEventListener('click', async () => {
            const idx = parseInt(document.getElementById('edit_cl_idx').value);
            const ma_cv = document.getElementById('edit_cl_macv').value;
            const newTen = document.getElementById('edit_cl_ten').value.trim();
            const newBd = document.getElementById('edit_cl_ngay_bd').value;
            const newKt = document.getElementById('edit_cl_ngay_kt').value;
            const newCd = document.getElementById('edit_cl_cap_do').value;

            if (!newTen) { showToast("Vui lòng nhập tên bước!", "warning"); return; }

            // Date validation
            if (activeTask) {
                const mainBd = activeTask.ngay_bat_dau;
                const mainKt = activeTask.ngay_hoan_thanh;

                if (newBd && mainBd && newBd < mainBd) {
                    showToast(`Ngày bắt đầu không được trước ngày ${formatDate(mainBd)}`, "error");
                    return;
                }
                if (newKt && mainKt && newKt > mainKt) {
                    showToast(`Ngày kết thúc không được sau ngày ${formatDate(mainKt)}`, "error");
                    return;
                }
                if (newBd && newKt && newBd > newKt) {
                    showToast("Ngày bắt đầu không được sau ngày kết thúc!", "error");
                    return;
                }
            }

            const lines = activeTask.mo_ta_cv.replace(/\r/g, '').split('\n');
            const currentLine = lines[idx];
            const prefixMatch = currentLine.match(/^(\s*\[[xX\s]\]\s*)/);
            const prefix = prefixMatch ? prefixMatch[1] : '[ ] ';

            // Reconstruct line with metadata tags
            let newLine = `${prefix}${newTen}`;
            if (newBd) newLine += ` |start:${newBd}|`;
            if (newKt) newLine += ` |end:${newKt}|`;
            if (newCd) newLine += ` |level:${newCd}|`;

            lines[idx] = newLine;
            const newMoTa = lines.join('\n');

            const formData = new FormData();
            if (activeTask.id) formData.append('id', activeTask.id);
            formData.append('ma_cv', ma_cv);
            formData.append('mo_ta_cv', newMoTa);
            formData.append('tien_do', activeTask.tien_do);

            try {
                const res = await fetch('api_update_progress.php', { method: 'POST', body: formData });
                const result = await res.json();
                if (result.success) {
                    showToast("Đã cập nhật chi tiết bước!", "success");
                    activeTask.mo_ta_cv = newMoTa;
                    document.getElementById('clEditModal').style.display = 'none';
                    filterTasksByCurrentMonth();
                    await fetchAndRenderSubTasks(activeTask);
                }
            } catch (err) {
                showToast("Lỗi kết nối!", "error");
            }
        });
    }

    const btnSaveSubTask = document.getElementById('btnSaveSubTask');
    if (btnSaveSubTask) {
        btnSaveSubTask.addEventListener('click', async () => {
            const id = document.getElementById('edit_subtask_id').value;
            const ma_cv_cha = document.getElementById('subtask_ma_cv').value;
            const ten_buoc = document.getElementById('subtask_mo_ta').value.trim();
            const ngay_bd = document.getElementById('subtask_ngay_bat_dau').value;
            const ngay_kt = document.getElementById('subtask_ngay_hoan_thanh').value;
            const tien_do = document.getElementById('subtask_tien_do').value;
            const cap_do_id = document.getElementById('subtask_cap_do').value;

            if (!ten_buoc) { showToast("Vui lòng nhập mô tả!", "warning"); return; }

            // Date validation
            if (activeTask) {
                const mainBd = activeTask.ngay_bat_dau;
                const mainKt = activeTask.ngay_hoan_thanh;
                if (ngay_bd && mainBd && ngay_bd < mainBd) {
                    showToast(`Ngày bắt đầu không được trước ${formatDate(mainBd)}`, "error");
                    return;
                }
                if (ngay_kt && mainKt && ngay_kt > mainKt) {
                    showToast(`Ngày kết thúc không được sau ${formatDate(mainKt)}`, "error");
                    return;
                }
                if (ngay_bd && ngay_kt && ngay_bd > ngay_kt) {
                    showToast("Ngày bắt đầu không được sau ngày kết thúc!", "error");
                    return;
                }
            }

            const formData = new FormData();
            formData.append('action', id ? 'update' : 'add');
            if (id) formData.append('id', id);
            formData.append('id_cv_cha', activeTask.id);
            formData.append('ma_cv_cha', ma_cv_cha);
            formData.append('ten_buoc', ten_buoc);
            formData.append('ngay_bat_dau', ngay_bd);
            formData.append('ngay_hoan_thanh', ngay_kt);
            formData.append('tien_do', tien_do);
            formData.append('cap_do_id', cap_do_id);
            formData.append('trang_thai_id', (parseInt(tien_do) === 100) ? 1 : 2);

            try {
                const res = await fetch('api_save_subtask.php', { method: 'POST', body: formData });
                if ((await res.json()).success) {
                    showToast("Đã lưu bước thực hiện!", "success");
                    document.getElementById('subTaskEditModal').style.display = 'none';
                    
                    const newTienDo = await recalculateMainTaskProgress(activeTask.id);
                    activeTask.tien_do = newTienDo;
                    activeTask.trang_thai_id = (newTienDo === 100) ? 1 : 2;
                    
                    filterTasksByCurrentMonth();
                    await fetchAndRenderSubTasks(activeTask);
                }
            } catch (err) { }
        });
    }

    const btnCancelSubTaskEdit = document.getElementById('btnCancelSubTaskEdit');
    if (btnCancelSubTaskEdit) {
        btnCancelSubTaskEdit.onclick = () => document.getElementById('subTaskEditModal').style.display = 'none';
    }
    const btnCloseSubTaskEdit = document.getElementById('btnCloseSubTaskEdit');
    if (btnCloseSubTaskEdit) {
        btnCloseSubTaskEdit.onclick = () => document.getElementById('subTaskEditModal').style.display = 'none';
    }

    // === STARTUP ===
    function isNewMonthForTask(task) {
        if (!task || (task.loai_cv || '').toLowerCase() !== 'định kỳ') return false;
        
        const targetMonthStr = `${currentStaffMonthDate.getFullYear()}-${String(currentStaffMonthDate.getMonth() + 1).padStart(2, '0')}`;
        let taskMonth = parseMonth(task.ngay_hoan_thanh) || parseMonth(task.ngay_bat_dau);
        
        return taskMonth && taskMonth !== targetMonthStr && taskMonth < targetMonthStr;
    }

    // Expose functions to global scope for HTML onclick attributes
    window.openEditModal = openEditModal;
    window.openSubTaskModal = openSubTaskModal;
    window.openAddModal = () => {
        if (addModal) {
            document.getElementById('addForm').reset();
            document.getElementById('modal_title').textContent = 'Thêm Công Việc Mới';
            document.getElementById('edit_id').value = '';
            addModal.style.display = 'flex';
        }
    };

    loadMyTasks();
});
