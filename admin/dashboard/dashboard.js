document.addEventListener('DOMContentLoaded', async () => {
    const { NavigationSecurity } = window.AdminUtils || {};

    const session = await window.supabaseConfig.getSession();
    if (!session) {
        window.location.href = '../login.html';
        return;
    }

    // Init Sidebar
    AdminSidebar.init('dashboard');

    // Render Header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = AdminHeader.render('Dashboard');
    }

    // Render Account Panel & Dashboard Content
    const admin = await window.Auth.getCurrentAdmin();
    if (admin) {
        await AdminSidebar.renderAccountPanel(session, admin);
        renderDashboard(admin);
    }
});

function renderDashboard(admin) {
    const content = document.getElementById('dashboard-content');

    content.innerHTML = `
        <div class="welcome-card">
            <div class="welcome-icon">
                <i class="fa-solid fa-chart-pie"></i>
            </div>
            <h2 class="welcome-title">Welcome back, ${admin?.full_name || 'Admin'}!</h2>
            <p class="welcome-text">Select a module from the sidebar to manage students, tutors, courses, and more.</p>
        </div>
    `;
}
