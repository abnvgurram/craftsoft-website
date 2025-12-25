/* ============================================
   RECEIPTS MANAGEMENT - JavaScript
   ============================================ */

// Global state
let allPayments = [];

// Initialize page
document.addEventListener('DOMContentLoaded', initReceiptsPage);

async function initReceiptsPage() {
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
    const table = document.getElementById('receiptsTable');

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
                    final_fee,
                    courses (name, code)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allPayments = payments || [];
        renderReceipts(allPayments);
    } catch (error) {
        console.error('Error loading payments:', error);
        showToast('Failed to load receipts', 'error');
    } finally {
        loadingState.style.display = 'none';
    }
}

function renderReceipts(payments) {
    const tbody = document.getElementById('receiptsTableBody');
    const mobileCards = document.getElementById('receiptCards');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('receiptsTable');

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
            <td><code style="font-size: 0.8rem; background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${payment.receipt_number || 'GENERATE...'}</code></td>
            <td>${formatDateStrip(payment.payment_date)}</td>
            <td>
                <div class="student-name">
                    <span class="avatar">${getInitials(payment.students?.name || 'NA')}</span>
                    <span>${payment.students?.name || 'Unknown'}</span>
                </div>
            </td>
            <td>${payment.student_enrollments?.courses?.name || '-'}</td>
            <td class="text-success">₹${formatCurrency(payment.amount)}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="downloadReceipt('${payment.id}')">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Mobile cards
    mobileCards.innerHTML = payments.map(payment => `
        <div class="student-card" data-id="${payment.id}">
            <div class="card-header">
                <div class="student-info">
                    <span class="avatar">${getInitials(payment.students?.name || 'NA')}</span>
                    <div>
                        <h3>${payment.students?.name || 'Unknown'}</h3>
                        <p>${payment.receipt_number || 'Receipt ID Pending'}</p>
                    </div>
                </div>
                <span class="amount text-success">₹${formatCurrency(payment.amount)}</span>
            </div>
            <div class="card-body">
                <div class="card-row">
                    <span class="label">Course</span>
                    <span class="value">${payment.student_enrollments?.courses?.name || '-'}</span>
                </div>
                <div class="card-row">
                    <span class="label">Date</span>
                    <span class="value">${formatDateStrip(payment.payment_date)}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-sm btn-full" onclick="downloadReceipt('${payment.id}')">
                    <i class="fas fa-download"></i> Download PDF
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

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyFilters, 300);
    });
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();

    let filtered = allPayments;

    // Search filter
    if (search) {
        filtered = filtered.filter(p =>
            p.students?.name?.toLowerCase().includes(search) ||
            (p.receipt_number && p.receipt_number.toLowerCase().includes(search))
        );
    }

    renderReceipts(filtered);
}

// ============================================
// UTILITIES
// ============================================
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Rename formatDateStrip to formatDate (or just keep it if used elsewhere, but common.js has formatDate)
function formatDateStrip(dateStr) {
    return formatDate(dateStr);
}
