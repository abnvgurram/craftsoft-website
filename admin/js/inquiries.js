// Inquiries Page Logic - Migrated and Fully Restored
let allInquiries = [];
let filteredInquiries = [];
let currentInquiry = null;

// === LOAD DATA ===
async function loadInquiries() {
    try {
        const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        allInquiries = data;

        updateStats();
        applyFilters();
    } catch (error) {
        console.error('Error loading inquiries:', error);
        showToast('Error loading inquiries', 'error');
    }
}

function updateStats() {
    let counts = { new: 0, 'demo-scheduled': 0, 'demo-done': 0, converted: 0, lost: 0 };
    allInquiries.forEach(i => {
        if (counts[i.status] !== undefined) counts[i.status]++;
    });

    document.getElementById('newCount').textContent = counts.new;
    document.getElementById('demoCount').textContent = counts['demo-scheduled'];
    document.getElementById('convertedCount').textContent = counts.converted;

    const total = allInquiries.length;
    const rate = total > 0 ? Math.round((counts.converted / total) * 100) : 0;
    document.getElementById('conversionRate').textContent = rate + '%';
}

// === FILTERS ===
function applyFilters() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const status = document.getElementById('statusFilter').value;

    filteredInquiries = allInquiries.filter(i => {
        const matchesQuery = !query ||
            i.name.toLowerCase().includes(query) ||
            i.phone.includes(query);
        const matchesStatus = !status || i.status === status;
        return matchesQuery && matchesStatus;
    });

    renderInquiries(filteredInquiries);
}

