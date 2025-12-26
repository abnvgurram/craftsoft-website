/**
 * Students Management Module
 * Phase 2: Student CRUD Operations
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ============================================
    // COURSES DATA (Synced with website order)
    // ============================================
    const COURSES = [
        { code: '01', name: 'Graphic Design', category: 'Design', fee: 15000 },
        { code: '02', name: 'UI/UX Design', category: 'Design', fee: 18000 },
        { code: '03', name: 'Full Stack Development (MERN)', category: 'Engineering', fee: 35000 },
        { code: '04', name: 'Python Full Stack Development', category: 'Engineering', fee: 35000 },
        { code: '05', name: 'Java Full Stack Development', category: 'Engineering', fee: 35000 },
        { code: '06', name: 'DSA Mastery', category: 'Engineering', fee: 12000 },
        { code: '07', name: 'Data Analytics', category: 'Engineering', fee: 25000 },
        { code: '08', name: 'Salesforce Administration', category: 'Engineering', fee: 20000 },
        { code: '09', name: 'Python Programming', category: 'Engineering', fee: 10000 },
        { code: '10', name: 'React JS', category: 'Engineering', fee: 15000 },
        { code: '11', name: 'Git & GitHub', category: 'Engineering', fee: 5000 },
        { code: '12', name: 'DevOps Engineering', category: 'Cloud', fee: 30000 },
        { code: '13', name: 'AWS Cloud Excellence', category: 'Cloud', fee: 25000 },
        { code: '14', name: 'DevSecOps', category: 'Cloud', fee: 28000 },
        { code: '15', name: 'Microsoft Azure', category: 'Cloud', fee: 22000 },
        { code: '16', name: 'Automation with Python', category: 'Cloud', fee: 12000 },
        { code: '17', name: 'Spoken English Mastery', category: 'Soft Skills', fee: 8000 },
        { code: '18', name: 'Soft Skills Training', category: 'Soft Skills', fee: 6000 },
        { code: '19', name: 'Resume Writing & Interview Prep', category: 'Soft Skills', fee: 5000 },
        { code: '20', name: 'Handwriting Improvement', category: 'Soft Skills', fee: 4000 }
    ];

    // Mock Tutors (will be dynamic in Phase 3)
    const TUTORS = [
        { id: 1, name: 'Sneha Reddy', courses: ['01', '02'] },
        { id: 2, name: 'Ravi Kumar', courses: ['03', '04', '05', '09', '10'] },
        { id: 3, name: 'Priya Sharma', courses: ['06', '07'] },
        { id: 4, name: 'Kiran Rao', courses: ['08'] },
        { id: 5, name: 'Arun Mehta', courses: ['12', '13', '14', '15', '16'] },
        { id: 6, name: 'Deepika Nair', courses: ['17', '18', '19', '20'] }
    ];

    // ============================================
    // DOM Elements
    // ============================================
    const addStudentBtn = document.getElementById('addStudentBtn');
    const studentModalOverlay = document.getElementById('studentModalOverlay');
    const studentModal = document.getElementById('studentModal');
    const closeStudentModal = document.getElementById('closeStudentModal');
    const cancelStudentBtn = document.getElementById('cancelStudentBtn');
    const saveStudentBtn = document.getElementById('saveStudentBtn');
    const studentForm = document.getElementById('studentForm');
    const studentsTableBody = document.getElementById('studentsTableBody');
    const studentsCards = document.getElementById('studentsCards');
    const emptyState = document.getElementById('emptyState');
    const studentSearch = document.getElementById('studentSearch');

    // Form Elements
    const coursesTrigger = document.getElementById('coursesTrigger');
    const coursesOptions = document.getElementById('coursesOptions');
    const selectedCoursesContainer = document.getElementById('selectedCourses');
    const tutorsGroup = document.getElementById('tutorsGroup');
    const tutorAssignments = document.getElementById('tutorAssignments');
    const feeInput = document.getElementById('fee');
    const discountInput = document.getElementById('discount');
    const finalFeeInput = document.getElementById('finalFee');

    // State
    let students = [];
    let selectedCourses = [];
    let selectedTutors = {}; // { courseCode: tutorId }
    let editingStudentId = null;

    // ============================================
    // Initialize
    // ============================================
    initCoursesDropdown();
    await loadStudents();

    // ============================================
    // Courses Multi-Select Dropdown
    // ============================================
    function initCoursesDropdown() {
        // Populate course options
        coursesOptions.innerHTML = COURSES.map(course => `
            <div class="multi-select-option" data-code="${course.code}">
                <input type="checkbox" id="course_${course.code}">
                <label for="course_${course.code}">${course.name}</label>
            </div>
        `).join('');

        // Toggle dropdown
        coursesTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            coursesOptions.classList.toggle('active');
        });

        // Select/Deselect options
        coursesOptions.querySelectorAll('.multi-select-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const code = option.dataset.code;
                const checkbox = option.querySelector('input');
                checkbox.checked = !checkbox.checked;
                option.classList.toggle('selected', checkbox.checked);

                if (checkbox.checked) {
                    selectedCourses.push(code);
                } else {
                    selectedCourses = selectedCourses.filter(c => c !== code);
                }

                updateSelectedTags();
                updateTutorAssignments();
                updateFees();
            });
        });

        // Close on outside click
        document.addEventListener('click', () => {
            coursesOptions.classList.remove('active');
        });
    }

    function updateSelectedTags() {
        if (selectedCourses.length === 0) {
            coursesTrigger.innerHTML = '<span class="placeholder">Select courses...</span><i class="fas fa-chevron-down"></i>';
            selectedCoursesContainer.innerHTML = '';
            return;
        }

        coursesTrigger.innerHTML = `<span>${selectedCourses.length} course(s) selected</span><i class="fas fa-chevron-down"></i>`;

        selectedCoursesContainer.innerHTML = selectedCourses.map(code => {
            const course = COURSES.find(c => c.code === code);
            return `
                <span class="selected-tag" data-code="${code}">
                    ${course.name}
                    <i class="fas fa-times remove-tag"></i>
                </span>
            `;
        }).join('');

        // Remove tag handler
        selectedCoursesContainer.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.target.closest('.selected-tag').dataset.code;
                selectedCourses = selectedCourses.filter(c => c !== code);

                // Update checkbox
                const option = coursesOptions.querySelector(`[data-code="${code}"]`);
                if (option) {
                    option.classList.remove('selected');
                    option.querySelector('input').checked = false;
                }

                updateSelectedTags();
                updateTutorAssignments();
                updateFees();
            });
        });
    }

    function updateTutorAssignments() {
        if (selectedCourses.length === 0) {
            tutorsGroup.style.display = 'none';
            return;
        }

        tutorsGroup.style.display = 'block';
        tutorAssignments.innerHTML = selectedCourses.map(code => {
            const course = COURSES.find(c => c.code === code);
            const availableTutors = TUTORS.filter(t => t.courses.includes(code));
            const currentTutor = selectedTutors[code] || '';
            return `
                <div class="tutor-assignment">
                    <span class="tutor-assignment-course">${course.name}</span>
                    <select class="tutor-select" data-course="${code}">
                        <option value="">Select tutor...</option>
                        ${availableTutors.map(t => `
                            <option value="${t.id}" ${currentTutor == t.id ? 'selected' : ''}>${t.name}</option>
                        `).join('')}
                    </select>
                </div>
            `;
        }).join('');

        // Attach change listeners
        tutorAssignments.querySelectorAll('.tutor-select').forEach(select => {
            select.addEventListener('change', (e) => {
                selectedTutors[e.target.dataset.course] = e.target.value;
            });
        });
    }

    function updateFees() {
        const totalFee = selectedCourses.reduce((sum, code) => {
            const course = COURSES.find(c => c.code === code);
            return sum + (course ? course.fee : 0);
        }, 0);

        feeInput.value = totalFee;
        const discount = parseInt(discountInput.value) || 0;
        finalFeeInput.value = Math.max(0, totalFee - discount);
    }

    discountInput.addEventListener('input', updateFees);

    // ============================================
    // Modal Controls
    // ============================================
    function openModal(editing = false) {
        studentModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (!editing) {
            document.getElementById('studentModalTitle').textContent = 'Add New Student';
            saveStudentBtn.querySelector('span').textContent = 'Save Student';
            studentForm.reset();
            resetCourseSelection();
        }
    }

    function closeModal() {
        studentModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        editingStudentId = null;
        studentForm.reset();
        resetCourseSelection();
    }

    function resetCourseSelection() {
        selectedCourses = [];
        selectedTutors = {};
        coursesOptions.querySelectorAll('.multi-select-option').forEach(opt => {
            opt.classList.remove('selected');
            opt.querySelector('input').checked = false;
        });
        updateSelectedTags();
        updateTutorAssignments();
        updateFees();
    }

    addStudentBtn.addEventListener('click', () => openModal(false));
    closeStudentModal.addEventListener('click', closeModal);
    cancelStudentBtn.addEventListener('click', closeModal);
    studentModalOverlay.addEventListener('click', (e) => {
        if (e.target === studentModalOverlay) closeModal();
    });

    // ============================================
    // Generate Student ID
    // ============================================
    function generateStudentId(courseCode) {
        // Get all students enrolled in this course
        const courseStudents = students.filter(s =>
            s.courses && s.courses.includes(courseCode)
        );
        const sequence = (courseStudents.length + 1).toString().padStart(3, '0');
        return `ACS-${courseCode}-${sequence}`;
    }

    // ============================================
    // Save Student
    // ============================================
    saveStudentBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Validation
        const firstName = document.getElementById('firstName').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (!firstName || !surname) {
            window.toast.warning('Required', 'Please enter first name and surname');
            return;
        }

        if (!phone) {
            window.toast.warning('Required', 'Please enter phone number');
            return;
        }

        if (selectedCourses.length === 0) {
            window.toast.warning('Required', 'Please select at least one course');
            return;
        }

        // Collect form data
        const studentData = {
            id: editingStudentId || generateStudentId(selectedCourses[0]),
            name: `${firstName} ${surname}`,
            first_name: firstName,
            surname: surname,
            phone: phone,
            email: document.getElementById('email').value.trim() || null,
            courses: selectedCourses,
            tutors: selectedTutors,
            fee: parseInt(feeInput.value) || 0,
            discount: parseInt(discountInput.value) || 0,
            final_fee: parseInt(finalFeeInput.value) || 0,
            demo_date: document.getElementById('demoDate').value || null,
            joining_date: document.getElementById('joiningDate').value || null,
            batch_time: document.getElementById('batchTime').value || null,
            lead_source: document.getElementById('leadSource').value || null,
            occupation: document.getElementById('occupation').value || null,
            address: document.getElementById('address').value.trim() || null,
            notes: document.getElementById('notes').value.trim() || null,
            created_at: editingStudentId ? undefined : new Date().toISOString()
        };

        saveStudentBtn.disabled = true;
        saveStudentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            // For now, save to localStorage (will be Supabase in production)
            if (editingStudentId) {
                const index = students.findIndex(s => s.id === editingStudentId);
                if (index !== -1) {
                    students[index] = { ...students[index], ...studentData };
                }
                window.toast.success('Updated', 'Student updated successfully');
            } else {
                students.push(studentData);
                window.toast.success('Added', 'Student added successfully');
            }

            saveStudentsToStorage();
            renderStudents();
            updateDashboardStats();
            closeModal();

        } catch (error) {
            console.error('Error saving student:', error);
            window.toast.error('Error', 'Failed to save student');
        } finally {
            saveStudentBtn.disabled = false;
            saveStudentBtn.innerHTML = '<i class="fas fa-save"></i> <span>Save Student</span>';
        }
    });

    // ============================================
    // Load Students
    // ============================================
    async function loadStudents() {
        try {
            // Load from localStorage for now
            const stored = localStorage.getItem('craftsoft_students');
            students = stored ? JSON.parse(stored) : [];

            // Add mock data if empty
            if (students.length === 0) {
                students = [
                    {
                        id: 'ACS-01-001',
                        name: 'Rahul Sharma',
                        first_name: 'Rahul',
                        surname: 'Sharma',
                        phone: '9876543210',
                        email: 'rahul@example.com',
                        courses: ['01'],
                        tutors: [1],
                        fee: 15000,
                        discount: 1000,
                        final_fee: 14000,
                        demo_date: '2024-12-20',
                        joining_date: '2024-12-25',
                        batch_time: '10:00',
                        lead_source: 'website',
                        occupation: 'student',
                        address: 'Hyderabad, Telangana',
                        notes: 'Interested in branding projects',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'ACS-12-001',
                        name: 'Priya Kumari',
                        first_name: 'Priya',
                        surname: 'Kumari',
                        phone: '8765432109',
                        email: 'priya@example.com',
                        courses: ['12', '13'],
                        tutors: [5],
                        fee: 55000,
                        discount: 5000,
                        final_fee: 50000,
                        demo_date: '2024-12-18',
                        joining_date: '2024-12-22',
                        batch_time: '18:00',
                        lead_source: 'linkedin',
                        occupation: 'working',
                        address: 'Bengaluru, Karnataka',
                        notes: 'Working professional, needs weekend batches',
                        created_at: new Date().toISOString()
                    }
                ];
                saveStudentsToStorage();
            }

            renderStudents();
            updateDashboardStats();

        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    function saveStudentsToStorage() {
        localStorage.setItem('craftsoft_students', JSON.stringify(students));
    }

    // ============================================
    // Render Students
    // ============================================
    function renderStudents(filteredStudents = null) {
        const data = filteredStudents || students;

        if (data.length === 0) {
            studentsTableBody.innerHTML = '';
            studentsCards.innerHTML = '';
            emptyState.style.display = 'block';
            document.querySelector('.data-table').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        document.querySelector('.data-table').style.display = 'table';

        // Table View (Desktop)
        studentsTableBody.innerHTML = data.map(student => `
            <tr data-id="${student.id}">
                <td><span class="student-id">${student.id}</span></td>
                <td><span class="student-name">${student.name}</span></td>
                <td>
                    <div class="phone-cell">
                        <span>${student.phone}</span>
                        <button class="action-btn whatsapp" title="WhatsApp" onclick="openWhatsApp('${student.phone}')">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="course-tags">
                        ${student.courses.map(code => {
            const course = COURSES.find(c => c.code === code);
            return `<span class="course-tag">${course ? course.name.split(' ')[0] : code}</span>`;
        }).join('')}
                    </div>
                </td>
                <td>${student.joining_date ? formatDate(student.joining_date) : '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" title="Edit" onclick="editStudent('${student.id}')">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" onclick="deleteStudent('${student.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Card View (Mobile)
        studentsCards.innerHTML = data.map(student => `
            <div class="data-card" data-id="${student.id}">
                <div class="data-card-header">
                    <span class="data-card-id">${student.id}</span>
                    <div class="action-btns">
                        <button class="action-btn edit" title="Edit" onclick="editStudent('${student.id}')">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" onclick="deleteStudent('${student.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="data-card-name">${student.name}</div>
                <div class="data-card-row">
                    <i class="fas fa-phone"></i>
                    <span>${student.phone}</span>
                </div>
                <div class="data-card-row">
                    <i class="fas fa-book"></i>
                    <span>${student.courses.map(code => {
            const course = COURSES.find(c => c.code === code);
            return course ? course.name.split(' ')[0] : code;
        }).join(', ')}</span>
                </div>
                ${student.joining_date ? `
                    <div class="data-card-row">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(student.joining_date)}</span>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // ============================================
    // WhatsApp Integration
    // ============================================
    window.openWhatsApp = function (phone) {
        // Clean phone number
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        // Add India country code if not present
        if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone;
        }
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    // ============================================
    // Edit Student
    // ============================================
    window.editStudent = function (id) {
        const student = students.find(s => s.id === id);
        if (!student) return;

        editingStudentId = id;
        document.getElementById('studentModalTitle').textContent = 'Edit Student';
        saveStudentBtn.querySelector('span').textContent = 'Update Student';

        // Populate form
        document.getElementById('firstName').value = student.first_name || '';
        document.getElementById('surname').value = student.surname || '';
        document.getElementById('phone').value = student.phone || '';
        document.getElementById('email').value = student.email || '';
        document.getElementById('demoDate').value = student.demo_date || '';
        document.getElementById('joiningDate').value = student.joining_date || '';
        document.getElementById('batchTime').value = student.batch_time || '';
        document.getElementById('leadSource').value = student.lead_source || '';
        document.getElementById('occupation').value = student.occupation || '';
        document.getElementById('address').value = student.address || '';
        document.getElementById('notes').value = student.notes || '';
        document.getElementById('discount').value = student.discount || 0;

        // Restore course selection
        selectedCourses = [...(student.courses || [])];
        selectedTutors = student.tutors || {};
        coursesOptions.querySelectorAll('.multi-select-option').forEach(opt => {
            const code = opt.dataset.code;
            if (selectedCourses.includes(code)) {
                opt.classList.add('selected');
                opt.querySelector('input').checked = true;
            } else {
                opt.classList.remove('selected');
                opt.querySelector('input').checked = false;
            }
        });
        updateSelectedTags();
        updateTutorAssignments();
        updateFees();

        openModal(true);
    };

    // ============================================
    // Delete Student
    // ============================================
    window.deleteStudent = function (id) {
        const student = students.find(s => s.id === id);
        if (!student) return;

        if (window.modal) {
            window.modal.confirm(
                'Delete Student',
                `Are you sure you want to delete <strong>${student.name}</strong>?`,
                () => {
                    students = students.filter(s => s.id !== id);
                    saveStudentsToStorage();
                    renderStudents();
                    updateDashboardStats();
                    window.toast.success('Deleted', 'Student removed successfully');
                }
            );
        }
    };

    // ============================================
    // Search
    // ============================================
    studentSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            renderStudents();
            return;
        }

        const filtered = students.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query) ||
            s.phone.includes(query) ||
            (s.email && s.email.toLowerCase().includes(query))
        );
        renderStudents(filtered);
    });

    // ============================================
    // Update Dashboard Stats
    // ============================================
    function updateDashboardStats() {
        // Update localStorage for dashboard to read
        localStorage.setItem('craftsoft_student_count', students.length);
    }
});
