// Inquiries Module

let allCoursesForInquiries = [];
let inquiryToDelete = null;

document.addEventListener('DOMContentLoaded', async () => {
    const session = await window.supabaseConfig.getSession();
    if (!session) {
        window.location.href = '../login.html';
        return;
    }

    AdminSidebar.init('inquiries');

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = AdminHeader.render('Inquiries');
    }

    const admin = await window.Auth.getCurrentAdmin();
    await AdminSidebar.renderAccountPanel(session, admin);

    // Load courses from master
    await loadCourses();

    // Load inquiries
    await loadInquiries();

    // Bind events
    bindFormEvents();
    bindDeleteEvents();
    bindSearchEvents();
});

// =====================
// Load Courses
// =====================
async function loadCourses() {
    try {
        const { data, error } = await window.supabaseClient
            .from('courses')
            .select('course_code, course_name')
            .eq('status', 'ACTIVE')
            .order('course_code');

        if (error) throw error;
        allCoursesForInquiries = data || [];
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// =====================
// Load Inquiries
// =====================
async function loadInquiries() {
    const { Skeleton } = window.AdminUtils;
    const content = document.getElementById('inquiries-content');

    // Show skeleton loading
    if (Skeleton) {
        Skeleton.show('inquiries-content', 'table', 5);
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-phone-volume"></i>
                    <p>No inquiries yet</p>
                </div>
            `;
            return;
        }

        renderInquiries(data);
    } catch (error) {
        console.error('Error loading inquiries:', error);
        content.innerHTML = '<p class="text-muted">Error loading inquiries</p>';
    }
}

function renderInquiries(inquiries) {
    const content = document.getElementById('inquiries-content');

    // Table view
    const tableHTML = `
        <div class="table-container">
            <table class="inquiries-table">
                <thead>
                    <tr>
                        <th>Inquiry ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Courses</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${inquiries.map(inq => `
                        <tr data-id="${inq.id}">
                            <td><div class="inquiry-id">${inq.inquiry_id}</div></td>
                            <td><div class="inquiry-name">${inq.name}</div></td>
                            <td class="inquiry-phone">${inq.phone}</td>
                            <td>
                                <div class="inquiry-courses">
                                    ${(inq.courses || []).map(c => `<span class="course-tag">${c}</span>`).join('')}
                                </div>
                            </td>
                            <td>${getStatusBadge(inq.status)}</td>
                            <td>
                                <div class="action-btns">
                                    <button class="action-btn edit-btn" title="Edit" data-id="${inq.id}">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button class="action-btn whatsapp" title="WhatsApp" data-phone="${inq.phone}">
                                        <i class="fa-brands fa-whatsapp"></i>
                                    </button>
                                    <button class="action-btn convert" title="Convert to Student" data-id="${inq.id}">
                                        <i class="fa-solid fa-repeat"></i>
                                    </button>
                                    <button class="action-btn delete" title="Delete" data-id="${inq.id}" data-name="${inq.name}">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="table-footer">${inquiries.length} ${inquiries.length === 1 ? 'inquiry' : 'inquiries'}</div>
        </div>
    `;

    // Card view (mobile)
    const cardsHTML = `
        <div class="inquiry-cards">
            ${inquiries.map(inq => `
                <div class="inquiry-card" data-id="${inq.id}">
                    <div class="inquiry-card-header">
                        <div>
                            <div class="inquiry-card-id">${inq.inquiry_id}</div>
                            <h4 class="inquiry-card-name">${inq.name}</h4>
                        </div>
                        ${getStatusBadge(inq.status)}
                    </div>
                    <div class="inquiry-card-info">
                        <span><i class="fa-solid fa-phone"></i> ${inq.phone}</span>
                        <span><i class="fa-solid fa-book"></i> ${(inq.courses || []).join(', ') || 'No courses'}</span>
                    </div>
                    <div class="inquiry-card-actions">
                        <button class="action-btn edit-btn" data-id="${inq.id}"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn whatsapp" data-phone="${inq.phone}"><i class="fa-brands fa-whatsapp"></i></button>
                        <button class="action-btn convert" data-id="${inq.id}"><i class="fa-solid fa-repeat"></i></button>
                        <button class="action-btn delete" data-id="${inq.id}" data-name="${inq.name}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    content.innerHTML = tableHTML + cardsHTML;

    // Bind action buttons
    bindActionButtons();
}

function getStatusBadge(status) {
    const icons = {
        'New': { icon: 'fa-sparkles', class: 'status-new' },
        'Contacted': { icon: 'fa-phone-plus', class: 'status-contacted' },
        'Demo Scheduled': { icon: 'fa-calendar-plus', class: 'status-demo' },
        'Converted': { icon: 'fa-face-laugh-beam', class: 'status-converted' },
        'Closed': { icon: 'fa-face-sad-cry', class: 'status-closed' }
    };
    const info = icons[status] || icons['New'];
    return `<span class="status-badge ${info.class}"><i class="fa-solid ${info.icon}"></i> ${status}</span>`;
}

function bindActionButtons() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openForm(true, btn.dataset.id));
    });

    // WhatsApp buttons
    document.querySelectorAll('.action-btn.whatsapp').forEach(btn => {
        btn.addEventListener('click', () => {
            const phone = btn.dataset.phone;
            window.open(`https://wa.me/91${phone}`, '_blank');
        });
    });

    // Convert buttons
    document.querySelectorAll('.action-btn.convert').forEach(btn => {
        btn.addEventListener('click', () => convertToStudent(btn.dataset.id));
    });

    // Delete buttons
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => {
            showDeleteConfirm(btn.dataset.id, btn.dataset.name);
        });
    });
}

