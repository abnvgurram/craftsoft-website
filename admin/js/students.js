// Students Page Logic - Migrated to Supabase with Full Functionality Restore
let allStudents = [];
let filteredStudents = [];
let allTutors = [];
let currentStudentData = null;

// Pagination
const ITEMS_PER_PAGE = 8;
let currentPage = 1;

// Subject Codes Mapping
const subjectCodes = {
    'Full Stack Development (MERN)': '01',
    'UI/UX Design': '02',
    'Graphic Design': '03',
    'DevOps Engineering': '04',
    'AWS Cloud Excellence': '05',
    'Python Full Stack Development': '06',
    'Java Full Stack Development': '07',
    'Data Analytics': '08',
    'Salesforce Administration': '09',
    'DSA Mastery': '10',
    'Soft Skills Training': '11',
    'Spoken English Mastery': '12',
    'Resume Writing & Interview Prep': '13',
    'DevSecOps': '14',
    'Handwriting Improvement': '15',
    'Other': '99'
};

// Helper: Map Supabase DB Row (snake_case) to JS Object (camelCase)
function mapStudentRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        course: row.course,
        totalFee: row.total_fee,
        paidAmount: row.paid_amount,
        notes: row.notes,
        batchTiming: row.batch_timing,
        batchMode: row.batch_mode,
        tutorName: row.tutor_name,
        status: row.status,
        joiningDate: row.joining_date,
        demoDate: row.demo_date,
        batchName: row.batch_name,
        initials: row.initials,
        subjectCode: row.subject_code,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

// === UTILITIES ===
function formatCurrency(amount) {
    return '₹' + (amount || 0).toLocaleString('en-IN');
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatPhoneNumber(val) {
    if (!val) return '';
    const cleaned = val.toString().replace(/\D/g, '');
    return cleaned.length === 10 ? `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}` : (cleaned.length === 12 ? cleaned : val);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="material-icons">${type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info')}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// === LOAD DATA ===
async function loadData() {
    try {
        if (typeof showTableSkeleton === 'function') showTableSkeleton('studentsTable');
        if (typeof showCardSkeleton === 'function') showCardSkeleton('studentsMobileCards');

        // Parallel load
        const [studentsRes, tutorsRes] = await Promise.all([
            supabase.from('students').select('*').order('created_at', { ascending: false }),
            supabase.from('tutors').select('*').eq('status', 'active')
        ]);

        if (studentsRes.error) throw studentsRes.error;

        allStudents = studentsRes.data.map(mapStudentRow);
        allTutors = tutorsRes.data || [];

        // Populate Tutors in Selects
        const selects = ['tutorName', 'editTutorName'];
        selects.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = '<option value="">Select Tutor</option>';
                allTutors.forEach(t => {
                    el.innerHTML += `<option value="${t.name}">${t.name} (${t.subject})</option>`;
                });
            }
        });

        applyFilters();
    } catch (error) {
        console.error('Loader error:', error);
        showToast('Error loading data', 'error');
    }
}

// === SEARCH & FILTER ===
function applyFilters() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const course = document.getElementById('courseFilter').value;
    const status = document.getElementById('statusFilter').value;

    filteredStudents = allStudents.filter(s => {
        const matchesSearch = !query ||
            s.name.toLowerCase().includes(query) ||
            s.phone.includes(query);

        const matchesCourse = !course || s.course.includes(course);

        const pending = (s.totalFee || 0) - (s.paidAmount || 0);
        let sType = pending <= 0 ? 'paid' : (s.paidAmount > 0 ? 'partial' : 'pending');
        const matchesStatus = !status || sType === status;

        return matchesSearch && matchesCourse && matchesStatus;
    });

    currentPage = 1;
    renderPage();
}

// === RENDERING ===
function renderPage() {
    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paged = filteredStudents.slice(start, end);

    renderTable(paged);
    renderCards(paged);
    renderPagination(totalPages);
}

