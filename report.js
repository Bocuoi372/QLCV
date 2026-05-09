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
    const statDoing = document.getElementById('statDoing');
    const statOverdue = document.getElementById('statOverdue');
    const statHelp = document.getElementById('statHelp');

    // if (empName && displayEmpName) {
    //     displayEmpName.textContent = empName.toUpperCase();
    // }

    let currentTasks = [];


    let allFetchedTasks = [];
    const monthFilter = document.getElementById('monthFilter');

    // Khởi tạo tháng hiện tại
    if (monthFilter) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        monthFilter.value = `${y}-${m}`;

        monthFilter.addEventListener('change', () => {
            applyFilter();
        });
    }

    const urgentFilterCheckbox = document.getElementById('urgentFilterCheckbox');
    if (urgentFilterCheckbox) {
        urgentFilterCheckbox.addEventListener('change', () => {
            applyFilter();
        });
    }

    const applyFilter = () => {
        if (!monthFilter) return;
        const selectedMonth = monthFilter.value; // format: "YYYY-MM"

        if (!selectedMonth) {
            currentTasks = [...allFetchedTasks];
        } else {
            // Bước 1: Xử lý làm sạch data công việc định kỳ từ tháng cũ (Sử dụng hàm dùng chung từ utils.js)
            const processedTasks = allFetchedTasks.map(task => processTaskReset(task, selectedMonth));

            // Bước 2: Lọc các công việc (Khớp logic toàn hệ thống)
            currentTasks = [];
            processedTasks.forEach(task => {
                const loai = (task.loai_cv || 'Định kỳ').trim();
                const originalTask = allFetchedTasks.find(t => t.ma_cv === task.ma_cv) || task;
                const start = originalTask.ngay_bat_dau;
                const end = originalTask.ngay_hoan_thanh;

                if (loai === 'Phát sinh') {
                    let matches = false;
                    if (end && end !== '0000-00-00') {
                        if (end.startsWith(selectedMonth)) matches = true;
                    } else if (start && start !== '0000-00-00') {
                        if (start.startsWith(selectedMonth)) matches = true;
                    }
                    if (matches) currentTasks.push(task);
                } else {
                    // Định kỳ
                    let taskOriginalMonth = null;
                    if (end && end !== '0000-00-00') taskOriginalMonth = end.substring(0, 7);
                    else if (start && start !== '0000-00-00') taskOriginalMonth = start.substring(0, 7);

                    if (taskOriginalMonth && selectedMonth < taskOriginalMonth) return;
                    currentTasks.push(task);
                }
            });
        }

        const urgentFilterCheckbox = document.getElementById('urgentFilterCheckbox');
        const isUrgentFilterEnabled = urgentFilterCheckbox ? urgentFilterCheckbox.checked : false;

        let urgentCount = 0;
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        currentTasks = currentTasks.filter(task => {
            let isUrgent = false;
            if (parseInt(task.tien_do || 0) < 100 && task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '0000-00-00') {
                const d = new Date(task.ngay_hoan_thanh);
                d.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((d - todayDate) / (1000 * 60 * 60 * 24));
                if (diffDays <= 2) {
                    isUrgent = true;
                    urgentCount++;
                }
            }
            if (isUrgentFilterEnabled && !isUrgent) return false;
            return true;
        });

        const reportAlertBadge = document.getElementById('reportAlertBadge');
        const reportAlertText = document.getElementById('reportAlertText');
        if (reportAlertBadge && reportAlertText) {
            if (urgentCount > 0) {
                reportAlertBadge.style.display = 'flex';
                reportAlertText.textContent = `Đang có ${urgentCount} công việc sắp/đã trễ Deadline!`;
            } else {
                reportAlertBadge.style.display = 'none';
            }
        }

        renderTable(currentTasks);
    };

    const renderTable = (data) => {
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 60px; color: var(--text-muted);">Không có công việc nào trong tháng này.</td></tr>';
        }

        let stats = {
            tong_so: data.length,
            hoan_thanh: 0,
            dang_lam: 0,
            qua_han: 0,
            can_chi_dao: 0
        };

        data.forEach((task, index) => {
            // Tính toán lại thống kê cho tháng này (Đồng bộ logic toàn hệ thống)
            const prog = parseInt(task.tien_do || 0);
            let sId = parseInt(task.trang_thai_id || 2);
            let sText = task.trang_thai_text;

            const isDone = sId === 1 || prog >= 100;

            if (isDone) {
                sId = 1; sText = 'Hoàn thành';
                stats.hoan_thanh++;
            } else {
                // Kiểm tra quá hạn tự động
                if (task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '0000-00-00') {
                    const d = new Date(task.ngay_hoan_thanh);
                    d.setHours(0,0,0,0);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    if (d < today) {
                        sId = 3; sText = 'Quá hạn';
                    }
                }

                if (sId === 3) stats.qua_han++;
                else if (sId === 5) stats.can_chi_dao++;
                else stats.dang_lam++; 
            }

            const row = document.createElement('tr');
            row.dataset.task = JSON.stringify(task);

            let dateClass = '';
            if (!isDone && task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '0000-00-00') {
                const d = new Date(task.ngay_hoan_thanh);
                d.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
                if (diffDays <= 0) dateClass = 'text-due-urgent';
                else if (diffDays <= 2) dateClass = 'text-due-soon';
            }

            row.innerHTML = `
                <td style="text-align: center; color: var(--text-muted); font-weight: 600; width: 50px; min-width: 50px; max-width: 50px;">${index + 1}</td>
                <td style="color: var(--primary-light); font-family: 'JetBrains Mono', 'Courier New', monospace; font-weight: 700; font-size: 0.85rem; width: 100px; min-width: 100px; max-width: 100px; white-space: nowrap;">${task.ma_cv}</td>
                <td style="color: var(--text-main); font-weight: 700; line-height: 1.4; width: 200px; min-width: 200px; max-width: 200px;">${task.ten_cv || ''}</td>
                <td style="width: 350px; min-width: 350px; max-width: 350px; text-align: left; background: #fafafa; border-radius: 8px;">${formatChecklist(task.mo_ta_cv)}</td>
                <td style="text-align: center; width: 120px; min-width: 120px; max-width: 120px; white-space: nowrap;">${getLevelBadge(task.cap_do_id)}</td>
                <td style="text-align: center; width: 100px; min-width: 100px; max-width: 100px; white-space: nowrap;"><span class="badge" style="background: #f1f5f9; color: var(--text-muted); padding: 4px 8px; border-radius: 6px; font-size: 11px;">${task.loai_cv || ''}</span></td>
                <td style="font-weight: 600; text-align: center; color: var(--text-muted); width: 100px; min-width: 100px; max-width: 100px; white-space: nowrap;">${formatDate(task.ngay_bat_dau)}</td>
                <td style="text-align: center; width: 110px; min-width: 110px; max-width: 110px; white-space: nowrap;">
                    <span class="${dateClass}" style="font-weight: 700; font-size: 0.9rem;">${formatDate(task.ngay_hoan_thanh)}</span>
                </td>
                <td style="text-align: center; width: 130px; min-width: 130px; max-width: 130px; white-space: nowrap;">
                    ${getStatusBadge(sId, sText)}
                </td>
            `;
            tbody.appendChild(row);
        });

        statTotal.textContent = stats.tong_so;
        statDone.textContent = stats.hoan_thanh;
        statDoing.textContent = stats.dang_lam;
        statOverdue.textContent = stats.qua_han;
        statHelp.textContent = stats.can_chi_dao;

        lastSync.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

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

                allFetchedTasks = sortedData;
                applyFilter();
            } else {
                showToast(result.message || 'Lỗi tải dữ liệu!', 'error');
            }
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
            showToast('Lỗi kết nối máy chủ! Chi tiết: ' + error.message, 'error');
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
            else if (t.includes('quá hạn')) id = 3;
            else if (t.includes('tạm dừng')) id = 4;
            else if (t.includes('xin chỉ đạo')) id = 5;
            else id = 2;
        }
        const mapping = {
            '1': { text: 'Hoàn thành', color: '#166534', bg: '#dcfce7', border: '#bbf7d0' },
            '2': { text: 'Đang làm', color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
            '3': { text: 'Quá hạn', color: '#ef4444', bg: '#fee2e2', border: '#fecaca' },
            '4': { text: 'Tạm dừng', color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
            '5': { text: 'Xin chỉ đạo', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' }
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



    // === HÀM XUẤT EXCEL ===
    const btnExportExcel = document.getElementById('btnExportExcel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            if (currentTasks.length === 0) {
                showToast('Không có dữ liệu để xuất!', 'warning');
                return;
            }

            const dataToExport = currentTasks.map((task, index) => {
                let statusSuffix = '';
                if (parseInt(task.tien_do || 0) < 100 && task.ngay_hoan_thanh && task.ngay_hoan_thanh !== '0000-00-00') {
                    const d = new Date(task.ngay_hoan_thanh);
                    d.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) statusSuffix = ' [QUÁ HẠN]';
                    else if (diffDays <= 2) statusSuffix = ' [SẮP HẠN]';
                }

                return {
                    'STT': index + 1,
                    'Mã CV': task.ma_cv,
                    'Tên công việc': task.ten_cv + statusSuffix,
                    'Mô tả': task.mo_ta_cv ? task.mo_ta_cv.replace(/\[([x\s])\]/g, (m, p1) => p1.trim() ? '[v]' : '[ ]') : '',
                    'Cấp độ': task.cap_do_id == 1 ? 'Khẩn cấp' : task.cap_do_id == 2 ? 'Quan trọng' : task.cap_do_id == 4 ? 'Thấp' : 'Bình thường',
                    'Loại': task.loai_cv,
                    'Bắt đầu': task.ngay_bat_dau,
                    'Kết thúc': task.ngay_hoan_thanh,
                    'Tiến độ (%)': task.tien_do,
                    'Trạng thái': task.trang_thai_text
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoCongViec");

            const fileName = `Bao_cao_CV_${empName || 'NhanVien'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            showToast('Đã xuất file Excel!');
        });
    }

    // === HÀM XUẤT PDF ===
    const btnExportPDF = document.getElementById('btnExportPDF');
    if (btnExportPDF) {
        btnExportPDF.addEventListener('click', () => {
            const element = document.querySelector('.main-wrapper');
            if (!element) return;

            const options = {
                margin: 10,
                filename: `Bao_cao_CV_${empName || 'NhanVien'}_${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            showToast('Đang tạo file PDF...');
            html2pdf().set(options).from(element).save().then(() => {
                showToast('Đã xuất file PDF!');
            });
        });
    }

    loadEmployeeTasks();
});
