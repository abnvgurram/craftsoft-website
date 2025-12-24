// Authentication Logic
const loginOverlay = document.getElementById('loginOverlay');
const appContainer = document.getElementById('app');
const loginForm = document.getElementById('loginForm');

async function checkAuth() {
    const { data: { session } } = await window.supabase.auth.getSession();

    if (session) {
        showApp();
    } else {
        showLogin();
    }
}

function showApp() {
    loginOverlay.style.display = 'none';
    appContainer.style.display = 'flex';
    // Initialize Dashboard after showing app
    if (window.initDashboard) window.initDashboard();
}

function showLogin() {
    loginOverlay.style.display = 'flex';
    appContainer.style.display = 'none';
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btn = e.target.querySelector('button');

        btn.disabled = true;
        btn.textContent = 'Verifying...';

        const { error } = await window.supabase.auth.signInWithPassword({ email, password });

        if (error) {
            alert('Invalid credentials: ' + error.message);
            btn.disabled = false;
            btn.textContent = 'Sign In';
        } else {
            showApp();
        }
    });
}

async function handleLogout() {
    await window.supabase.auth.signOut();
    location.reload();
}

// Sidebar Toggle Utility
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sb.classList.toggle('open');
    overlay.classList.toggle('show');
}

document.addEventListener('DOMContentLoaded', checkAuth);
