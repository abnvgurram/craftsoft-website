// Dashboard Module
const ACTIVITIES_KEY = 'craftsoft_admin_activities';

document.addEventListener('DOMContentLoaded', async () => {
    const session = await window.supabaseConfig.getSession();
    if (!session) {
        window.location.href = '../login.html';
        return;
    }

    AdminSidebar.init('dashboard');

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = AdminHeader.render('Dashboard');
    }

    const admin = await window.Auth.getCurrentAdmin();
    await AdminSidebar.renderAccountPanel(session, admin);

    // Load Dashboard Data
    await loadStats();
    loadActivities();

    // Bind Clear All
    document.getElementById('clear-all-activities')?.addEventListener('click', clearAllActivities);
});

// =====================
// Stats Loading
// =====================
async function loadStats() {
    try {
        // Total Students
        const { count: studentCount } = await window.supabaseClient
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ACTIVE');
        document.getElementById('total-students').textContent = studentCount || 0;

        // Active Courses
        const { count: courseCount } = await window.supabaseClient
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ACTIVE');
        document.getElementById('total-courses').textContent = courseCount || 0;

        // Total Tutors
        const { count: tutorCount } = await window.supabaseClient
            .from('tutors')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ACTIVE');
        document.getElementById('total-tutors').textContent = tutorCount || 0;

        // Demos Today
        const today = new Date().toISOString().split('T')[0];
        const { count: demosToday } = await window.supabaseClient
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('demo_scheduled', true)
            .eq('demo_date', today);
        document.getElementById('demos-today').textContent = demosToday || 0;

        // Students Joined This Week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: joinedWeek } = await window.supabaseClient
            .from('students')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', weekAgo.toISOString());
        document.getElementById('joined-week').textContent = joinedWeek || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// =====================
// Activities Management
// =====================
function getActivities() {
    try {
        const data = localStorage.getItem(ACTIVITIES_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveActivities(activities) {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

function addActivity(type, name, link = null) {
    const activities = getActivities();
    activities.unshift({
        id: Date.now(),
        type,
        name,
        link,
        timestamp: new Date().toISOString()
    });
    // Keep only last 50
    saveActivities(activities.slice(0, 50));
}

function removeActivity(id) {
    const activities = getActivities().filter(a => a.id !== id);
    saveActivities(activities);
    loadActivities();
}

function clearAllActivities() {
    saveActivities([]);
    loadActivities();
}

function getRelativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getActivityIcon(type) {
    const icons = {
        'student_added': { icon: 'fa-user-graduate', class: 'activity-icon-student' },
        'tutor_added': { icon: 'fa-chalkboard-user', class: 'activity-icon-tutor' },
        'course_added': { icon: 'fa-book-bookmark', class: 'activity-icon-course' },
        'fee_updated': { icon: 'fa-book-bookmark', class: 'activity-icon-course' },
        'fee_recorded': { icon: 'fa-indian-rupee-sign', class: 'activity-icon-fee' },
        'receipt_generated': { icon: 'fa-receipt', class: 'activity-icon-receipt' },
        'inquiry_added': { icon: 'fa-phone', class: 'activity-icon-inquiry' },
        'demo_scheduled': { icon: 'fa-calendar-check', class: 'activity-icon-demo' }
    };
    return icons[type] || { icon: 'fa-circle-info', class: 'activity-icon-student' };
}

function getActivityText(type) {
    const texts = {
        'student_added': 'Student added',
        'tutor_added': 'Tutor added',
        'course_added': 'Course added',
        'fee_updated': 'Course fee updated',
        'fee_recorded': 'Fee recorded',
        'receipt_generated': 'Receipt generated',
        'inquiry_added': 'Inquiry added',
        'demo_scheduled': 'Demo scheduled'
    };
    return texts[type] || 'Activity';
}

function loadActivities() {
    const list = document.getElementById('activities-list');
    const activities = getActivities();

    if (activities.length === 0) {
        list.innerHTML = `
            <div class="activities-empty">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <p>No recent activities</p>
            </div>
        `;
        return;
    }

    list.innerHTML = activities.map(a => {
        const iconInfo = getActivityIcon(a.type);
        const text = getActivityText(a.type);
        const time = getRelativeTime(a.timestamp);

        return `
            <div class="activity-item" data-link="${a.link || ''}" data-id="${a.id}">
                <div class="activity-icon ${iconInfo.class}">
                    <i class="fa-solid ${iconInfo.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${text}: <strong>${a.name}</strong></div>
                    <div class="activity-time">${time}</div>
                </div>
                <button class="activity-remove" title="Remove">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    }).join('');

    // Bind click events
    list.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't navigate if clicking remove button
            if (e.target.closest('.activity-remove')) return;

            const link = item.dataset.link;
            if (link) {
                window.location.href = link;
            }
        });
    });

    // Bind remove buttons
    list.querySelectorAll('.activity-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.closest('.activity-item').dataset.id);
            removeActivity(id);
        });
    });
}

// Export addActivity for other modules
window.DashboardActivities = {
    add: addActivity
};
