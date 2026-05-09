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
    let lastFilteredData = [];
    let charts = {};

    const UI = {
        employeeList: document.getElementById('employeeListContainer'),
        selectAll: document.getElementById('selectAll'),
        fromDate: document.getElementById('fromDate'),
        toDate: document.getElementById('toDate'),
        btnApply: document.getElementById('btnApplyFilter'),
        btnExport: document.getElementById('btnExportExcel'),
        btnClear: document.getElementById('btnClearFilter'),
        tableBody: document.getElementById('dashboardTaskTableBody'),
        tableNote: document.getElementById('tableUpdateNote'),
        stats: {
            total: document.getElementById('statTotal'),
            onTime: document.getElementById('statEfficiency'),
            inProgress: document.getElementById('statDoing'),
            completed: document.getElementById('statDone'),
            overdue: document.getElementById('statOverdue'),
            paused: document.getElementById('statPaused')
        }
    };

    // Set Chart.js Defaults
    if (window.Chart) {
        Chart.defaults.font.family = "'Be Vietnam Pro', sans-serif";
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
        const today = new Date();
        const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        // --- ĐỒNG BỘ HÓA & LỌC DỮ LIỆU (KHỚP TOÀN HỆ THỐNG) ---
        const syncData = [];
        data.forEach(task => {
            const loai = (task.loai_cv || 'Định kỳ').trim();
            const start = task.ngay_bat_dau;
            const end = task.ngay_hoan_thanh;

            if (loai === 'Phát sinh') {
                let matches = false;
                if (end && end !== '0000-00-00') {
                    if (end.startsWith(currentMonthStr)) matches = true;
                } else if (start && start !== '0000-00-00') {
                    if (start.startsWith(currentMonthStr)) matches = true;
                }
                if (matches) syncData.push({...task});
            } else {
                // Định kỳ: Reset tháng cũ
                let taskCopy = processTaskReset(task, currentMonthStr);
                
                // Xác định tháng gốc
                let taskOriginalMonth = null;
                if (end && end !== '0000-00-00') taskOriginalMonth = end.substring(0, 7);
                else if (start && start !== '0000-00-00') taskOriginalMonth = start.substring(0, 7);

                // Ẩn nếu là tháng tương lai (chưa tới) -> dashboard luôn hiện tháng hiện tại
                if (taskOriginalMonth && currentMonthStr < taskOriginalMonth) return;
                
                syncData.push(taskCopy);
            }
        });

        const total = syncData.length;
        // 1: Hoàn thành, 2: Đang thực hiện, 3: Quá hạn, 4: Tạm dừng, 5: Xin chỉ đạo
        const completed = syncData.filter(t => t.trang_thai_id == 1 || parseInt(t.tien_do || 0) >= 100).length;
        const doing = syncData.filter(t => (t.trang_thai_id == 2 || t.trang_thai_id == 5) && parseInt(t.tien_do || 0) < 100).length;
        const overdue = syncData.filter(t => t.trang_thai_id == 3 && parseInt(t.tien_do || 0) < 100).length;
        const paused = syncData.filter(t => t.trang_thai_id == 4).length;
        
        const onTimeRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

        if (UI.stats.total) UI.stats.total.textContent = total;
        if (UI.stats.completed) UI.stats.completed.textContent = completed;
        if (UI.stats.inProgress) UI.stats.inProgress.textContent = doing;
        if (UI.stats.overdue) UI.stats.overdue.textContent = overdue;
        if (UI.stats.paused) UI.stats.paused.textContent = paused;
        if (UI.stats.onTime) UI.stats.onTime.textContent = onTimeRate + '%';

        lastFilteredData = syncData;
        renderCharts(syncData);
        renderAdditionalAnalytics(syncData);
        // renderTaskTable(syncData); // Table was removed from HTML
    };

    const exportToExcel = () => {
        if (!lastFilteredData || lastFilteredData.length === 0) {
            if (typeof showToast === 'function') showToast('Không có dữ liệu để xuất!', 'error');
            else alert('Không có dữ liệu để xuất!');
            return;
        }

        // 1. Chuẩn bị dữ liệu (mapping lại các trường để hiển thị đẹp)
        const excelData = lastFilteredData.map((task, index) => {
            const statusText = parseInt(task.tien_do || 0) >= 100 ? "Hoàn thành" : (task.trang_thai_text || "Đang làm");
            return {
                "STT": index + 1,
                "Mã CV": task.ma_cv,
                "Tên Công Việc": task.ten_cv || '',
                "Mô Tả Chi Tiết": (task.mo_ta_cv || '').replace(/\[x\]/g, '[✓]').replace(/\[ \]/g, '[ ]').replace(/\|file:.*?\|/g, '').trim(),
                "Người Phụ Trách": task.nguoi_phu_trach || task.ten_nv || 'Chưa phân công',
                "Loại CV": task.loai_cv || 'Định kỳ',
                "Bắt Đầu": task.ngay_bat_dau || '-',
                "Kết Thúc": task.ngay_hoan_thanh || '-',
                "Tiến Độ (%)": task.tien_do || 0,
                "Trạng Thái": statusText,
                "Ghi Chú": task.ghi_chu || ''
            };
        });

        // 2. Tạo Workbook & Worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Báo cáo công việc");

        // 3. Cấu hình độ rộng cột (tính theo số ký tự)
        const wscols = [
            { wch: 6 },  // STT
            { wch: 15 }, // Mã CV
            { wch: 30 }, // Tên CV
            { wch: 50 }, // Mô tả
            { wch: 20 }, // Người phụ trách
            { wch: 15 }, // Loại CV
            { wch: 15 }, // Bắt đầu
            { wch: 15 }, // Kết thúc
            { wch: 10 }, // Tiến độ
            { wch: 15 }, // Trạng thái
            { wch: 30 }  // Ghi chú
        ];
        ws['!cols'] = wscols;

        // 4. Xuất file .xlsx
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        XLSX.writeFile(wb, `Bao_cao_dashboard_${dateStr}.xlsx`);
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
            
            // Sử dụng hàm formatChecklist dùng chung từ utils.js để đồng bộ hiển thị
            let mo_ta_html = formatChecklist(task.mo_ta_cv);

            row.innerHTML = `
                <td style="padding: 12px; text-align: center; color: #64748b; width: 50px; min-width: 50px; max-width: 50px;">${index + 1}</td>
                <td style="padding: 12px; color: #6366f1; font-weight: 600; width: 100px; min-width: 100px; max-width: 100px; white-space: nowrap;">${task.ma_cv}</td>
                <td style="padding: 12px; font-weight: 600; width: 200px; min-width: 200px; max-width: 200px;">${task.ten_cv}</td>
                <td style="padding: 12px; line-height: 1.5; font-size: 0.8rem; width: 350px; min-width: 350px; max-width: 350px;">${mo_ta_html}</td>
                <td style="padding: 12px; width: 120px; min-width: 120px; max-width: 120px; white-space: nowrap;">${getLevelBadge(task.cap_do_ten, task.cap_do_id)}</td>
                <td style="padding: 12px; color: #64748b; width: 100px; min-width: 100px; max-width: 100px; white-space: nowrap;">${task.loai_cv || 'Định kỳ'}</td>
                <td style="padding: 12px; font-weight: 600; width: 100px; min-width: 100px; max-width: 100px; white-space: nowrap;">${formatDate(task.ngay_bat_dau)}</td>
                <td style="padding: 12px; font-weight: 600; color: #4f46e5; width: 100px; min-width: 100px; max-width: 100px; white-space: nowrap;">${formatDate(task.ngay_hoan_thanh)}</td>
                <td style="padding: 12px; color: #64748b; font-size: 0.8rem; width: 120px; min-width: 120px; max-width: 120px;">${task.ghi_chu || '-'}</td>
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

    const renderAdditionalAnalytics = (data) => {
        const total = data.length || 1;
        
        // 1. Circle Progress Logic
        const counts = {
            done: data.filter(t => t.trang_thai_id == 1 || parseInt(t.tien_do || 0) >= 100).length,
            doing: data.filter(t => (t.trang_thai_id == 2 || t.trang_thai_id == 5) && parseInt(t.tien_do || 0) < 100).length,
            overdue: data.filter(t => t.trang_thai_id == 3 && parseInt(t.tien_do || 0) < 100).length,
            paused: data.filter(t => t.trang_thai_id == 4).length
        };

        const renderCircle = (id, count, color) => {
            const percent = Math.round((count / total) * 100);
            const textEl = document.getElementById(id + 'Text');
            if (textEl) textEl.textContent = percent + '%';
            
            updateChart(id, 'doughnut', {
                datasets: [{
                    data: [count, total - count],
                    backgroundColor: [color, '#f1f5f9'],
                    borderWidth: 0
                }]
            }, {
                cutout: '80%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            });
        };

        renderCircle('circleDone', counts.done, '#10b981');
        renderCircle('circleDoing', counts.doing, '#6366f1');
        renderCircle('circleOverdue', counts.overdue, '#f43f5e');
        renderCircle('circlePaused', counts.paused, '#f59e0b');

        // 2. Deadline Table Logic
        const deadlineBody = document.getElementById('deadlineTableBody');
        if (deadlineBody) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const in7Days = new Date(today);
            in7Days.setDate(today.getDate() + 7);

            const upcoming = data.filter(t => {
                if (parseInt(t.tien_do || 0) >= 100) return false;
                if (!t.ngay_hoan_thanh || t.ngay_hoan_thanh === '0000-00-00') return false;
                const d = new Date(t.ngay_hoan_thanh);
                return d >= today && d <= in7Days;
            }).sort((a, b) => new Date(a.ngay_hoan_thanh) - new Date(b.ngay_hoan_thanh));

            deadlineBody.innerHTML = upcoming.map(t => {
                const d = new Date(t.ngay_hoan_thanh);
                const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
                const diffText = diff === 0 ? 'Hôm nay' : diff + ' ngày';
                const diffColor = diff <= 2 ? '#ef4444' : '#16a34a';
                
                return `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;">
                        <td style="padding: 12px; font-weight: 700; color: #1e293b; font-size: 0.85rem; word-break: break-word; line-height: 1.4;">
                            ${t.ten_cv}
                        </td>
                        <td style="padding: 12px; color: #64748b; font-weight: 600; text-align: center; font-size: 0.8rem; width: 100px;">
                            ${formatDate(t.ngay_hoan_thanh)}
                        </td>
                        <td style="padding: 12px; color: ${diffColor}; font-weight: 800; text-align: right; font-size: 0.85rem; width: 80px;">
                            ${diffText}
                        </td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="3" style="padding: 30px; text-align: center; color: #94a3b8;">Không có việc nào sắp hết hạn</td></tr>';
        }

        // 3. Monthly Volume Chart (Respecting Filters)
        const monthsData = {};
        const sourceData = (data.length > 0) ? data : allTasksData;
        
        sourceData.forEach(t => {
            const date = t.ngay_bat_dau || t.ngay_hoan_thanh;
            if (date && date !== '0000-00-00') {
                const m = date.substring(0, 7); // YYYY-MM
                monthsData[m] = (monthsData[m] || 0) + 1;
            }
        });
        
        // Get sorted months. If filtered, show all months in range. 
        // If no data, show at least last 6 months.
        let sortedMonths = Object.keys(monthsData).sort();
        if (sortedMonths.length > 12) sortedMonths = sortedMonths.slice(-12); // Max 1 year trend
        if (sortedMonths.length === 0) {
            // Placeholder if no data in range
            const now = new Date();
            for(let i=5; i>=0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                sortedMonths.push(d.toISOString().substring(0, 7));
            }
        }
        updateChart('monthlyVolumeChart', 'line', {
            labels: sortedMonths.map(m => m.replace('-', '-thg ')),
            datasets: [{
                label: 'Số lượng công việc',
                data: sortedMonths.map(m => monthsData[m]),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#22c55e'
            }]
        }, {
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        });

        // 4. Top 5 High Intensity Tasks
        const topTasks = [...data].sort((a, b) => {
            const countA = (a.mo_ta_cv || '').split('[ ]').length + (a.mo_ta_cv || '').split('[x]').length;
            const countB = (b.mo_ta_cv || '').split('[ ]').length + (b.mo_ta_cv || '').split('[x]').length;
            return countB - countA;
        }).slice(0, 5);

        updateChart('topTasksChart', 'bar', {
            labels: topTasks.map(t => t.ten_cv.length > 20 ? t.ten_cv.substring(0, 20) + '...' : t.ten_cv),
            datasets: [{
                label: 'Số lượng hạng mục',
                data: topTasks.map(t => {
                    const c = (t.mo_ta_cv || '').split('[ ]').length + (t.mo_ta_cv || '').split('[x]').length - 1;
                    return c > 0 ? c : 0;
                }),
                backgroundColor: '#93c5fd',
                borderRadius: 8,
                barThickness: 50
            }]
        }, {
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
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
                    filtered = filtered.filter(t => selectedEmps.includes(t.nguoi_phu_trach));
                }

                if (from) filtered = filtered.filter(t => t.ngay_hoan_thanh >= from);
                if (to) filtered = filtered.filter(t => t.ngay_hoan_thanh <= to);

                updateDashboard(filtered);
            };
        }

        if (UI.btnExport) {
            UI.btnExport.onclick = () => exportToExcel();
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
