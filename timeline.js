document.addEventListener('DOMContentLoaded', () => {
    const ganttContainer = document.getElementById('ganttContainer');

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
                    renderGantt(result.data);
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

    const renderGantt = (tasks) => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        const grouped = {};
        tasks.forEach(task => {
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
                    <th colspan="${daysInMonth}" class="month-header">THÁNG ${month + 1} / ${year}</th>
                    <th rowspan="2" style="min-width: 100px;">GHI CHÚ</th>
                </tr>
                <tr>`;

        // Render Ngày (Hiện đầy đủ tất cả các ngày)
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const isSunday = d.getDay() === 0;
            html += `<th class="day-header ${isSunday ? 'weekend' : ''}" style="${isSunday ? 'color: #ef4444;' : ''}">
                ${i}<br>${dayNames[d.getDay()]}
            </th>`;
        }
        html += `</tr></thead><tbody>`;

        let parentIndex = 1;
        for (const [name, empTasks] of Object.entries(grouped)) {
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

                html += `<tr>
                    <td class="sticky-col col-wbs">${wbs}</td>
                    <td class="sticky-col col-task" style="padding-left: 40px; color: #475569;">${task.ten_cv || ''}</td>
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

                    html += `<td class="day-cell ${isSunday ? 'weekend-col' : ''}" style="${isSunday ? 'background: #f8fafc;' : ''}">
                        ${isTaskDay ? `<div class="task-bar" title="${task.ten_cv}: ${progress}%"></div>` : ''}
                    </td>`;
                }

                html += `<td style="text-align: center; color: #cbd5e1; font-size: 0.7rem;">N/A</td></tr>`;
            });

            parentIndex++;
        }

        html += `</tbody></table>`;
        ganttContainer.innerHTML = html;
    };

    const formatDateShort = (date) => {
        if (!date || isNaN(date.getTime())) return '-';
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).substring(2)}`;
    };

    loadTimelineData();
});
