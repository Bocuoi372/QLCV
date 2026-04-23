document.addEventListener('DOMContentLoaded', () => {

    const tbody = document.getElementById('accountsBody');

    const loadAccounts = async () => {
        try {
            const response = await fetch('api_get_accounts.php');
            const result = await response.json();

            if (result.success && result.data) {
                tbody.innerHTML = '';

                if (result.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Chưa có tài khoản nào!</td></tr>';
                    return;
                }

                result.data.forEach(acc => {
                    const row = document.createElement('tr');

                    const isSet = !!acc.mat_khau;
                    const passText = isSet ? '••••••' : 'Chưa thiết lập';
                    const actualPass = acc.mat_khau || '';

                    row.innerHTML = `
                        <td class="bold">${acc.ma_nv}</td>
                        <td class="bold">${acc.ten_nv}</td>
                        <td>
                            <div style="display: inline-flex; align-items: center; background-color: #ffffffff; padding: 4px 8px; border-radius: 4px;">
                                <span class="pass-display" data-pass="${actualPass}" style="font-family: monospace; letter-spacing: 2px; margin-right: 8px;">${passText}</span>
                                ${isSet ? `<button class="btn-toggle-pass" style="background: none; border: none; cursor: pointer; color: #555;" title="Hiện mật khẩu">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                </button>` : ''}
                            </div>
                        </td>
                        <td>
                            <button class="btn-change-pass" data-manv="${acc.ma_nv}" data-tennv="${acc.ten_nv}" data-pass="${actualPass}" style="background-color: #fcfcfcff ; color: green; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                Update
                            </button>
                            <button class="btn-delete-acc" data-manv="${acc.ma_nv}" style="background-color: #ffffffff; color: red; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; margin-left: 4px;">
                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="vertical-align: middle;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="color: red;">Lỗi: ${result.message}</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="4" style="color: red;">Lỗi kết nối máy chủ!</td></tr>`;
        }
    };

    // Load dữ liệu
    loadAccounts();


    // ==========================================
    // LOGIC MODAL
    // ==========================================
    const passwordModal = document.getElementById('passwordModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const btnSavePassword = document.getElementById('btnSavePassword');

    const inputMaNv = document.getElementById('modal_ma_nv');
    const inputTenNv = document.getElementById('modal_ten_nv');
    const inputMatKhau = document.getElementById('modal_mat_khau');

    const closeModal = () => {
        passwordModal.style.display = 'none';
        inputMatKhau.value = '';
    };

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === passwordModal) closeModal();
    });

    // Delegate Click (Update, Delete, Toggle Pass)
    if (tbody) {
        tbody.addEventListener('click', async (e) => {
            const btnUpdate = e.target.closest('.btn-change-pass');
            const btnDelete = e.target.closest('.btn-delete-acc');
            const btnToggle = e.target.closest('.btn-toggle-pass');

            if (btnUpdate) {
                inputMaNv.value = btnUpdate.getAttribute('data-manv');
                inputTenNv.value = btnUpdate.getAttribute('data-tennv');
                inputMatKhau.value = btnUpdate.getAttribute('data-pass'); // Hiển thị mật khẩu cũ khi Edit
                passwordModal.style.display = 'flex';
                inputMatKhau.focus();
            }

            if (btnToggle) {
                const span = btnToggle.previousElementSibling;
                if (span.textContent === '••••••') {
                    span.textContent = span.getAttribute('data-pass');
                    btnToggle.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>';
                } else {
                    span.textContent = '••••••';
                    btnToggle.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                }
            }

            if (btnDelete) {
                const ma_nv = btnDelete.getAttribute('data-manv');
                if (ma_nv === 'ADMIN') {
                    alert("Bạn không thể xóa tài khoản Quản trị viên (ADMIN)!");
                    return;
                }
                if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ tài khoản và dữ liệu liên quan của ${ma_nv} không? Hành động này không thể hoàn tác!`)) {
                    try {
                        const formData = new FormData();
                        formData.append('ma_nv', ma_nv);
                        const response = await fetch('api_delete_employee.php', { method: 'POST', body: formData });
                        const result = await response.json();
                        if (result.success) {
                            loadAccounts();
                        } else {
                            alert('Lỗi: ' + result.message);
                        }
                    } catch (error) {
                        alert('Lỗi kết nối khi xóa!');
                    }
                }
            }
        });
    }

    // Submit lưu mật khẩu
    if (btnSavePassword) {
        btnSavePassword.addEventListener('click', async (e) => {
            e.preventDefault();
            const ma_nv = inputMaNv.value;
            const ten_nv = inputTenNv.value.trim();
            const mat_khau = inputMatKhau.value.trim();

            if (!ten_nv || !mat_khau) {
                alert("Vui lòng nhập Tên nhân viên và Mật khẩu!");
                return;
            }

            btnSavePassword.textContent = 'Đang lưu...';
            btnSavePassword.disabled = true;

            const formData = new FormData();
            formData.append('ma_nv', ma_nv);
            formData.append('ten_nv', ten_nv);
            formData.append('mat_khau', mat_khau);

            try {
                const response = await fetch('api_update_password.php', { method: 'POST', body: formData });
                const result = await response.json();

                if (result.success) {
                    closeModal();
                    loadAccounts(); // Refresh table
                } else {
                    alert("Lỗi: " + result.message);
                }
            } catch (error) {
                alert("Đã xảy ra lỗi kết nối!");
            } finally {
                btnSavePassword.textContent = 'Lưu thay đổi';
                btnSavePassword.disabled = false;
            }
        });
    }

    // ==========================================
    // LOGIC THÊM TÀI KHOẢN MỚI
    // ==========================================
    const btnAddAccount = document.getElementById('btnAddAccount');
    const addAccountModal = document.getElementById('addAccountModal');
    const btnCloseAddModal = document.getElementById('btnCloseAddModal');
    const btnCancelAddModal = document.getElementById('btnCancelAddModal');
    const btnSaveNewAccount = document.getElementById('btnSaveNewAccount');

    const inputAddMaNv = document.getElementById('add_ma_nv');
    const inputAddTenNv = document.getElementById('add_ten_nv');
    const inputAddMatKhau = document.getElementById('add_mat_khau');

    const closeAddModal = () => {
        if (!addAccountModal) return;
        addAccountModal.style.display = 'none';
        inputAddMaNv.value = '';
        inputAddTenNv.value = '';
        inputAddMatKhau.value = '';
    };

    if (btnAddAccount) {
        btnAddAccount.addEventListener('click', () => {
            addAccountModal.style.display = 'flex';
            inputAddMaNv.focus();
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

            if (!ma_nv || !ten_nv || !mat_khau) {
                alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
                return;
            }

            btnSaveNewAccount.textContent = 'Đang xử lý...';
            btnSaveNewAccount.disabled = true;

            const formData = new FormData();
            formData.append('ma_nv', ma_nv);
            formData.append('ten_nv', ten_nv);
            formData.append('mat_khau', mat_khau);

            try {
                const response = await fetch('api_add_account.php', { method: 'POST', body: formData });
                const result = await response.json();

                if (result.success) {
                    closeAddModal();
                    loadAccounts(); // Refresh table
                } else {
                    alert("Lỗi: " + result.message);
                }
            } catch (error) {
                alert("Đã xảy ra lỗi kết nối!");
            } finally {
                btnSaveNewAccount.textContent = 'Tạo tài khoản';
                btnSaveNewAccount.disabled = false;
            }
        });
    }

});
