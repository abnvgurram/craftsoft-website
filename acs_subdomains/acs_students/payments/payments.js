/* ============================================
   Student Payments History
   Craft Soft - Student Module
   ============================================ */

(function () {
    'use strict';

    // Dom Elements
    const userNameEl = document.getElementById('user-name');
    const userInitialsEl = document.getElementById('user-initials');
    const userIdEl = document.getElementById('user-id');
    const totalPaidEl = document.getElementById('total-paid');
    const totalPendingEl = document.getElementById('total-pending');
    const totalFeeEl = document.getElementById('total-fee');
    const paymentsList = document.getElementById('payments-list');
    const btnLogout = document.getElementById('btn-logout');

    // Menu Controls
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    let studentData = null;

    // Toast Utility
    const Toast = {
        show(msg, type = 'info') {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.className = `toast show ${type}`;
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    };

    // Modal Utility
    const Modal = {
        element: document.getElementById('modal-overlay'),
        title: document.getElementById('modal-title'),
        message: document.getElementById('modal-message'),
        icon: document.getElementById('modal-icon'),
        btnConfirm: document.getElementById('modal-confirm'),
        btnCancel: document.getElementById('modal-cancel'),

        show({ title, message, type = 'warning', confirmText = 'Confirm', onConfirm }) {
            this.title.textContent = title;
            this.message.textContent = message;
            this.icon.className = `modal-icon ${type}`;
            this.btnConfirm.textContent = confirmText;
            this.element.style.display = 'flex';
            document.body.classList.add('modal-open');

            const close = () => {
                this.element.style.display = 'none';
                document.body.classList.remove('modal-open');
            };

            this.btnCancel.onclick = close;
            this.btnConfirm.onclick = () => {
                if (onConfirm) onConfirm();
                close();
            };
        }
    };

    // Value Animation
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            let current = Math.floor(progress * (end - start) + start);
            obj.textContent = new Intl.NumberFormat('en-IN', {
                style: 'currency', currency: 'INR', maximumFractionDigits: 0
            }).format(current);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    // Check Auth
    async function checkAuth() {
        const session = localStorage.getItem('acs_student_session');
        if (!session) {
            window.location.href = '../';
            return;
        }

        const data = JSON.parse(session);
        studentData = data;
        initPage();
    }

    async function initPage() {
        // Basic Info
        userNameEl.textContent = studentData.name;
        userIdEl.textContent = `ID: ${studentData.student_id}`;
        userInitialsEl.textContent = studentData.name.split(' ').map(n => n[0]).join('').toUpperCase();

        await loadPaymentData();
    }

    async function loadPaymentData() {
        try {
            // 1. Fetch Profile for totals
            const { data: profile, error: pErr } = await window.supabaseClient
                .from('students')
                .select('final_fee')
                .eq('id', studentData.id)
                .single();

            if (pErr) throw pErr;

            // 2. Fetch Payments
            const { data: payments, error: payErr } = await window.supabaseClient
                .from('payments')
                .select('*')
                .eq('student_id', studentData.id)
                .order('payment_date', { ascending: false });

            if (payErr) throw payErr;

            let totalPaid = 0;
            payments.forEach(p => totalPaid += (p.amount_paid || 0));

            // Summary
            const totalFee = profile.final_fee || 0;
            const pending = totalFee - totalPaid;

            animateValue(totalPaidEl, 0, totalPaid, 1000);
            animateValue(totalPendingEl, 0, pending > 0 ? pending : 0, 1000);
            animateValue(totalFeeEl, 0, totalFee, 1000);

            renderPayments(payments);

        } catch (err) {
            console.error('Data loading error:', err);
            Toast.show("Error loading payment history", "error");
        }
    }

    function renderPayments(payments) {
        paymentsList.innerHTML = '';
        if (payments.length === 0) {
            paymentsList.innerHTML = '<div class="loading-state"><p>No transactions found.</p></div>';
            return;
        }

        payments.forEach(p => {
            const div = document.createElement('div');
            div.className = 'payment-row';
            div.innerHTML = `
                <div class="pay-info">
                    <div class="pay-icon"><i class="fas fa-file-invoice-dollar"></i></div>
                    <div class="pay-meta">
                        <h4>FEE PAYMENT</h4>
                        <div class="date">${new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                        <span class="receipt-id">TXN: ${p.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                </div>
                <div class="pay-amount">
                    <span class="amt">+ ₹${p.amount_paid.toLocaleString()}</span>
                    <span class="mode">via ${p.payment_mode || 'Cash'}</span>
                </div>
            `;
            paymentsList.appendChild(div);
        });
    }

    // Toggle Menu
    function toggleMenu() {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }

    menuToggle.addEventListener('click', toggleMenu);
    sidebarOverlay.addEventListener('click', toggleMenu);

    btnLogout.addEventListener('click', () => {
        Modal.show({
            title: "Logout?",
            message: "Are you sure you want to end your session?",
            type: "warning",
            confirmText: "Logout",
            onConfirm: () => {
                localStorage.removeItem('acs_student_session');
                window.location.href = '../';
            }
        });
    });

    checkAuth();

})();