function renderTable(students) {
    const tbody = document.getElementById('studentsTable');
    if (!tbody) return;

    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color:#64748b;">No matching students found</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map(s => {
        const pending = (s.totalFee || 0) - (s.paidAmount || 0);
        const statusClass = pending <= 0 ? 'paid' : (s.paidAmount > 0 ? 'partial' : 'pending');

        return `
            <tr>
                <td>
                    <div style="font-weight:600; color:var(--gray-900);">${s.name}</div>
                    <div style="font-size:0.75rem; color:var(--gray-500);">${s.phone}</div>
                </td>
                <td>
                    <div style="font-size: 0.85rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${s.course}">${s.course}</div>
                </td>
                <td><div style="font-size: 0.9rem;">${formatCurrency(s.totalFee)}</div></td>
                <td><div style="font-size: 0.9rem; color: #10B981; font-weight: 500;">${formatCurrency(s.paidAmount)}</div></td>
                <td><span class="status-badge ${statusClass}">${statusClass.toUpperCase()}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="openEditStudentModal('${s.id}')" title="Edit Profile"><span class="material-icons">edit</span></button>
                        ${pending > 0 ? `<button class="btn-icon success" onclick="openPaymentModal('${s.id}', '${s.name}', ${pending})" title="Record Payment"><span class="material-icons">add_card</span></button>` : ''}
                        <button class="btn-icon" onclick="openPaymentHistory('${s.id}')" title="History & Receipts"><span class="material-icons">receipt_long</span></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderCards(students) {
    const container = document.getElementById('studentsMobileCards');
    if (!container) return;

    if (students.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 20px; color:#64748b;">No results</div>`;
        return;
    }

    container.innerHTML = students.map(s => {
        const pending = (s.totalFee || 0) - (s.paidAmount || 0);
        const statusClass = pending <= 0 ? 'paid' : (s.paidAmount > 0 ? 'partial' : 'pending');

        return `
            <div class="mobile-card">
                <div class="mobile-card-header">
                    <div>
                        <div class="mobile-card-name">${s.name}</div>
                        <div style="font-size:0.75rem; color: #64748b;">${s.phone}</div>
                    </div>
                    <span class="status-badge ${statusClass}">${statusClass.toUpperCase()}</span>
                </div>
                <div class="mobile-card-row"><span>Course</span><span>${s.course}</span></div>
                <div class="mobile-card-row"><span>Total Fee</span><span>${formatCurrency(s.totalFee)}</span></div>
                <div class="mobile-card-row"><span>Paid</span><span style="color:#10B981">${formatCurrency(s.paidAmount)}</span></div>
                <div class="mobile-card-row"><span>Balance</span><span style="color:${pending > 0 ? '#EF4444' : '#10B981'}; font-weight:600;">${formatCurrency(pending)}</span></div>
                <div class="mobile-card-actions" style="margin-top:12px; border-top:1px solid #f1f5f9; padding-top:12px;">
                    <button class="btn-icon" onclick="openEditStudentModal('${s.id}')"><span class="material-icons">edit</span></button>
                    ${pending > 0 ? `<button class="btn-icon success" onclick="openPaymentModal('${s.id}', '${s.name}', ${pending})"><span class="material-icons">add_card</span></button>` : ''}
                    <button class="btn-icon" onclick="openPaymentHistory('${s.id}')"><span class="material-icons">receipt_long</span></button>
                </div>
            </div>
        `;
    }).join('');
}

function renderPagination(total) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    if (total <= 1) { container.innerHTML = ''; return; }

    let html = `<button class="p-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})"><span class="material-icons">chevron_left</span></button>`;
    for (let i = 1; i <= total; i++) {
        html += `<button class="p-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    html += `<button class="p-btn" ${currentPage === total ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})"><span class="material-icons">chevron_right</span></button>`;
    container.innerHTML = html;
}

// === ACTION HANDLERS ===
async function openEditStudentModal(id) {
    try {
        const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
        if (error) throw error;
        const s = mapStudentRow(data);
        currentStudentData = s;

        document.getElementById('editStudentId').value = s.id;
        document.getElementById('editStudentName').value = s.name;
        document.getElementById('editStudentPhone').value = s.phone.replace(/\D/g, '').slice(-10);
        document.getElementById('editStudentEmail').value = s.email || '';
        document.getElementById('editStudentCourse').value = s.course.split(',')[0].trim();
        document.getElementById('editTotalFee').value = s.totalFee;
        document.getElementById('editBatchName').value = s.batchName || '';
        document.getElementById('editBatchTiming').value = s.batchTiming || '';
        document.getElementById('editBatchMode').value = s.batchMode || 'offline';
        document.getElementById('editTutorName').value = s.tutorName || '';
        document.getElementById('editJoiningDate').value = s.joiningDate || '';
        document.getElementById('editStudentStatus').value = s.status || 'active';
        document.getElementById('editDemoDate').value = s.demoDate || '';
        document.getElementById('editStudentNotes').value = s.notes || '';

        document.getElementById('editStudentModal').classList.add('active');
    } catch (e) { showToast('Error fetching student', 'error'); }
}

