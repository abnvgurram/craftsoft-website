// Record Payment Module
let students = [];
let courses = [];
let selectedStudent = null;
let selectedCourse = null;
let totalFee = 0;
let paidSoFar = 0;
let balanceDue = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const session = await window.supabaseConfig.getSession();
    if (!session) {
        window.location.href = '../../login.html';
        return;
    }

    // Initialize sidebar with correct page name
    AdminSidebar.init('record-payment', '../../');

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = AdminHeader.render('Record Payment');
    }

    const currentAdmin = await window.Auth.getCurrentAdmin();
    await AdminSidebar.renderAccountPanel(session, currentAdmin);

    // Load data
    await loadStudents();

    // Set default date to today
    const dateInput = document.getElementById('payment-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().slice(0, 10);
    }

    // Bind events
    bindEvents();
});

// =====================
// Load Students
// =====================
async function loadStudents() {
    try {
        const { data, error } = await window.supabaseClient
            .from('students')
            .select('id, first_name, last_name, phone')
            .order('first_name');

        if (error) throw error;
        students = data || [];

        const select = document.getElementById('student-select');
        select.innerHTML = '<option value="">Select a student</option>';

        students.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.first_name} ${s.last_name} (${s.phone || 'No phone'})</option>`;
        });
    } catch (err) {
        console.error('Error loading students:', err);
        window.AdminUtils.Toast.error('Error', 'Failed to load students');
    }
}

// =====================
// Load Student's Courses
// =====================
async function loadStudentCourses(studentId) {
    const courseSelect = document.getElementById('course-select');
    courseSelect.disabled = true;
    courseSelect.innerHTML = '<option value="">Loading...</option>';

    try {
        // 1. Get student's enrolled course codes and discounts
        const { data: student, error: studentError } = await window.supabaseClient
            .from('students')
            .select('courses, course_discounts')
            .eq('id', studentId)
            .single();

        if (studentError) throw studentError;
        const enrolledCodes = student.courses || [];
        const discounts = student.course_discounts || {};

        if (enrolledCodes.length === 0) {
            courseSelect.innerHTML = '<option value="">No courses found</option>';
            return;
        }

        // 2. Get details for these courses from the courses table
        const { data: courseDetails, error: courseError } = await window.supabaseClient
            .from('courses')
            .select('id, course_code, course_name, fee')
            .in('course_code', enrolledCodes);

        if (courseError) throw courseError;

        // 3. Map details and prepare the 'courses' array for UI
        courses = courseDetails.map(c => {
            const disc = parseFloat(discounts[c.course_code] || 0);
            return {
                id: c.id, // Supabase UUID
                course_code: c.course_code,
                course_name: c.course_name,
                original_fee: parseFloat(c.fee) || 0,
                discount: disc,
                final_fee: (parseFloat(c.fee) || 0) - disc
            };
        });

        courseSelect.innerHTML = '<option value="">Select a course</option>';
        courses.forEach(c => {
            courseSelect.innerHTML += `<option value="${c.id}">${c.course_name} (${c.course_code})</option>`;
        });

        courseSelect.disabled = false;
    } catch (err) {
        console.error('Error loading courses:', err);
        courseSelect.innerHTML = '<option value="">Error loading courses</option>';
    }
}

// =====================
// Calculate Fee Summary
// =====================
async function calculateFeeSummary(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    totalFee = course.final_fee;

    // Get total payments made for this student-course
    try {
        const { data: payments, error } = await window.supabaseClient
            .from('payments')
            .select('amount_paid')
            .eq('student_id', selectedStudent)
            .eq('course_id', course.id);

        if (error) throw error;

        paidSoFar = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
        balanceDue = totalFee - paidSoFar;

        // Update UI
        document.getElementById('total-fee').textContent = formatCurrency(totalFee);
        document.getElementById('paid-so-far').textContent = formatCurrency(paidSoFar);
        document.getElementById('balance-due').textContent = formatCurrency(balanceDue);
        document.getElementById('fee-summary').style.display = 'block';

        // Set default amount to balance due
        const amountInput = document.getElementById('amount-input');
        amountInput.value = balanceDue > 0 ? balanceDue : '';
        amountInput.max = balanceDue;
        amountInput.disabled = balanceDue <= 0;

        // Enable proceed button if balance due
        updateProceedButton();

    } catch (err) {
        console.error('Error calculating fees:', err);
    }
}

// =====================
// Format Currency
// =====================
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

// =====================
// Update Proceed Button
// =====================
function updateProceedButton() {
    const btn = document.getElementById('proceed-btn');
    const amount = parseFloat(document.getElementById('amount-input').value) || 0;
    const mode = document.querySelector('input[name="payment-mode"]:checked')?.value;
    const utr = document.getElementById('utr-input')?.value?.trim() || '';

    // For Offline UPI, require UTR
    const utrValid = mode === 'OFFLINE_UPI' ? utr.length > 5 : true;

    btn.disabled = !(selectedStudent && selectedCourse && amount > 0 && amount <= balanceDue && mode && utrValid);
}

// =====================
// Bind Events
// =====================
function bindEvents() {
    // Student selection
    document.getElementById('student-select').addEventListener('change', async (e) => {
        selectedStudent = e.target.value;
        selectedCourse = null;

        // Reset fee summary
        document.getElementById('fee-summary').style.display = 'none';
        document.getElementById('amount-input').value = '';
        document.getElementById('amount-input').disabled = true;

        if (selectedStudent) {
            await loadStudentCourses(selectedStudent);
        } else {
            const courseSelect = document.getElementById('course-select');
            courseSelect.disabled = true;
            courseSelect.innerHTML = '<option value="">Select student first</option>';
        }

        updateProceedButton();
    });

    // Course selection
    document.getElementById('course-select').addEventListener('change', async (e) => {
        selectedCourse = e.target.value;

        if (selectedCourse) {
            await calculateFeeSummary(selectedCourse);
        } else {
            document.getElementById('fee-summary').style.display = 'none';
            document.getElementById('amount-input').value = '';
            document.getElementById('amount-input').disabled = true;
        }

        updateProceedButton();
    });

    // Amount input
    document.getElementById('amount-input').addEventListener('input', updateProceedButton);

    // Payment mode change
    document.querySelectorAll('input[name="payment-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const utrGroup = document.getElementById('utr-group');
            if (e.target.value === 'OFFLINE_UPI') {
                utrGroup.style.display = 'block';
            } else {
                utrGroup.style.display = 'none';
                document.getElementById('utr-input').value = '';
            }
            updateProceedButton();
        });
    });

    // UTR input change
    document.getElementById('utr-input').addEventListener('input', updateProceedButton);

    // Form submission
    document.getElementById('payment-form').addEventListener('submit', handlePayment);
}

// =====================
// Handle Payment
// =====================
async function handlePayment(e) {
    e.preventDefault();

    const { Toast, Modal } = window.AdminUtils;
    const amount = parseFloat(document.getElementById('amount-input').value);
    const mode = document.querySelector('input[name="payment-mode"]:checked').value;
    const btn = document.getElementById('proceed-btn');

    if (amount > balanceDue) {
        Toast.error('Invalid', 'Amount cannot exceed balance due');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {
        if (mode === 'CASH') {
            await processCashPayment(amount);
        } else if (mode === 'UPI') {
            await processUPIPayment(amount);
        } else if (mode === 'OFFLINE_UPI') {
            const utr = document.getElementById('utr-input').value.trim();
            await processOfflineUPIPayment(amount, utr);
        }
    } catch (err) {
        console.error('Payment error:', err);
        Toast.error('Error', err.message || 'Payment failed');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Proceed';
    }
}

// =====================
// Process Cash Payment
// =====================
async function processCashPayment(amount) {
    const { Toast } = window.AdminUtils;
    const paymentDate = document.getElementById('payment-date').value;

    // Generate reference ID: PAY-CASH-YYYYMMDD-XXX
    const dateObj = new Date(paymentDate);
    const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of cash payments for this specific date for sequence
    const { count } = await window.supabaseClient
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('payment_date', paymentDate)
        .like('reference_id', `PAY-CASH-${dateStr}%`);

    const seq = String((count || 0) + 1).padStart(3, '0');
    const referenceId = `PAY-CASH-${dateStr}-${seq}`;

    // Insert payment
    const { data: payment, error: paymentError } = await window.supabaseClient
        .from('payments')
        .insert({
            student_id: selectedStudent,
            course_id: selectedCourse,
            amount_paid: amount,
            payment_mode: 'CASH',
            reference_id: referenceId,
            status: 'SUCCESS',
            payment_date: paymentDate
        })
        .select()
        .single();

    if (paymentError) throw paymentError;

    // Auto-create receipt
    await createReceipt(payment);

    // Log activity
    const student = students.find(s => s.id === selectedStudent);
    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
    await window.AdminUtils.Activity.add('fee_recorded', studentName, '../payments/receipts/');

    Toast.success('Success', 'Payment recorded successfully');

    // Redirect to receipts
    setTimeout(() => {
        window.location.href = '../receipts/';
    }, 1500);
}

// =====================
// Process Offline UPI Payment (Manual Entry)
// =====================
async function processOfflineUPIPayment(amount, utr) {
    const { Toast } = window.AdminUtils;
    const paymentDate = document.getElementById('payment-date').value;

    // Insert payment with mode = 'UPI' but reference = admin-entered UTR
    const { data: payment, error: paymentError } = await window.supabaseClient
        .from('payments')
        .insert({
            student_id: selectedStudent,
            course_id: selectedCourse,
            amount_paid: amount,
            payment_mode: 'UPI',
            reference_id: utr,
            status: 'SUCCESS',
            payment_date: paymentDate
        })
        .select()
        .single();

    if (paymentError) throw paymentError;

    // Auto-create receipt
    await createReceipt(payment);

    // Log activity
    const student = students.find(s => s.id === selectedStudent);
    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
    await window.AdminUtils.Activity.add('fee_recorded', studentName, '../payments/receipts/');

    Toast.success('Success', 'Offline UPI payment recorded');

    // Redirect to receipts
    setTimeout(() => {
        window.location.href = '../receipts/';
    }, 1500);
}

// =====================
// Process UPI Payment (Razorpay)
// =====================
async function processUPIPayment(amount) {
    const { Toast } = window.AdminUtils;
    const btn = document.getElementById('proceed-btn');

    try {
        // Step 1: Create Razorpay order via Netlify function
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating order...';

        const orderResponse = await fetch('/.netlify/functions/create-razorpay-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount,
                student_id: selectedStudent,
                course_id: selectedCourse
            })
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok || !orderData.success) {
            throw new Error(orderData.error || 'Failed to create order');
        }

        // Step 2: Get student info for prefill
        const student = students.find(s => s.id === selectedStudent);
        const course = courses.find(c => c.id === selectedCourse);

        // Step 3: Open Razorpay Checkout (UPI only)
        btn.innerHTML = '<i class="fa-brands fa-gg"></i> Complete UPI payment...';

        const razorpayOptions = {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.order_id,
            name: 'Abhi\'s Craftsoft',
            description: course ? `${course.course_name} Fee` : 'Course Fee',
            prefill: {
                name: student ? `${student.first_name} ${student.last_name}` : '',
                contact: student?.phone || ''
            },
            method: {
                upi: true,
                card: false,
                netbanking: false,
                wallet: false,
                emi: false
            },
            theme: {
                color: '#2896cd'
            },
            handler: async function (response) {
                // Payment successful - verify on backend
                await verifyPayment(response);
            },
            modal: {
                ondismiss: function () {
                    // User closed the modal
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Proceed';
                    Toast.info('Cancelled', 'Payment was cancelled');
                }
            }
        };

        const razorpay = new Razorpay(razorpayOptions);
        razorpay.on('payment.failed', function (response) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Proceed';
            Toast.error('Payment Failed', response.error.description || 'Please try again');
        });

        razorpay.open();

    } catch (err) {
        console.error('Online payment error:', err);
        Toast.error('Error', err.message || 'Failed to initiate payment');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Proceed';
    }
}

// =====================
// Verify Payment (Backend)
// =====================
async function verifyPayment(razorpayResponse) {
    const { Toast } = window.AdminUtils;
    const btn = document.getElementById('proceed-btn');

    try {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';

        const verifyResponse = await fetch('/.netlify/functions/verify-razorpay-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                student_id: selectedStudent,
                course_id: selectedCourse
            })
        });

        const result = await verifyResponse.json();

        if (!verifyResponse.ok || !result.success) {
            throw new Error(result.error || 'Payment verification failed');
        }

        // Success!
        Toast.success('Payment Successful', `Receipt: ${result.receipt_id}`);

        // Redirect to receipts
        setTimeout(() => {
            window.location.href = '../receipts/';
        }, 1500);

    } catch (err) {
        console.error('Verify payment error:', err);
        Toast.error('Verification Failed', err.message || 'Please contact support');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Proceed';
    }
}

// =====================
// Create Receipt (Auto after payment success)
// =====================
async function createReceipt(payment) {
    try {
        // Get student and course info for receipt ID
        const { data: student } = await window.supabaseClient
            .from('students')
            .select('first_name, last_name')
            .eq('id', payment.student_id)
            .single();

        const { data: course } = await window.supabaseClient
            .from('courses')
            .select('course_name')
            .eq('id', payment.course_id)
            .single();

        // Generate receipt ID using the database function
        const { data: receiptIdData } = await window.supabaseClient
            .rpc('generate_receipt_id', {
                p_student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown',
                p_course_name: course?.course_name || 'Unknown'
            });

        const receiptId = receiptIdData || `${Date.now()}-ACS`;

        // Calculate new balance
        const newBalance = balanceDue - payment.amount_paid;

        // Insert receipt
        const { error } = await window.supabaseClient
            .from('receipts')
            .insert({
                receipt_id: receiptId,
                payment_id: payment.id,
                student_id: payment.student_id,
                course_id: payment.course_id,
                amount_paid: payment.amount_paid,
                payment_mode: payment.payment_mode,
                reference_id: payment.reference_id,
                balance_due: balanceDue - payment.amount_paid,
                payment_date: payment.payment_date
            });

        if (error) throw error;

    } catch (err) {
        console.error('Error creating receipt:', err);
        // Don't throw - payment is still successful even if receipt creation fails
    }
}
