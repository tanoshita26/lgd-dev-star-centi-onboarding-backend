import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

interface FormData {
  fullName?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  country_residence?: string;
  phone?: string;
  email?: string;
  uid?: string;
  uid_sole?: string;
  incorporation_date?: string;
  establishment_date?: string;
  owner_name?: string;
  owner_dob?: string;
  owner_nationality?: string;
  owner_address?: string;
  person_1_name?: string;
  person_1_dob?: string;
  person_1_nationality?: string;
  person_1_auth?: string;
  verification_method?: string;
  [key: string]: any;
}

export const generatePdf = async (formData: FormData): Promise<string[]> => {
  console.log('[generatePdf] loading template…');
  const templatePath = path.join(__dirname, '../templates/902.1e_fillable.pdf');
  console.log('[templatePath]', templatePath);
  const templateBytes = fs.readFileSync(templatePath);
  console.log('[templateBytes]', templateBytes);

  const pdfDoc = await PDFDocument.load(templateBytes);
  console.log('[pdfDoc]', pdfDoc);

  const form = pdfDoc.getForm();
  console.log('[form]', form);

  console.log('[generatePdf] PDF form fields:', form.getFields().map(f => f.getName()));

  const mapping: Record<string, string | ((data: FormData) => string)> = {
    fullName: 'company_name',
    address: o => `${o.street}, ${o.postal_code} ${o.city}`,
    country: 'country_residence',
    phone: 'phone',
    email: 'email',
    uid: o => (o.uid || o.uid_sole || ''),
    incorporationDate: 'incorporation_date',
    establishmentDate: 'establishment_date',
    ownerName: 'owner_name',
    ownerDOB: 'owner_dob',
    ownerNat: 'owner_nationality',
    ownerAddress: 'owner_address',
    person1Name: 'person_1_name',
    person1DOB: 'person_1_dob',
    person1Nat: 'person_1_nationality',
    person1Auth: 'person_1_auth',
    verificationMethod: 'verification_method',
    submissionDate: () => new Date().toLocaleDateString('en-CA'),
  };

  for (const [fieldName, mapTo] of Object.entries(mapping)) {
    const field = form.getTextField(fieldName);
    if (!field) {
      console.warn(`[generatePdf] missing PDF field: ${fieldName}`);
      continue;
    }

    const raw = typeof mapTo === 'function'
      ? mapTo(formData)
      : formData[mapTo];

    const text = raw != null ? String(raw) : '';
    console.log(`[generatePdf] filling ${fieldName} → "${text}"`);
    field.setText(text);
  }

  form.flatten();

  const outPath = path.join(__dirname, `../uploads/902.1e_${Date.now()}.pdf`);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`[generatePdf] saved filled PDF to ${outPath}`);

  return [outPath];
}; 