document.addEventListener('DOMContentLoaded', () => {
    const ganttContainer = document.getElementById('ganttContainer');

    let allTasks = [];
    let currentGanttDate = new Date();

    const loadTimelineData = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            let ma_nv = urlParams.get('id');
            
            // Xử lý an toàn nếu ma_nv là chuỗi "null" hoặc undefined
            if (ma_nv === 'null' || ma_nv === 'undefined') ma_nv = null;
            
            console.log("Filtering Gantt for Employee ID:", ma_nv || "ALL");
            
            const apiUrl = ma_nv ? `api_get_employee_tasks.php?id=${encodeURIComponent(ma_nv)}` : 'api_get_employee_tasks.php';

            const response = await fetch(apiUrl);
            const result = await response.json();

            if (result.success && result.data) {
                if (result.data.length > 0) {
                    if (ma_nv) {
                        const empName = result.data[0].ten_nv || 'Nhân viên';
                        const titleEl = document.getElementById('timelineTitle');
                        if (titleEl) titleEl.textContent = `Lịch Công Việc: ${empName}`;
                    }
                    allTasks = result.data;
                    renderGantt(allTasks, currentGanttDate);
                } else {
                    ganttContainer.innerHTML = '<div style="padding: 100px; text-align: center; color: var(--text-muted); font-weight: 600;">Chưa có dữ liệu công việc trong hệ thống.</div>';
                }
            } else {
                ganttContainer.innerHTML = `<div style="padding: 100px; text-align: center; color: #ef4444; font-weight: 700;">LỖI TỪ MÁY CHỦ: ${result.message || 'Không rõ nguyên nhân'}</div>`;
            }
        } catch (error) {
            console.error("Gantt Load Error:", error);
            ganttContainer.innerHTML = '<div style="padding: 100px; text-align: center; color: #ef4444; font-weight: 700;">LỖI KẾT NỐI MÁY CHỦ!</div>';
        }
    };

    const renderGantt = (tasks, targetDate) => {
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        const selectedMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        // --- ĐỒNG BỘ HÓA DỮ LIỆU (KHỚP LOGIC TRANG STAFF) ---
        const filteredTasks = [];
        tasks.forEach(task => {
            const loai = (task.loai_cv || 'Định kỳ').trim();
            const start = task.ngay_bat_dau;
            const end = task.ngay_hoan_thanh;

            if (loai === 'Phát sinh') {
                // Phát sinh: Chỉ hiển thị ở đúng tháng của ngày kết thúc (hoặc bắt đầu)
                let matches = false;
                if (end && end !== '0000-00-00') {
                    if (end.startsWith(selectedMonth)) matches = true;
                } else if (start && start !== '0000-00-00') {
                    if (start.startsWith(selectedMonth)) matches = true;
                }
                if (matches) filteredTasks.push({...task});
            } else {
                // Định kỳ: Sử dụng hàm reset dùng chung
                let taskCopy = processTaskReset(task, selectedMonth);
                
                // Xác định tháng gốc của công việc
                let taskOriginalMonth = null;
                if (task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '0000-00-00') {
                    taskOriginalMonth = task.ngay_hoan_thanh.substring(0, 7);
                } else if (task.ngay_bat_dau && task.ngay_bat_dau !== '0000-00-00') {
                    taskOriginalMonth = task.ngay_bat_dau.substring(0, 7);
                }

                // Nếu đang xem tháng cũ hơn tháng tạo công việc -> ẩn
                if (taskOriginalMonth && selectedMonth < taskOriginalMonth) {
                    return;
                }
                
                // Công việc định kỳ luôn hiện ở tháng hiện tại và tương lai (đã qua reset)
                filteredTasks.push(taskCopy);
            }
        });

        const grouped = {};
        filteredTasks.forEach(task => {
            const key = task.ten_nv || 'Chưa phân công';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(task);
        });

        let html = `<table class="gantt-table">
            <thead>
                <tr>
                    <th rowspan="2" class="sticky-col col-wbs">STT</th>
                    <th rowspan="2" class="sticky-col col-task">DANH MỤC CÔNG VIỆC</th>
                    <th rowspan="2" class="col-start">BẮT ĐẦU</th>
                    <th rowspan="2" class="col-end">ĐẾN HẠN</th>
                    <th rowspan="2" class="col-duration">SỐ NGÀY</th>
                    <th rowspan="2" class="col-percent">PHẦN TRĂM HOÀN THÀNH</th>
                    <th colspan="${daysInMonth}" class="month-header">
                        <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
                            <button class="btn-prev-month" style="background: rgba(255,255,255,0.25); border: none; color: white; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: background 0.2s;">&#10094;</button>
                            <span>THÁNG ${month + 1} / ${year}</span>
                            <button class="btn-next-month" style="background: rgba(255,255,255,0.25); border: none; color: white; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: background 0.2s;">&#10095;</button>
                        </div>
                    </th>
                    <th rowspan="2" style="min-width: 100px;">GHI CHÚ</th>
                </tr>
                <tr>`;

        const todayDate = new Date();
        todayDate.setHours(0,0,0,0);

        // Render Ngày (Hiện đầy đủ tất cả các ngày)
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const isSunday = d.getDay() === 0;
            const isToday = (d.getTime() === todayDate.getTime());
            
            // Marker cho ngày hôm nay: Viền đỏ đậm và nền hồng nhạt sang trọng
            const todayStyle = isToday ? 'background: #fef2f2; border-left: 2px solid #ef4444; border-right: 2px solid #ef4444; position: relative;' : '';
            const todayLabel = isToday ? '<div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #ef4444; color: white; font-size: 8px; padding: 1px 4px; border-radius: 4px; white-space: nowrap; z-index: 10;">HÔM NAY</div>' : '';

            html += `<th class="day-header ${isSunday ? 'weekend' : ''}" style="${isSunday ? 'color: #ef4444;' : ''} ${todayStyle}">
                ${todayLabel}
                ${i}<br>${dayNames[d.getDay()]}
            </th>`;
        }
        html += `</tr></thead><tbody>`;

        let parentIndex = 1;
        const workloadStats = {};

        for (const [name, empTasks] of Object.entries(grouped)) {
            // Tính toán tải trọng (Số task chưa hoàn thành)
            const activeTasks = empTasks.filter(t => parseInt(t.tien_do || 0) < 100).length;
            workloadStats[name] = activeTasks;

            html += `<tr class="row-parent">
                <td class="sticky-col col-wbs">${parentIndex}</td>
                <td class="sticky-col col-task" style="padding-left: 20px;">👤 ${name.toUpperCase()}</td>
                <td class="col-start"></td>
                <td class="col-end"></td>
                <td class="col-duration"></td>
                <td class="col-percent"></td>
                <td colspan="${daysInMonth}"></td>
                <td></td>
            </tr>`;

            empTasks.forEach((task, childIndex) => {
                const wbs = `${parentIndex}.${childIndex + 1}`;
                const startStr = task.ngay_bat_dau;
                const endStr = task.ngay_hoan_thanh;
                
                const start = (startStr && startStr !== '0000-00-00') ? new Date(startStr) : null;
                const end = (endStr && endStr !== '0000-00-00') ? new Date(endStr) : null;
                
                let progress = parseInt(task.tien_do) || 0;
                if (progress >= 100) progress = 100;

                // TÍNH THỜI GIAN (Trừ Chủ Nhật)
                let duration = 0;
                if (start && end) {
                    let tempDate = new Date(start);
                    while (tempDate <= end) {
                        if (tempDate.getDay() !== 0) duration++;
                        tempDate.setDate(tempDate.getDate() + 1);
                    }
                }

                // Màu tiến độ cho ô phần trăm
                let bgColor = "#fee2e2"; 
                let textColor = "#ef4444"; 
                if (progress >= 100) {
                    bgColor = "#10b981"; 
                    textColor = "white";
                } else if (progress >= 70) {
                    bgColor = "#d1fae5"; 
                    textColor = "#10b981";
                } else if (progress >= 30) {
                    bgColor = "#fef3c7"; 
                    textColor = "#d97706";
                }

                let isUrgent = false;
                let isSoon = false;
                let diffDays = null;
                if (progress < 100 && end) {
                    const e = new Date(end);
                    e.setHours(0,0,0,0);
                    diffDays = Math.ceil((e - todayDate)/(1000*60*60*24));
                    if (diffDays < 0) isUrgent = true;
                    else if (diffDays <= 2) isSoon = true;
                }
                
                let barStyle = '';
                let tooltipWarn = '';
                let pulseIcon = '';
                let taskNameStyle = 'color: #475569;';
                if (isUrgent) {
                    barStyle = 'background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5);';
                    tooltipWarn = `⚠️ CHÚ Ý: Đã quá hạn! | `;
                    pulseIcon = '<span style="animation: pulse 1s infinite;">🔴</span> ';
                    taskNameStyle = 'color: #b91c1c; font-weight: 700;';
                } else if (isSoon) {
                    barStyle = 'background: #f59e0b;';
                    tooltipWarn = `⚠️ CHÚ Ý: Còn ${diffDays} ngày! | `;
                    pulseIcon = '🔥 ';
                    taskNameStyle = 'color: #b45309; font-weight: 700;';
                }

                html += `<tr>
                    <td class="sticky-col col-wbs">${wbs}</td>
                    <td class="sticky-col col-task" style="padding-left: 40px; ${taskNameStyle}">${pulseIcon}${task.ten_cv || ''}</td>
                    <td class="col-start">${start ? formatDateShort(start) : '-'}</td>
                    <td class="col-end">${end ? formatDateShort(end) : '-'}</td>
                    <td class="col-duration">${duration > 0 ? duration : '-'}</td>
                    <td class="col-percent" style="padding: 10px 5px;">
                        <div class="pct-box" style="background: ${bgColor}; color: ${textColor};">${progress}%</div>
                    </td>`;

                // Render Gantt Days (Tất cả các ngày)
                for (let i = 1; i <= daysInMonth; i++) {
                    const currentDate = new Date(year, month, i);
                    currentDate.setHours(0,0,0,0);
                    const isSunday = currentDate.getDay() === 0;
                    
                    let isTaskDay = false;
                    // CHỈ TÔ MÀU NẾU KHÔNG PHẢI CHỦ NHẬT
                    if (!isSunday && start && end) {
                        const s = new Date(start); s.setHours(0,0,0,0);
                        const e = new Date(end); e.setHours(0,0,0,0);
                        if (currentDate >= s && currentDate <= e) isTaskDay = true;
                    }

                    const isToday = (currentDate.getTime() === todayDate.getTime());
                    // Highlight toàn bộ cột ngày hôm nay
                    const todayStyle = isToday ? 'background: #fef2f2; border-left: 2px solid #ef4444; border-right: 2px solid #ef4444;' : (isSunday ? 'background: #f8fafc;' : '');

                    html += `<td class="day-cell ${isSunday ? 'weekend-col' : ''}" style="${todayStyle}">
                        ${isTaskDay ? `<div class="task-bar ${isUrgent ? 'pulse-urgent' : ''}" style="${barStyle} height: 14px; border-radius: 20px;" title="${tooltipWarn}${task.ten_cv}: ${progress}%"></div>` : ''}
                    </td>`;
                }

                html += `<td style="text-align: center; color: #cbd5e1; font-size: 0.7rem;">N/A</td></tr>`;
            });

            parentIndex++;
        }

        // Render Workload Summary UI
        const summaryContainer = document.getElementById('workloadSummary');
        if (summaryContainer) {
            summaryContainer.innerHTML = Object.entries(workloadStats).map(([name, count]) => {
                const isOverloaded = count > 3;
                const color = isOverloaded ? '#ef4444' : (count > 0 ? '#3b82f6' : '#10b981');
                const label = isOverloaded ? 'QUÁ TẢI' : (count > 0 ? 'ĐANG LÀM' : 'SẴN SÀNG');
                return `
                    <div style="background: white; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <div style="font-weight: 800; font-size: 0.8rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name.toUpperCase()}</div>
                        <div style="display: flex; align-items: baseline; gap: 4px;">
                            <span style="font-size: 1.5rem; font-weight: 800; color: #1e293b;">${count}</span>
                            <span style="font-size: 0.7rem; color: #94a3b8; font-weight: 700;">TASK ĐANG CHẠY</span>
                        </div>
                        <div style="font-size: 0.65rem; font-weight: 800; color: ${color}; background: ${color}15; padding: 4px 8px; border-radius: 6px; width: fit-content;">${label}</div>
                    </div>
                `;
            }).join('');
        }

        html += `</tbody></table>`;
        ganttContainer.innerHTML = html;
    };

    const formatDateShort = (date) => {
        if (!date || isNaN(date.getTime())) return '-';
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).substring(2)}`;
    };

    // Xử lý sự kiện chuyển tháng
    ganttContainer.addEventListener('click', (e) => {
        const btnPrev = e.target.closest('.btn-prev-month');
        const btnNext = e.target.closest('.btn-next-month');
        
        if (btnPrev) {
            currentGanttDate.setMonth(currentGanttDate.getMonth() - 1);
            renderGantt(allTasks, currentGanttDate);
        } else if (btnNext) {
            currentGanttDate.setMonth(currentGanttDate.getMonth() + 1);
            renderGantt(allTasks, currentGanttDate);
        }
    });

    loadTimelineData();
});
