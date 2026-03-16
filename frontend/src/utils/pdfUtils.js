import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a professional PDF for an electricity bill
 * @param {Object} bill The bill data
 * @param {Object} user The user/tenant data
 * @param {Object} pg The PG property data
 */
export const generateElectricityBillPDF = (bill, user, pg) => {
  try {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243); // Accent Blue
    doc.text('APNA ROOMS', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Premium PG Management Platform', 105, 28, { align: 'center' });
    
    doc.setDrawColor(230);
    doc.line(20, 35, 190, 35);

    // Bill Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('ELECTRICITY INVOICE', 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Bill Date: ${dateStr}`, 190, 50, { align: 'right' });
    doc.text(`Invoice #: ELEC-${(bill?.id || 'TEMP').substring(0, 8).toUpperCase()}`, 190, 56, { align: 'right' });

    // PG & User Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Property Details:', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(pg?.name || 'Apna Rooms Property', 20, 76);
    doc.text(pg?.address || '', 20, 82, { maxWidth: 80 });

    doc.setFont('helvetica', 'bold');
    doc.text('Tenant Details:', 120, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(user?.full_name || 'Valued Tenant', 120, 76);
    doc.text(`Room: ${bill?.rooms?.room_number || 'N/A'}`, 120, 82);

    // Table
    const tableData = [
      ['Billing Month', bill?.billing_month || 'N/A'],
      ['Units Consumed', `${bill?.units || 0} kWh`],
      ['Rate per Unit', `INR ${bill?.rate || 0}`],
      ['Total Amount', `INR ${bill?.amount || 0}`],
      ['Payment Status', bill?.is_paid ? 'PAID' : 'UNPAID']
    ];

    autoTable(doc, {
      startY: 100,
      head: [['Description', 'Details']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243] },
      margin: { left: 20, right: 20 }
    });

    // Footer
    const finalY = (doc.lastAutoTable?.finalY || 150) + 20;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('This is a computer-generated document. No signature is required.', 105, finalY, { align: 'center' });
    doc.text('Thank you for choosing Apna Rooms!', 105, finalY + 6, { align: 'center' });

    doc.save(`Bill_${(bill?.billing_month || 'History').replace(' ', '_')}.pdf`);
    return true;
  } catch (error) {
    console.error('Electricity Bill PDF Error:', error);
    throw error;
  }
};

/**
 * Generates a professional Rent Receipt PDF
 * @param {Object} booking The booking data
 * @param {Object} user The user data
 * @param {Object} pg The PG data
 */
export const generateRentReceiptPDF = (booking, user, pg) => {
  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243);
    doc.text('APNA ROOMS', 105, 20, { align: 'center' });
    
    doc.setDrawColor(230);
    doc.line(20, 35, 190, 35);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('RENT RECEIPT', 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Receipt Date: ${new Date().toLocaleDateString()}`, 190, 50, { align: 'right' });
    doc.text(`Receipt #: RENT-${(booking?.id || 'TEMP').substring(0, 8).toUpperCase()}`, 190, 56, { align: 'right' });

    // Info
    doc.setFontSize(11);
    doc.text(`Received with thanks from ${user?.full_name || 'Tenant'}`, 20, 75);
    doc.text(`Sum of INR ${booking?.paid_amount || booking?.amount || 0} towards rent for ${pg?.name || 'Property'}`, 20, 82);
    doc.text(`Room: ${booking?.rooms?.room_number || booking?.room_id || 'N/A'} | Plan: ${booking?.payment_plan || 'Full'}`, 20, 89);

    // Table
    const tableData = [
      ['Total Rent Amount', `INR ${booking?.amount || 0}`],
      ['Amount Paid Now', `INR ${booking?.paid_amount || booking?.amount || 0}`],
      ['Contract Duration', `${booking?.contract_months || 1} Months`],
      ['Payment Status', 'SUCCESS']
    ];

    autoTable(doc, {
      startY: 100,
      head: [['Item', 'Amount/Details']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [33, 150, 243] },
      margin: { left: 20, right: 20 }
    });

    doc.save(`Rent_Receipt_${(booking?.id || 'History').substring(0, 8)}.pdf`);
    return true;
  } catch (error) {
    console.error('Rent Receipt PDF Error:', error);
    throw error;
  }
};

/**
 * Generates a receipt for a specific payment from the history
 */
export const generatePaymentReceiptPDF = (payment, user, pg, booking) => {
  try {
    const doc = new jsPDF();
    if (!doc) throw new Error('Could not initialize PDF document');
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243);
    doc.text('APNA ROOMS', 105, 20, { align: 'center' });
    
    doc.setDrawColor(230);
    doc.line(20, 35, 190, 35);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('PAYMENT RECEIPT', 20, 50);
    
    const paymentDate = payment?.created_at ? new Date(payment.created_at).toLocaleDateString() : new Date().toLocaleDateString();
    const receiptNo = payment?.id ? payment.id.substring(0, 8).toUpperCase() : 'TEMP';

    doc.setFontSize(10);
    doc.text(`Payment Date: ${paymentDate}`, 190, 50, { align: 'right' });
    doc.text(`Receipt #: PAY-${receiptNo}`, 190, 56, { align: 'right' });

    // Info
    doc.setFontSize(11);
    const tenantName = user?.full_name || 'Valued Tenant';
    doc.text(`Received with thanks from ${tenantName}`, 20, 75);
    doc.text(`Sum of INR ${payment?.amount || 0} for ${pg?.name || booking?.pgs?.name || 'Property'}`, 20, 82);
    doc.text(`Payment Type: ${payment?.type?.replace('_', ' ').toUpperCase() || 'RENT'}`, 20, 89);

    // Table
    const tableData = [
      ['Payment ID', payment?.payment_id || 'N/A'],
      ['Order ID', payment?.order_id || 'N/A'],
      ['Amount Paid', `INR ${payment?.amount || 0}`],
      ['Room Number', booking?.rooms?.room_number || booking?.room_id || 'N/A'],
      ['Payment Status', (payment?.status || 'SUCCESS').toUpperCase()]
    ];

    autoTable(doc, {
      startY: 100,
      head: [['Transaction Detail', 'Value']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243] },
      margin: { left: 20, right: 20 }
    });

    // Footer
    const finalY = (doc.lastAutoTable?.finalY || 150) + 20;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('This is an official payment confirmation receipt.', 105, finalY, { align: 'center' });
    doc.text('For any queries, please contact Apna Rooms support.', 105, finalY + 6, { align: 'center' });

    const fileName = payment?.payment_id ? `Receipt_${payment.payment_id.substring(0, 8)}.pdf` : `Receipt_${receiptNo}.pdf`;
    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('Payment Receipt PDF Error:', error);
    throw error;
  }
};
