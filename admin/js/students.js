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
            <td>₹${formatNumber(student.totalFee)}</td>
            <td class="text-success">₹${formatNumber(student.totalPaid)}</td>
            <td class="${student.balance > 0 ? 'text-danger' : 'text-success'}">
                ${student.balance > 0 ? '₹' + formatNumber(student.balance) : '✓ Paid'}
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
                    <span class="value">₹${formatNumber(student.totalFee)}</span>
                </div>
                <div class="card-row">
                    <span class="label">Paid</span>
                    <span class="value text-success">₹${formatNumber(student.totalPaid)}</span>
                </div>
                <div class="card-row">
                    <span class="label">Balance</span>
                    <span class="value ${student.balance > 0 ? 'text-danger' : 'text-success'}">
                        ${student.balance > 0 ? '₹' + formatNumber(student.balance) : '✓ Paid'}
                    </span>
                </div>
            </div>
            <div class="card-actions">
                <a href="student-profile.html?id=${student.id}" class="btn btn-outline btn-sm">
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
        window.location.href = `student-profile.html?id=${currentStudentId}`;
    });

    document.getElementById('actionEdit').addEventListener('click', () => {
        window.location.href = `add-student.html?id=${currentStudentId}`;
    });

    document.getElementById('actionPayment').addEventListener('click', () => {
        window.location.href = `student-profile.html?id=${currentStudentId}&action=payment`;
    });

    document.getElementById('actionReceipt').addEventListener('click', () => {
        window.location.href = `student-profile.html?id=${currentStudentId}&action=receipt`;
    });

    document.getElementById('actionDeactivate').addEventListener('click', async () => {
        if (confirm('Are you sure you want to deactivate this student?')) {
            await updateStudentStatus(currentStudentId, 'inactive');
        }
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

function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(message, type = 'info') {
    // Simple toast - can enhance later
    alert(message);
}