// =====================
// Form Events
// =====================
function bindFormEvents() {
    document.getElementById('add-inquiry-btn')?.addEventListener('click', () => openForm(false));
    document.getElementById('close-form-btn')?.addEventListener('click', closeForm);
    document.getElementById('cancel-form-btn')?.addEventListener('click', closeForm);
    document.getElementById('save-inquiry-btn')?.addEventListener('click', saveInquiry);

    // Demo toggle
    document.querySelectorAll('input[name="demo-required"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const demoFields = document.querySelector('.demo-fields');
            demoFields.style.display = radio.value === 'yes' ? 'block' : 'none';
        });
    });
}

function renderCoursesCheckboxes(selectedCourses = []) {
    const container = document.getElementById('inquiry-courses-list');
    if (!allCoursesForInquiries.length) {
        container.innerHTML = '<p class="text-muted">No courses available</p>';
        return;
    }

    container.innerHTML = allCoursesForInquiries.map(c => {
        const isChecked = selectedCourses.includes(c.course_code);
        return `
            <label class="checkbox-item ${isChecked ? 'checked' : ''}" data-code="${c.course_code}">
                <input type="checkbox" name="inquiry-courses" value="${c.course_code}" ${isChecked ? 'checked' : ''}>
                <i class="fa-solid fa-check"></i>
                <span>${c.course_code}</span>
            </label>
        `;
    }).join('');

    // Toggle checked class on change
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            checkbox.closest('.checkbox-item').classList.toggle('checked', checkbox.checked);
        });
    });
}

