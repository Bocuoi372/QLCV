// showToast premium - tự động tiêm CSS để đồng bộ mọi trang

// === HÀM ĐỊNH DẠNG CHECKLIST TỪ VĂN BẢN [x] [ ] ===
function formatChecklist(text) {
    if (!text) return '-';
    
    // Tìm các mẫu [x] hoặc [ ]
    const pattern = /\[([x\s])\]\s*([^\[]+)/g;
    let matches = [...text.matchAll(pattern)];
    
    if (matches.length === 0) {
        // Vẫn phải xóa tags file nếu có, đặc biệt là trang báo cáo
        return text.replace(/\|file:.*?\|/g, '').trim() || '-';
    } 
    let html = '<div class="checklist-container" style="display: flex; flex-direction: column; gap: 4px; padding: 5px 0;">';
    
    matches.forEach(match => {
        const isDone = match[1].toLowerCase() === 'x';
        const rawContent = match[2].trim();
        
        // 1. Tìm tất cả các file tags |file:path|
        const fileTags = [...rawContent.matchAll(/\|file:(.*?)\|/g)];
        
        // 2. Làm sạch text (xóa hết tags)
        let cleanText = rawContent.replace(/\|file:.*?\|/g, '').trim();
        
        // 3. Tạo duy nhất 1 HTML cho file icon (nếu có bất kỳ file nào và không phải trang báo cáo)
        let fileHtml = '';
        const isReportPage = window.location.href.includes('report.html');
        
        if (fileTags.length > 0 && !isReportPage) {
            const lastFilePath = fileTags[fileTags.length - 1][1]; // Lấy file cuối cùng
            fileHtml = `
                <a href="${lastFilePath}" target="_blank" download="${lastFilePath.split('/').pop()}" style="color: #10b981; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; background: #d1fae5; transition: all 0.2s;" title="Tải về / Xem file đính kèm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </a>
            `;
        }

        html += `
            <div class="checklist-item" style="display: flex; align-items: center; justify-content: flex-start; gap: 10px; padding: 4px 0; min-height: 32px;">
                <span style="
                    min-width: 18px; height: 18px; 
                    display: flex; align-items: center; justify-content: center; 
                    border-radius: 4px; border: 1.5px solid ${isDone ? '#10b981' : '#cbd5e1'};
                    background: ${isDone ? '#d1fae5' : 'white'};
                    color: ${isDone ? '#10b981' : 'transparent'};
                    font-size: 10px; font-weight: 900; flex-shrink: 0;
                ">
                    ${isDone ? '✓' : ''}
                </span>
                <span style="
                    color: ${isDone ? '#94a3b8' : 'var(--text-main)'};
                    text-decoration: ${isDone ? 'line-through' : 'none'};
                    line-height: 1.2; font-size: 0.85rem; font-weight: 500;
                ">
                    ${cleanText}
                </span>
                <div style="margin-left: 5px; height: 26px; display: flex; align-items: center;">
                    ${fileHtml}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

if (typeof window.showToast === 'undefined') {
    window.showToast = (message, type = 'success') => {
        // Tiêm CSS nếu chưa có
        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.innerHTML = `
                #toast-container {
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    pointer-events: none;
                }
                .toast-item {
                    min-width: 300px;
                    background: rgba(30, 41, 59, 0.95);
                    backdrop-filter: blur(8px);
                    color: white;
                    padding: 16px 20px;
                    border-radius: 16px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-left: 4px solid #3b82f6;
                    transform: translateX(120%);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    pointer-events: auto;
                }
                .toast-item.show {
                    transform: translateX(0);
                }
                .toast-item.success { border-left-color: #10b981; }
                .toast-item.error { border-left-color: #ef4444; }
                .toast-item.warning { border-left-color: #f59e0b; }
                
                .toast-icon {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 14px;
                    flex-shrink: 0;
                }
                .toast-item.success .toast-icon { background: rgba(16, 185, 129, 0.2); color: #10b981; }
                .toast-item.error .toast-icon { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
            `;
            document.head.appendChild(style);
        }

        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-item ${type}`;
        
        const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : '!');
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div style="font-weight: 500; font-size: 0.95rem;">${message}</div>
        `;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };
}
const showToast = window.showToast;

const getProgressColor = (percent) => {
    if (percent < 30) return '#ef4444'; 
    if (percent < 70) return '#f59e0b'; 
    return '#10b981'; 
};

const updateSliderBackground = (slider) => {
    if (!slider) return;
    const val = slider.value;
    const min = slider.min ? slider.min : 0;
    const max = slider.max ? slider.max : 100;
    const percentage = (val - min) * 100 / (max - min);
    const color = getProgressColor(val);
    slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
};

const formatDate = (dtStr) => {
    if (!dtStr || dtStr === '0000-00-00' || dtStr === 'null') return '';
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return dtStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/**
 * Logic dùng chung để reset công việc định kỳ khi sang tháng mới
 * @param {Object} task - Đối tượng công việc
 * @param {String} targetMonthStr - Tháng đang xem (YYYY-MM)
 * @returns {Object} - Đối tượng đã được xử lý (deep copy)
 */
const processTaskReset = (task, targetMonthStr) => {
    let taskCopy = JSON.parse(JSON.stringify(task));
    const loai = (taskCopy.loai_cv || 'Định kỳ').trim().toLowerCase();
    
    if (loai === 'định kỳ') {
        let taskMonth = null;
        if (taskCopy.ngay_hoan_thanh && taskCopy.ngay_hoan_thanh !== '0000-00-00') taskMonth = taskCopy.ngay_hoan_thanh.substring(0, 7);
        else if (taskCopy.ngay_bat_dau && taskCopy.ngay_bat_dau !== '0000-00-00') taskMonth = taskCopy.ngay_bat_dau.substring(0, 7);
        
        // Nếu tháng gốc cũ hơn tháng đang xem -> Reset dữ liệu tạm thời để nhân viên làm lại
        if (taskMonth && taskMonth !== targetMonthStr && taskMonth < targetMonthStr) {
            taskCopy.ngay_bat_dau = '';
            taskCopy.ngay_hoan_thanh = '';
            taskCopy.tien_do = 0;
            if (taskCopy.mo_ta_cv) {
                // Xóa file đính kèm cũ và bỏ check checklist
                taskCopy.mo_ta_cv = taskCopy.mo_ta_cv.replace(/\|file:.*?\|/g, '');
                taskCopy.mo_ta_cv = taskCopy.mo_ta_cv.replace(/\[[xX]\]/g, '[ ]');
            }
        }
    }
    return taskCopy;
};

// === PHÂN QUYỀN NGAY LẬP TỨC (Immediate Enforcement) ===
(function() {
    const qh = localStorage.getItem('quyen_han');
    const isBGD = (qh == 4 || qh === 'Ban Giám Đốc' || qh === 'BGD');
    
    if (isBGD) {
        // 1. Chuyển hướng ngay lập tức nếu không phải trang báo cáo hoặc login
        const path = window.location.pathname;
        const currentPage = path.split('/').pop() || 'index.html';
        if (currentPage !== 'report.html' && currentPage !== 'login.html') {
            window.location.replace('report.html');
            return;
        }

        // 2. Tiêm CSS ẩn TẤT CẢ menu ngay lập tức để an toàn tuyệt đối
        const style = document.createElement('style');
        style.id = 'bgd-security-style';
        style.innerHTML = `
            .sidebar-menu li:not(.bgd-allowed) { display: none !important; }
        `;
        document.head.appendChild(style);

        // 3. Đợi DOM sẵn sàng mới đánh dấu các menu được phép
        document.addEventListener('DOMContentLoaded', () => {
            const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
            sidebarLinks.forEach(link => {
                const href = link.getAttribute('href') || '';
                const text = link.textContent.trim().toLowerCase();
                if (href.includes('report.html') || text.includes('báo cáo') || 
                    href.includes('login.html') || text.includes('đăng xuất') || 
                    (link.querySelector('span') && link.querySelector('span').textContent.toLowerCase().includes('đăng xuất'))) {
                    if (link.parentElement) {
                        link.parentElement.classList.add('bgd-allowed');
                        link.parentElement.style.setProperty('display', 'block', 'important');
                    }
                }
            });
        });
    }
})();

const applyPermissions = () => {
    const quyenHan = localStorage.getItem('quyen_han');
    const maNV = localStorage.getItem('ma_nv');
    
    // Check if user is Board of Directors
    const isBGD = (quyenHan == 4 || quyenHan === 'Ban Giám Đốc' || quyenHan === 'BGD');

    // Nếu chưa đăng nhập, đá về login
    if (!maNV && !window.location.href.includes('login.html')) {
        console.warn("Unauthorized access: No ma_nv in localStorage");
        window.location.replace('login.html');
        return;
    }

    // Nếu là Staff (quyen_han == 3)
    if (quyenHan == 3) {
        const sidebarLinks = document.querySelectorAll('.sidebar-menu li');
        sidebarLinks.forEach(li => {
            const link = li.querySelector('a');
            if (!link) return;
            const href = link.getAttribute('href') || '';
            const text = link.textContent.trim().toLowerCase();
            
            // Chỉ giữ lại "Công việc cá nhân" và "Đăng xuất"
            const isAllowed = href.includes('staff.html') || text.includes('công việc cá nhân') || 
                              href.includes('login.html') || text.includes('đăng xuất');
            
            if (!isAllowed) {
                li.style.setProperty('display', 'none', 'important');
            }
        });
    }

    // Nếu là Admin (quyen_han == 1)
    if (quyenHan == 1) {
        // 1. Tìm và ẩn link "Công việc cá nhân" trong sidebar
        const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
        sidebarLinks.forEach(link => {
            if (link.getAttribute('href') === 'staff.html') {
                if (link.parentElement) link.parentElement.style.display = 'none';
            }
        });

        // 2. Nếu đang ở trang staff.html, đá về index.html
        if (window.location.href.includes('staff.html')) {
            window.location.replace('index.html');
            return;
        }
    }

    // Nếu là Manager (quyen_han == 2)
    if (quyenHan == 2) {
        // 1. Tìm và ẩn link "Tài khoản nhân viên" trong sidebar
        const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
        sidebarLinks.forEach(link => {
            if (link.getAttribute('href') === 'accounts.html') {
                if (link.parentElement) link.parentElement.style.display = 'none';
            }
        });

        // 2. Nếu đang ở trang accounts.html, đá về index.html
        if (window.location.href.includes('accounts.html')) {
            window.location.replace('index.html');
        }
    }

    // Hiển thị nút "Trang quản trị" trên staff.html nếu là Admin hoặc Manager hoặc Ban Giám Đốc
    if (quyenHan == 1 || quyenHan == 2 || isBGD) {
        const adminLink = document.getElementById('navAdminLink');
        if (adminLink) adminLink.style.display = 'block';
    }
};

// === HỆ THỐNG THÔNG BÁO THÔNG MINH ===
const initNotifications = async () => {
    const maNV = localStorage.getItem('ma_nv');
    if (!maNV) return;

    // Yêu cầu quyền thông báo trình duyệt
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            await Notification.requestPermission();
        }
    }

    // Kiểm tra deadline công việc
    try {
        const response = await fetch('api_get_my_tasks.php');
        const result = await response.json();

        if (result.success && result.data) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const dueTasks = result.data.filter(task => {
                if (parseInt(task.tien_do || 0) >= 100) return false;
                if (!task.ngay_hoan_thanh) return false;
                
                const dueDate = new Date(task.ngay_hoan_thanh);
                dueDate.setHours(0, 0, 0, 0);
                
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // Trả về true nếu hạn là hôm nay, ngày mai hoặc ngày mốt (0, 1, 2 ngày)
                return diffDays >= 0 && diffDays <= 2;
            });

            if (dueTasks.length > 0) {
                const todayTasksCount = dueTasks.filter(t => {
                    const dueDate = new Date(t.ngay_hoan_thanh);
                    dueDate.setHours(0, 0, 0, 0);
                    return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) === 0;
                }).length;

                if (todayTasksCount > 0) {
                    showToast(`Bạn có ${todayTasksCount} công việc cần hoàn thành trong hôm nay!`, 'warning');
                } else {
                    showToast(`Bạn có ${dueTasks.length} công việc sắp đến hạn!`, 'warning');
                }
                
                // Nếu được phép, gửi thông báo hệ thống
                if ("Notification" in window && Notification.permission === "granted") {
                    const taskNames = dueTasks.map(t => t.ten_cv).slice(0, 3).join(', ');
                    new Notification("Nhắc nhở công việc", {
                        body: `Cảnh báo: ${dueTasks.length} việc sắp hết hạn: ${taskNames}...`,
                        icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827347.png'
                    });
                }
            }

            // Kiểm tra phản hồi mới (Dựa trên trường ghi_chu thay đổi)
            const lastNotes = JSON.parse(localStorage.getItem('last_task_notes') || '{}');
            let newFeedbackCount = 0;
            
            result.data.forEach(task => {
                if (task.ghi_chu && lastNotes[task.ma_cv] !== task.ghi_chu) {
                    newFeedbackCount++;
                }
                lastNotes[task.ma_cv] = task.ghi_chu;
            });

            if (newFeedbackCount > 0) {
                showToast(`Bạn có ${newFeedbackCount} phản hồi mới từ quản lý!`, 'info');
                localStorage.setItem('last_task_notes', JSON.stringify(lastNotes));
            }
        }
    } catch (error) {
        console.warn('Không thể kiểm tra thông báo:', error);
    }
};

// === HỖ TRỢ NHẬP CHECKLIST TRONG TEXTAREA ===
const initChecklistTextarea = () => {
    document.addEventListener('keydown', function(e) {
        if (e.target && e.target.id === 'modal_mo_ta') {
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;

            // Xử lý khi nhấn Enter
            if (e.key === 'Enter') {
                e.preventDefault();
                
                // Chèn xuống dòng và "[ ] "
                const textToInsert = '\n[ ] ';
                textarea.value = value.substring(0, start) + textToInsert + value.substring(end);
                
                // Di chuyển con trỏ ra sau "[ ] "
                textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
                return;
            }

            // Hàm kiểm tra xem vị trí index có nằm trong chuỗi "[ ] " hoặc "[x] " không
            const isInsideMarker = (index) => {
                for (let i = Math.max(0, index - 3); i <= index; i++) {
                    const sub = value.substring(i, i + 4);
                    if (sub === '[ ] ' || sub === '[x] ') {
                        return true;
                    }
                }
                return false;
            };

            // Xử lý khi nhấn Backspace (xóa lùi)
            if (e.key === 'Backspace' && start === end && start > 0) {
                if (isInsideMarker(start - 1)) {
                    e.preventDefault(); // Khóa lại, không cho xóa
                }
            }

            // Xử lý khi nhấn Delete (xóa tới)
            if (e.key === 'Delete' && start === end && start < value.length) {
                if (isInsideMarker(start)) {
                    e.preventDefault(); // Khóa lại, không cho xóa
                }
            }
        }
    });
};

// Tự động chạy khi load script
document.addEventListener('DOMContentLoaded', () => {
    applyPermissions();
    initNotifications();
    initChecklistTextarea();
});
