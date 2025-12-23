/**
 * Payment Receipt PDF Generator
 * Uses jsPDF to generate Razorpay-style receipts
 * Matches the exact layout and styling of professional payment receipts
 */

// Receipt Generator Class
class ReceiptGenerator {
    constructor() {
        this.pageWidth = 210; // A4 width in mm
        this.pageHeight = 297; // A4 height in mm
        this.margin = 20;
        this.contentWidth = this.pageWidth - (this.margin * 2);

        // Colors (RGB)
        this.colors = {
            primary: [16, 185, 129],      // Green #10B981
            dark: [17, 24, 39],           // Dark gray #111827
            gray: [107, 114, 128],        // Gray #6B7280
            lightGray: [156, 163, 175],   // Light gray #9CA3AF
            tableHeader: [249, 250, 251], // Very light gray #F9FAFB
            border: [229, 231, 235],      // Border gray #E5E7EB
            white: [255, 255, 255]
        };
    }

    /**
     * Generate a payment receipt PDF
     * @param {Object} data - Receipt data
     * @param {string} data.receiptId - Receipt ID (e.g., "RCPT-2024-0047")
     * @param {string} data.studentName - Student's full name
     * @param {string} data.phone - Student's phone number
     * @param {string} data.courseName - Name of the course
     * @param {number} data.totalFee - Total course fee
     * @param {number} data.currentPayment - Current payment amount
     * @param {string} data.paymentMode - Payment mode (UPI/Cash/Bank Transfer)
     * @param {string} data.paymentDate - Payment date
     * @param {Array} data.paymentHistory - Array of past payments [{amount, mode, date}]
     */
    generate(data) {
        // Create new PDF document
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        let y = this.margin; // Current Y position

        // === HEADER SECTION ===
        y = this.drawHeader(doc, y, data);

        // === AMOUNT PAID BOX ===
        y = this.drawAmountBox(doc, y, data);

        // === ISSUED TO / PAID ON ===
        y = this.drawIssuedTo(doc, y, data);

        // === PAYMENT HISTORY TABLE ===
        y = this.drawPaymentTable(doc, y, data);

        // === TOTALS SECTION ===
        y = this.drawTotals(doc, y, data);

        // === FOOTER ===
        this.drawFooter(doc);

        // Save the PDF
        const fileName = `Receipt_${data.receiptId}_${data.studentName.replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);

        return fileName;
    }

    drawHeader(doc, y, data) {
        // Company Logo/Name
        doc.setFontSize(18);
        doc.setTextColor(...this.colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text("Abhi's Craft Soft", this.margin, y);

        y += 15;

        // Divider line
        doc.setDrawColor(...this.colors.border);
        doc.setLineWidth(0.5);
        doc.line(this.margin, y, this.pageWidth - this.margin, y);

        y += 12;

        // Payment Receipt Title + Receipt ID
        doc.setFontSize(20);
        doc.setTextColor(...this.colors.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Receipt', this.margin, y);

        // Receipt ID (right aligned, smaller, gray)
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.gray);
        doc.setFont('helvetica', 'normal');
        const receiptIdText = `Receipt ID: ${data.receiptId}`;
        const receiptIdWidth = doc.getTextWidth(receiptIdText);
        doc.text(receiptIdText, this.pageWidth - this.margin - receiptIdWidth, y);

        y += 8;

        // Subtitle
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.gray);
        doc.setFont('helvetica', 'normal');
        doc.text(`This is a payment receipt for your enrollment in ${data.courseName}.`, this.margin, y);

        y += 15;

        return y;
    }

    drawAmountBox(doc, y, data) {
        // "AMOUNT PAID" label with green underline
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text('AMOUNT PAID', this.margin, y);

        // Green underline
        const labelWidth = doc.getTextWidth('AMOUNT PAID');
        doc.setDrawColor(...this.colors.primary);
        doc.setLineWidth(1.5);
        doc.line(this.margin, y + 2, this.margin + labelWidth, y + 2);

        // Amount value with payment mode
        doc.setFontSize(22);
        doc.setTextColor(...this.colors.dark);
        doc.setFont('helvetica', 'bold');
        const amountText = `₹ ${this.formatCurrency(data.currentPayment)}`;
        doc.text(amountText, this.margin + labelWidth + 15, y);

        // Payment mode in parentheses
        const amountWidth = doc.getTextWidth(amountText);
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.gray);
        doc.setFont('helvetica', 'normal');
        doc.text(`(${data.paymentMode})`, this.margin + labelWidth + 15 + amountWidth + 3, y);

        y += 18;

        return y;
    }

    drawIssuedTo(doc, y, data) {
        // Two column layout
        const col1X = this.margin;
        const col2X = this.margin + 100;

        // ISSUED TO label
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.lightGray);
        doc.setFont('helvetica', 'normal');
        doc.text('ISSUED TO', col1X, y);

        // PAID ON label
        doc.text('PAID ON', col2X, y);

        y += 7;

        // Student Name
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.dark);
        doc.setFont('helvetica', 'normal');
        doc.text(data.studentName, col1X, y);

        // Payment Date
        doc.text(data.paymentDate, col2X, y);

        y += 6;

        // Phone Number
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.gray);
        doc.text(data.phone, col1X, y);

        y += 18;

        // Divider line
        doc.setDrawColor(...this.colors.border);
        doc.setLineWidth(0.3);
        doc.line(this.margin, y, this.pageWidth - this.margin, y);

        y += 10;

        return y;
    }

    drawPaymentTable(doc, y, data) {
        const tableStartY = y;
        const col1X = this.margin;
        const col2X = this.margin + 85;
        const col3X = this.pageWidth - this.margin - 35;

        // Table Header Background
        doc.setFillColor(...this.colors.tableHeader);
        doc.rect(this.margin, y - 5, this.contentWidth, 12, 'F');

        // Table Headers
        doc.setFontSize(9);
        doc.setTextColor(...this.colors.gray);
        doc.setFont('helvetica', 'bold');
        doc.text('NAME OF THE COURSE', col1X, y + 3);
        doc.text('MODE OF PAYMENT', col2X, y + 3);
        doc.text('AMOUNT PAID', col3X, y + 3);

        y += 15;

        // Payment History Rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        // Combine historical payments with current payment
        const allPayments = [...(data.paymentHistory || [])];

        // Add current payment at the end
        allPayments.push({
            amount: data.currentPayment,
            mode: data.paymentMode,
            date: data.paymentDate,
            isCurrent: true
        });

        allPayments.forEach((payment, index) => {
            // Course Name
            doc.setTextColor(...this.colors.dark);
            doc.text(data.courseName, col1X, y);

            // Payment Mode
            doc.setTextColor(...this.colors.gray);
            doc.text(payment.mode, col2X, y);

            // Amount
            if (payment.isCurrent) {
                // Highlight current payment
                doc.setTextColor(...this.colors.primary);
                doc.setFont('helvetica', 'bold');
            } else {
                doc.setTextColor(...this.colors.dark);
                doc.setFont('helvetica', 'normal');
            }
            const amountText = `₹ ${this.formatCurrency(payment.amount)}`;
            const amountWidth = doc.getTextWidth(amountText);
            doc.text(amountText, this.pageWidth - this.margin - amountWidth, y);

            // Add star for current payment
            if (payment.isCurrent) {
                doc.setFontSize(8);
                doc.text(' ★', this.pageWidth - this.margin - amountWidth - 8, y);
                doc.setFontSize(11);
            }

            doc.setFont('helvetica', 'normal');
            y += 10;
        });

        y += 5;

        // Bottom border
        doc.setDrawColor(...this.colors.border);
        doc.setLineWidth(0.3);
        doc.line(this.margin, y, this.pageWidth - this.margin, y);

        y += 12;

        return y;
    }

    drawTotals(doc, y, data) {
        const labelX = this.pageWidth - this.margin - 80;
        const valueX = this.pageWidth - this.margin;

        // Calculate totals
        const historicalTotal = (data.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);
        const totalPaid = historicalTotal + data.currentPayment;
        const balanceDue = data.totalFee - totalPaid;

        // Total Fee
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Fee', labelX, y);
        const totalFeeText = `₹ ${this.formatCurrency(data.totalFee)}`;
        doc.text(totalFeeText, valueX - doc.getTextWidth(totalFeeText), y);

        y += 10;

        // Amount Paid (Green)
        doc.setTextColor(...this.colors.primary);
        doc.setFont('helvetica', 'normal');
        doc.text('Amount Paid', labelX, y);
        const paidText = `₹ ${this.formatCurrency(totalPaid)}`;
        doc.text(paidText, valueX - doc.getTextWidth(paidText), y);

        y += 10;

        // Balance Due
        if (balanceDue > 0) {
            doc.setTextColor(...this.colors.dark);
            doc.setFont('helvetica', 'bold');
            doc.text('Balance Due', labelX, y);
            const balanceText = `₹ ${this.formatCurrency(balanceDue)}`;
            doc.text(balanceText, valueX - doc.getTextWidth(balanceText), y);
        } else {
            doc.setTextColor(...this.colors.primary);
            doc.setFont('helvetica', 'bold');
            doc.text('Fully Paid', labelX, y);
            doc.text('✓', valueX - doc.getTextWidth('✓'), y);
        }

        y += 20;

        return y;
    }

    drawFooter(doc) {
        const footerY = this.pageHeight - 30;

        // Top border
        doc.setDrawColor(...this.colors.border);
        doc.setLineWidth(0.5);
        doc.line(this.margin, footerY - 10, this.pageWidth - this.margin, footerY - 10);

        // Company Name
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.dark);
        doc.setFont('helvetica', 'bold');
        doc.text("Abhi's Craft Soft", this.margin, footerY);

        // Address
        doc.setFontSize(9);
        doc.setTextColor(...this.colors.gray);
        doc.setFont('helvetica', 'normal');
        doc.text('Plot No. 163, Vijayasree Colony, Vanasthalipuram, Hyderabad 500070', this.margin, footerY + 6);

        // Contact
        doc.text('Phone: +91 7842239090 | Email: team.craftsoft@gmail.com', this.margin, footerY + 12);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Generate Receipt ID
     * Format: RCPT-YYYY-XXXX
     */
    static generateReceiptId() {
        const year = new Date().getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        return `RCPT-${year}-${random}`;
    }

    /**
     * Format date for display
     */
    static formatDate(date) {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
}

// Create global instance
window.receiptGenerator = new ReceiptGenerator();

/**
 * Quick function to generate receipt from student data
 * @param {Object} student - Student object from Firestore
 * @param {Object} payment - Current payment details {amount, mode}
 */
window.generateReceipt = function (student, payment) {
    const receiptData = {
        receiptId: ReceiptGenerator.generateReceiptId(),
        studentName: student.name || student.studentName,
        phone: student.phone || student.phoneNumber,
        courseName: student.course || student.courseName,
        totalFee: student.totalFee || 0,
        currentPayment: payment.amount,
        paymentMode: payment.mode || 'Cash',
        paymentDate: ReceiptGenerator.formatDate(new Date()),
        paymentHistory: (student.paymentHistory || []).map(p => ({
            amount: p.amount,
            mode: p.mode || 'Cash',
            date: ReceiptGenerator.formatDate(p.date?.toDate?.() || p.date || new Date())
        }))
    };

    return window.receiptGenerator.generate(receiptData);
};

console.log('Receipt Generator loaded successfully!');