async function openForm(isEdit = false, inquiryId = null) {
    const container = document.getElementById('inquiry-form-container');
    const formTitle = document.getElementById('form-title');
    const saveBtn = document.getElementById('save-inquiry-btn');

    // Reset form
    document.getElementById('edit-inquiry-id').value = '';
    document.getElementById('inquiry-name').value = '';
    document.getElementById('inquiry-phone').value = '';
    document.getElementById('inquiry-email').value = '';
    document.getElementById('inquiry-source').value = 'Walk-in';
    document.getElementById('inquiry-status').value = 'New';
    document.getElementById('inquiry-demo-date').value = '';
    document.getElementById('inquiry-demo-time').value = '';
    document.getElementById('inquiry-notes').value = '';
    document.querySelector('input[name="demo-required"][value="no"]').checked = true;
    document.querySelector('.demo-fields').style.display = 'none';

    let inquiry = null;

    if (isEdit) {
        const { data, error } = await window.supabaseClient.from('inquiries').select('*').eq('id', inquiryId).single();
        if (error || !data) {
            window.AdminUtils.Toast.error('Error', 'Could not load inquiry data');
            return;
        }
        inquiry = data;

        document.getElementById('edit-inquiry-id').value = inquiry.id;
        document.getElementById('inquiry-name').value = inquiry.name || '';
        document.getElementById('inquiry-phone').value = inquiry.phone || '';
        document.getElementById('inquiry-email').value = inquiry.email || '';
        document.getElementById('inquiry-source').value = inquiry.source || 'Walk-in';
        document.getElementById('inquiry-status').value = inquiry.status || 'New';
        document.getElementById('inquiry-demo-date').value = inquiry.demo_date || '';
        document.getElementById('inquiry-demo-time').value = inquiry.demo_time || '';
        document.getElementById('inquiry-notes').value = inquiry.notes || '';

        if (inquiry.demo_required) {
            document.querySelector('input[name="demo-required"][value="yes"]').checked = true;
            document.querySelector('.demo-fields').style.display = 'block';
        }
    }

    renderCoursesCheckboxes(inquiry?.courses || []);

    formTitle.textContent = isEdit ? 'Edit Inquiry' : 'Add Inquiry';
    saveBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${isEdit ? 'Update' : 'Save'} Inquiry`;

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('inquiry-name').focus();
}

function closeForm() {
    document.getElementById('inquiry-form-container').style.display = 'none';
}

async function saveInquiry() {
    const { Toast } = window.AdminUtils;
    const saveBtn = document.getElementById('save-inquiry-btn');

    const editId = document.getElementById('edit-inquiry-id').value;
    const isEdit = Boolean(editId);

    const name = document.getElementById('inquiry-name').value.trim();
    const phone = document.getElementById('inquiry-phone').value.trim();
    const email = document.getElementById('inquiry-email').value.trim();
    const source = document.getElementById('inquiry-source').value;
    const status = document.getElementById('inquiry-status').value;
    const demoRequired = document.querySelector('input[name="demo-required"]:checked').value === 'yes';
    const demoDate = document.getElementById('inquiry-demo-date').value || null;
    const demoTime = document.getElementById('inquiry-demo-time').value || null;
    const notes = document.getElementById('inquiry-notes').value.trim();

    // Get selected courses
    const courses = Array.from(document.querySelectorAll('input[name="inquiry-courses"]:checked')).map(cb => cb.value);

    // Validation
    if (!name) { Toast.error('Required', 'Name is required'); return; }
    if (!phone || phone.length !== 10) { Toast.error('Required', 'Valid 10-digit phone required'); return; }
    if (courses.length === 0) { Toast.error('Required', 'Select at least one course'); return; }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        const inquiryData = {
            name,
            phone,
            email: email || null,
            courses,
            source,
            status,
            demo_required: demoRequired,
            demo_date: demoDate,
            demo_time: demoTime,
            notes
        };

        if (isEdit) {
            const { error } = await window.supabaseClient.from('inquiries').update(inquiryData).eq('id', editId);
            if (error) throw error;
            Toast.success('Updated', 'Inquiry updated successfully');
        } else {
            // Generate new ID
            const { data: maxData } = await window.supabaseClient.from('inquiries').select('inquiry_id').order('inquiry_id', { ascending: false }).limit(1);
            let nextNum = 1;
            if (maxData?.length > 0) {
                const m = maxData[0].inquiry_id.match(/INQ-ACS-(\d+)/);
                if (m) nextNum = parseInt(m[1]) + 1;
            }
            const newId = `INQ-ACS-${String(nextNum).padStart(3, '0')}`;

            const { error } = await window.supabaseClient.from('inquiries').insert({
                ...inquiryData,
                inquiry_id: newId
            });
            if (error) throw error;
            Toast.success('Added', 'Inquiry added successfully');

            // Log activity
            if (window.DashboardActivities) {
                await window.DashboardActivities.add('inquiry_added', name, '../inquiries/');
            }
        }

        closeForm();
        await loadInquiries();
    } catch (err) {
        console.error(err);
        Toast.error('Error', err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${isEdit ? 'Update' : 'Save'} Inquiry`;
    }
}

// =====================
// Convert to Student
// =====================
async function convertToStudent(inquiryId) {
    try {
        const { data: inquiry, error } = await window.supabaseClient.from('inquiries').select('*').eq('id', inquiryId).single();
        if (error || !inquiry) {
            window.AdminUtils.Toast.error('Error', 'Could not load inquiry');
            return;
        }

        // Build query params for pre-fill
        const params = new URLSearchParams({
            prefill: '1',
            name: inquiry.name || '',
            phone: inquiry.phone || '',
            email: inquiry.email || '',
            courses: (inquiry.courses || []).join(','),
            inquiry_id: inquiryId
        });

        window.location.href = `../students/?${params.toString()}`;
    } catch (err) {
        console.error(err);
        window.AdminUtils.Toast.error('Error', 'Could not convert inquiry');
    }
}

// =====================
// Delete
// =====================
function bindDeleteEvents() {
    document.getElementById('cancel-delete-btn')?.addEventListener('click', hideDeleteConfirm);
    document.getElementById('confirm-delete-btn')?.addEventListener('click', confirmDelete);
}

function showDeleteConfirm(id, name) {
    inquiryToDelete = id;
    document.getElementById('delete-name').textContent = name;
    document.getElementById('delete-overlay').style.display = 'flex';
}

function hideDeleteConfirm() {
    inquiryToDelete = null;
    document.getElementById('delete-overlay').style.display = 'none';
}

async function confirmDelete() {
    if (!inquiryToDelete) return;

    try {
        const { error } = await window.supabaseClient.from('inquiries').delete().eq('id', inquiryToDelete);
        if (error) throw error;

        window.AdminUtils.Toast.success('Deleted', 'Inquiry deleted');
        hideDeleteConfirm();
        await loadInquiries();
    } catch (err) {
        console.error(err);
        window.AdminUtils.Toast.error('Error', err.message);
    }
}

// =====================
// Search
// =====================
function bindSearchEvents() {
    const searchInput = document.getElementById('inquiry-search');
    searchInput?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        filterInquiries(q);
    });
}

function filterInquiries(query) {
    // Filter table rows
    document.querySelectorAll('.inquiries-table tbody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });

    // Filter cards
    document.querySelectorAll('.inquiry-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
    });
}
