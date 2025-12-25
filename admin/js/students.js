/* ============================================
   STUDENTS MANAGEMENT - JavaScript
   ============================================ */

// Global state
let allStudents = [];
let allCourses = [];
let currentStudentId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', initStudentsPage);

async function initStudentsPage() {
    // Check auth
    const session = await requireAuth();
    if (!session) return;

    // Show layout
    document.getElementById('adminLayout').style.display = 'flex';

    // Setup sidebar
    setupSidebar();

    // Load data
    await Promise.all([
        loadCourses(),
        loadStudents()
    ]);

    // Setup event listeners
    setupFilters();
    setupActionMenu();
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
async function loadCourses() {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('code');

        if (error) throw error;
        allCourses = data || [];

        // Populate course filter
        const courseFilter = document.getElementById('courseFilter');
        allCourses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            courseFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

async function loadStudents() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('studentsTable');

    loadingState.style.display = 'flex';
    table.style.display = 'none';
    emptyState.style.display = 'none';

    try {
        // Get students with their enrollments and payments
        const { data: students, error } = await supabase
            .from('students')
            .select(`
                *,
                student_enrollments (
                    id,
                    course_id,
                    final_fee,
                    status,
                    courses (name, code)
                ),
                fee_payments (
                    amount
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allStudents = (students || []).map(student => {
            const totalFee = student.student_enrollments?.reduce((sum, e) => sum + parseFloat(e.final_fee || 0), 0) || 0;
            const totalPaid = student.fee_payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
            const courses = student.student_enrollments?.map(e => e.courses?.name).filter(Boolean) || [];

            return {
                ...student,
                totalFee,
                totalPaid,
                balance: totalFee - totalPaid,
                courseNames: courses
            };
        });

        renderStudents(allStudents);
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Failed to load students', 'error');
    } finally {
        loadingState.style.display = 'none';
    }
}

function renderStudents(students) {
    const tbody = document.getElementById('studentsTableBody');
    const mobileCards = document.getElementById('studentCards');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('studentsTable');

    if (students.length === 0) {
        table.style.display = 'none';
        mobileCards.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    // Desktop table
    tbody.innerHTML = students.map(student => `
        <tr data-id="${student.id}">
            <td>
                <div class="student-name">
                    <span class="avatar">${getInitials(student.name)}</span>
                    <span>${student.name}</span>
                </div>
            </td>
            <td><a href="tel:${student.phone}" class="phone-link">${student.phone}</a></td>
            <td>${student.courseNames.length > 0 ?
            (student.courseNames.length === 1 ? student.courseNames[0] : `${student.courseNames.length} courses`)
            : '-'}</td>
            <td>₹${formatCurrency(student.totalFee)}</td>
            <td class="text-success">₹${formatCurrency(student.totalPaid)}</td>
            <td class="${student.balance > 0 ? 'text-danger' : 'text-success'}">
                ${student.balance > 0 ? '₹' + formatCurrency(student.balance) : '✓ Paid'}
            </td>
            <td><span class="status-badge status-${student.status}">${capitalizeFirst(student.status)}</span></td>
            <td>
                <button class="action-btn" onclick="showActionMenu(event, '${student.id}')">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Mobile cards
    mobileCards.innerHTML = students.map(student => `
        <div class="student-card" data-id="${student.id}">
            <div class="card-header">
                <div class="student-info">
                    <span class="avatar">${getInitials(student.name)}</span>
                    <div>
                        <h3>${student.name}</h3>
                        <a href="tel:${student.phone}" class="phone-link">📞 ${student.phone}</a>
                    </div>
                </div>
                <span class="status-badge status-${student.status}">${capitalizeFirst(student.status)}</span>
            </div>
            <div class="card-body">
                <div class="card-row">
                    <span class="label">Courses</span>
                    <span class="value">${student.courseNames.length > 0 ? student.courseNames.join(', ') : '-'}</span>
                </div>
                <div class="card-row">
                    <span class="label">Total Fee</span>
                    <span class="value">₹${formatCurrency(student.totalFee)}</span>
                </div>
                <div class="card-row">
                    <span class="label">Paid</span>
                    <span class="value text-success">₹${formatCurrency(student.totalPaid)}</span>
                </div>
                <div class="card-row">
                    <span class="label">Balance</span>
                    <span class="value ${student.balance > 0 ? 'text-danger' : 'text-success'}">
                        ${student.balance > 0 ? '₹' + formatCurrency(student.balance) : '✓ Paid'}
                    </span>
                </div>
            </div>
            <div class="card-actions">
                <a href="#" class="btn btn-outline btn-sm disabled" title="Coming Soon">
                    <i class="fas fa-eye"></i> View
                </a>
                <button class="btn btn-primary btn-sm" onclick="showActionMenu(event, '${student.id}')">
                    <i class="fas fa-ellipsis-h"></i> Actions
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
    const statusFilter = document.getElementById('statusFilter');
    const courseFilter = document.getElementById('courseFilter');

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyFilters, 300);
    });

    statusFilter.addEventListener('change', applyFilters);
    courseFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const courseId = document.getElementById('courseFilter').value;

    let filtered = allStudents;

    // Search filter
    if (search) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(search) ||
            s.phone.includes(search) ||
            (s.email && s.email.toLowerCase().includes(search))
        );
    }

    // Status filter
    if (status) {
        filtered = filtered.filter(s => s.status === status);
    }

    // Course filter
    if (courseId) {
        filtered = filtered.filter(s =>
            s.student_enrollments?.some(e => e.course_id === courseId)
        );
    }

    renderStudents(filtered);
}

// ============================================
// ACTION MENU
// ============================================
function setupActionMenu() {
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('actionMenu');
        if (!e.target.closest('.action-btn') && !e.target.closest('.action-menu')) {
            menu.classList.remove('show');
        }
    });

    // Setup action handlers
    document.getElementById('actionView').addEventListener('click', () => {
        showToast('Student profile coming soon', 'info');
    });

    document.getElementById('actionEdit').addEventListener('click', () => {
        window.location.href = `add.html?id=${currentStudentId}`;
    });

    document.getElementById('actionPayment').addEventListener('click', () => {
        hideActionMenu();
        showPaymentModal(currentStudentId);
    });

    document.getElementById('actionReceipt').addEventListener('click', async () => {
        hideActionMenu();
        try {
            // Fetch latest payment for this student
            const { data: payments, error } = await supabase
                .from('fee_payments')
                .select('id')
                .eq('student_id', currentStudentId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (!payments || payments.length === 0) {
                showToast('No payments found for this student', 'info');
                return;
            }

            downloadReceipt(payments[0].id);
        } catch (error) {
            console.error('Error fetching latest payment:', error);
            showToast('Failed to generate receipt', 'error');
        }
    });

    document.getElementById('actionDeactivate').addEventListener('click', () => {
        hideActionMenu();
        showConfirmModal(
            'Deactivate Student',
            'Are you sure you want to deactivate this student? They will no longer appear in active lists.',
            async () => {
                await updateStudentStatus(currentStudentId, 'inactive');
            }
        );
    });
}

function showActionMenu(event, studentId) {
    event.stopPropagation();
    currentStudentId = studentId;

    const menu = document.getElementById('actionMenu');
    const rect = event.target.getBoundingClientRect();

    // Position menu
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left - 150}px`;

    // Show menu
    menu.classList.add('show');
}

function hideActionMenu() {
    document.getElementById('actionMenu').classList.remove('show');
}

async function updateStudentStatus(studentId, status) {
    try {
        const { error } = await supabase
            .from('students')
            .update({ status })
            .eq('id', studentId);

        if (error) throw error;

        showToast('Student status updated', 'success');
        loadStudents();
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Failed to update status', 'error');
    }
}

// ============================================
// PAYMENT MODAL
// ============================================
let currentPaymentStudent = null;

async function showPaymentModal(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    currentPaymentStudent = student;

    // Populate student info
    document.getElementById('paymentStudentAvatar').textContent = getInitials(student.name);
    document.getElementById('paymentStudentName').textContent = student.name;
    document.getElementById('paymentStudentPhone').textContent = `+91 ${student.phone}`;

    // Load enrollments with payment info
    await loadPaymentEnrollments(studentId);

    // Set default date to today
    document.getElementById('paymentDate').valueAsDate = new Date();

    // Show modal
    document.getElementById('paymentModal').classList.add('show');
}

async function loadPaymentEnrollments(studentId) {
    try {
        // Get enrollments with payment totals
        const { data: enrollments, error } = await supabase
            .from('student_enrollments')
            .select(`
                id,
                course_id,
                final_fee,
                courses (name, code)
            `)
            .eq('student_id', studentId);

        if (error) throw error;

        // Get payments grouped by enrollment
        const { data: payments, error: payError } = await supabase
            .from('fee_payments')
            .select('enrollment_id, amount')
            .eq('student_id', studentId);

        if (payError) throw payError;

        // Calculate paid amounts per enrollment
        const paymentsByEnrollment = {};
        (payments || []).forEach(p => {
            if (!paymentsByEnrollment[p.enrollment_id]) {
                paymentsByEnrollment[p.enrollment_id] = 0;
            }
            paymentsByEnrollment[p.enrollment_id] += parseFloat(p.amount);
        });

        // Render enrollments table
        const tbody = document.getElementById('paymentEnrollmentsBody');
        const courseSelect = document.getElementById('paymentCourse');

        tbody.innerHTML = '';
        courseSelect.innerHTML = '<option value="">Choose course...</option>';

        (enrollments || []).forEach(e => {
            const total = parseFloat(e.final_fee);
            const paid = paymentsByEnrollment[e.id] || 0;
            const balance = total - paid;

            // Table row
            tbody.innerHTML += `
                <tr>
                    <td>${e.courses?.name || 'Unknown'}</td>
                    <td>₹${formatCurrency(total)}</td>
                    <td class="text-success">₹${formatCurrency(paid)}</td>
                    <td class="${balance > 0 ? 'text-danger' : 'text-success'}">
                        ${balance > 0 ? '₹' + formatCurrency(balance) : '✓ Paid'}
                    </td>
                </tr>
            `;

            // Course dropdown option (only if balance > 0)
            if (balance > 0) {
                const option = document.createElement('option');
                option.value = e.id;
                option.textContent = `${e.courses?.name} (Balance: ₹${formatCurrency(balance)})`;
                option.dataset.balance = balance;
                courseSelect.appendChild(option);
            }
        });

    } catch (error) {
        console.error('Error loading enrollments:', error);
    }
}

function hidePaymentModal() {
    document.getElementById('paymentModal').classList.remove('show');
    document.getElementById('paymentForm').reset();
    currentPaymentStudent = null;
}

async function submitPayment() {
    const enrollmentId = document.getElementById('paymentCourse').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const mode = document.getElementById('paymentMode').value;
    const reference = document.getElementById('paymentReference').value.trim();
    const paymentDate = document.getElementById('paymentDate').value;
    const notes = document.getElementById('paymentNotes').value.trim();

    // Validate
    if (!enrollmentId) {
        showToast('Please select a course', 'error');
        return;
    }
    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    try {
        // Insert payment
        const { error } = await supabase
            .from('fee_payments')
            .insert({
                student_id: currentPaymentStudent.id,
                enrollment_id: enrollmentId,
                amount: amount,
                payment_mode: mode,
                reference_id: reference || null,
                payment_date: paymentDate || new Date().toISOString().split('T')[0],
                notes: notes || null
            });

        if (error) throw error;

        showToast('Payment recorded successfully!', 'success');
        hidePaymentModal();
        loadStudents(); // Refresh list

    } catch (error) {
        console.error('Error recording payment:', error);
        showToast('Failed to record payment: ' + error.message, 'error');
    }
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
// CONFIRM MODAL
// ============================================
let confirmCallback = null;

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalText').textContent = message;
    confirmCallback = onConfirm;

    document.getElementById('confirmModalAction').onclick = async () => {
        if (confirmCallback) {
            await confirmCallback();
        }
        hideConfirmModal();
    };

    document.getElementById('confirmModal').classList.add('show');
}

function hideConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
    confirmCallback = null;
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
