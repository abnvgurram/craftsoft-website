/**
 * Inquiry Sync Module
 * Syncs form submissions to Supabase inquiries table
 */

const InquirySync = {
    // Course name to code mapping
    courseCodeMap: {
        'Graphic Design': 'GD',
        'UI/UX Design': 'UX',
        'Full Stack Development': 'MERN',
        'Full Stack Development (MERN)': 'MERN',
        'Python Full Stack': 'PYFS',
        'Python Full Stack Development': 'PYFS',
        'Java Full Stack': 'JAVA',
        'Java Full Stack Development': 'JAVA',
        'DSA Mastery': 'DSA',
        'Data Analytics': 'DA',
        'Salesforce': 'SF',
        'Salesforce Administration': 'SF',
        'Python Programming': 'PY',
        'React JS': 'REACT',
        'Git & GitHub': 'GIT',
        'DevOps Engineering': 'DEVOPS',
        'DevOps': 'DEVOPS',
        'AWS Cloud': 'AWS',
        'AWS': 'AWS',
        'DevSecOps': 'DEVSEC',
        'Microsoft Azure': 'AZURE',
        'Azure': 'AZURE',
        'Automation with Python': 'AUTOPY',
        'Spoken English': 'ENG',
        'Spoken English Mastery': 'ENG',
        'Soft Skills': 'SOFT',
        'Soft Skills Training': 'SOFT',
        'Resume & Interview': 'RESUME',
        'Resume & Interview Prep': 'RESUME',
        'Handwriting': 'HW',
        'Handwriting Improvement': 'HW'
    },

    // Service name to code mapping
    serviceCodeMap: {
        'Web Development': 'WEB',
        'Web Development Service': 'WEB',
        'Website Development': 'WEB',
        'UI/UX Design': 'UX',
        'UI/UX Design Service': 'UX',
        'UI/UX Design Services': 'UX',
        'Graphic Design': 'GD',
        'Graphic Design Service': 'GD',
        'Graphic Design Services': 'GD',
        'Branding & Marketing': 'BM',
        'Cloud & DevOps': 'CLOUD',
        'Cloud & DevOps Service': 'CLOUD',
        'Cloud & DevOps Solutions': 'CLOUD',
        'Career Services': 'CAREER',
        'Career & Placement Services': 'CAREER'
    },

    // Get course code from name
    getCourseCode(name) {
        return this.courseCodeMap[name] || name;
    },

    // Get service code from name
    getServiceCode(name) {
        return this.serviceCodeMap[name] || name;
    },

    // Generate next inquiry ID
    async getNextInquiryId() {
        try {
            const { data, error } = await window.supabaseClient
                .from('inquiries')
                .select('inquiry_id')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            let nextNum = 1;
            if (data && data[0] && data[0].inquiry_id) {
                const match = data[0].inquiry_id.match(/INQ-ACS-(\d+)/);
                if (match) nextNum = parseInt(match[1]) + 1;
            }

            return `INQ-ACS-${String(nextNum).padStart(3, '0')}`;
        } catch (e) {
            console.error('Error getting next inquiry ID:', e);
            return `INQ-ACS-${Date.now()}`;
        }
    },

    // Create inquiry from course page
    async createCourseInquiry(formData) {
        try {
            const inquiryId = await this.getNextInquiryId();
            const courseCode = this.getCourseCode(formData.interest || formData.courses);

            const payload = {
                inquiry_id: inquiryId,
                name: formData.name,
                email: formData.email || null,
                phone: formData.phone || null,
                courses: [courseCode],
                notes: formData.message || null,
                source: 'Website',
                status: 'New',
                demo_required: false
            };

            const { data, error } = await window.supabaseClient
                .from('inquiries')
                .insert(payload);

            if (error) throw error;

            console.log('Course inquiry created:', inquiryId);
            return { success: true, inquiryId };
        } catch (e) {
            console.error('Error creating course inquiry:', e);
            return { success: false, error: e.message };
        }
    },

    // Create inquiry from service page
    async createServiceInquiry(formData) {
        try {
            const inquiryId = await this.getNextInquiryId();
            const serviceCode = formData.courses || this.getServiceCode(formData.interest);

            const payload = {
                inquiry_id: inquiryId,
                name: formData.name,
                email: formData.email || null,
                phone: formData.phone || null,
                courses: [serviceCode], // Services are stored in courses array too
                notes: formData.message || null,
                source: 'Website',
                status: 'New',
                demo_required: false
            };

            const { data, error } = await window.supabaseClient
                .from('inquiries')
                .insert(payload);

            if (error) throw error;

            console.log('Service inquiry created:', inquiryId);
            return { success: true, inquiryId };
        } catch (e) {
            console.error('Error creating service inquiry:', e);
            return { success: false, error: e.message };
        }
    },

    // Create inquiry from contact page (mixed)
    async createContactInquiry(formData, type = 'course') {
        try {
            const inquiryId = await this.getNextInquiryId();
            let code;

            if (type === 'service') {
                code = this.getServiceCode(formData.courses);
            } else {
                code = this.getCourseCode(formData.courses);
            }

            const payload = {
                inquiry_id: inquiryId,
                name: formData.name,
                email: formData.email || null,
                phone: formData.phone || null,
                courses: [code],
                notes: formData.message || null,
                source: 'Website',
                status: 'New',
                demo_required: false
            };

            const { data, error } = await window.supabaseClient
                .from('inquiries')
                .insert(payload);

            if (error) throw error;

            console.log('Contact inquiry created:', inquiryId);
            return { success: true, inquiryId };
        } catch (e) {
            console.error('Error creating contact inquiry:', e);
            return { success: false, error: e.message };
        }
    },

    // Extract form data from FormData object
    extractFormData(form) {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    },

    // Initialize form handlers
    initCourseForm(formId, courseName) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            // Don't prevent default - let Formspree handle it too
            const formData = this.extractFormData(form);
            formData.interest = courseName;

            // Sync to Supabase in background
            this.createCourseInquiry(formData);
        });
    },

    initServiceForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            const formData = this.extractFormData(form);

            // Sync to Supabase in background
            this.createServiceInquiry(formData);
        });
    },

    initContactForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            const formData = this.extractFormData(form);
            const selectEl = form.querySelector('select[name="courses"]');

            let type = 'course';
            if (selectEl) {
                const selected = selectEl.options[selectEl.selectedIndex];
                type = selected.dataset.type || 'course';
            }

            // Sync to Supabase in background
            this.createContactInquiry(formData, type);
        });
    }
};

// Make available globally
window.InquirySync = InquirySync;
