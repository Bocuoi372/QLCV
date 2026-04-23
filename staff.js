document.addEventListener('DOMContentLoaded', () => {

    const tbody = document.getElementById('myTasksBody');
    const staffWelcome = document.getElementById('staffWelcome');

    const loadMyTasks = async () => {
        try {
            const response = await fetch('api_get_my_tasks.php');
            const result = await response.json();

            if (result.success) {
                // Hiển thị tên đăng nhập
                if (result.userInfo && staffWelcome) {
                    staffWelcome.textContent = `Xin chào, ${result.userInfo.ten_nv} (${result.userInfo.ma_nv})`;
                }

                tbody.innerHTML = '';

                if (!result.data || result.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Tuyệt vời! Bạn chưa có công việc nào cần làm.</td></tr>';
                    return;
                }

                result.data.forEach(task => {
                    const row = document.createElement('tr');

                    // Format lại ngày tháng
                    const formatDt = (dtStr) => {
                        if (!dtStr || dtStr === '0000-00-00' || dtStr === 'null') return '';
                        const d = new Date(dtStr);
                        if (isNaN(d.getTime())) return dtStr;
                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    };

                    row.innerHTML = `
                        <td class="bold" style="color: var(--primary-color);">${task.ma_cv}</td>
                        <td class="bold">${task.ten_cv || ''}</td>
                        <td style="max-width: 300px; text-align: left;">${task.mo_ta_cv || ''}</td>
                        <td class="bold">${task.cap_do_text || ''}</td>
                        <td class="bold">${task.loai_cv || ''}</td>
                        <td>${formatDt(task.ngay_bat_dau)}</td>
                        <td>${formatDt(task.ngay_hoan_thanh)}</td>
                        <td>${task.ghi_chu || ''}</td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                console.warn(result.message);
                tbody.innerHTML = `<tr><td colspan="8" style="color: red; text-align: center; padding: 2rem;">Lỗi: ${result.message} <br><a href="login.html">Bấm vào đây để Đăng nhập lại</a></td></tr>`;
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu công việc:', error);
            tbody.innerHTML = `<tr><td colspan="8" style="color: red; text-align: center; padding: 2rem;">Lỗi kết nối máy chủ!</td></tr>`;
        }
    };

    // Tự động Load dữ liệu khi vào trang
    loadMyTasks();

});
