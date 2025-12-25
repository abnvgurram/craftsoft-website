/* ============================================
   Dashboard Core Logic
   - Auth check
   - Session protection
   - Single tab enforcement
   - Sidebar navigation
   - Logout
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
    // ============================================
    // SINGLE TAB ENFORCEMENT
    // ============================================

    const SESSION_KEY = 'craftsoft_admin_session_tab';
    const tabId = Date.now().toString() + Math.random().toString(36);

    // Check if another tab is already open
    const existingTab = sessionStorage.getItem(SESSION_KEY);

    if (existingTab && existingTab !== tabId) {
        // Another tab is already open - redirect to signin
        alert('Admin session is already open in another tab. Please use that tab.');
        window.location.replace('signin.html');
        return;
    }

    // Mark this tab as the active one
    sessionStorage.setItem(SESSION_KEY, tabId);

    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === SESSION_KEY && e.newValue !== tabId) {
            // Another tab took over or cleared the session
            window.location.replace('signin.html');
        }
    });

    // Clear on unload
    window.addEventListener('beforeunload', () => {
        if (sessionStorage.getItem(SESSION_KEY) === tabId) {
            sessionStorage.removeItem(SESSION_KEY);
        }
    });

    // ============================================
    // SESSION PROTECTION
    // ============================================

    // Prevent caching and back/forward
    if (window.history && window.history.pushState) {
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', () => {
            window.history.pushState(null, '', window.location.href);
        });
    }

    // ============================================
    // AUTH CHECK
    // ============================================

    async function checkAuth() {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();

            if (!session || !session.user) {
                // Not logged in - redirect to signin
                window.location.replace('signin.html');
                return null;
            }

            // Check if email is verified
            if (!session.user.email_confirmed_at) {
                await window.supabaseClient.auth.signOut();
                window.location.replace('signin.html');
                return null;
            }

            return session;
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.replace('signin.html');
            return null;
        }
    }

    const session = await checkAuth();
    if (!session) return;

    // ============================================
    // LOAD ADMIN DATA
    // ============================================

    async function loadAdminData() {
        try {
            const { data: admin, error } = await window.supabaseClient
                .from('admins')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error || !admin) {
                console.error('Failed to load admin data:', error);
                return null;
            }

            return admin;
        } catch (e) {
            console.error('Error loading admin:', e);
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

    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();

            window.modal.confirm(
                'Logout',
                'Are you sure you want to logout?',
                async () => {
                    try {
                        await window.supabaseClient.auth.signOut();

                        // Clear any cached data
                        sessionStorage.clear();
                        localStorage.removeItem('sb-pklhwfipldiswdboobua-auth-token');

                        // Redirect to signin
                        window.location.replace('signin.html');
                    } catch (error) {
                        console.error('Logout error:', error);
                        window.location.replace('signin.html');
                    }
                }
            );
        });
    });

    // ============================================
    // LISTEN FOR AUTH STATE CHANGES
    // ============================================

    window.supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
            window.location.replace('signin.html');
        }
    });
});
