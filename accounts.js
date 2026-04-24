document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('accountsBody');
    const passwordModal = document.getElementById('passwordModal');
    const addAccountModal = document.getElementById('addAccountModal');
    
    // Log để kiểm tra xem script có chạy không
    console.log("Account JS Loaded. tbody:", tbody);

    const loadAccounts = async () => {
        if (!tbody) {
            console.error("Không tìm thấy phần tử 'accountsBody'!");
            return;
        }

        try {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Đang tải danh sách...</td></tr>';
            
            const response = await fetch('api_get_accounts.php');
            const result = await response.json();

            if (result.success && result.data) {
                tbody.innerHTML = '';

                if (result.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Chưa có tài khoản nào!</td></tr>';
                    return;
                }

                result.data.forEach((acc, index) => {
                    const row = document.createElement('tr');

                    const isSet = !!acc.mat_khau;
                    const passText = isSet ? '••••••' : 'Chưa thiết lập';
                    const actualPass = acc.mat_khau || '';
                    
                    // Chuẩn hóa quyền hạn
                    const roleId = (acc.quyen_han == 1 || acc.quyen_han == 'Admin' || acc.quyen_han == 'ADMIN') ? 1 : 
                                   (acc.quyen_han == 2 || acc.quyen_han == 'Quản lý' || acc.quyen_han == 'MANAGER') ? 2 : 3;
                    
                    const roleText = roleId === 1 ? 'Admin' : (roleId === 2 ? 'Quản lý' : 'Nhân viên');
                    const roleColor = roleId === 1 ? '#e11d48' : (roleId === 2 ? '#d2691e' : '#64748b');

                    row.innerHTML = `
                        <td style="text-align: center; color: #64748b;">${index + 1}</td>
                        <td class="bold">${acc.ma_nv}</td>
                        <td class="bold">${acc.ten_nv}</td>
                        <td class="bold" style="color: ${roleColor}">${roleText}</td>
                        <td>
                            <div style="display: inline-flex; align-items: center; background-color: #f8fafc; padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                <span class="pass-display" data-pass="${actualPass}" style="font-family: monospace; letter-spacing: 2px; margin-right: 8px; font-size: 0.9rem;">${passText}</span>
                                ${isSet ? `<button class="btn-toggle-pass" style="background: none; border: none; cursor: pointer; color: #64748b; padding: 2px; display: flex; align-items: center;" title="Hiện mật khẩu">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                </button>` : ''}
                            </div>
                        </td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-change-pass" data-manv="${acc.ma_nv}" data-tennv="${acc.ten_nv}" data-pass="${actualPass}" data-quyen="${roleId}" style="background: none; color: #3b82f6; border: none; padding: 4px; cursor: pointer; display: flex; align-items: center; font-weight: 600; font-size: 0.85rem;">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    Sửa
                                </button>
                                ${acc.ma_nv !== 'ADMIN' ? `
                                <button class="btn-delete-acc" data-manv="${acc.ma_nv}" style="background: none; color: #ef4444; border: none; padding: 4px; cursor: pointer; display: flex; align-items: center;">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center; padding: 2rem;">Lỗi: ${result.message}</td></tr>`;
            }
        } catch (error) {
            console.error("Lỗi fetch:", error);
            tbody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center; padding: 2rem;">Lỗi kết nối hoặc dữ liệu không hợp lệ!</td></tr>`;
        }
    };

    // Modal Control Elements
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const btnSavePassword = document.getElementById('btnSavePassword');

    const inputMaNv = document.getElementById('modal_ma_nv');
    const inputTenNv = document.getElementById('modal_ten_nv');
    const inputQuyenHan = document.getElementById('modal_quyen_han');
    const inputMatKhau = document.getElementById('modal_mat_khau');

    const closeModal = () => {
        if (passwordModal) passwordModal.style.display = 'none';
        if (inputMatKhau) inputMatKhau.value = '';
    };

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === passwordModal) closeModal();
    });

    // Delegation cho table
    if (tbody) {
        tbody.addEventListener('click', async (e) => {
            const btnUpdate = e.target.closest('.btn-change-pass');
            const btnDelete = e.target.closest('.btn-delete-acc');
            const btnToggle = e.target.closest('.btn-toggle-pass');

            if (btnUpdate) {
                if (inputMaNv) inputMaNv.value = btnUpdate.getAttribute('data-manv');
                if (inputTenNv) inputTenNv.value = btnUpdate.getAttribute('data-tennv');
                if (inputMatKhau) inputMatKhau.value = btnUpdate.getAttribute('data-pass'); 
                if (inputQuyenHan) inputQuyenHan.value = btnUpdate.getAttribute('data-quyen');
                if (passwordModal) passwordModal.style.display = 'flex';
            }

            if (btnToggle) {
                const span = btnToggle.previousElementSibling;
                const actualPass = span.getAttribute('data-pass');
                if (span.textContent === '••••••') {
                    span.textContent = actualPass || '(Trống)';
                    btnToggle.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>';
                } else {
                    span.textContent = '••••••';
                    btnToggle.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                }
            }

            if (btnDelete) {
                const ma_nv = btnDelete.getAttribute('data-manv');
                if (ma_nv === 'ADMIN') {
                    if (typeof showToast === 'function') showToast("Bạn không thể xóa tài khoản ADMIN!", 'error');
                    return;
                }
                if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${ma_nv}?`)) {
                    try {
                        const formData = new FormData();
                        formData.append('ma_nv', ma_nv);
                        const response = await fetch('api_delete_employee.php', { method: 'POST', body: formData });
                        const result = await response.json();
                        if (result.success) {
                            if (typeof showToast === 'function') showToast("Đã xóa tài khoản!");
                            loadAccounts();
                        } else {
                            if (typeof showToast === 'function') showToast('Lỗi: ' + result.message, 'error');
                        }
                    } catch (error) {
                        if (typeof showToast === 'function') showToast('Lỗi kết nối!', 'error');
                    }
                }
            }
        });
    }

    if (btnSavePassword) {
        btnSavePassword.addEventListener('click', async (e) => {
            e.preventDefault();
            const ma_nv = inputMaNv.value;
            const ten_nv = inputTenNv.value.trim();
            const mat_khau = inputMatKhau.value.trim();
            const quyen_han = inputQuyenHan.value;

            if (!ten_nv || !mat_khau) {
                if (typeof showToast === 'function') showToast("Vui lòng nhập đầy đủ!", 'error');
                return;
            }

            btnSavePassword.textContent = 'Đang lưu...';
            btnSavePassword.disabled = true;

            const formData = new FormData();
            formData.append('ma_nv', ma_nv);
            formData.append('ten_nv', ten_nv);
            formData.append('mat_khau', mat_khau);
            formData.append('quyen_han', quyen_han);

            try {
                const response = await fetch('api_update_password.php', { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    if (typeof showToast === 'function') showToast("Cập nhật thành công!");
                    closeModal();
                    loadAccounts();
                } else {
                    if (typeof showToast === 'function') showToast("Lỗi: " + result.message, 'error');
                }
            } catch (error) {
                if (typeof showToast === 'function') showToast("Lỗi kết nối!", 'error');
            } finally {
                btnSavePassword.textContent = 'Update';
                btnSavePassword.disabled = false;
            }
        });
    }

    const btnAddAccount = document.getElementById('btnAddAccount');
    const btnCloseAddModal = document.getElementById('btnCloseAddModal');
    const btnCancelAddModal = document.getElementById('btnCancelAddModal');
    const btnSaveNewAccount = document.getElementById('btnSaveNewAccount');

    const inputAddMaNv = document.getElementById('add_ma_nv');
    const inputAddTenNv = document.getElementById('add_ten_nv');
    const inputAddMatKhau = document.getElementById('add_mat_khau');
    const selectAddQuyenHan = document.getElementById('add_quyen_han');

    const closeAddModal = () => {
        if (addAccountModal) addAccountModal.style.display = 'none';
        if (inputAddMaNv) inputAddMaNv.value = '';
        if (inputAddTenNv) inputAddTenNv.value = '';
        if (inputAddMatKhau) inputAddMatKhau.value = '';
        if (selectAddQuyenHan) selectAddQuyenHan.selectedIndex = 0;
    };

    if (btnAddAccount) {
        btnAddAccount.addEventListener('click', () => {
            if (addAccountModal) {
                addAccountModal.style.display = 'flex';
                if (inputAddMaNv) inputAddMaNv.focus();
            }
        });
    }

    if (btnCloseAddModal) btnCloseAddModal.addEventListener('click', closeAddModal);
    if (btnCancelAddModal) btnCancelAddModal.addEventListener('click', closeAddModal);

    window.addEventListener('click', (e) => {
        if (e.target === addAccountModal) closeAddModal();
    });

    if (btnSaveNewAccount) {
        btnSaveNewAccount.addEventListener('click', async (e) => {
            e.preventDefault();
            const ma_nv = inputAddMaNv.value.trim();
            const ten_nv = inputAddTenNv.value.trim();
            const mat_khau = inputAddMatKhau.value.trim();
            const quyen_han = selectAddQuyenHan ? selectAddQuyenHan.value : 3;

            if (!ma_nv || !ten_nv || !mat_khau) {
                if (typeof showToast === 'function') showToast("Vui lòng nhập đầy đủ!", 'error');
                return;
            }

            btnSaveNewAccount.textContent = 'Đang xử lý...';
            btnSaveNewAccount.disabled = true;

            const formData = new FormData();
            formData.append('ma_nv', ma_nv);
            formData.append('ten_nv', ten_nv);
            formData.append('mat_khau', mat_khau);
            formData.append('quyen_han', quyen_han);

            try {
                const response = await fetch('api_add_account.php', { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    if (typeof showToast === 'function') showToast("Đã thêm tài khoản!");
                    closeAddModal();
                    loadAccounts();
                } else {
                    if (typeof showToast === 'function') showToast("Lỗi: " + result.message, 'error');
                }
            } catch (error) {
                if (typeof showToast === 'function') showToast("Lỗi kết nối!", 'error');
            } finally {
                btnSaveNewAccount.textContent = 'Tạo tài khoản';
                btnSaveNewAccount.disabled = false;
            }
        });
    }

    // Khởi chạy
    loadAccounts();
});
