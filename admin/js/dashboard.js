/* ============================================
   Dashboard Core Logic - WITH DEBUG PANEL
   ============================================ */

// DEBUG PANEL - Shows errors on screen
function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debugPanel';
    panel.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 350px;
        max-height: 300px;
        background: #1e293b;
        color: #10b981;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        border-radius: 8px;
        overflow-y: auto;
        z-index: 99999;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    `;
    panel.innerHTML = '<div style="color:#f59e0b;font-weight:bold;margin-bottom:5px;">🔧 DEBUG PANEL</div>';
    document.body.appendChild(panel);
    return panel;
}

function debugLog(msg, type = 'info') {
    const panel = document.getElementById('debugPanel') || createDebugPanel();
    const colors = { info: '#3b82f6', success: '#10b981', error: '#ef4444', warn: '#f59e0b' };
    const time = new Date().toLocaleTimeString();
    panel.innerHTML += `<div style="color:${colors[type]};margin:2px 0;">[${time}] ${msg}</div>`;
    panel.scrollTop = panel.scrollHeight;
    console.log(`[DEBUG ${type}]`, msg);
}

// Catch all errors
window.onerror = function (msg, url, line, col, error) {
    debugLog(`ERROR: ${msg} at line ${line}`, 'error');
    return false;
};

document.addEventListener('DOMContentLoaded', async () => {
    debugLog('DOMContentLoaded fired', 'info');

    // ============================================
    // SESSION PROTECTION (back/forward)
    // ============================================

    if (window.history && window.history.pushState) {
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', () => {
            window.history.pushState(null, '', window.location.href);
        });
    }
    debugLog('Session protection set', 'success');

    // ============================================
    // AUTH CHECK
    // ============================================

    async function checkAuth() {
        debugLog('Checking auth...', 'info');
        try {
            if (!window.supabaseClient) {
                debugLog('supabaseClient is undefined!', 'error');
                return null;
            }
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            debugLog(`Session: ${session ? 'exists' : 'null'}`, session ? 'success' : 'warn');

            if (!session || !session.user) {
                debugLog('No session, redirecting...', 'warn');
                window.location.replace('signin.html');
                return null;
            }

            if (!session.user.email_confirmed_at) {
                debugLog('Email not confirmed, redirecting...', 'warn');
                window.location.replace('signin.html');
                return null;
            }

            debugLog('Auth OK: ' + session.user.email, 'success');
            return session;
        } catch (error) {
            debugLog('Auth error: ' + error.message, 'error');
            window.location.replace('signin.html');
            return null;
        }
    }

    const session = await checkAuth();
    if (!session) {
        debugLog('No session, stopping here', 'error');
        return;
    }

    // ============================================
    // LOAD ADMIN DATA
    // ============================================

    async function loadAdminData() {
        debugLog('Loading admin data...', 'info');
        try {
            const { data: admin, error } = await window.supabaseClient
                .from('admins')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error || !admin) {
                debugLog('Admin load error: ' + (error?.message || 'no data'), 'error');
                return null;
            }

            debugLog('Admin loaded: ' + admin.admin_id, 'success');
            return admin;
        } catch (e) {
            debugLog('Admin load exception: ' + e.message, 'error');
            return null;
        }
    }

    const admin = await loadAdminData();

    // Update UI with admin info
    if (admin) {
        const adminNameEl = document.getElementById('adminName');
        const adminIdEl = document.getElementById('adminId');
        const adminAvatarEl = document.getElementById('adminAvatar');
        const welcomeNameEl = document.getElementById('welcomeName');
        const welcomeIdEl = document.getElementById('welcomeAdminId');
        const welcomeEmailEl = document.getElementById('welcomeEmail');

        if (adminNameEl) adminNameEl.textContent = admin.full_name;
        if (adminIdEl) adminIdEl.textContent = admin.admin_id;
        if (adminAvatarEl) adminAvatarEl.textContent = admin.full_name.charAt(0).toUpperCase();
        if (welcomeNameEl) welcomeNameEl.textContent = admin.full_name.split(' ')[0];
        if (welcomeIdEl) welcomeIdEl.textContent = admin.admin_id;
        if (welcomeEmailEl) welcomeEmailEl.textContent = admin.email;
        debugLog('UI updated', 'success');
    }

    // ============================================
    // MOBILE MENU
    // ============================================

    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');

    function openSidebar() {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openSidebar);
    }

    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // ============================================
    // UNDER MAINTENANCE MODAL
    // ============================================

    const maintenanceLinks = document.querySelectorAll('[data-maintenance]');

    maintenanceLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeSidebar();

            const pageName = link.getAttribute('data-maintenance');
            showMaintenanceModal(pageName);
        });
    });

    function showMaintenanceModal(pageName) {
        window.modal.show({
            type: 'warning',
            title: 'Under Maintenance',
            message: `<strong>${pageName}</strong> is currently under development.<br><br>This feature will be available soon!`,
            buttons: [
                {
                    text: 'Got it',
                    type: 'primary'
                }
            ]
        });
    }

    // ============================================
    // LOGOUT
    // ============================================

    const logoutBtns = document.querySelectorAll('[data-logout]');
    debugLog('Found ' + logoutBtns.length + ' logout buttons', 'info');

    logoutBtns.forEach((btn, i) => {
        debugLog('Adding listener to logout btn ' + i, 'info');
        btn.addEventListener('click', (e) => {
            debugLog('Logout button clicked!', 'success');
            e.preventDefault();
            e.stopPropagation();
            debugLog('Redirecting to signin...', 'info');
            window.location.href = 'signin.html';
        });
    });

    debugLog('Dashboard fully loaded!', 'success');
});
