// showToast premium - tự động tiêm CSS để đồng bộ mọi trang

// === HÀM ĐỊNH DẠNG CHECKLIST TỪ VĂN BẢN [x] [ ] ===
function formatChecklist(text) {
    if (!text) return '-';
    
    // Tìm các mẫu [x] hoặc [ ]
    const pattern = /\[([x\s])\]\s*([^\[]+)/g;
    let matches = [...text.matchAll(pattern)];
    
    if (matches.length === 0) return text; // Nếu không có checklist thì trả về text gốc

    let html = '<div class="checklist-container" style="display: flex; flex-direction: column; gap: 8px; padding: 10px 0;">';
    
    matches.forEach(match => {
        const isDone = match[1].toLowerCase() === 'x';
        const content = match[2].trim();
        
        html += `
            <div class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.85rem;">
                <span class="checklist-icon" style="
                    min-width: 18px; 
                    height: 18px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    border-radius: 4px;
                    border: 1.5px solid ${isDone ? '#10b981' : '#cbd5e1'};
                    background: ${isDone ? '#d1fae5' : 'white'};
                    color: ${isDone ? '#10b981' : 'transparent'};
                    font-size: 10px;
                    font-weight: 900;
                ">
                    ${isDone ? '✓' : ''}
                </span>
                <span class="checklist-text" style="
                    color: ${isDone ? '#94a3b8' : 'var(--text-main)'};
                    text-decoration: ${isDone ? 'line-through' : 'none'};
                    line-height: 1.4;
                ">
                    ${content}
                </span>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

const showToast = (message, type = 'success') => {
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
