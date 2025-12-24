/* ============================================
   CRAFTSOFT ADMIN - Authentication Logic
   ============================================ */

// Check if user is already logged in (for login/signup pages)
async function checkExistingSession() {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
    }
}

// Check if user is logged in (for protected pages)
async function requireAuth() {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return null;
    }
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
        // Get all existing employee IDs to find the highest number
        const { data, error } = await window.supabase
            .from('admin_profiles')
            .select('employee_id')
            .order('employee_id', { ascending: false })
            .limit(1);

        let nextNumber = 1;

        if (data && data.length > 0) {
            // Extract number from last ID (e.g., "ACS-0001" -> 1)
            const lastId = data[0].employee_id;
            const match = lastId.match(/ACS-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        return `ACS-${String(nextNumber).padStart(4, '0')}`;
    } catch (err) {
        console.error('Error generating employee ID:', err);
        // Fallback: use timestamp-based ID
        return `ACS-${Date.now().toString().slice(-4)}`;
    }
}

// Sign Up
async function signUp(firstName, lastName, email, password, phone) {
    try {
        // First, sign up with Supabase Auth
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

        // Generate employee ID
        const employeeId = await generateEmployeeId();

        // Create profile in admin_profiles table
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

// Sign In
async function signIn(email, password) {
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign Out
async function signOut() {
    try {
        const { error } = await window.supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Sign out error:', error);
        alert('Error signing out. Please try again.');
    }
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

// Validate Email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate Phone (Indian format)
function isValidPhone(phone) {
    if (!phone) return true; // Optional field
    return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

console.log('🔐 Auth module loaded');