async function openPaymentModal(id, name, pending) {
    document.getElementById('paymentStudentId').value = id;
    document.getElementById('paymentStudentName').value = name;
    document.getElementById('pendingDisplayAmount').value = formatCurrency(pending);
    document.getElementById('paymentAmount').value = pending;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('addPaymentModal').classList.add('active');
}

async function openPaymentHistory(id) {
    try {
        const [sRes, pRes] = await Promise.all([
            supabase.from('students').select('*').eq('id', id).single(),
            supabase.from('payments').select('*').eq('student_id', id).order('date', { ascending: false })
        ]);

        const s = mapStudentRow(sRes.data);
        const payments = pRes.data || [];

        // Link history for PDF generator
        s.paymentHistory = payments;
        currentStudentData = s;

        const header = document.getElementById('studentInfoHeader');
        header.innerHTML = `
            <div style="font-weight:700; font-size:1.1rem; color:var(--gray-900);">${s.name}</div>
            <div style="color:var(--gray-600); font-size:0.85rem;">${s.course}</div>
            <div style="display:flex; gap:10px; margin-top:8px;">
                <span class="badge" style="background:#f1f5f9; color:#64748b;">Total: ${formatCurrency(s.totalFee)}</span>
                <span class="badge" style="background:#ecfdf5; color:#10b981;">Paid: ${formatCurrency(s.paidAmount)}</span>
            </div>
        `;

        const timeline = document.getElementById('paymentTimeline');
        if (payments.length === 0) {
            timeline.innerHTML = '<li style="color:#64748b; padding:20px; text-align:center;">No payments found</li>';
        } else {
            timeline.innerHTML = payments.map(p => `
                <li class="payment-item">
                    <div class="payment-icon"><span class="material-icons">${p.mode === 'cash' ? 'payments' : 'account_balance_wallet'}</span></div>
                    <div class="payment-details">
                        <div class="payment-main">
                            <span class="payment-amount">${formatCurrency(p.amount)}</span>
                            <span class="payment-mode">${p.mode.toUpperCase()}</span>
                        </div>
                        <div class="payment-sub">
                            <span>ID: ${p.receipt_number}</span>
                            <span>📅 ${formatDate(p.date)}</span>
                        </div>
                    </div>
                    <button class="btn-icon" onclick="printSingleReceipt('${p.id}')" title="Download Receipt"><span class="material-icons">download</span></button>
                </li>
            `).join('');
        }

        document.getElementById('paymentHistoryModal').classList.add('active');
    } catch (e) { showToast('Error loading history', 'error'); }
}

// === FORM SUBMISSIONS ===
document.getElementById('addStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('studentName').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const courses = typeof getSelectedCourses === 'function' ? getSelectedCourses() : [];
    const totalFee = parseInt(document.getElementById('totalFee').value) || 0;
    const initialPayment = parseInt(document.getElementById('initialPayment').value) || 0;
    const paymentMode = document.getElementById('paymentMode').value;
    const tutor = document.getElementById('tutorName').value;
    const joinDate = document.getElementById('startDate').value;

    try {
        // Validation
        if (!name || phone.length < 10) return showToast('Invalid name or phone', 'error');

        // Logic for Initials/Subject
        const nParts = name.split(/\s+/);
        const initials = nParts.length >= 2 ? (nParts[0][0] + nParts[1][0]).toUpperCase() : nParts[0].substring(0, 2).toUpperCase();
        const mainCourse = courses[0] || 'Other';
        const subCode = subjectCodes[mainCourse] || '99';

        const studentData = {
            name, phone: '+91 ' + phone.slice(-10), email, course: courses.join(', '),
            total_fee: totalFee, paid_amount: initialPayment, status: 'active',
            joining_date: joinDate || new Date().toISOString().split('T')[0],
            tutor_name: tutor, initials, subject_code: subCode,
            created_at: new Date().toISOString()
        };

        const { data: student, error } = await supabase.from('students').insert([studentData]).select().single();
        if (error) throw error;

        if (initialPayment > 0) {
            const seq = await getNextReceiptSequence();
            const receipt = `${seq}-ACS-${initials}${subCode}01`;
            await supabase.from('payments').insert([{
                student_id: student.id, amount: initialPayment, mode: paymentMode,
                date: studentData.joining_date, receipt_number: receipt,
                created_at: new Date().toISOString()
            }]);
        }

        showToast('Admission successful!');
        if (typeof resetWizard === 'function') resetWizard();
        document.getElementById('addStudentModal').classList.remove('active');
        loadData();
    } catch (err) {
        showToast('Submission error', 'error');
    }
});