// === RENDERING ===
function renderInquiries(inquiries) {
    const container = document.getElementById('inquiriesList');
    if (!container) return;

    if (inquiries.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align:center; padding: 40px;">
                <span class="material-icons" style="font-size: 40px; color: #cbd5e1; margin-bottom: 12px;">contact_support</span>
                <h3 style="color: #64748b;">No inquiries found</h3>
            </div>`;
        return;
    }

    container.innerHTML = inquiries.map(i => {
        const statusDetails = getStatusDetails(i.status);
        return `
            <div class="inquiry-card ${i.status}">
                <div class="inquiry-header">
                    <div>
                        <div class="inquiry-name">${i.name}</div>
                        <div class="inquiry-phone">📞 ${i.phone}</div>
                    </div>
                    <span class="inquiry-course">${i.course || 'General'}</span>
                </div>
                <div class="inquiry-meta">
                    <span><span class="material-icons">source</span> ${i.source || 'Other'}</span>
                    <span><span class="material-icons">schedule</span> ${formatDate(i.created_at)}</span>
                    ${i.demo_date ? `<div class="demo-time"><span class="material-icons">event</span> Demo: ${formatDateTime(i.demo_date)}</div>` : ''}
                </div>
                ${i.notes ? `<p style="font-size: 0.85rem; color: #475569; margin: 8px 0; line-height: 1.4;">${i.notes}</p>` : ''}
                <div class="inquiry-actions" style="margin-top: 15px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                    <select class="status-select" onchange="updateInquiryStatus('${i.id}', this.value)">
                        <option value="new" ${i.status === 'new' ? 'selected' : ''}>🆕 New</option>
                        <option value="demo-scheduled" ${i.status === 'demo-scheduled' ? 'selected' : ''}>📅 Demo Scheduled</option>
                        <option value="demo-done" ${i.status === 'demo-done' ? 'selected' : ''}>✅ Demo Done</option>
                        <option value="converted" ${i.status === 'converted' ? 'selected' : ''}>🎉 Converted</option>
                        <option value="lost" ${i.status === 'lost' ? 'selected' : ''}>❌ Lost</option>
                    </select>
                    <div style="flex: 1;"></div>
                    <button class="btn-icon" onclick="openEditInquiryModal('${i.id}')" title="Edit Inquiry"><span class="material-icons">edit</span></button>
                    <button class="btn-icon" onclick="deleteInquiry('${i.id}')" style="color:#EF4444" title="Delete"><span class="material-icons">delete</span></button>
                </div>
            </div>`;
    }).join('');
}

function getStatusDetails(status) {
    const map = {
        'new': { icon: 'fiber_new', label: 'New' },
        'demo-scheduled': { icon: 'event', label: 'Demo' },
        'demo-done': { icon: 'check_circle', label: 'Demo Done' },
        'converted': { icon: 'celebration', label: 'Converted' },
        'lost': { icon: 'block', label: 'Lost' }
    };
    return map[status] || map.new;
}

// === ACTIONS ===
async function updateInquiryStatus(id, status) {
    try {
        const { error } = await supabase.from('inquiries').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        showToast('Status updated');
        loadInquiries();
    } catch (e) { showToast('Update failed', 'error'); }
}

async function openEditInquiryModal(id) {
    try {
        const { data, error } = await supabase.from('inquiries').select('*').eq('id', id).single();
        if (error) throw error;
        currentInquiry = data;

        document.getElementById('editInquiryId').value = id;
        document.getElementById('editName').value = data.name;
        document.getElementById('editPhone').value = data.phone.replace(/\D/g, '').slice(-10);
        document.getElementById('editCourse').value = data.course || '';
        document.getElementById('editStatus').value = data.status || 'new';
        document.getElementById('editDemo').value = data.demo_date ? data.demo_date.slice(0, 16) : '';
        document.getElementById('editNotes').value = data.notes || '';

        document.getElementById('editInquiryModal').classList.add('active');
    } catch (e) { showToast('Error fetching data', 'error'); }
}

function followUpWhatsApp() {
    if (!currentInquiry) return;
    const msg = encodeURIComponent(`Hi ${currentInquiry.name}, this is from Abhi's Craft Soft. We are following up regarding your interest in the ${currentInquiry.course} course.`);
    window.open(`https://wa.me/${currentInquiry.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
}

function convertToStudent() {
    if (!currentInquiry) return;
    // Store in session and redirect to students page with pre-fill params
    const params = new URLSearchParams({
        name: currentInquiry.name,
        phone: currentInquiry.phone.replace(/\D/g, '').slice(-10),
        course: currentInquiry.course || '',
        action: 'convert'
    });
    window.location.href = `students.html?${params.toString()}`;
}

async function deleteInquiry(id) {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
        const { error } = await supabase.from('inquiries').delete().eq('id', id);
        if (error) throw error;
        showToast('Lead deleted');
        loadInquiries();
    } catch (e) { showToast('Deletion failed', 'error'); }
}

// === FORMS ===
document.getElementById('addInquiryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('inquiryName').value.trim(),
        phone: '+91 ' + document.getElementById('inquiryPhone').value.trim().slice(-10),
        course: document.getElementById('inquiryCourse').value,
        source: document.getElementById('inquirySource').value,
        demo_date: document.getElementById('inquiryDemo').value || null,
        notes: document.getElementById('inquiryNotes').value.trim(),
        status: document.getElementById('inquiryDemo').value ? 'demo-scheduled' : 'new',
        created_at: new Date().toISOString()
    };
    try {
        const { error } = await supabase.from('inquiries').insert([data]);
        if (error) throw error;
        showToast('Lead added successfully!');
        closeModal('addInquiryModal');
        loadInquiries();
    } catch (e) { showToast('Error adding lead', 'error'); }
});

document.getElementById('editInquiryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editInquiryId').value;
    const updates = {
        name: document.getElementById('editName').value.trim(),
        phone: '+91 ' + document.getElementById('editPhone').value.trim().slice(-10),
        course: document.getElementById('editCourse').value,
        status: document.getElementById('editStatus').value,
        demo_date: document.getElementById('editDemo').value || null,
        notes: document.getElementById('editNotes').value.trim(),
        updated_at: new Date().toISOString()
    };
    try {
        const { error } = await supabase.from('inquiries').update(updates).eq('id', id);
        if (error) throw error;
        showToast('Lead updated');
        closeModal('editInquiryModal');
        loadInquiries();
    } catch (e) { showToast('Update failed', 'error'); }
});

function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function openAddInquiryModal() { document.getElementById('addInquiryModal').classList.add('active'); }

function formatDateTime(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Init
window.updateInquiryStatus = updateInquiryStatus;
window.openEditInquiryModal = openEditInquiryModal;
window.deleteInquiry = deleteInquiry;
window.followUpWhatsApp = followUpWhatsApp;
window.convertToStudent = convertToStudent;
window.closeModal = closeModal;
window.openAddInquiryModal = openAddInquiryModal;

document.getElementById('searchInput')?.addEventListener('input', applyFilters);
document.getElementById('statusFilter')?.addEventListener('change', applyFilters);

document.addEventListener('DOMContentLoaded', loadInquiries);
