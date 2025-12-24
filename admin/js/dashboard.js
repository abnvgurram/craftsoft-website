// Dashboard Logic - Migrated and Fully Restored UI
let allStudents = [];
let allInquiries = [];

// Set current date
const dateEl = document.getElementById('currentDate');
if (dateEl) dateEl.textContent = formatDate(new Date());

async function loadDashboardData() {
    try {
        if (typeof showTableSkeleton === 'function') showTableSkeleton('recentStudentsTable', 5, 5);

        // Fetch Data in Parallel
        const [studentsRes, inquiriesRes] = await Promise.all([
            supabase.from('students').select('*').order('created_at', { ascending: false }),
            supabase.from('inquiries').select('*').order('created_at', { ascending: false })
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (inquiriesRes.error) throw inquiriesRes.error;

        allStudents = studentsRes.data;
        allInquiries = inquiriesRes.data;

        calculateKpis();
        updateRecentStudentsTable();
        renderUpcomingDemos();
    } catch (e) {
        console.error('Dashboard Load Error:', e);
        if (typeof showToast === 'function') showToast('Error loading stats', 'error');
    }
}

function calculateKpis() {
    let revenue = 0;
    let pending = 0;
    let paidCount = 0;

    allStudents.forEach(s => {
        revenue += s.paid_amount || 0;
        const bal = (s.total_fee || 0) - (s.paid_amount || 0);
        pending += bal;
        if (bal <= 0) paidCount++;
    });

    // Update UI with count animations if possible
    animateValue('totalStudents', allStudents.length);
    animateValue('totalRevenue', revenue, true);
    animateValue('pendingAmount', pending, true);
    animateValue('paidStudents', paidCount);
}

function updateRecentStudentsTable() {
    const tbody = document.getElementById('recentStudentsTable');
    if (!tbody) return;

    const recent = allStudents.slice(0, 5);
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">No students yet</td></tr>';
        return;
    }

    tbody.innerHTML = recent.map(s => {
        const bal = (s.total_fee || 0) - (s.paid_amount || 0);
        const status = bal <= 0 ? 'paid' : (s.paid_amount > 0 ? 'partial' : 'pending');
        return `
            <tr>
                <td><strong>${s.name}</strong><br><small style="color:#64748b">${s.phone}</small></td>
                <td><div style="font-size:0.85rem">${s.course}</div></td>
                <td>${formatCurrency(s.total_fee)}</td>
                <td style="color:#10B981; font-weight:600;">${formatCurrency(s.paid_amount)}</td>
                <td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-icon" onclick="viewStudentQuick('${s.id}')">
                        <span class="material-icons">visibility</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderUpcomingDemos() {
    const container = document.getElementById('upcomingDemosContainer');
    if (!container) return;

    const upcoming = allInquiries
        .filter(i => i.status === 'demo-scheduled' && i.demo_date)
        .sort((a, b) => new Date(a.demo_date) - new Date(b.demo_date))
        .slice(0, 3);

    if (upcoming.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#64748b; font-size:0.85rem;">No upcoming demos</div>';
        return;
    }

    container.innerHTML = upcoming.map(i => `
        <div class="demo-item" style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #f1f5f9;">
            <div style="background:#fef3c7; color:#92400e; padding:8px; border-radius:8px;"><span class="material-icons">event</span></div>
            <div style="flex:1;">
                <div style="font-weight:600; font-size:0.9rem;">${i.name}</div>
                <div style="font-size:0.75rem; color:#64748b;">${i.course} • ${formatDateTime(i.demo_date)}</div>
            </div>
        </div>
    `).join('');
}

function animateValue(id, target, isCurrency = false) {
    const el = document.getElementById(id);
    if (!el) return;

    let current = 0;
    const duration = 1000;
    const start = performance.now();

    function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const val = Math.floor(progress * target);
        el.textContent = isCurrency ? formatCurrency(val) : val;
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = isCurrency ? formatCurrency(target) : target;
    }
    requestAnimationFrame(update);
}

async function viewStudentQuick(id) {
    try {
        const { data: s } = await supabase.from('students').select('*').eq('id', id).single();
        if (!s) return;

        const bal = (s.total_fee || 0) - (s.paid_amount || 0);
        document.getElementById('quickViewContent').innerHTML = `
            <div style="text-align:center; padding:10px;">
                <div style="width:60px; height:60px; background:var(--primary-100); color:var(--primary-600); border-radius:30px; display:flex; align-items:center; justify-content:center; margin:0 auto 15px;">
                    <span class="material-icons" style="font-size:30px;">person</span>
                </div>
                <h3 style="margin:0;">${s.name}</h3>
                <p style="color:#64748b; margin:5px 0;">${s.course}</p>
                <div style="margin-top:20px; display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div style="background:#f8fafc; padding:10px; border-radius:8px;">
                        <div style="font-size:0.75rem; color:#64748b;">TOTAL FEE</div>
                        <div style="font-weight:700;">${formatCurrency(s.total_fee)}</div>
                    </div>
                    <div style="background:#ecfdf5; padding:10px; border-radius:8px;">
                        <div style="font-size:0.75rem; color:#10b981;">PAID</div>
                        <div style="font-weight:700; color:#10b981;">${formatCurrency(s.paid_amount)}</div>
                    </div>
                </div>
                <div style="margin-top:10px; padding:12px; background:${bal > 0 ? '#fff1f2' : '#f0fdf4'}; border-radius:8px; color:${bal > 0 ? '#e11d48' : '#16a34a'}; font-weight:600;">
                    ${bal > 0 ? `Balance Due: ${formatCurrency(bal)}` : 'Fees Fully Paid ✅'}
                </div>
                <div style="margin-top:20px; display:flex; gap:10px;">
                    <a href="students.html?id=${s.id}" class="btn btn-primary" style="flex:1; text-decoration:none; font-size:0.85rem;">Full Profile</a>
                </div>
            </div>`;
        document.getElementById('quickViewModal').classList.add('active');
    } catch (e) { console.error(e); }
}

// Helpers
function formatCurrency(n) { return '₹' + (n || 0).toLocaleString('en-IN'); }
function formatDate(d) { return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function formatDateTime(iso) { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

window.viewStudentQuick = viewStudentQuick;
window.closeModal = (id) => document.getElementById(id)?.classList.remove('active');

document.addEventListener('DOMContentLoaded', loadDashboardData);
