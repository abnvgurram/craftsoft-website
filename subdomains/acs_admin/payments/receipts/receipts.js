// Receipts List Module
let receipts = [];
let filteredReceipts = [];
let currentReceipt = null;
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', async () => {
    const session = await window.supabaseConfig.getSession();
    if (!session) {
        window.location.href = '../../login.html';
        return;
    }

    // Initialize sidebar with correct page name
    AdminSidebar.init('receipts', '../../');

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = window.AdminHeader.render('Receipts');
    }

    const currentAdmin = await window.Auth.getCurrentAdmin();
    await AdminSidebar.renderAccountPanel(session, currentAdmin);

    // Load receipts
    await loadReceipts();

    // Bind events
    bindEvents();
});

// =====================
// Load Receipts
// =====================
async function loadReceipts() {
    try {
        const { data, error } = await window.supabaseClient
            .from('receipts')
            .select(`
                receipt_id,
                payment_id,
                amount_paid,
                payment_mode,
                reference_id,
                balance_due,
                created_at,
                student:student_id (
                    id,
                    student_id,
                    first_name,
                    last_name,
                    phone
                ),
                course:course_id (
                    id,
                    course_code,
                    course_name
                ),
                service:service_id (
                    id,
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        receipts = data || [];
        filteredReceipts = receipts;

        renderReceipts();
    } catch (err) {
        console.error('Error loading receipts:', err);
        window.AdminUtils.Toast.error('Error', 'Failed to load receipts');
    } finally {
        document.getElementById('loading-state').style.display = 'none';
    }
}

// =====================
// Render Receipts
// =====================
function renderReceipts() {
    const cards = document.getElementById('receipts-cards');
    const emptyState = document.getElementById('empty-state');

    if (filteredReceipts.length === 0) {
        cards.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    const start = (currentPage - 1) * itemsPerPage;
    const paginatedReceipts = filteredReceipts.slice(start, start + itemsPerPage);

    // Cards layout
    cards.innerHTML = paginatedReceipts.map(r => {
        const itemName = r.course?.course_name || r.service?.name || 'Unknown Item';
        return `
        <div class="premium-card">
            <div class="card-header">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span class="card-id-badge">${r.receipt_id}</span>
                    <span style="font-size: 0.75rem; color: var(--admin-text-muted);">${formatDate(r.created_at)}</span>
                </div>
                <span class="card-amount">${formatCurrency(r.amount_paid)}</span>
            </div>
            <div class="card-body">
                <div class="card-info-row">
                    <span class="card-info-item">
                        <i class="fa-solid fa-user"></i> 
                        ${r.student ? `${r.student.first_name} ${r.student.last_name} (${r.student.student_id})` : 'Unknown'}
                    </span>
                    <span class="card-info-item"><i class="fa-solid fa-book"></i> ${itemName}</span>
                    <span class="card-info-item ${r.balance_due <= 0 ? 'text-success' : 'text-danger'}">
                        <i class="fa-solid fa-coins"></i> ${r.balance_due <= 0 ? 'Fully Paid' : `Due: ${formatCurrency(r.balance_due)}`}
                    </span>
                </div>
            </div>
            <div class="card-footer">
                <span class="glass-tag ${r.payment_mode.toLowerCase()}">${r.payment_mode}</span>
                <div class="card-actions">
                    <button class="action-btn" onclick="viewReceipt('${r.receipt_id}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="downloadReceipt('${r.receipt_id}')">
                        <i class="fa-solid fa-download"></i>
                    </button>
                    <button class="action-btn whatsapp" onclick="sendWhatsApp('${r.receipt_id}')">
                        <i class="fa-brands fa-whatsapp"></i>
                    </button>
                </div>
            </div>
        </div>
    `}).join('');

    // Update footer count
    const footer = document.getElementById('receipts-footer');
    if (footer) {
        footer.innerHTML = `<span>Total Receipts: <strong>${filteredReceipts.length}</strong></span>`;
        footer.style.display = 'block';
    }

    // Render pagination
    window.AdminUtils.Pagination.render('pagination-container', filteredReceipts.length, currentPage, itemsPerPage, (page) => {
        currentPage = page;
        renderReceipts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// =====================
// View Receipt
// =====================
function viewReceipt(receiptId) {
    currentReceipt = receipts.find(r => r.receipt_id === receiptId);
    if (!currentReceipt) return;

    const itemName = currentReceipt.course?.course_name || currentReceipt.service?.name || 'Unknown Item';
    const itemLabel = currentReceipt.course ? 'Course' : 'Service';

    const content = document.getElementById('receipt-content');
    content.innerHTML = `
        <div class="receipt-view" id="receipt-printable">
            <div class="receipt-header">
                <div class="receipt-logo">Abhi's Craftsoft</div>
                <div class="receipt-subtitle">Payment Receipt</div>
            </div>
            
            <div class="receipt-details">
                <div class="receipt-row">
                    <span class="receipt-label">Receipt ID</span>
                    <span class="receipt-value">${currentReceipt.receipt_id}</span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Date</span>
                    <span class="receipt-value">${formatDate(currentReceipt.created_at)}</span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Student</span>
                    <span class="receipt-value">${currentReceipt.student ? `${currentReceipt.student.first_name} ${currentReceipt.student.last_name}` : 'Unknown'}</span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">${itemLabel}</span>
                    <span class="receipt-value">${itemName}</span>
                </div>
                <div class="receipt-row receipt-amount-row">
                    <span class="receipt-label">Amount Paid</span>
                    <span class="receipt-value">${formatCurrency(currentReceipt.amount_paid)}</span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Payment Mode</span>
                    <span class="receipt-value">${currentReceipt.payment_mode === 'CASH' ? 'Cash' : 'Online (UPI)'}</span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Reference ID</span>
                    <span class="receipt-value" style="font-size: 0.75rem; font-family: monospace;">${currentReceipt.reference_id}</span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Balance Due</span>
                    <span class="receipt-value ${currentReceipt.balance_due <= 0 ? 'paid' : 'due'}">
                        ${currentReceipt.balance_due <= 0 ? '₹0 (Fully Paid)' : formatCurrency(currentReceipt.balance_due)}
                    </span>
                </div>
            </div>
            
            <div class="receipt-footer">
                <p>This is a system-generated receipt.</p>
                <p>No signature required.</p>
            </div>
        </div>
    `;

    document.getElementById('receipt-modal').classList.add('active');
}

// =====================
// Download Receipt as PDF
// =====================
async function downloadReceipt(receiptId) {
    const receipt = receipts.find(r => r.receipt_id === receiptId);
    if (!receipt) return;

    const { Toast } = window.AdminUtils;
    Toast.info('Generating', 'Creating PDF...');

    try {
        viewReceipt(receiptId);
        await new Promise(resolve => setTimeout(resolve, 300));

        const element = document.getElementById('receipt-printable');
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`Receipt-${receiptId}.pdf`);

        Toast.success('Downloaded', 'Receipt PDF saved');
        closeReceiptModal();
    } catch (err) {
        console.error('PDF generation error:', err);
        Toast.error('Error', 'Failed to generate PDF');
    }
}

// =====================
// Send WhatsApp Message
// =====================
function sendWhatsApp(receiptId) {
    const receipt = receipts.find(r => r.receipt_id === receiptId);
    if (!receipt) return;

    const phone = receipt.student?.phone;
    if (!phone) {
        window.AdminUtils.Toast.error('No Phone', 'Student phone number not available');
        return;
    }

    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91')) formattedPhone = '91' + formattedPhone;

    const studentName = receipt.student ? `${receipt.student.first_name} ${receipt.student.last_name}` : 'Student';
    const itemName = receipt.course?.course_name || receipt.service?.name || 'Item';
    const amount = formatCurrency(receipt.amount_paid);
    const balance = receipt.balance_due <= 0 ? '₹0' : formatCurrency(receipt.balance_due);

    const message = `Hi ${studentName},

We have received ${amount} for ${itemName}.
Receipt ID: ${receipt.receipt_id}
Balance Due: ${balance}

– Abhi's Craftsoft`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').classList.remove('active');
    currentReceipt = null;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function bindEvents() {
    document.getElementById('search-input').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
            filteredReceipts = receipts;
        } else {
            filteredReceipts = receipts.filter(r =>
                r.receipt_id?.toLowerCase().includes(query) ||
                (r.student ? `${r.student.first_name} ${r.student.last_name}`.toLowerCase().includes(query) : false) ||
                (r.student?.student_id ? r.student.student_id.toLowerCase().includes(query) : false) ||
                r.course?.course_name?.toLowerCase().includes(query) ||
                r.service?.name?.toLowerCase().includes(query)
            );
        }
        renderReceipts();
    });

    document.getElementById('close-receipt-modal').addEventListener('click', closeReceiptModal);
    document.getElementById('receipt-modal').addEventListener('click', (e) => {
        if (e.target.id === 'receipt-modal') closeReceiptModal();
    });

    document.getElementById('receipt-download-btn').addEventListener('click', () => {
        if (currentReceipt) downloadReceipt(currentReceipt.receipt_id);
    });

    document.getElementById('receipt-whatsapp-btn').addEventListener('click', () => {
        if (currentReceipt) {
            sendWhatsApp(currentReceipt.receipt_id);
            closeReceiptModal();
        }
    });
}
