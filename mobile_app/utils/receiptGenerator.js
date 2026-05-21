import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import api from '../config/api';

// Import your logo (ADJUST THE PATH BASED ON YOUR FOLDER STRUCTURE)
// If your receipt.js is in src/utils/ and assets is in project root:
const UNIVERSITY_LOGO = require('../assets/ualog.jpg');

// Payment method display labels
const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  card: 'Card',
  check: 'Check',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};

// Format currency
const formatCurrency = (amount) =>
  `$${Number(amount || 0).toFixed(2)}`;

// Format date nicely
const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};



// Convert local image to base64 for use in HTML
const getLogoBase64 = async () => {
    try {
      // Load the asset properly using expo-asset
      const asset = Asset.fromModule(UNIVERSITY_LOGO);
      await asset.downloadAsync();
      
      // Now read the file from its local URI
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('Failed to load logo:', error);
      return null;
    }
  };

// Build the HTML for the receipt
const buildReceiptHTML = (receipt, logoBase64, brandColor = '#1a365d') => {
  const lineItem = receipt.installment_number
    ? `Installment ${receipt.installment_number} of ${receipt.total_installments}`
    : receipt.transaction_description;

  const semesterLine = receipt.semester_name
    ? `<tr><td>Semester</td><td><strong>${receipt.semester_name}</strong></td></tr>`
    : '';

  const notesBlock = receipt.notes
    ? `
      <div class="notes">
        <div class="notes-label">Notes</div>
        <div class="notes-text">${receipt.notes}</div>
      </div>`
    : '';

  // Finance office contact details (customize these)
  const financeOffice = {
    phone: '+961 1 234 567',
    email: 'finance@antonine.edu',
    hours: 'Mon-Fri: 8:00 AM - 4:00 PM',
    location: 'Main Building, Ground Floor'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Receipt ${receipt.reference_number}</title>
      <style>
        @page {
          size: A4;
          margin: 24mm 18mm;
        }
        
        * { 
          box-sizing: border-box; 
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #1a365d;
          padding: 0;
          margin: 0;
          font-size: 11pt;
          line-height: 1.5;
          position: relative;
        }

        /* Watermark Background */
        body::before {
          content: "OFFICIAL RECEIPT";
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72pt;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.03);
          white-space: nowrap;
          pointer-events: none;
          z-index: 0;
          letter-spacing: 8px;
        }

        .receipt {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px;
          position: relative;
          z-index: 1;
          background: white;
        }

        /* Colored Top Bar */
        .top-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: ${brandColor};
          z-index: 2;
        }

        .header {
          border-bottom: 3px solid ${brandColor};
          padding-bottom: 16px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .logo-container img {
          height: 60px;
          width: auto;
          object-fit: contain;
        }

        .university-info h1 {
          font-size: 22pt;
          font-weight: 800;
          margin: 0 0 4px 0;
          color: ${brandColor};
        }

        .university-info .tagline {
          color: #4a5568;
          font-size: 10pt;
        }

        .receipt-label {
          text-align: right;
          color: #2b6cb0;
        }

        .receipt-label .badge {
          background: ${brandColor};
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 9pt;
          font-weight: 700;
          letter-spacing: 1px;
          display: inline-block;
          margin-bottom: 6px;
        }

        .receipt-label .ref-number {
          font-family: 'Courier New', monospace;
          font-size: 14pt;
          font-weight: 800;
          color: ${brandColor};
        }

        .receipt-label .ref-date {
          font-size: 9pt;
          color: #718096;
          margin-top: 4px;
        }

        /* Authorization Code Box */
        .auth-code {
          background: #ebf8ff;
          border: 1px solid ${brandColor};
          border-radius: 8px;
          padding: 10px 14px;
          margin: 16px 0;
          text-align: center;
        }

        .auth-code .label {
          color: #4a5568;
          font-size: 8pt;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .auth-code .code {
          font-family: 'Courier New', monospace;
          font-size: 14pt;
          font-weight: 800;
          color: ${brandColor};
          letter-spacing: 1px;
        }

        .section {
          margin-bottom: 22px;
        }

        .section-title {
          color: #718096;
          font-size: 8pt;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e2e8f0;
        }

        .info-grid {
          width: 100%;
          border-collapse: collapse;
        }

        .info-grid td {
          padding: 5px 0;
          font-size: 10pt;
        }

        .info-grid td:first-child {
          color: #718096;
          width: 35%;
        }

        .amount-box {
          background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
          border: 2px solid #9ae6b4;
          border-radius: 14px;
          padding: 20px 24px;
          margin: 20px 0;
          text-align: center;
        }

        .amount-box .label {
          color: #22543d;
          font-size: 9pt;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .amount-box .value {
          color: #22543d;
          font-size: 28pt;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .breakdown {
          background: #f8fafc;
          border-radius: 10px;
          padding: 14px 18px;
          margin: 16px 0;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 10pt;
        }

        .breakdown-row.total {
          border-top: 1px solid #cbd5e0;
          margin-top: 6px;
          padding-top: 10px;
          font-weight: 700;
          color: ${brandColor};
        }

        .breakdown-row .label {
          color: #4a5568;
        }

        .notes {
          background: #fffbeb;
          border-left: 3px solid #f6ad55;
          padding: 10px 14px;
          border-radius: 4px;
          margin-top: 14px;
        }

        .notes-label {
          color: #9c4221;
          font-size: 9pt;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .notes-text {
          color: #4a5568;
          font-size: 10pt;
          font-style: italic;
          margin-top: 4px;
        }

        /* Officer Signature */
        .officer-signature {
          margin-top: 28px;
          text-align: right;
        }

        .officer-signature .signature-line {
          border-top: 1px solid ${brandColor};
          width: 250px;
          margin-left: auto;
          margin-bottom: 8px;
        }

        .officer-signature .officer-name {
          color: ${brandColor};
          font-weight: 700;
          font-size: 10pt;
        }

        .officer-signature .officer-title {
          color: #718096;
          font-size: 9pt;
        }

        /* Footer */
        .footer {
          margin-top: 32px;
          padding-top: 18px;
          border-top: 2px dashed #cbd5e0;
          text-align: center;
          color: #718096;
          font-size: 9pt;
          line-height: 1.6;
        }

        .footer .official {
          color: ${brandColor};
          font-weight: 700;
          font-size: 10pt;
          margin-bottom: 4px;
        }

        .footer .contact-info {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .footer .contact-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
      </style>
    </head>
    <body>
      <div class="top-bar"></div>
      <div class="receipt">

        <!-- HEADER WITH LOGO -->
        <div class="header">
          <div class="logo-container">
            ${logoBase64 ? `<img src="${logoBase64}" alt="University Logo" />` : ''}
            <div class="university-info">
              <h1>Antonine University</h1>
              <div class="tagline">Student Information System · Finance Office</div>
            </div>
          </div>
          <div class="receipt-label">
            <div class="badge">PAYMENT RECEIPT</div>
            <div class="ref-number">${receipt.reference_number || 'N/A'}</div>
            <div class="ref-date">Issued ${formatDate(receipt.recorded_at)}</div>
          </div>
        </div>

        <!-- STUDENT INFO -->
        <div class="section">
          <div class="section-title">Student Information</div>
          <table class="info-grid">
            <tr>
              <td>Full Name</td>
              <td><strong>${receipt.student_name}</strong></td>
            </tr>
            <tr>
              <td>Student ID</td>
              <td><strong>${receipt.student_id}</strong></td>
            </tr>
            ${receipt.student_email ? `
            <tr>
              <td>Email</td>
              <td>${receipt.student_email}</td>
            </tr>` : ''}
            ${receipt.major_name ? `
            <tr>
              <td>Major</td>
              <td>${receipt.major_name}</td>
            </tr>` : ''}
            ${receipt.department_name ? `
            <tr>
              <td>Department</td>
              <td>${receipt.department_name}</td>
            </tr>` : ''}
          </table>
        </div>

        <!-- PAYMENT DETAILS -->
        <div class="section">
          <div class="section-title">Payment Details</div>
          <table class="info-grid">
            <tr>
              <td>Paid For</td>
              <td><strong>${lineItem}</strong></td>
            </tr>
            ${semesterLine}
            <tr>
              <td>Payment Date</td>
              <td><strong>${formatDate(receipt.payment_date)}</strong></td>
            </tr>
            <tr>
              <td>Payment Method</td>
              <td><strong>${PAYMENT_METHOD_LABELS[receipt.payment_method] || receipt.payment_method}</strong></td>
            </tr>
            ${receipt.recorded_by_name ? `
            <tr>
              <td>Recorded By</td>
              <td>${receipt.recorded_by_name}</td>
            </tr>` : ''}
          </table>
        </div>

        <!-- AMOUNT (THE BIG ONE) -->
        <div class="amount-box">
          <div class="label">Amount Paid</div>
          <div class="value">${formatCurrency(receipt.payment_amount)}</div>
        </div>

        <!-- TRANSACTION SUMMARY (BALANCE AFTER PAYMENT REMOVED) -->
        <div class="section">
          <div class="section-title">Transaction Summary</div>
          <div class="breakdown">
            ${receipt.original_amount && receipt.discount_amount > 0 ? `
            <div class="breakdown-row">
              <span class="label">Original Charge</span>
              <span>${formatCurrency(receipt.original_amount)}</span>
            </div>
            <div class="breakdown-row">
              <span class="label">Discount Applied</span>
              <span style="color: #22543d;">-${formatCurrency(receipt.discount_amount)}</span>
            </div>
            ` : ''}
            <div class="breakdown-row">
              <span class="label">Total Charge</span>
              <span>${formatCurrency(receipt.transaction_total)}</span>
            </div>
            ${receipt.prior_paid > 0 ? `
            <div class="breakdown-row">
              <span class="label">Previously Paid</span>
              <span>${formatCurrency(receipt.prior_paid)}</span>
            </div>
            ` : ''}
            <div class="breakdown-row">
              <span class="label">This Payment</span>
              <span><strong>${formatCurrency(receipt.payment_amount)}</strong></span>
            </div>
            <!-- BALANCE AFTER PAYMENT REMOVED AS REQUESTED -->
          </div>
        </div>

        ${notesBlock}

        <!-- OFFICER SIGNATURE (Student signature removed) -->
        <div class="officer-signature">
          <div class="signature-line"></div>
          <div class="officer-name">${receipt.recorded_by_name || 'Finance Officer'}</div>
          <div class="officer-title">Authorized Finance Officer</div>
        </div>

        <!-- FOOTER WITH CONTACT DETAILS -->
        <div class="footer">
          <div class="official">This is an official payment receipt</div>
          Please keep this document for your records.
          <div class="contact-info">
            <span class="contact-item">📞 ${financeOffice.phone}</span>
            <span class="contact-item">✉️ ${financeOffice.email}</span>
            <span class="contact-item">🕐 ${financeOffice.hours}</span>
            <span class="contact-item">📍 ${financeOffice.location}</span>
          </div>
          <div style="margin-top: 8px; font-size: 8pt;">
            Verify this receipt online: https://www.antonine.edu/verify/${receipt.reference_number}
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};

// Main exported function — fetches receipt data and generates the PDF
export const downloadPaymentReceipt = async (studentId, paymentId) => {
  // 1. Fetch the receipt data
  const res = await api.get(
    `/api/students/${studentId}/payments/${paymentId}/receipt`
  );

  if (!res.data.success) {
    throw new Error(res.data.message || 'Failed to fetch receipt');
  }

  const receipt = res.data.data;

  // 2. Load the logo as base64
  const logoBase64 = await getLogoBase64();

  // 3. Build the HTML with logo
  const html = buildReceiptHTML(receipt, logoBase64);

  // 4. Generate the PDF (saved to a temporary cache location)
  const { uri: tempUri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // 5. Move/rename to a friendly filename
  const fileName = `Receipt_${receipt.reference_number || `payment_${paymentId}`}.pdf`;
  const newUri = `${FileSystem.cacheDirectory}${fileName}`;

  try {
    await FileSystem.moveAsync({
      from: tempUri,
      to: newUri,
    });
  } catch (err) {
    console.warn('Could not rename PDF, using temp URI:', err);
  }

  const finalUri = (await FileSystem.getInfoAsync(newUri)).exists 
    ? newUri 
    : tempUri;

  // 6. Open the native share sheet (Save to Files, email, WhatsApp, etc.)
  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (!isSharingAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(finalUri, {
    mimeType: 'application/pdf',
    dialogTitle: `Receipt ${receipt.reference_number}`,
    UTI: 'com.adobe.pdf', // iOS hint
  });

  return { fileName, uri: finalUri };
};