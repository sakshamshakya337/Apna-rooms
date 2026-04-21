import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates Police Verification Form for National Students
 * @returns {void} Downloads PDF
 */
export const generateNationalPoliceVerificationForm = () => {
  try {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 150, 243);
    doc.text('POLICE VERIFICATION FORM', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('For National Students in India', pageWidth / 2, yPosition, { align: 'center' });
    
    // Instructions
    yPosition += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('INSTRUCTIONS:', 20, yPosition);
    
    yPosition += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const instructions = [
      '1. This form must be completed by the student applying for PG accommodation.',
      '2. Provide accurate information for police verification purposes.',
      '3. This form requires attestation from the local police station.',
      '4. Original documents must be presented during verification.',
      '5. False information may result in rejection and legal action.'
    ];
    
    instructions.forEach((instruction) => {
      doc.text(instruction, 22, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Form Fields
    const fields = [
      { label: 'Full Name (As per Aadhaar):', width: 85 },
      { label: 'Date of Birth (DD/MM/YYYY):', width: 85 },
      { label: 'Aadhaar Number:', width: 85 },
      { label: 'Mobile Number:', width: 85 },
      { label: 'Email ID:', width: 85 },
      { label: 'Father / Guardian Name:', width: 85 },
      { label: 'Permanent Address (with Pin Code):', width: 130 },
      { label: 'Current Address (PG/Hostel):', width: 130 },
      { label: 'City of Residence:', width: 85 },
      { label: 'State:', width: 85 },
      { label: 'College / University Name:', width: 85 },
      { label: 'Course & Year of Study:', width: 85 }
    ];

    fields.forEach((field) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.text(field.label, 20, yPosition);
      
      doc.setDrawColor(100);
      doc.setLineWidth(0.3);
      doc.line(50, yPosition + 2, 50 + field.width, yPosition + 2);
      
      yPosition += 10;
    });

    yPosition += 5;
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Declaration
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARATION:', 20, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    const declaration = [
      'I hereby declare that the above information is true and correct to the best of my knowledge',
      'and belief. I undertake to abide by all rules and regulations of the PG/Accommodation.'
    ];
    
    declaration.forEach((line) => {
      doc.text(line, 22, yPosition, { maxWidth: 160 });
      yPosition += 5;
    });

    yPosition += 10;
    
    // Signature Section
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, 50, yPosition);
    doc.setFontSize(7);
    doc.text('Student Signature', 25, yPosition + 5);
    
    doc.line(90, yPosition, 120, yPosition);
    doc.text('Date', 100, yPosition + 5);
    
    doc.line(150, yPosition, 180, yPosition);
    doc.text('Police Verification', 160, yPosition + 5);

    // Footer
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(20, pageHeight - 10, pageWidth - 20, pageHeight - 10);
    
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('Confidential - For Official Use Only', pageWidth / 2, pageHeight - 5, { align: 'center' });

    doc.save('Police_Verification_Form_National.pdf');
  } catch (error) {
    console.error('Error generating national police form:', error);
    throw error;
  }
};

/**
 * Generates Police Verification Form for International Students
 * @returns {void} Downloads PDF
 */
export const generateInternationalPoliceVerificationForm = () => {
  try {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 150, 243);
    doc.text('POLICE VERIFICATION FORM', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('For International Students in India', pageWidth / 2, yPosition, { align: 'center' });
    
    // Instructions
    yPosition += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('INSTRUCTIONS:', 20, yPosition);
    
    yPosition += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const instructions = [
      '1. This form must be completed by the international student applying for PG accommodation.',
      '2. Provide accurate information matching your passport details.',
      '3. This form requires attestation from the local police station / Foreigners Regional Registration Office (FRRO).',
      '4. Original documents (Passport, Visa, Registration Certificate) must be presented.',
      '5. False information may result in rejection, visa cancellation, and legal action.',
      '6. Students must comply with all Indian immigration and police regulations.'
    ];
    
    instructions.forEach((instruction) => {
      doc.text(instruction, 22, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Form Fields
    const fields = [
      { label: 'Full Name (As per Passport):', width: 85 },
      { label: 'Date of Birth (DD/MM/YYYY):', width: 85 },
      { label: 'Passport Number:', width: 85 },
      { label: 'Passport Expiry Date:', width: 85 },
      { label: 'Visa Type & Expiry Date:', width: 85 },
      { label: 'Country of Origin:', width: 85 },
      { label: 'Mobile Number:', width: 85 },
      { label: 'Email ID:', width: 85 },
      { label: 'Home Country Address (Complete):', width: 130 },
      { label: 'Current Address in India (PG/Hostel):', width: 130 },
      { label: 'City in India:', width: 85 },
      { label: 'State:', width: 85 },
      { label: 'College / University Name:', width: 85 },
      { label: 'Course & Duration of Study:', width: 85 },
      { label: 'FRRO Registration Number (if applicable):', width: 85 },
      { label: 'Local Guardian / Emergency Contact:', width: 85 }
    ];

    fields.forEach((field) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.text(field.label, 20, yPosition);
      
      doc.setDrawColor(100);
      doc.setLineWidth(0.3);
      doc.line(50, yPosition + 2, 50 + field.width, yPosition + 2);
      
      yPosition += 10;
    });

    yPosition += 5;
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    // Declaration
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARATION:', 20, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    const declaration = [
      'I hereby declare that the above information is true and correct to the best of my knowledge.',
      'I confirm that I am a valid student visa holder and comply with all Indian immigration laws.',
      'I undertake to follow all rules and regulations of the PG/Accommodation and Indian laws.',
      'I understand that false declaration may result in visa cancellation and legal consequences.'
    ];
    
    declaration.forEach((line) => {
      doc.text(line, 22, yPosition, { maxWidth: 160 });
      yPosition += 5;
    });

    yPosition += 10;
    
    // Signature Section
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, 50, yPosition);
    doc.setFontSize(7);
    doc.text('Student Signature', 25, yPosition + 5);
    
    doc.line(90, yPosition, 120, yPosition);
    doc.text('Date', 100, yPosition + 5);
    
    doc.line(150, yPosition, 180, yPosition);
    doc.text('Police / FRRO Verification', 160, yPosition + 5);

    // Footer
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(20, pageHeight - 10, pageWidth - 20, pageHeight - 10);
    
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('Confidential - For Official Use Only | Complies with Indian Visa & Police Regulations', pageWidth / 2, pageHeight - 5, { align: 'center' });

    doc.save('Police_Verification_Form_International.pdf');
  } catch (error) {
    console.error('Error generating international police form:', error);
    throw error;
  }
};

