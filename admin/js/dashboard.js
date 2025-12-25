/* ============================================
   DASHBOARD MANAGEMENT - JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
    // Check if logged in
    const session = await requireAuth();
    if (!session) return;

    // Get profile
    const profile = await getAdminProfile(session.user.id);

    if (profile) {
        const fullName = `${profile.first_name} ${profile.last_name}`;
        document.getElementById('userName').textContent = fullName;
        document.getElementById('welcomeName').textContent = profile.first_name;
    } else {
        const email = session.user.email;
        document.getElementById('userName').textContent = email;
        document.getElementById('welcomeName').textContent = 'Admin';
    }

    // Load stats
    await loadDashboardStats();

    // Load Recent Activity
    await loadRecentActivity();

    // Show dashboard
    document.getElementById('adminLayout').style.display = 'flex';

    // Setup sidebar
    setupSidebar();
}

async function loadDashboardStats() {
    try {
        // 1. Get student count
        const { count: studentCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });

        document.getElementById('totalStudents').textContent = studentCount || 0;

        // 2. Get payment stats (Total Collected)
        const { data: payments } = await supabase
            .from('fee_payments')
            .select('amount, payment_date');

        const totalCollected = payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
        document.getElementById('totalCollected').textContent = '₹' + formatCurrency(totalCollected);

        // 3. Get pending fees from enrollments
        const { data: enrollments } = await supabase
            .from('student_enrollments')
            .select('final_fee');

        const totalFees = enrollments?.reduce((sum, e) => sum + parseFloat(e.final_fee || 0), 0) || 0;
        const pending = totalFees - totalCollected;
        document.getElementById('pendingFees').textContent = '₹' + formatCurrency(pending > 0 ? pending : 0);

        // 4. Get active course count
        const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        document.getElementById('activeCourses').textContent = courseCount || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentActivity() {
    const listContainer = document.getElementById('recentActivityList');
    if (!listContainer) return;

    try {
        // Fetch last 5 payments
        const { data: recentPayments, error } = await supabase
            .from('fee_payments')
            .select(`
                id,
                amount,
                payment_date,
                students (name),
                student_enrollments (courses (name))
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (!recentPayments || recentPayments.length === 0) {
            listContainer.innerHTML = '<div class="empty-activity">No recent activity</div>';
            return;
        }

        listContainer.innerHTML = recentPayments.map(payment => `
            <div class="activity-item">
                <div class="activity-icon payment">
                    <i class="fas fa-indian-rupee-sign"></i>
                </div>
                <div class="activity-details">
                    <p class="activity-text">
                        <strong>${payment.students?.name || 'Unknown'}</strong> paid 
                        <span class="activity-amount">₹${formatCurrency(payment.amount)}</span> 
                        for <strong>${payment.student_enrollments?.courses?.name || 'Course'}</strong>
                    </p>
                    <span class="activity-time">${formatRelativeTime(payment.payment_date)}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading activity:', error);
        listContainer.innerHTML = '<div class="error-activity">Failed to load activity</div>';
    }
}



function formatRelativeTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' min ago';
    if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + ' hours ago';

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
    });
}

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

// Logout Modal Functions
function showLogoutModal() {
    document.getElementById('logoutModal').classList.add('show');
}

function hideLogoutModal() {
    document.getElementById('logoutModal').classList.remove('show');
}

async function confirmLogout() {
    await signOut();
}

// Close modal on overlay click
document.getElementById('logoutModal').addEventListener('click', function (e) {
    if (e.target === this) {
        hideLogoutModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        hideLogoutModal();
    }
});
