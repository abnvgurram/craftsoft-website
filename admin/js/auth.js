/* ============================================
   CRAFTSOFT ADMIN - Authentication Logic
   Enhanced Security: Per-tab sessions, inactivity timeout,
   back/forward protection, history protection
   ============================================ */

// ============================================
// SESSION SECURITY CONFIGURATION
// ============================================
const SESSION_CONFIG = {
    INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes in ms
    TAB_SESSION_KEY: 'craftsoft_tab_session',
    LAST_ACTIVITY_KEY: 'craftsoft_last_activity'
};

// ============================================
// TAB SESSION MANAGEMENT
// ============================================

// Generate unique tab session ID
function generateTabSessionId() {
    return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Create tab session after successful login
function createTabSession() {
    const tabSessionId = generateTabSessionId();
    sessionStorage.setItem(SESSION_CONFIG.TAB_SESSION_KEY, tabSessionId);
    updateLastActivity();
    return tabSessionId;
}

// Validate tab session exists
function hasValidTabSession() {
    return sessionStorage.getItem(SESSION_CONFIG.TAB_SESSION_KEY) !== null;
}

// Clear tab session
function clearTabSession() {
    sessionStorage.removeItem(SESSION_CONFIG.TAB_SESSION_KEY);
    sessionStorage.removeItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
}

// ============================================
// INACTIVITY TIMEOUT MANAGEMENT
// ============================================

// Update last activity timestamp
function updateLastActivity() {
    sessionStorage.setItem(SESSION_CONFIG.LAST_ACTIVITY_KEY, Date.now().toString());
}

// Check if session has expired due to inactivity
function isSessionExpired() {
    const lastActivity = sessionStorage.getItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
    if (!lastActivity) return true;

    const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
    return timeSinceActivity > SESSION_CONFIG.INACTIVITY_TIMEOUT;
}

// Start activity tracking (call on protected pages)
function startActivityTracking() {
    // Update on any user interaction
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, updateLastActivity, { passive: true });
    });

    // Check for inactivity every minute
    setInterval(checkInactivity, 60000);
}

// Check inactivity and logout if expired
async function checkInactivity() {
    if (isSessionExpired()) {
        console.log('Session expired due to inactivity');
        await forceLogout('Your session expired due to inactivity');
    }
}

// ============================================
// BACK/FORWARD & HISTORY PROTECTION
// ============================================

// Prevent back navigation to protected pages after logout
function setupHistoryProtection() {
    // Replace current history entry (prevents back to this page after logout)
    window.history.replaceState(null, '', window.location.href);

    // Handle back-forward cache (bfcache)
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            // Page was loaded from bfcache, re-validate session
            validateSessionOrRedirect();
        }
    });

    // Prevent caching of authenticated content
    window.addEventListener('beforeunload', function () {
        // This helps prevent caching issues
    });
}

// Validate session or redirect to login
async function validateSessionOrRedirect() {
    const { data: { session } } = await window.supabase.auth.getSession();

    if (!session || !hasValidTabSession() || isSessionExpired()) {
        clearTabSession();
        window.location.replace('/admin/index.html');
    }
}

// ============================================
// AUTH FUNCTIONS (Enhanced)
// ============================================

// Check if user is already logged in (for login page only)
async function checkExistingSession() {
    const { data: { session } } = await window.supabase.auth.getSession();

    // Only redirect if BOTH Supabase session AND tab session exist
    if (session && hasValidTabSession() && !isSessionExpired()) {
        window.location.replace('/admin/dashboard.html');
    } else if (session && !hasValidTabSession()) {
        // Supabase has session but tab doesn't - clear Supabase session
        // This ensures new tab requires login
        await window.supabase.auth.signOut();
    }
}

// Check if user is logged in (for protected pages)
async function requireAuth() {
    const { data: { session } } = await window.supabase.auth.getSession();

    // Check all conditions: Supabase session, tab session, and not expired
    if (!session || !hasValidTabSession() || isSessionExpired()) {
        clearTabSession();
        window.location.replace('/admin/index.html');
        return null;
    }

    // Session valid - update activity and setup protections
    updateLastActivity();
    startActivityTracking();
    setupHistoryProtection();

    return session;
}

// Get admin profile
async function getAdminProfile(userId) {
    const { data, error } = await window.supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

// Generate Employee ID
async function generateEmployeeId() {
    try {
        const { data, error } = await window.supabase
            .from('admin_profiles')
            .select('employee_id')
            .order('employee_id', { ascending: false })
            .limit(1);

        let nextNumber = 1;

        if (data && data.length > 0) {
            const lastId = data[0].employee_id;
            const match = lastId.match(/ACS-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        return `ACS-${String(nextNumber).padStart(4, '0')}`;
    } catch (err) {
        console.error('Error generating employee ID:', err);
        return `ACS-${Date.now().toString().slice(-4)}`;
    }
}

// Sign Up
async function signUp(firstName, lastName, email, password, phone) {
    try {
        const { data: authData, error: authError } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName
                }
            }
        });

        if (authError) throw authError;

        const employeeId = await generateEmployeeId();

        const { error: profileError } = await window.supabase
            .from('admin_profiles')
            .insert({
                id: authData.user.id,
                employee_id: employeeId,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone || null
            });

        if (profileError) throw profileError;

        return { success: true, employeeId: employeeId };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
    }
}

// Sign In (Enhanced - creates tab session)
async function signIn(email, password) {
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Create tab-specific session
        createTabSession();

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign Out (Enhanced - clears all sessions and protects history)
async function signOut() {
    try {
        // Clear tab session first
        clearTabSession();

        // Sign out from Supabase
        const { error } = await window.supabase.auth.signOut();
        if (error) throw error;

        // Replace history to prevent back navigation
        window.location.replace('/admin/index.html');
    } catch (error) {
        console.error('Sign out error:', error);
        // Force redirect even on error
        clearTabSession();
        window.location.replace('/admin/index.html');
    }
}

// Force Logout (for expired sessions)
async function forceLogout(message) {
    clearTabSession();
    await window.supabase.auth.signOut();

    // Store message to show on login page
    sessionStorage.setItem('logout_message', message || 'You have been logged out');
    window.location.replace('/admin/index.html');
}

// Password Reset
async function resetPassword(email) {
    try {
        const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/admin/reset-password.html'
        });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Toggle Password Visibility
function togglePassword(inputId, toggleBtn) {
    const input = document.getElementById(inputId);
    const icon = toggleBtn.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Show Alert
function showAlert(containerId, type, message) {
    const container = document.getElementById(containerId);
    container.className = `alert alert-${type} show`;
    container.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
}

// Check for logout message (show on login page)
function checkLogoutMessage() {
    const message = sessionStorage.getItem('logout_message');
    if (message) {
        sessionStorage.removeItem('logout_message');
        return message;
    }
    return null;
}

// Validate Email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate Phone (Indian format)
function isValidPhone(phone) {
    if (!phone) return true;
    return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

console.log('🔐 Enhanced Auth module loaded with per-tab sessions');
