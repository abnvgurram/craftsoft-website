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
        this.margin = 25;
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
        doc.setFontSize(20);
        doc.setTextColor(...this.colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text("Abhi's Craft Soft", this.margin, y);

        y += 12;

        // Divider line
        doc.setDrawColor(...this.colors.border);
        doc.setLineWidth(0.5);
        doc.line(this.margin, y, this.pageWidth - this.margin, y);

        y += 15;

        // Payment Receipt Title
        doc.setFontSize(22);
        doc.setTextColor(...this.colors.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Receipt', this.margin, y);

        // Receipt ID (right aligned)
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.gray);
        doc.setFont('helvetica', 'normal');
        const receiptIdText = 'Receipt ID: ' + data.receiptId;
        doc.text(receiptIdText, this.pageWidth - this.margin, y, { align: 'right' });

        y += 8;

        // Subtitle
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.gray);
        doc.setFont('helvetica', 'normal');
        doc.text('This is a payment receipt for your enrollment in ' + data.courseName + '.', this.margin, y);

        y += 18;

        return y;
    }

    drawAmountBox(doc, y, data) {
        // "AMOUNT PAID" label
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text('AMOUNT PAID', this.margin, y);

        // Green underline
        doc.setDrawColor(...this.colors.primary);
        doc.setLineWidth(1.5);
        doc.line(this.margin, y + 2, this.margin + 28, y + 2);

        y += 12;

        // Amount value - Large and bold
        doc.setFontSize(28);
        doc.setTextColor(...this.colors.dark);
        doc.setFont('helvetica', 'bold');
        const amountStr = 'Rs. ' + this.formatCurrency(data.currentPayment);
        doc.text(amountStr, this.margin, y);

        // Payment mode in parentheses (same line, smaller)
        const amountWidth = doc.getTextWidth(amountStr);
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.gray);
        doc.setFont('helvetica', 'normal');
        doc.text('  (' + data.paymentMode + ')', this.margin + amountWidth + 2, y);

        y += 15;

        return y;
    }

    drawIssuedTo(doc, y, data) {
        const col2X = 120;

        // ISSUED TO label
        doc.setFontSize(9);
        doc.setTextColor(...this.colors.lightGray);
        doc.setFont('helvetica', 'bold');
        doc.text('ISSUED TO', this.margin, y);
        doc.text('PAID ON', col2X, y);

        y += 6;

        // Values
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.dark);
        doc.setFont('helvetica', 'normal');
        doc.text(data.studentName, this.margin, y);
        doc.text(data.paymentDate, col2X, y);

        y += 6;

        // Phone Number
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.gray);
        doc.text(data.phone || '', this.margin, y);

        y += 15;

        // Divider line
        doc.setDrawColor(...this.colors.border);
        doc.setLineWidth(0.3);
        doc.line(this.margin, y, this.pageWidth - this.margin, y);

        y += 12;

        return y;
    }

    drawPaymentTable(doc, y, data) {
        const col1X = this.margin;
        const col2X = 95;
        const col3X = this.pageWidth - this.margin;

        // Table Header Background
        doc.setFillColor(...this.colors.tableHeader);
        doc.rect(this.margin - 3, y - 5, this.contentWidth + 6, 10, 'F');

        // Table Headers
        doc.setFontSize(8);
        doc.setTextColor(...this.colors.gray);
        doc.setFont('helvetica', 'bold');
        doc.text('NAME OF THE COURSE', col1X, y);
        doc.text('MODE OF PAYMENT', col2X, y);
        doc.text('AMOUNT PAID', col3X, y, { align: 'right' });

        y += 12;

        // Payment History Rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Combine historical payments with current payment
        const allPayments = [...(data.paymentHistory || [])];

        // Add current payment at the end
        allPayments.push({
            amount: data.currentPayment,
            mode: data.paymentMode,
            date: data.paymentDate,
            isCurrent: true
        });

        allPayments.forEach((payment) => {
            // Course Name
            doc.setTextColor(...this.colors.dark);
            doc.setFont('helvetica', 'normal');
            doc.text(data.courseName, col1X, y);

            // Payment Mode
            doc.setTextColor(...this.colors.gray);
            doc.text(payment.mode || 'Cash', col2X, y);

            // Amount - highlight current payment
            const amtText = 'Rs. ' + this.formatCurrency(payment.amount);
            if (payment.isCurrent) {
                doc.setTextColor(...this.colors.primary);
                doc.setFont('helvetica', 'bold');
            } else {
                doc.setTextColor(...this.colors.dark);
                doc.setFont('helvetica', 'normal');
            }
            doc.text(amtText, col3X, y, { align: 'right' });

            doc.setFont('helvetica', 'normal');
            y += 8;
        });

        y += 5;

        // Bottom border
        doc.setDrawColor(...this.colors.border);
        doc.setLineWidth(0.3);
        doc.line(this.margin, y, this.pageWidth - this.margin, y);

        y += 15;

        return y;
    }

    drawTotals(doc, y, data) {
        const labelX = 120;
        const valueX = this.pageWidth - this.margin;

        // Calculate totals
        const historicalTotal = (data.paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalPaid = historicalTotal + data.currentPayment;
        const balanceDue = data.totalFee - totalPaid;

        // Total Fee
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Fee', labelX, y);
        doc.text('Rs. ' + this.formatCurrency(data.totalFee), valueX, y, { align: 'right' });

        y += 10;

        // Amount Paid (Green)
        doc.setTextColor(...this.colors.primary);
        doc.setFont('helvetica', 'normal');
        doc.text('Amount Paid', labelX, y);
        doc.text('Rs. ' + this.formatCurrency(totalPaid), valueX, y, { align: 'right' });

        y += 10;

        // Balance Due
        if (balanceDue > 0) {
            doc.setTextColor(...this.colors.dark);
            doc.setFont('helvetica', 'bold');
            doc.text('Balance Due', labelX, y);
            doc.text('Rs. ' + this.formatCurrency(balanceDue), valueX, y, { align: 'right' });
        } else {
            doc.setTextColor(...this.colors.primary);
            doc.setFont('helvetica', 'bold');
            doc.text('Fully Paid', labelX, y);
            doc.text('Yes', valueX, y, { align: 'right' });
        }

        y += 20;

        return y;
    }

    drawFooter(doc) {
        const footerY = this.pageHeight - 35;

        // Top border
        doc.setDrawColor(...this.colors.border);
        doc.setLineWidth(0.5);
        doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

        // Company Name
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.dark);
        doc.setFont('helvetica', 'bold');
        doc.text("Abhi's Craft Soft", this.margin, footerY + 3);

        // Address
        doc.setFontSize(9);
        doc.setTextColor(...this.colors.gray);
        doc.setFont('helvetica', 'normal');
        doc.text('Plot No. 163, Vijayasree Colony, Vanasthalipuram, Hyderabad 500070', this.margin, footerY + 10);

        // Contact
        doc.text('Phone: +91 7842239090 | Email: team.craftsoft@gmail.com', this.margin, footerY + 16);
    }

    formatCurrency(amount) {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return '0.00';
        }
        return Number(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    static generateReceiptId() {
        const year = new Date().getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        return 'RCPT-' + year + '-' + random;
    }

    static formatDate(date) {
        if (!date) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
}

// Create global instance
window.receiptGenerator = new ReceiptGenerator();

// Quick function to generate receipt from student data
window.generateReceipt = function (student, payment) {
    const receiptData = {
        receiptId: ReceiptGenerator.generateReceiptId(),
        studentName: student.name || student.studentName || '',
        phone: student.phone || student.phoneNumber || '',
        courseName: student.course || student.courseName || '',
        totalFee: student.totalFee || 0,
        currentPayment: payment.amount || 0,
        paymentMode: payment.mode || 'Cash',
        paymentDate: ReceiptGenerator.formatDate(new Date()),
        paymentHistory: (student.paymentHistory || []).map(p => ({
            amount: p.amount || 0,
            mode: p.mode || 'Cash',
            date: ReceiptGenerator.formatDate(p.date)
        }))
    };

    return window.receiptGenerator.generate(receiptData);
};

console.log('Receipt Generator loaded successfully!');
