document.addEventListener('DOMContentLoaded', () => {
    // Sync version: 7 - Fixed Column Order

    const tbody = document.getElementById('myTasksBody');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userAvatar = document.getElementById('userAvatar');
    const taskSearch = document.getElementById('taskSearch');
    const lastUpdate = document.getElementById('lastUpdate');
    
    // Thống kê elements
    const statTotal = document.getElementById('statTotal');
    const statDone = document.getElementById('statDone');
    const statDoing = document.getElementById('statDoing');
    const statHigh = document.getElementById('statHigh');

    let allMyTasks = []; 

    const loadMyTasks = async () => {
        try {
            const response = await fetch('api_get_my_tasks.php');
            const result = await response.json();

            if (result.success) {
                allMyTasks = result.data || [];
                
                if (result.userInfo) {
                    const name = result.userInfo.ten_nv;
                    userNameDisplay.textContent = name;
                    userAvatar.textContent = name.charAt(0).toUpperCase();
                }

                updateStats();
                
                // Sắp xếp: Khẩn cấp/Cao (chưa xong) lên đầu, Hoàn thành xuống cuối
                const sortedTasks = allMyTasks.sort((a, b) => {
                    const aDone = parseInt(a.tien_do || 0) >= 100;
                    const bDone = parseInt(b.tien_do || 0) >= 100;
                    if (aDone !== bDone) return aDone ? 1 : -1;
                    if (!aDone) {
                        if (a.cap_do_id !== b.cap_do_id) return a.cap_do_id - b.cap_do_id;
                    }
                    return 0;
                });

                renderTable(sortedTasks);
                lastUpdate.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            } else {
                tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger); text-align: center; padding: 3rem;">Lỗi: ${result.message}</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger); text-align: center; padding: 3rem;">Lỗi kết nối máy chủ!</td></tr>`;
        }
    };

    const updateStats = () => {
        statTotal.textContent = allMyTasks.length;
        statDone.textContent = allMyTasks.filter(t => parseInt(t.tien_do) === 100).length;
        statDoing.textContent = allMyTasks.filter(t => parseInt(t.tien_do) > 0 && parseInt(t.tien_do) < 100).length;
        
        // Đếm thông minh: Kiểm tra cả ID (1, 2) và từ khóa trong văn bản
        statHigh.textContent = allMyTasks.filter(t => {
            const id = t.cap_do_id || t.cap_do;
            const text = (t.cap_do_text || '').toLowerCase();
            return (id == 1 || id == 2 || text.includes('khẩn cấp') || text.includes('quan trọng') || text.includes('cao'));
        }).length;
    };

    const renderTable = (tasks) => {
        if (!tbody) return;
        tbody.innerHTML = '';

        if (tasks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 6rem;">
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
            
            const progress = parseInt(task.tien_do || 0);
            const progressColor = getProgressColor(progress);

            const descLines = (task.mo_ta_cv || '').split('\n');
            const pureDescLines = descLines.filter(l => !l.trim().match(/^\[(x| )\]/));
            const pureDesc = pureDescLines.join('\n').trim();
            const checklistHtml = generateInteractiveChecklist(task.mo_ta_cv, task.ma_cv);

            row.innerHTML = `
                <td style="text-align: center; color: #94a3b8; font-weight: 700;">${index + 1}</td>
                <td class="bold" style="color: var(--primary-light); font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;">${task.ma_cv}</td>
                <td>
                    <div class="bold" style="color: var(--text-main); font-size: 1.05rem; margin-bottom: 6px; letter-spacing: -0.3px;">${task.ten_cv || 'Không có tiêu đề'}</div>
                    ${pureDesc ? `<div class="task-desc" style="font-size: 0.85rem; color: var(--text-muted); max-width: 320px; line-height: 1.5; white-space: pre-wrap;">${pureDesc}</div>` : ''}
                </td>
                <td style="background: rgba(248, 250, 252, 0.3);">
                    <div class="checklist-col" style="display: flex; flex-direction: column; gap: 10px;">
                        ${checklistHtml}
                    </div>
                </td>
                <td>
                    ${(() => {
                        const start = formatDate(task.ngay_bat_dau);
                        const end = formatDate(task.ngay_hoan_thanh);
                        if (start && end) {
                            return `<div style="font-size: 0.95rem; font-weight: 800; color: var(--text-main);">${start}</div><div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">đến ${end}</div>`;
                        } else if (start || end) {
                            return `<div style="font-size: 0.95rem; font-weight: 800; color: var(--text-main);">${start || end}</div>`;
                        } else {
                            return `<div style="font-size: 0.85rem; color: #cbd5e1; font-weight: 500;">Chưa xác định</div>`;
                        }
                    })()}
                </td>
                <td style="text-align: center;">
                    ${getLevelBadge(task.cap_do_id || task.cap_do, task.cap_do_text)}
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 12px; min-width: 190px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <span class="progress-text" style="font-size: 1.1rem; font-weight: 900; color: ${progressColor}">${progress}%</span>
                            <span class="status-label" style="font-size: 0.75rem; font-weight: 800; color: ${progress === 100 ? '#10b981' : '#64748b'};">${progress === 100 ? 'HOÀN THÀNH' : 'ĐANG LÀM'}</span>
                        </div>
                        <div style="position: relative; height: 10px;">
                            <input type="range" min="0" max="100" value="${progress}" 
                                class="progress-slider" data-macv="${task.ma_cv}"
                                style="width: 100%; cursor: pointer;">
                        </div>
                    </div>
                </td>
                <td style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">${task.ghi_chu || '-'}</td>
            `;
            tbody.appendChild(row);
        });

        attachEvents();
    };

    const generateInteractiveChecklist = (desc, ma_cv) => {
        if (!desc) return '<span style="color: #cbd5e1; font-size: 0.8rem; font-style: italic;">Trống</span>';
        
        const lines = desc.split('\n');
        let html = '';
        let hasChecklist = false;

        lines.forEach((line, idx) => {
            const match = line.trim().match(/^\[(x| )\] (.*)/);
            if (match) {
                hasChecklist = true;
                const isChecked = match[1] === 'x';
                const text = match[2];
                html += `
                    <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer; margin: 0; padding: 6px 12px; border-radius: 12px; transition: all 0.2s;" class="checklist-item-row">
                        <input type="checkbox" class="checklist-item" data-macv="${ma_cv}" data-line="${idx}" ${isChecked ? 'checked' : ''} 
                            style="width: 18px; height: 18px; cursor: pointer; margin-top: 2px; accent-color: var(--primary-light);">
                        <span style="font-size: 0.9rem; font-weight: 600; color: ${isChecked ? '#94a3b8' : '#334155'}; text-decoration: ${isChecked ? 'line-through' : 'none'}; line-height: 1.4;">${text}</span>
                    </label>
                `;
            }
        });

        return hasChecklist ? html : '<span style="color: #cbd5e1; font-size: 0.85rem; font-style: italic;">Không có checklist</span>';
    };

    const attachEvents = () => {
        // Search Filter
        taskSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allMyTasks.filter(t => 
                t.ten_cv.toLowerCase().includes(term) || 
                t.ma_cv.toLowerCase().includes(term)
            );
            renderTable(filtered);
        });

        // Checklist Change
        document.querySelectorAll('.checklist-item').forEach(cb => {
            cb.addEventListener('change', async (e) => {
                const ma_cv = e.target.getAttribute('data-macv');
                const lineIdx = parseInt(e.target.getAttribute('data-line'));
                const isChecked = e.target.checked;

                const task = allMyTasks.find(t => t.ma_cv === ma_cv);
                if (!task) return;

                const lines = task.mo_ta_cv.split('\n');
                const originalLine = lines[lineIdx];
                const prefixMatch = originalLine.match(/^(\s*\[(x| )\]\s*)/);
                if (prefixMatch) {
                    const prefix = prefixMatch[1];
                    const content = originalLine.substring(prefix.length);
                    lines[lineIdx] = `[${isChecked ? 'x' : ' '}] ${content}`;
                }
                
                const newDesc = lines.join('\n');
                task.mo_ta_cv = newDesc;

                const checklistLines = lines.filter(l => l.trim().match(/^\[(x| )\]/));
                const checkedCount = checklistLines.filter(l => l.trim().startsWith('[x]')).length;
                const totalCount = checklistLines.length;
                const newProgress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : task.tien_do;
                
                task.tien_do = newProgress;

                // Cập nhật stats
                updateStats();

                const row = e.target.closest('tr');
                const slider = row.querySelector('.progress-slider');
                const progressText = row.querySelector('.progress-text');
                const statusLabel = row.querySelector('.status-label');

                slider.value = newProgress;
                progressText.textContent = `${newProgress}%`;
                progressText.style.color = getProgressColor(newProgress);
                statusLabel.textContent = newProgress === 100 ? 'HOÀN THÀNH' : 'ĐANG LÀM';
                statusLabel.style.color = newProgress === 100 ? '#10b981' : '#64748b';
                
                updateSliderBackground(slider);
                
                const labelSpan = e.target.nextElementSibling;
                labelSpan.style.color = isChecked ? '#94a3b8' : '#334155';
                labelSpan.style.textDecoration = isChecked ? 'line-through' : 'none';

                try {
                    const formData = new FormData();
                    formData.append('ma_cv', ma_cv);
                    formData.append('tien_do', newProgress);
                    formData.append('mo_ta_cv', newDesc);

                    const response = await fetch('api_update_progress.php', { method: 'POST', body: formData });
                    const result = await response.json();
                    if (result.success) {
                        showToast(`Tiến độ: ${newProgress}% (${checkedCount}/${totalCount})`, 'success');
                    }
                } catch (error) {
                    showToast('Lỗi lưu dữ liệu!', 'error');
                }
            });
        });

        // Slider Interaction
        document.querySelectorAll('.progress-slider').forEach(slider => {
            updateSliderBackground(slider);
            
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                const row = e.target.closest('tr');
                const percentSpan = row.querySelector('.progress-text');
                const statusLabel = row.querySelector('.status-label');

                percentSpan.textContent = `${val}%`;
                percentSpan.style.color = getProgressColor(val);
                statusLabel.textContent = val === 100 ? 'HOÀN THÀNH' : 'ĐANG LÀM';
                statusLabel.style.color = val === 100 ? '#10b981' : '#64748b';
                
                updateSliderBackground(e.target);
            });

            slider.addEventListener('change', async (e) => {
                const ma_cv = e.target.getAttribute('data-macv');
                const tien_do = e.target.value;

                try {
                    const formData = new FormData();
                    formData.append('ma_cv', ma_cv);
                    formData.append('tien_do', tien_do);

                    const response = await fetch('api_update_progress.php', { method: 'POST', body: formData });
                    const result = await response.json();
                    if (result.success) {
                        showToast(`Cập nhật tiến độ: ${tien_do}%`, 'success');
                        const task = allMyTasks.find(t => t.ma_cv === ma_cv);
                        if (task) {
                            task.tien_do = tien_do;
                            updateStats();
                        }
                    }
                } catch (error) {
                    showToast('Lỗi kết nối!', 'error');
                }
            });
        });
    };

    const updateSliderBackground = (slider) => {
        if (!slider) return;
        const val = slider.value;
        const color = getProgressColor(val);
        slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${val}%, #e2e8f0 ${val}%, #e2e8f0 100%)`;
    }

    function getLevelBadge(id, text) {
        // Fallback: Nếu không có ID nhưng có text, thử suy luận ID từ text
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

    loadMyTasks();
});
