(function() {
    // === STANDALONE MODE LOGIC ===
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const btnBack = document.getElementById('btnBack');
    const sidebar = document.querySelector('.sidebar');
    const mainWrapper = document.querySelector('.main-wrapper');

    if (mode === 'standalone') {
        if (sidebar) sidebar.style.display = 'none';
        if (mainWrapper) {
            mainWrapper.style.marginLeft = '0';
            mainWrapper.style.width = '100%';
            mainWrapper.style.padding = '40px';
        }
        if (btnBack) {
            btnBack.style.display = 'flex';
            btnBack.addEventListener('click', () => {
                window.history.back();
            });
        }
    }

    let allTasksData = [];
    let employeeListData = [];
    let charts = {};

    const UI = {
        employeeList: document.getElementById('employeeListContainer'),
        selectAll: document.getElementById('selectAll'),
        fromDate: document.getElementById('fromDate'),
        toDate: document.getElementById('toDate'),
        btnApply: document.getElementById('btnApplyFilter'),
        btnClear: document.getElementById('btnClearFilter'),
        tableBody: document.getElementById('dashboardTaskTableBody'),
        tableNote: document.getElementById('tableUpdateNote'),
        stats: {
            total: document.getElementById('statTotal'),
            onTime: document.getElementById('statEfficiency'),
            inProgress: document.getElementById('statDoing'),
            completed: document.getElementById('statDone'),
            overdue: document.getElementById('statOverdue'),
            projects: document.getElementById('statProjects')
        }
    };

    // Set Chart.js Defaults
    if (window.Chart) {
        Chart.defaults.font.family = "'Outfit', sans-serif";
        Chart.defaults.color = '#64748b';
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
        Chart.defaults.plugins.tooltip.padding = 12;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.titleFont = { size: 13, weight: 'bold' };
    }

    // === 1. LOAD INITIAL DATA ===
    const init = async () => {
        // Clear previous state if any
        if (UI.tableBody) UI.tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">Đang tải dữ liệu...</td></tr>';
        
        await Promise.all([loadEmployees(), loadData()]);
        initEvents();
    };

    const loadEmployees = async () => {
        try {
            const response = await fetch('api_get_employees_list.php');
            const result = await response.json();
            if (result.success) {
                employeeListData = result.data;
                renderEmployeeFilter(employeeListData);
            }
        } catch (error) {
            console.error("Lỗi tải danh sách nhân viên:", error);
        }
    };

    const loadData = async () => {
        try {
            const response = await fetch('api_get_all_tasks.php');
            const result = await response.json();
            if (result.success) {
                allTasksData = result.data;
                updateDashboard(allTasksData);
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu Dashboard:", error);
        }
    };

    // === 2. UI RENDERING ===
    const renderEmployeeFilter = (employees) => {
        if (!UI.employeeList) return;
        UI.employeeList.innerHTML = employees.map(emp => `
            <div class="select-item">
                <input type="checkbox" class="emp-checkbox" id="emp_${emp.ma_nv}" value="${emp.ma_nv}">
                <label for="emp_${emp.ma_nv}">${emp.ten_nv}</label>
            </div>
        `).join('');
    };

    const updateDashboard = (data) => {
        const total = data.length;
        // 1: Hoàn thành, 2: Đang thực hiện, 3: Quá hạn, 4: Tạm dừng, 5: Xin chỉ đạo
        const completed = data.filter(t => t.trang_thai_id == 1 || parseInt(t.tien_do || 0) >= 100).length;
        const doing = data.filter(t => (t.trang_thai_id == 2 || t.trang_thai_id == 5) && parseInt(t.tien_do || 0) < 100).length;
        const overdue = data.filter(t => t.trang_thai_id == 3 && parseInt(t.tien_do || 0) < 100).length;
        
        const onTimeRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        const projects = new Set(data.map(t => t.ma_cv ? t.ma_cv.split('.')[0] : 'Other')).size;

        if (UI.stats.total) UI.stats.total.textContent = total;
        if (UI.stats.completed) UI.stats.completed.textContent = completed;
        if (UI.stats.inProgress) UI.stats.inProgress.textContent = doing;
        if (UI.stats.overdue) UI.stats.overdue.textContent = overdue;
        if (UI.stats.onTime) UI.stats.onTime.textContent = onTimeRate + '%';
        if (UI.stats.projects) UI.stats.projects.textContent = projects;

        renderCharts(data);
        renderTaskTable(data);
    };

    const renderTaskTable = (data) => {
        if (!UI.tableBody) return;
        
        UI.tableBody.innerHTML = '';
        if (data.length === 0) {
            UI.tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">Không có dữ liệu phù hợp</td></tr>';
            return;
        }

        data.forEach((task, index) => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #f1f5f9';
            
            let mo_ta_html = task.mo_ta_cv || '-';
            if (mo_ta_html.includes('[ ]') || mo_ta_html.includes('[x]')) {
                const lines = mo_ta_html.split('\n');
                mo_ta_html = lines.map(line => {
                    if (line.trim().startsWith('[x]')) return `<div style="color: #10b981; display: flex; align-items: center; gap: 5px; margin-bottom: 2px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ${line.replace('[x]', '').trim()}</div>`;
                    if (line.trim().startsWith('[ ]')) return `<div style="color: #94a3b8; display: flex; align-items: center; gap: 5px; margin-bottom: 2px;"><span style="width: 12px; height: 12px; border: 1px solid #cbd5e1; border-radius: 3px; display: inline-block;"></span> ${line.replace('[ ]', '').trim()}</div>`;
                    return line;
                }).join('');
            }

            row.innerHTML = `
                <td style="padding: 12px; text-align: center; color: #64748b;">${index + 1}</td>
                <td style="padding: 12px; color: #6366f1; font-weight: 600;">${task.ma_cv}</td>
                <td style="padding: 12px; font-weight: 600;">${task.ten_cv}</td>
                <td style="padding: 12px; line-height: 1.5; font-size: 0.8rem;">${mo_ta_html}</td>
                <td style="padding: 12px;">${getLevelBadge(task.cap_do_ten, task.cap_do_id)}</td>
                <td style="padding: 12px; color: #64748b;">${task.loai_cv || 'Định kỳ'}</td>
                <td style="padding: 12px; font-weight: 600;">${formatDate(task.ngay_bat_dau)}</td>
                <td style="padding: 12px; font-weight: 600; color: #4f46e5;">${formatDate(task.ngay_hoan_thanh)}</td>
                <td style="padding: 12px; color: #64748b; font-size: 0.8rem;">${task.ghi_chu || '-'}</td>
            `;
            UI.tableBody.appendChild(row);
        });

        if (UI.tableNote) {
            const now = new Date();
            UI.tableNote.textContent = `Cập nhật: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        }
    };

    function getLevelBadge(name, id) {
        let color = '#94a3b8';
        let label = name || 'Bình thường';
        if (id == 1) { color = '#ef4444'; label = 'Khẩn cấp'; }
        else if (id == 2) { color = '#f59e0b'; label = 'Cao'; }
        else if (id == 3) { color = '#8b5cf6'; label = 'Bình thường'; }
        else if (id == 4) { color = '#64748b'; label = 'Thấp'; }
        return `<span style="color: ${color}; font-weight: 600;">${label}</span>`;
    }

    function formatDate(dateStr) {
        if (!dateStr || dateStr === '0000-00-00') return '-';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('vi-VN');
    }

    // === 3. CHARTS RENDERING ===
    const renderCharts = (data) => {
        const statusCounts = {
            'Đang thực hiện': data.filter(t => (t.trang_thai_id == 2 || t.trang_thai_id == 5) && parseInt(t.tien_do || 0) < 100).length,
            'Hoàn thành': data.filter(t => t.trang_thai_id == 1 || parseInt(t.tien_do || 0) >= 100).length,
            'Quá hạn': data.filter(t => t.trang_thai_id == 3 && parseInt(t.tien_do || 0) < 100).length,
            'Tạm dừng': data.filter(t => t.trang_thai_id == 4 && parseInt(t.tien_do || 0) < 100).length
        };

        updateChart('statusChart', 'bar', {
            labels: Object.keys(statusCounts),
            datasets: [{
                label: 'Số lượng công việc',
                data: Object.values(statusCounts),
                backgroundColor: ['#6366f1', '#10b981', '#f43f5e', '#f59e0b'],
                borderRadius: 12,
                barThickness: 40
            }]
        }, {
            scales: {
                y: { grid: { display: false }, ticks: { precision: 0 } },
                x: { grid: { display: false } }
            }
        });

        const levelCounts = {
            'Khẩn cấp': data.filter(t => t.cap_do_id == 1).length,
            'Cao': data.filter(t => t.cap_do_id == 2).length,
            'Bình thường': data.filter(t => t.cap_do_id == 3).length,
            'Thấp': data.filter(t => t.cap_do_id == 4).length
        };

        updateChart('levelChart', 'doughnut', {
            labels: Object.keys(levelCounts),
            datasets: [{
                data: Object.values(levelCounts),
                backgroundColor: ['#f43f5e', '#f59e0b', '#6366f1', '#94a3b8'],
                borderWidth: 4,
                borderColor: '#ffffff',
                hoverOffset: 15
            }]
        }, { 
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { weight: '600' } } }
            }
        });
    };

    const updateChart = (id, type, data, options = {}) => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        if (charts[id]) charts[id].destroy();
        const ctx = canvas.getContext('2d');
        charts[id] = new Chart(ctx, {
            type: type,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: type === 'doughnut' } 
                },
                ...options
            }
        });
    };

    // === 4. EVENTS ===
    const initEvents = () => {
        if (UI.selectAll) {
            UI.selectAll.onclick = (e) => {
                document.querySelectorAll('.emp-checkbox').forEach(cb => cb.checked = e.target.checked);
            };
        }

        if (UI.btnApply) {
            UI.btnApply.onclick = () => {
                const selectedEmps = Array.from(document.querySelectorAll('.emp-checkbox:checked')).map(cb => cb.value);
                const from = UI.fromDate.value;
                const to = UI.toDate.value;

                let filtered = allTasksData;

                if (selectedEmps.length > 0) {
                    filtered = filtered.filter(t => selectedEmps.includes(t.ma_nv));
                }

                if (from) filtered = filtered.filter(t => t.ngay_hoan_thanh >= from);
                if (to) filtered = filtered.filter(t => t.ngay_hoan_thanh <= to);

                updateDashboard(filtered);
            };
        }

        if (UI.btnClear) {
            UI.btnClear.onclick = () => {
                if (UI.selectAll) UI.selectAll.checked = false;
                document.querySelectorAll('.emp-checkbox').forEach(cb => cb.checked = false);
                UI.fromDate.value = '';
                UI.toDate.value = '';
                document.querySelectorAll('.btn-preset').forEach(b => b.style.borderColor = '#f1f5f9');
                updateDashboard(allTasksData);
            };
        }

        // --- TIME PRESETS LOGIC ---
        const toLocalISOString = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.onclick = () => {
                const range = btn.dataset.range;
                const today = new Date();
                let start, end;

                // Reset preset buttons style
                document.querySelectorAll('.btn-preset').forEach(b => b.style.borderColor = '#f1f5f9');
                btn.style.borderColor = '#6366f1';

                if (range === 'month') {
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                } else if (range === 'quarter') {
                    const quarter = Math.floor(today.getMonth() / 3);
                    start = new Date(today.getFullYear(), quarter * 3, 1);
                    end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
                } else if (range === 'year') {
                    start = new Date(today.getFullYear(), 0, 1);
                    end = new Date(today.getFullYear(), 11, 31);
                }

                if (start && end) {
                    UI.fromDate.value = toLocalISOString(start);
                    UI.toDate.value = toLocalISOString(end);
                    UI.btnApply.click(); // Trigger filtering
                }
            };
        });
    };

    init();
})();