/**
 * Generates Vidu Authorization Form for International Students
 * @returns {void} Downloads PDF
 */
export const generateViduAuthorizationForm = () => {
  try {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 150, 243);
    doc.text('VIDU AUTHORIZATION FORM', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('For International Student Accommodation Authorization', pageWidth / 2, yPosition, { align: 'center' });
    doc.text('Vidu India - Student Housing Platform', pageWidth / 2, yPosition + 5, { align: 'center' });
    
    yPosition += 20;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Instructions
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('AUTHORIZATION TERMS:', 20, yPosition);
    yPosition += 8;

    const terms = [
      '• I authorize the PG/Accommodation to verify my student status through Vidu platform.',
      '• I consent to sharing my accommodation and contact information with Vidu for verification.',
      '• I confirm that all information provided is accurate and authentic.',
      '• I understand this authorization is valid for the duration of my stay.',
      '• I authorize periodic compliance checks as per Vidu and PG policies.',
      '• Any misrepresentation may lead to immediate termination of accommodation.'
    ];

    doc.setFont('helvetica', 'normal');
    terms.forEach((term) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(term, 22, yPosition, { maxWidth: 165 });
      yPosition += 7;
    });

    yPosition += 10;
    
    // Student Information Section
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('STUDENT INFORMATION:', 20, yPosition);
    yPosition += 10;

    const formFields = [
      { label: 'Full Name:', width: 100 },
      { label: 'Email Address:', width: 100 },
      { label: 'Passport Number:', width: 100 },
      { label: 'University/College Name:', width: 100 },
      { label: 'Course:', width: 100 },
      { label: 'Duration of Stay (From - To):', width: 100 },
      { label: 'Accommodation Address:', width: 150 }
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    formFields.forEach((field) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(field.label, 20, yPosition);
      
      doc.setDrawColor(100);
      doc.setLineWidth(0.3);
      doc.line(50, yPosition + 2, 50 + field.width, yPosition + 2);
      
      yPosition += 10;
    });

    yPosition += 10;
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }

    // Signature Section
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES:', 20, yPosition);
    yPosition += 10;

    doc.setLineWidth(0.3);
    doc.line(20, yPosition + 8, 70, yPosition + 8);
    doc.setFontSize(7);
    doc.text('Student Signature', 35, yPosition + 12);
    
    doc.line(100, yPosition + 8, 150, yPosition + 8);
    doc.text('Date', 115, yPosition + 12);
    
    yPosition += 25;
    
    doc.line(20, yPosition, 70, yPosition);
    doc.text('PG/Accommodation Manager', 30, yPosition + 4);
    doc.text('Signature & Stamp', 28, yPosition + 8);
    
    doc.line(100, yPosition, 150, yPosition);
    doc.text('Date', 115, yPosition + 8);

    // Footer
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(20, pageHeight - 10, pageWidth - 20, pageHeight - 10);
    
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text('Vidu - Premium Student Housing Authorization | Valid for the academic year', pageWidth / 2, pageHeight - 5, { align: 'center' });

    doc.save('Vidu_Authorization_Form.pdf');
  } catch (error) {
    console.error('Error generating Vidu authorization form:', error);
    throw error;
  }
};
