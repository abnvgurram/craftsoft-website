/* ============================================
   PAYMENTS MANAGEMENT - JavaScript
   ============================================ */

// Global state
let allPayments = [];

// Initialize page
document.addEventListener('DOMContentLoaded', initPaymentsPage);

async function initPaymentsPage() {
    // Check auth
    const session = await requireAuth();
    if (!session) return;

    // Show layout
    document.getElementById('adminLayout').style.display = 'flex';

    // Setup sidebar
    setupSidebar();

    // Load data
    await loadPayments();

    // Setup event listeners
    setupFilters();
}

// ============================================
// SIDEBAR
// ============================================
function setupSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const toggle = document.getElementById('sidebarToggle');
    const close = document.getElementById('sidebarClose');
    const overlay = document.getElementById('sidebarOverlay');

    toggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('show');
    });

    close.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    }
}

// ============================================
// LOAD DATA
// ============================================
async function loadPayments() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('paymentsTable');

    loadingState.style.display = 'flex';
    table.style.display = 'none';
    emptyState.style.display = 'none';

    try {
        const { data: payments, error } = await supabase
            .from('fee_payments')
            .select(`
                *,
                students (id, name, phone),
                student_enrollments (
                    id,
                    courses (name, code)
                )
            `)
            .order('payment_date', { ascending: false });

        if (error) throw error;

        allPayments = payments || [];
        renderPayments(allPayments);
    } catch (error) {
        console.error('Error loading payments:', error);
        showToast('Failed to load payments', 'error');
    } finally {
        loadingState.style.display = 'none';
    }
}

function renderPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    const mobileCards = document.getElementById('paymentCards');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('paymentsTable');

    if (payments.length === 0) {
        table.style.display = 'none';
        mobileCards.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    // Desktop table
    tbody.innerHTML = payments.map(payment => `
        <tr data-id="${payment.id}">
            <td>${formatDate(payment.payment_date)}</td>
            <td>
                <div class="student-name">
                    <span class="avatar">${getInitials(payment.students?.name || 'NA')}</span>
                    <span>${payment.students?.name || 'Unknown'}</span>
                </div>
            </td>
            <td>${payment.student_enrollments?.courses?.name || '-'}</td>
            <td class="text-success">₹${formatCurrency(payment.amount)}</td>
            <td><span class="mode-badge mode-${payment.payment_mode}">${capitalizeFirst(payment.payment_mode)}</span></td>
            <td>${payment.reference_id || '-'}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="generateReceipt('${payment.id}')">
                    <i class="fas fa-file-invoice"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Mobile cards
    mobileCards.innerHTML = payments.map(payment => `
        <div class="payment-card" data-id="${payment.id}">
            <div class="card-header">
                <div class="payment-info">
                    <span class="avatar">${getInitials(payment.students?.name || 'NA')}</span>
                    <div>
                        <h3>${payment.students?.name || 'Unknown'}</h3>
                        <p>${payment.student_enrollments?.courses?.name || '-'}</p>
                    </div>
                </div>
                <span class="amount text-success">₹${formatCurrency(payment.amount)}</span>
            </div>
            <div class="card-body">
                <div class="card-row">
                    <span class="label">Date</span>
                    <span class="value">${formatDate(payment.payment_date)}</span>
                </div>
                <div class="card-row">
                    <span class="label">Mode</span>
                    <span class="value">${capitalizeFirst(payment.payment_mode)}</span>
                </div>
                <div class="card-row">
                    <span class="label">Reference</span>
                    <span class="value">${payment.reference_id || '-'}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-sm btn-full" onclick="generateReceipt('${payment.id}')">
                    <i class="fas fa-file-invoice"></i> Generate Receipt
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// FILTERS
// ============================================
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const modeFilter = document.getElementById('modeFilter');
    const dateFilter = document.getElementById('dateFilter');

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyFilters, 300);
    });

    modeFilter.addEventListener('change', applyFilters);
    dateFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const mode = document.getElementById('modeFilter').value;
    const dateRange = document.getElementById('dateFilter').value;

    let filtered = allPayments;

    // Search filter
    if (search) {
        filtered = filtered.filter(p =>
            p.students?.name?.toLowerCase().includes(search) ||
            p.student_enrollments?.courses?.name?.toLowerCase().includes(search)
        );
    }

    // Mode filter
    if (mode) {
        filtered = filtered.filter(p => p.payment_mode === mode);
    }

    // Date filter
    if (dateRange) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filtered = filtered.filter(p => {
            const paymentDate = new Date(p.payment_date);
            paymentDate.setHours(0, 0, 0, 0);

            switch (dateRange) {
                case 'today':
                    return paymentDate.getTime() === today.getTime();
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return paymentDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return paymentDate >= monthAgo;
                default:
                    return true;
            }
        });
    }

    renderPayments(filtered);
}

// ============================================
// RECEIPT GENERATION
// ============================================
function generateReceipt(paymentId) {
    downloadReceipt(paymentId);
}

// ============================================
// LOGOUT
// ============================================
function showLogoutModal() {
    document.getElementById('logoutModal').classList.add('show');
}

function hideLogoutModal() {
    document.getElementById('logoutModal').classList.remove('show');
}

async function confirmLogout() {
    await signOut();
}

// ============================================
// UTILITIES
// ============================================
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
