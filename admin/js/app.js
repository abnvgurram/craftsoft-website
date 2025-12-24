// Main App Router & View Manager
const viewContainer = document.getElementById('viewContainer');
const navItems = document.querySelectorAll('.nav-item');

const state = {
    currentView: 'dashboard',
    students: [],
    inquiries: [],
    loading: false
};

// --- VIEW UTILITIES ---
function setView(viewName) {
    state.currentView = viewName;

    // Update Active Nav
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Render View
    renderView();
}

// Attach Nav Listeners
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        setView(item.dataset.view);
        if (window.innerWidth <= 1024) toggleSidebar(); // Close sidebar on mobile after selection
    });
});

// --- RENDERER ---
async function renderView() {
    viewContainer.innerHTML = `<div class="skeleton" style="height: 400px; width: 100%;"></div>`;

    switch (state.currentView) {
        case 'dashboard':
            await renderDashboard();
            break;
        case 'students':
            await renderStudents();
            break;
        case 'inquiries':
            await renderInquiries();
            break;
        case 'payments':
            await renderPayments();
            break;
        case 'tutors':
            await renderTutors();
            break;
        case 'experts':
            await renderExperts();
            break;
        default:
            viewContainer.innerHTML = `<h1>Coming Soon: ${state.currentView}</h1>`;
    }
}

// --- DASHBOARD VIEW ---
async function renderDashboard() {
    const { data: students, error: sErr } = await supabase.from('students').select('*');
    const { data: inquiries, error: iErr } = await supabase.from('inquiries').select('*');

    const totalRevenue = students?.reduce((sum, s) => sum + (s.paid_amount || 0), 0) || 0;
    const pendingTotal = students?.reduce((sum, s) => sum + ((s.total_fee || 0) - (s.paid_amount || 0)), 0) || 0;

    viewContainer.innerHTML = `
        <div class="page-header">
            <h1>Dashboard Overview</h1>
            <p style="color: #64748b;">Welcome back, Admin</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <div class="card-title">Total Students</div>
                <div class="card-value">${students?.length || 0}</div>
            </div>
            <div class="card">
                <div class="card-title">Revenue (₹)</div>
                <div class="card-value">${totalRevenue.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-title">Pending (₹)</div>
                <div class="card-value" style="color: var(--danger);">${pendingTotal.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-title">Active Inquiries</div>
                <div class="card-value" style="color: var(--accent);">${inquiries?.length || 0}</div>
            </div>
        </div>

        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="font-weight: 700;">Recent Inquiries</h3>
                <button class="btn btn-primary btn-sm" onclick="setView('inquiries')">View All</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Course</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inquiries?.slice(0, 5).map(i => `
                            <tr>
                                <td style="font-weight: 600;">${i.name}</td>
                                <td>${i.course || 'N/A'}</td>
                                <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${i.status}</span></td>
                                <td style="font-size: 0.8rem; color: #64748b;">${new Date(i.created_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="4" style="text-align: center;">No inquiries found</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- STUDENTS VIEW ---
async function renderStudents() {
    const { data: students, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });

    viewContainer.innerHTML = `
        <div class="page-header">
            <h1>Students Management</h1>
            <button class="btn btn-primary" onclick="openAddStudentModal()">
                <span class="material-icons">add</span> New Student
            </button>
        </div>

        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Course</th>
                            <th>Fee Status</th>
                            <th>Balance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students?.map(s => {
        const bal = (s.total_fee || 0) - (s.paid_amount || 0);
        return `
                                <tr>
                                    <td>
                                        <div style="font-weight: 600;">${s.name}</div>
                                        <div style="font-size: 0.75rem; color: #64748b;">${s.phone}</div>
                                    </td>
                                    <td style="font-size: 0.85rem;">${s.course}</td>
                                    <td>
                                        <div style="font-size: 0.85rem; font-weight: 700;">₹${s.paid_amount || 0} / ₹${s.total_fee || 0}</div>
                                        <div style="width: 100%; height: 4px; background: #f1f5f9; border-radius: 2px; margin-top: 4px;">
                                            <div style="width: ${(s.paid_amount / s.total_fee) * 100 || 0}%; height: 100%; background: var(--success); border-radius: 2px;"></div>
                                        </div>
                                    </td>
                                    <td style="color: ${bal > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight: 700;">₹${bal.toLocaleString()}</td>
                                    <td>
                                        <button class="btn btn-outline" style="padding: 6px;" title="Edit">
                                            <span class="material-icons" style="font-size: 18px;">edit</span>
                                        </button>
                                    </td>
                                </tr>
                            `;
    }).join('') || '<tr><td colspan="5" style="text-align: center;">No students yet</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- PLACEHOLDERS FOR OTHER VIEWS ---
async function renderInquiries() { viewContainer.innerHTML = '<h1>Inquiries View (Coming Soon)</h1>'; }
async function renderPayments() { viewContainer.innerHTML = '<h1>Payments View (Coming Soon)</h1>'; }
async function renderTutors() { viewContainer.innerHTML = '<h1>Tutors View (Coming Soon)</h1>'; }
async function renderExperts() { viewContainer.innerHTML = '<h1>Experts View (Coming Soon)</h1>'; }

// TOAST UTILITY
function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="material-icons">${type === 'success' ? 'check_circle' : 'error'}</span><span>${msg}</span>`;
    document.getElementById('toastContainer').appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// GLOBAL EXPORTS
window.initDashboard = () => setView('dashboard');
window.showToast = showToast;
window.setView = setView;
