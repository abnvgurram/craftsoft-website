/**
 * Inquiries Management Module
 * Phase 4: Inquiry CRUD Operations
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ============================================
    // DATA: Courses + Services (with short codes)
    // ============================================
    const COURSES = [
        { code: 'C01', short: 'GD', name: 'Graphic Design', category: 'Design' },
        { code: 'C02', short: 'UX', name: 'UI/UX Design', category: 'Design' },
        { code: 'C03', short: 'MERN', name: 'Full Stack Development (MERN)', category: 'Engineering' },
        { code: 'C04', short: 'PyFS', name: 'Python Full Stack Development', category: 'Engineering' },
        { code: 'C05', short: 'JavaFS', name: 'Java Full Stack Development', category: 'Engineering' },
        { code: 'C06', short: 'DSA', name: 'DSA Mastery', category: 'Engineering' },
        { code: 'C07', short: 'DA', name: 'Data Analytics', category: 'Engineering' },
        { code: 'C08', short: 'SF', name: 'Salesforce Administration', category: 'Engineering' },
        { code: 'C09', short: 'Py', name: 'Python Programming', category: 'Engineering' },
        { code: 'C10', short: 'React', name: 'React JS', category: 'Engineering' },
        { code: 'C11', short: 'Git', name: 'Git & GitHub', category: 'Engineering' },
        { code: 'C12', short: 'DevOps', name: 'DevOps Engineering', category: 'Cloud' },
        { code: 'C13', short: 'AWS', name: 'AWS Cloud Excellence', category: 'Cloud' },
        { code: 'C14', short: 'DevSec', name: 'DevSecOps', category: 'Cloud' },
        { code: 'C15', short: 'Azure', name: 'Microsoft Azure', category: 'Cloud' },
        { code: 'C16', short: 'AutoPy', name: 'Automation with Python', category: 'Cloud' },
        { code: 'C17', short: 'Eng', name: 'Spoken English Mastery', category: 'Soft Skills' },
        { code: 'C18', short: 'Soft', name: 'Soft Skills Training', category: 'Soft Skills' },
        { code: 'C19', short: 'Resume', name: 'Resume Writing & Interview Prep', category: 'Soft Skills' },
        { code: 'C20', short: 'HW', name: 'Handwriting Improvement', category: 'Soft Skills' }
    ];

    const SERVICES = [
        { code: 'S01', short: 'S-GD', name: 'Graphic Design Services' },
        { code: 'S02', short: 'S-UX', name: 'UI/UX Design Services' },
        { code: 'S03', short: 'S-Web', name: 'Website Development' },
        { code: 'S04', short: 'S-Cloud', name: 'Cloud & DevOps' },
        { code: 'S05', short: 'S-Brand', name: 'Branding & Identity' },
        { code: 'S06', short: 'S-Career', name: 'Career Services' }
    ];

    const STATUS_CONFIG = {
        new: { label: 'New', icon: 'fa-regular fa-face-smile-beam', color: '#f59e0b' },
        contacted: { label: 'Contacted', icon: 'fa-solid fa-phone', color: '#3b82f6' },
        converted: { label: 'Converted', icon: 'fa-solid fa-user-plus', color: '#22c55e' },
        lost: { label: 'Lost', icon: 'fa-regular fa-face-sad-tear', color: '#ef4444' }
    };

    const SOURCE_CONFIG = {
        website: { label: 'Website', icon: 'fa-solid fa-globe' },
        instagram: { label: 'Instagram', icon: 'fa-brands fa-instagram' },
        linkedin: { label: 'LinkedIn', icon: 'fa-brands fa-linkedin' },
        classifieds: { label: 'Classifieds', icon: 'fa-regular fa-newspaper' },
        walkin: { label: 'Walk-in', icon: 'fa-solid fa-person-walking-dashed-line-arrow-right' }
    };

    const EXPECTED_START = {
        immediate: { label: 'Immediate', icon: 'fa-solid fa-bolt' },
        this_month: { label: 'This Month', icon: 'fa-solid fa-calendar-day' },
        next_month: { label: 'Next Month', icon: 'fa-solid fa-calendar-plus' },
        custom: { label: 'Specific', icon: 'fa-regular fa-calendar' }
    };

    // Pagination Settings
    const ITEMS_PER_PAGE = 10;

    // ============================================
    // DOM Elements
    // ============================================
    const addInquiryBtn = document.getElementById('addInquiryBtn');
    const inquiryModalOverlay = document.getElementById('inquiryModalOverlay');
    const closeInquiryModal = document.getElementById('closeInquiryModal');
    const cancelInquiryBtn = document.getElementById('cancelInquiryBtn');
    const saveInquiryBtn = document.getElementById('saveInquiryBtn');
    const inquiryForm = document.getElementById('inquiryForm');
    const inquiriesTableBody = document.getElementById('inquiriesTableBody');
    const inquiriesCards = document.getElementById('inquiriesCards');
    const emptyState = document.getElementById('emptyState');
    const inquirySearch = document.getElementById('inquirySearch');

    // Form Elements
    const courseServiceSelect = document.getElementById('courseService');
    const expectedStartSelect = document.getElementById('expectedStart');
    const customMonthGroup = document.getElementById('customMonthGroup');
    const scheduleDemoCheckbox = document.getElementById('scheduleDemo');
    const demoFields = document.getElementById('demoFields');

    // Filter & Pagination Elements
    const statusFilter = document.getElementById('statusFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const paginationInfo = document.getElementById('paginationInfo');

    // State
    let inquiries = [];
    let editingInquiryId = null;
    let currentPage = 1;
    let filteredInquiries = [];

    // ============================================
    // Initialize
    // ============================================
    initCourseServiceDropdown();
    initFilters();
    initFormListeners();
    await loadInquiries();

    // ============================================
    // Course/Service Dropdown
    // ============================================
    function initCourseServiceDropdown() {
        const coursesOptgroup = courseServiceSelect.querySelector('optgroup[label="Courses"]');
        const servicesOptgroup = courseServiceSelect.querySelector('optgroup[label="Services"]');

        coursesOptgroup.innerHTML = COURSES.map(c =>
            `<option value="${c.code}">${c.name}</option>`
        ).join('');

        servicesOptgroup.innerHTML = SERVICES.map(s =>
            `<option value="${s.code}">${s.name}</option>`
        ).join('');
    }

    // ============================================
    // Filters
    // ============================================
    function initFilters() {
        statusFilter.addEventListener('change', () => {
            currentPage = 1;
            applyFiltersAndSort();
        });

        sourceFilter.addEventListener('change', () => {
            currentPage = 1;
            applyFiltersAndSort();
        });
    }

    // ============================================
    // Form Listeners
    // ============================================
    function initFormListeners() {
        // Expected Start - show custom month picker
        expectedStartSelect.addEventListener('change', () => {
            customMonthGroup.style.display = expectedStartSelect.value === 'custom' ? 'flex' : 'none';
        });

        // Demo toggle
        scheduleDemoCheckbox.addEventListener('change', () => {
            demoFields.style.display = scheduleDemoCheckbox.checked ? 'flex' : 'none';
        });
    }

    // ============================================
    // Modal Controls
    // ============================================
    function openModal(editing = false) {
        inquiryModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (!editing) {
            document.getElementById('inquiryModalTitle').textContent = 'Add New Inquiry';
            saveInquiryBtn.querySelector('span').textContent = 'Save Inquiry';
            inquiryForm.reset();
            document.getElementById('inquiryCountryCode').value = '+91';
            document.getElementById('inquiryStatus').value = 'new';
            customMonthGroup.style.display = 'none';
            demoFields.style.display = 'none';
        }
    }

    function closeModal() {
        inquiryModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        editingInquiryId = null;
        inquiryForm.reset();
        customMonthGroup.style.display = 'none';
        demoFields.style.display = 'none';
    }

    addInquiryBtn.addEventListener('click', () => openModal(false));
    closeInquiryModal.addEventListener('click', closeModal);
    cancelInquiryBtn.addEventListener('click', closeModal);
    inquiryModalOverlay.addEventListener('click', (e) => {
        if (e.target === inquiryModalOverlay) closeModal();
    });

    // ============================================
    // Generate Inquiry ID
    // ============================================
    function generateInquiryId() {
        const sequence = (inquiries.length + 1).toString().padStart(3, '0');
        return `INQ-${sequence}`;
    }

    // ============================================
    // Save Inquiry
    // ============================================
    saveInquiryBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const name = document.getElementById('inquiryName').value.trim();
        const phone = document.getElementById('inquiryPhone').value.trim();
        const courseService = courseServiceSelect.value;
        const status = document.getElementById('inquiryStatus').value;

        if (!name) {
            window.toast.warning('Required', 'Please enter name');
            return;
        }

        if (!phone || phone.length < 10) {
            window.toast.warning('Required', 'Please enter a valid phone number');
            return;
        }

        if (!courseService) {
            window.toast.warning('Required', 'Please select a course or service');
            return;
        }

        const countryCode = document.getElementById('inquiryCountryCode').value.trim() || '+91';
        const fullPhone = countryCode + phone.replace(/\D/g, '');

        // Supabase data (only columns in table)
        const inquiryData = {
            id: editingInquiryId || generateInquiryId(),
            name: name,
            phone: fullPhone,
            interest_type: courseService.startsWith('S') ? 'service' : 'course',
            interest_code: courseService,
            source: document.getElementById('leadSource').value || null,
            expected_start: expectedStartSelect.value || null,
            custom_month: expectedStartSelect.value === 'custom'
                ? `${document.getElementById('customYearSelect').value}-${document.getElementById('customMonthSelect').value}`
                : null,
            status: status,
            notes: document.getElementById('inquiryNotes').value.trim() || null
        };

        // Extra fields for localStorage (not in Supabase)
        const localExtraData = {
            email: document.getElementById('inquiryEmail').value.trim() || null,
            course_service: courseService,
            occupation: document.getElementById('occupation').value || null,
            schedule_demo: scheduleDemoCheckbox.checked,
            demo_date: scheduleDemoCheckbox.checked ? document.getElementById('demoDate').value : null,
            demo_time: scheduleDemoCheckbox.checked ? document.getElementById('demoTime').value : null
        };

        saveInquiryBtn.disabled = true;
        saveInquiryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            if (editingInquiryId) {
                // Update in Supabase
                const { error } = await window.supabaseClient
                    .from('inquiries')
                    .update(inquiryData)
                    .eq('id', editingInquiryId);

                if (error) throw error;

                const index = inquiries.findIndex(i => i.id === editingInquiryId);
                if (index !== -1) {
                    inquiries[index] = { ...inquiries[index], ...inquiryData, ...localExtraData };
                }
                window.toast.success('Updated', 'Inquiry updated successfully');
            } else {
                // Insert to Supabase
                const { error } = await window.supabaseClient
                    .from('inquiries')
                    .insert([inquiryData]);

                if (error) throw error;

                inquiries.push({ ...inquiryData, ...localExtraData, created_at: new Date().toISOString() });
                window.toast.success('Added', 'Inquiry added successfully');
            }

            saveInquiriesToStorage();
            applyFiltersAndSort();
            updateDashboardStats();
            closeModal();

        } catch (error) {
            console.error('Error saving inquiry:', error);
            window.toast.error('Error', 'Failed to save inquiry: ' + error.message);
        } finally {
            saveInquiryBtn.disabled = false;
            saveInquiryBtn.innerHTML = '<i class="fas fa-save"></i> <span>Save Inquiry</span>';
        }
    });

    // ============================================
    // Load Inquiries
    // ============================================
    async function loadInquiries() {
        try {
            // Try loading from Supabase first
            const { data: supabaseInquiries, error } = await window.supabaseClient
                .from('inquiries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Supabase load failed, using localStorage:', error.message);
                const stored = localStorage.getItem('craftsoft_inquiries');
                inquiries = stored ? JSON.parse(stored) : [];
            } else {
                // Supabase is source of truth - sync to localStorage
                inquiries = supabaseInquiries || [];
                saveInquiriesToStorage();
            }

            // Seed mock data if empty
            if (inquiries.length === 0) {
                const mockInquiries = [
                    {
                        id: 'INQ-001',
                        name: 'Amit Sharma',
                        phone: '+919876543210',
                        email: 'amit@example.com',
                        interest_type: 'course',
                        interest_code: 'C03',
                        course_service: 'C03',
                        source: 'website',
                        occupation: 'student',
                        expected_start: 'immediate',
                        custom_month: null,
                        schedule_demo: true,
                        demo_date: '2024-12-28',
                        demo_time: '14:00',
                        status: 'new',
                        notes: 'Interested in MERN stack development',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'INQ-002',
                        name: 'Neha Reddy',
                        phone: '+918765432109',
                        email: 'neha@example.com',
                        interest_type: 'course',
                        interest_code: 'C02',
                        course_service: 'C02',
                        source: 'instagram',
                        occupation: 'working',
                        expected_start: 'next_month',
                        custom_month: null,
                        schedule_demo: false,
                        demo_date: null,
                        demo_time: null,
                        status: 'contacted',
                        notes: 'Looking for weekend batches',
                        created_at: new Date().toISOString()
                    }
                ];

                // Insert mock data to Supabase
                for (const inq of mockInquiries) {
                    const { id, name, phone, interest_type, interest_code, source, expected_start, custom_month, status, notes } = inq;
                    await window.supabaseClient
                        .from('inquiries')
                        .insert([{ id, name, phone, interest_type, interest_code, source, expected_start, custom_month, status, notes }])
                        .catch(e => console.warn('Mock insert skipped:', e.message));
                }

                inquiries = mockInquiries;
                saveInquiriesToStorage();
            }

            applyFiltersAndSort();
            updateDashboardStats();

        } catch (error) {
            console.error('Error loading inquiries:', error);
            const stored = localStorage.getItem('craftsoft_inquiries');
            inquiries = stored ? JSON.parse(stored) : [];
            applyFiltersAndSort();
        }
    }

    function saveInquiriesToStorage() {
        localStorage.setItem('craftsoft_inquiries', JSON.stringify(inquiries));
    }

    // ============================================
    // Filtering & Sorting
    // ============================================
    function applyFiltersAndSort() {
        let result = [...inquiries];

        // Search filter
        const searchQuery = inquirySearch.value.toLowerCase().trim();
        if (searchQuery) {
            result = result.filter(i =>
                i.name.toLowerCase().includes(searchQuery) ||
                i.id.toLowerCase().includes(searchQuery) ||
                i.phone.includes(searchQuery) ||
                (i.email && i.email.toLowerCase().includes(searchQuery))
            );
        }

        // Status filter
        const selectedStatus = statusFilter.value;
        if (selectedStatus) {
            result = result.filter(i => i.status === selectedStatus);
        }

        // Source filter
        const selectedSource = sourceFilter.value;
        if (selectedSource) {
            result = result.filter(i => i.lead_source === selectedSource);
        }

        // Sort by newest
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        filteredInquiries = result;
        renderInquiries();
    }

    inquirySearch.addEventListener('input', () => {
        currentPage = 1;
        applyFiltersAndSort();
    });

    // ============================================
    // Pagination
    // ============================================
    function getTotalPages() {
        return Math.ceil(filteredInquiries.length / ITEMS_PER_PAGE) || 1;
    }

    function getPageData() {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredInquiries.slice(start, end);
    }

    function updatePagination() {
        const totalPages = getTotalPages();
        paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderInquiries();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < getTotalPages()) {
            currentPage++;
            renderInquiries();
        }
    });

    // ============================================
    // Helper: Get Interest Short Code
    // ============================================
    function getInterestShortCode(code) {
        const course = COURSES.find(c => c.code === code);
        if (course) return course.short;
        const service = SERVICES.find(s => s.code === code);
        if (service) return service.short;
        return code;
    }

    // ============================================
    // Render Inquiries
    // ============================================
    function renderInquiries() {
        const data = getPageData();

        // Hide skeletons
        const skeletonTable = document.getElementById('skeletonTable');
        const skeletonCards = document.getElementById('skeletonCards');
        if (skeletonTable) skeletonTable.style.display = 'none';
        if (skeletonCards) skeletonCards.style.display = 'none';

        if (filteredInquiries.length === 0) {
            inquiriesTableBody.innerHTML = '';
            inquiriesCards.innerHTML = '';
            inquiriesCards.style.display = 'none';
            emptyState.style.display = 'block';
            document.querySelector('.data-table').style.display = 'none';
            document.getElementById('pagination').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        document.querySelector('.data-table').style.display = 'table';
        inquiriesCards.style.display = '';
        document.getElementById('pagination').style.display = 'flex';
        updatePagination();

        // Table View (Desktop)
        inquiriesTableBody.innerHTML = data.map(inq => {
            const statusCfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.new;
            const demoDisplay = inq.schedule_demo && inq.demo_date
                ? `${formatDate(inq.demo_date)}`
                : '-';

            return `
                <tr data-id="${inq.id}">
                    <td><span class="student-id">${inq.id}</span></td>
                    <td><span class="student-name">${inq.name}</span></td>
                    <td>${inq.phone}</td>
                    <td><span class="course-tag">${getInterestShortCode(inq.interest_code || inq.course_service)}</span></td>
                    <td>
                        <span class="status-badge" style="--status-color: ${statusCfg.color}">
                            <i class="${statusCfg.icon}"></i> ${statusCfg.label}
                        </span>
                    </td>
                    <td>${demoDisplay}</td>
                    <td>
                        <button class="action-btn whatsapp" title="WhatsApp" onclick="openWhatsApp('${inq.phone}')">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" title="Edit" onclick="editInquiry('${inq.id}')">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="action-btn delete" title="Delete" onclick="deleteInquiry('${inq.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Card View (Mobile)
        inquiriesCards.innerHTML = data.map(inq => {
            const statusCfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.new;

            return `
                <div class="data-card" data-id="${inq.id}">
                    <div class="data-card-header">
                        <span class="data-card-id">${inq.id}</span>
                        <div class="action-btns">
                            <button class="action-btn whatsapp" title="WhatsApp" onclick="openWhatsApp('${inq.phone}')">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                            <button class="action-btn edit" title="Edit" onclick="editInquiry('${inq.id}')">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="action-btn delete" title="Delete" onclick="deleteInquiry('${inq.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="data-card-name">${inq.name}</div>
                    <div class="data-card-row">
                        <i class="fas fa-phone"></i>
                        <span>${inq.phone}</span>
                    </div>
                    <div class="data-card-row">
                        <i class="fas fa-book"></i>
                        <span>${getInterestShortCode(inq.interest_code || inq.course_service)}</span>
                    </div>
                    <div class="data-card-row">
                        <span class="status-badge" style="--status-color: ${statusCfg.color}">
                            <i class="${statusCfg.icon}"></i> ${statusCfg.label}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }

    // ============================================
    // WhatsApp Integration
    // ============================================
    window.openWhatsApp = function (phone) {
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    // ============================================
    // Edit Inquiry
    // ============================================
    window.editInquiry = function (id) {
        const inq = inquiries.find(i => i.id === id);
        if (!inq) return;

        editingInquiryId = id;
        document.getElementById('inquiryModalTitle').textContent = 'Edit Inquiry';
        saveInquiryBtn.querySelector('span').textContent = 'Update Inquiry';

        // Populate form
        document.getElementById('inquiryName').value = inq.name || '';
        document.getElementById('inquiryEmail').value = inq.email || '';

        // Parse phone
        if (inq.phone) {
            let cleanPhone = inq.phone.replace(/[^\d+]/g, '');

            if (cleanPhone.startsWith('+91')) {
                document.getElementById('inquiryCountryCode').value = '+91';
                document.getElementById('inquiryPhone').value = cleanPhone.slice(3);
            } else if (cleanPhone.startsWith('+')) {
                const match = cleanPhone.match(/^(\+\d{1,4})(\d+)$/);
                if (match) {
                    document.getElementById('inquiryCountryCode').value = match[1];
                    document.getElementById('inquiryPhone').value = match[2];
                } else {
                    document.getElementById('inquiryCountryCode').value = '+91';
                    document.getElementById('inquiryPhone').value = cleanPhone.replace(/\+/g, '');
                }
            } else {
                document.getElementById('inquiryCountryCode').value = '+91';
                document.getElementById('inquiryPhone').value = cleanPhone;
            }
        } else {
            document.getElementById('inquiryCountryCode').value = '+91';
            document.getElementById('inquiryPhone').value = '';
        }

        courseServiceSelect.value = inq.interest_code || inq.course_service || '';
        document.getElementById('leadSource').value = inq.source || inq.lead_source || '';
        document.getElementById('occupation').value = inq.occupation || '';
        expectedStartSelect.value = inq.expected_start || '';

        if (inq.expected_start === 'custom' && inq.custom_month) {
            customMonthGroup.style.display = 'flex';
            const [year, month] = inq.custom_month.split('-');
            document.getElementById('customYearSelect').value = year || '2025';
            document.getElementById('customMonthSelect').value = month || '01';
        } else {
            customMonthGroup.style.display = 'none';
        }

        scheduleDemoCheckbox.checked = inq.schedule_demo || false;
        if (inq.schedule_demo) {
            demoFields.style.display = 'flex';
            document.getElementById('demoDate').value = inq.demo_date || '';
            document.getElementById('demoTime').value = inq.demo_time || '';
        } else {
            demoFields.style.display = 'none';
        }

        document.getElementById('inquiryStatus').value = inq.status || 'new';
        document.getElementById('inquiryNotes').value = inq.notes || '';

        openModal(true);
    };

    // ============================================
    // Delete Inquiry
    // ============================================
    window.deleteInquiry = function (id) {
        const inq = inquiries.find(i => i.id === id);
        if (!inq) return;

        if (window.modal) {
            window.modal.confirm(
                'Delete Inquiry',
                `Are you sure you want to delete inquiry from <strong>${inq.name}</strong>?`,
                async () => {
                    try {
                        const { error } = await window.supabaseClient
                            .from('inquiries')
                            .delete()
                            .eq('id', id);

                        if (error) throw error;

                        inquiries = inquiries.filter(i => i.id !== id);
                        saveInquiriesToStorage();
                        applyFiltersAndSort();
                        updateDashboardStats();
                        window.toast.success('Deleted', 'Inquiry removed successfully');
                    } catch (error) {
                        console.error('Delete error:', error);
                        window.toast.error('Error', 'Failed to delete: ' + error.message);
                    }
                }
            );
        }
    };

    // ============================================
    // Update Dashboard Stats
    // ============================================
    function updateDashboardStats() {
        localStorage.setItem('craftsoft_inquiry_count', inquiries.length);
    }
});