document.getElementById('editStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editStudentId').value;
    const updates = {
        name: document.getElementById('editStudentName').value.trim(),
        phone: '+91 ' + document.getElementById('editStudentPhone').value.trim().slice(-10),
        email: document.getElementById('editStudentEmail').value.trim(),
        course: document.getElementById('editStudentCourse').value,
        total_fee: parseInt(document.getElementById('editTotalFee').value) || 0,
        batch_name: document.getElementById('editBatchName').value,
        batch_timing: document.getElementById('editBatchTiming').value,
        batch_mode: document.getElementById('editBatchMode').value,
        tutor_name: document.getElementById('editTutorName').value,
        joining_date: document.getElementById('editJoiningDate').value,
        status: document.getElementById('editStudentStatus').value,
        demo_date: document.getElementById('editDemoDate').value,
        notes: document.getElementById('editStudentNotes').value,
        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase.from('students').update(updates).eq('id', id);
        if (error) throw error;
        showToast('Profile updated');
        document.getElementById('editStudentModal').classList.remove('active');
        loadData();
    } catch (e) { showToast('Update failed', 'error'); }
});

document.getElementById('addPaymentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sid = document.getElementById('paymentStudentId').value;
    const amt = parseInt(document.getElementById('paymentAmount').value) || 0;
    const mode = document.getElementById('paymentModeRecord').value;
    const date = document.getElementById('paymentDate').value;
    const notes = document.getElementById('paymentNotes').value;

    try {
        const { data: sRow } = await supabase.from('students').select('*').eq('id', sid).single();
        const s = mapStudentRow(sRow);

        const { count } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('student_id', sid);
        const seq = await getNextReceiptSequence();
        const receipt = `${seq}-ACS-${s.initials}${s.subjectCode}${(count + 1).toString().padStart(2, '0')}`;

        await Promise.all([
            supabase.from('payments').insert([{ student_id: sid, amount: amt, mode, date, receipt_number: receipt, notes, created_at: new Date().toISOString() }]),
            supabase.from('students').update({ paid_amount: (s.paidAmount || 0) + amt }).eq('id', sid)
        ]);

        showToast('Payment recorded!');
        document.getElementById('addPaymentModal').classList.remove('active');
        loadData();
    } catch (e) { showToast('Error saving payment', 'error'); }
});

// === PDF & RECEIPTS ===
async function printSingleReceipt(paymentId) {
    try {
        const { data: p } = await supabase.from('payments').select('*').eq('id', paymentId).single();
        if (!currentStudentData || !p) return;

        // Pass to generator
        await window.generateReceipt(currentStudentData, {
            receiptNumber: p.receipt_number,
            amount: p.amount,
            mode: p.mode,
            date: p.date
        });
        showToast('Receipt generated!');
    } catch (e) { showToast('PDF Error', 'error'); }
}

async function getNextReceiptSequence() {
    const { data } = await supabase.from('settings').select('metadata').eq('id', 'config').single();
    let seq = (data?.metadata?.receiptSequence || 0) + 1;

    // Save back to metadata
    const newMetadata = { ...(data?.metadata || {}), receiptSequence: seq };
    await supabase.from('settings').update({ metadata: newMetadata }).eq('id', 'config');

    return seq;
}

// === EXPORTS & INIT ===
window.loadData = loadData;
window.applyFilters = applyFilters;
window.openEditStudentModal = openEditStudentModal;
window.openPaymentModal = openPaymentModal;
window.openPaymentHistory = openPaymentHistory;
window.printSingleReceipt = printSingleReceipt;
window.goToPage = (p) => { currentPage = p; renderPage(); };

// Listeners
document.getElementById('searchInput')?.addEventListener('input', applyFilters);
document.getElementById('courseFilter')?.addEventListener('change', applyFilters);
document.getElementById('statusFilter')?.addEventListener('change', applyFilters);

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('studentsTable')) loadData();
});

// Fee calculation helper for the wizard
window.calculateFinalFee = function () {
    let total = 0;
    document.querySelectorAll('.course-fee-input').forEach(input => {
        total += parseInt(input.value) || 0;
    });

    const discount = parseInt(document.getElementById('discountAmount').value) || 0;
    const final = Math.max(0, total - discount);

    const totalFeeInput = document.getElementById('totalFee');
    if (totalFeeInput) totalFeeInput.value = final;

    const originalFeeInput = document.getElementById('originalFee');
    if (originalFeeInput) originalFeeInput.value = total;
};
