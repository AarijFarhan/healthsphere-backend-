import { PrismaClient, Role, FacilityType, RecordType, SourceFormat, OcrStatus, TrendDirection, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HealthSphere — RICH multi-patient demo data...');

  // Clean
  await prisma.$transaction([
    prisma.healthReport.deleteMany(), prisma.symptomLog.deleteMany(), prisma.vitalsLog.deleteMany(),
    prisma.medicationReminder.deleteMany(), prisma.riskAssessment.deleteMany(), prisma.aIChatMessage.deleteMany(),
    prisma.aIChatSession.deleteMany(), prisma.clinicianNote.deleteMany(), prisma.dataSharingConsent.deleteMany(),
    prisma.notification.deleteMany(), prisma.appointment.deleteMany(), prisma.aIInsight.deleteMany(),
    prisma.uploadedDocument.deleteMany(), prisma.labResult.deleteMany(), prisma.medicalRecord.deleteMany(),
    prisma.clinician.deleteMany(), prisma.patient.deleteMany(), prisma.facility.deleteMany(), prisma.user.deleteMany(),
  ]);

  const hash = await bcrypt.hash('demo123', 10);

  // ── USERS ──
  const patientUsers: any = [];
  for (let i = 1; i <= 12; i++) {
    patientUsers.push(await prisma.user.create({
      data: { email: i === 1 ? 'patient@demo.com' : `patient${i}@demo.com`, passwordHash: hash, role: Role.patient },
    }));
  }
  const clinicianUsers = await Promise.all([
    prisma.user.create({ data: { email: 'clinician@demo.com', passwordHash: hash, role: Role.clinician } }),
    prisma.user.create({ data: { email: 'dr.smith@demo.com', passwordHash: hash, role: Role.clinician } }),
    prisma.user.create({ data: { email: 'dr.ali@demo.com', passwordHash: hash, role: Role.clinician } }),
    prisma.user.create({ data: { email: 'dr.fatima@demo.com', passwordHash: hash, role: Role.clinician } }),
    prisma.user.create({ data: { email: 'dr.naveed@demo.com', passwordHash: hash, role: Role.clinician } }),
  ]);
  const adminUser = await prisma.user.create({ data: { email: 'admin@demo.com', passwordHash: hash, role: Role.admin } });

  // ── FACILITIES ──
  const f = await Promise.all([
    prisma.facility.create({ data: { name: 'Karachi General Hospital', type: FacilityType.hospital, address: 'Shahrah-e-Faisal, Karachi', phone: '+92-21-34567890', email: 'info@kgh.pk' } }),
    prisma.facility.create({ data: { name: 'Lahore Medical Center', type: FacilityType.hospital, address: 'Mall Road, Lahore', phone: '+92-42-34567891', email: 'info@lmc.pk' } }),
    prisma.facility.create({ data: { name: 'Aga Khan Diagnostic Lab', type: FacilityType.lab, address: 'Stadium Road, Karachi', phone: '+92-21-34567892', email: 'lab@akdn.pk' } }),
    prisma.facility.create({ data: { name: 'Shifa Clinic Islamabad', type: FacilityType.clinic, address: 'F-10 Markaz, Islamabad', phone: '+92-51-34567893', email: 'info@shifa.pk' } }),
    prisma.facility.create({ data: { name: 'Chughtai Lab Lahore', type: FacilityType.lab, address: 'Jail Road, Lahore', phone: '+92-42-34567894', email: 'reports@chughtai.pk' } }),
    prisma.facility.create({ data: { name: 'Ziauddin Hospital', type: FacilityType.hospital, address: 'North Nazimabad, Karachi', phone: '+92-21-34567895', email: 'info@ziauddin.pk' } }),
    prisma.facility.create({ data: { name: 'Medicare Pharmacy', type: FacilityType.pharmacy, address: 'Gulshan, Karachi', phone: '+92-21-34567896' } }),
  ]);

  // ── PATIENTS ──
  const patientDefs = [
    { fn: 'Ahmed Khan', dob: '1985-03-15', g: 'Male', ph: '+92-300-1234567', ad: '123 Main St', ci: 'Karachi', bt: 'B+', h: 175, w: 78, al: ['Penicillin', 'Dust'], cc: ['Hypertension', 'Type 2 Diabetes'], meds: ['Lisinopril 10mg', 'Metformin 500mg', 'Amlodipine 5mg'], ec: 'Fatima Khan +92-300-7654321' },
    { fn: 'Jane Doe', dob: '1990-07-22', g: 'Female', ph: '+92-321-9876543', ad: '456 Park Ave', ci: 'Lahore', bt: 'A+', h: 165, w: 60, al: ['Sulfa'], cc: ['Asthma'], meds: ['Albuterol inhaler', 'Montelukast 10mg'], ec: 'John Doe +92-321-1234567' },
    { fn: 'Mike Wilson', dob: '1978-11-08', g: 'Male', ph: '+92-333-5551234', ad: '789 Lake Rd', ci: 'Islamabad', bt: 'O+', h: 182, w: 95, al: [], cc: ['High Cholesterol', 'Arthritis'], meds: ['Atorvastatin 20mg', 'Ibuprofen 400mg PRN'] },
    { fn: 'Sarah Ahmed', dob: '1982-01-18', g: 'Female', ph: '+92-301-1112233', ad: '100 Hill St', ci: 'Karachi', bt: 'A-', h: 160, w: 68, al: ['Latex'], cc: ['Anemia'], meds: ['Iron 65mg'] },
    { fn: 'Bilal Mahmood', dob: '1975-06-30', g: 'Male', ph: '+92-302-2223344', ad: '200 Green Rd', ci: 'Lahore', bt: 'AB+', h: 178, w: 88, al: [], cc: ['Migraine', 'Anxiety'], meds: ['Sumatriptan 50mg PRN', 'Sertraline 50mg'] },
    { fn: 'Ayesha Iqbal', dob: '1988-09-12', g: 'Female', ph: '+92-303-3334455', ad: '300 Rose Ln', ci: 'Karachi', bt: 'B-', h: 162, w: 55, al: ['Shellfish'], cc: ['Hypothyroidism'], meds: ['Levothyroxine 50mcg'] },
    { fn: 'Omar Farooq', dob: '1970-04-25', g: 'Male', ph: '+92-304-4445566', ad: '400 Oak Ave', ci: 'Islamabad', bt: 'O-', h: 185, w: 92, al: ['Aspirin'], cc: ['GERD'], meds: ['Omeprazole 20mg'] },
    { fn: 'Zainab Ali', dob: '1993-12-05', g: 'Female', ph: '+92-305-5556677', ad: '500 Palm Blvd', ci: 'Karachi', bt: 'A+', h: 168, w: 62, al: [], cc: ['Eczema'], meds: ['Hydrocortisone 1%', 'Cetirizine 10mg PRN'] },
    { fn: 'Hassan Raza', dob: '1968-08-20', g: 'Male', ph: '+92-306-6667788', ad: '600 Cedar St', ci: 'Lahore', bt: 'B+', h: 170, w: 75, al: ['Codeine'], cc: ['Osteoporosis'], meds: ['Calcium 500mg + Vit D'] },
    { fn: 'Nadia Sheikh', dob: '1986-02-14', g: 'Female', ph: '+92-307-7778899', ad: '700 Elm Dr', ci: 'Karachi', bt: 'O+', h: 163, w: 70, al: ['Peanuts'], cc: ['Anemia', 'Vitamin D Deficiency'], meds: ['Iron 65mg', 'Vitamin D3 2000 IU'] },
    { fn: 'Kamran Yusuf', dob: '1995-05-30', g: 'Male', ph: '+92-308-8889900', ad: '800 River Rd', ci: 'Hyderabad', bt: 'AB-', h: 180, w: 85, al: [], cc: ['Lower Back Pain'], meds: ['Physiotherapy', 'Naproxen 250mg PRN'] },
    { fn: 'Sana Tariq', dob: '1983-10-12', g: 'Female', ph: '+92-309-9990011', ad: '900 Lake View', ci: 'Karachi', bt: 'B+', h: 158, w: 58, al: ['Iodine contrast'], cc: ['PCOS', 'Insulin Resistance'], meds: ['Metformin 500mg', 'Oral contraceptive'] },
  ];

  const patients: any = [];
  for (let i = 0; i < patientDefs.length; i++) {
    const d = patientDefs[i];
    patients.push(await prisma.patient.create({
      data: { userId: patientUsers[i].id, fullName: d.fn, dob: new Date(d.dob), gender: d.g, phone: d.ph, address: d.ad, city: d.ci, bloodType: d.bt, heightCm: d.h, weightKg: d.w, allergies: d.al, chronicConditions: d.cc, medications: d.meds, emergencyContact: d.ec || null, familyHistory: null, lifestyleNotes: null },
    }));
  }

  // ── CLINICIANS ──
  const clin = await Promise.all([
    prisma.clinician.create({ data: { userId: clinicianUsers[0].id, fullName: 'Dr. Sarah Williams', specialty: 'Cardiology', facilityName: 'Karachi General Hospital', licenseNo: 'PMC-2015-00421', bio: 'Board-certified cardiologist. Preventive cardiology and heart failure.' } }),
    prisma.clinician.create({ data: { userId: clinicianUsers[1].id, fullName: 'Dr. James Smith', specialty: 'Endocrinology', facilityName: 'Lahore Medical Center', licenseNo: 'PMC-2012-00318', bio: 'Endocrinologist. Diabetes and metabolic disorders.' } }),
    prisma.clinician.create({ data: { userId: clinicianUsers[2].id, fullName: 'Dr. Ali Raza', specialty: 'Radiology', facilityName: 'Karachi General Hospital', licenseNo: 'PMC-2016-00782', bio: 'Diagnostic radiologist. Chest and cardiac imaging.' } }),
    prisma.clinician.create({ data: { userId: clinicianUsers[3].id, fullName: 'Dr. Fatima Noor', specialty: 'General Practice', facilityName: 'Shifa Clinic Islamabad', licenseNo: 'PMC-2018-01234', bio: 'Family medicine. Preventive care and chronic disease.' } }),
    prisma.clinician.create({ data: { userId: clinicianUsers[4].id, fullName: 'Dr. Naveed Akram', specialty: 'Pulmonology', facilityName: 'Ziauddin Hospital', licenseNo: 'PMC-2014-00567', bio: 'Pulmonologist. Asthma, COPD, and respiratory infections.' } }),
  ]);

  // ── MEDICAL RECORDS ──
  const p1 = patients[0];
  const akRecords = [
    { fid: f[0].id, type: RecordType.visit, title: 'Annual Physical Examination', dt: '2024-01-15', content: 'Comprehensive annual physical. BP 148/92. Weight 82kg (BMI 26.8). Overweight. Ordered: CMP, lipid profile, HbA1c, ECG. Discussed lifestyle modifications aggressively. F/U 2 weeks.', src: SourceFormat.structured, clin: 'Dr. Sarah Williams' },
    { fid: f[0].id, type: RecordType.prescription, title: 'HTN + DM Medication Plan', dt: '2024-01-15', content: '1. Lisinopril 10mg — 1 tab daily AM\n2. Amlodipine 5mg — 1 tab daily AM\n3. Metformin 500mg — 1 tab BID with meals\n\nRefills: 3 months. Monitor BP at home twice weekly. Return if dizziness, cough, or hypoglycemia.', src: SourceFormat.structured, clin: 'Dr. Sarah Williams' },
    { fid: f[0].id, type: RecordType.imaging, title: 'Chest X-Ray PA View', dt: '2024-01-20', content: 'FINDINGS: Lungs clear. No infiltrates, effusions, pneumothorax. Cardiac silhouette normal. Mediastinal contours normal. Bony thorax intact.\nIMPRESSION: Normal chest radiograph. No acute cardiopulmonary process.', src: SourceFormat.imaging, clin: 'Dr. Ali Raza' },
    { fid: f[1].id, type: RecordType.visit, title: 'Diabetes Follow-Up Consultation', dt: '2024-03-10', content: 'HbA1c 7.5%. FPG 144. Better energy with diet changes. ↑ Metformin to 1000mg BID. Referred to nutritionist. Foot exam unremarkable — no neuropathy signs.', src: SourceFormat.structured, clin: 'Dr. James Smith' },
    { fid: f[1].id, type: RecordType.referral, title: 'Clinical Nutritionist Referral', dt: '2024-03-15', content: 'Referred to Ms. Hina Tariq for diabetes dietary counseling. Focus: carb counting, portion control, low-GI meal planning. Target: HbA1c <7.0%.', src: SourceFormat.structured, clin: 'Dr. James Smith' },
    { fid: f[3].id, type: RecordType.visit, title: 'Acute Allergic Rhinitis', dt: '2024-05-05', content: 'Seasonal allergies ×5 days. Sneezing, itchy eyes, nasal congestion. Known dust allergy. Vitals normal. Rx: Cetirizine 10mg daily PRN. Allergen avoidance counseled.', src: SourceFormat.structured, clin: 'Dr. Fatima Noor' },
    { fid: f[0].id, type: RecordType.visit, title: '6-Month Cardiology Review', dt: '2024-06-20', content: 'BP 136/84 — significant improvement. Excellent med adherence. ECG: NSR 68 bpm, no ST-T changes. Weight 79kg (↓3kg). Continue current regimen.', src: SourceFormat.structured, clin: 'Dr. Sarah Williams' },
    { fid: f[2].id, type: RecordType.lab_report, title: 'Comprehensive Metabolic Panel (Jun)', dt: '2024-06-22', content: 'Total Chol: 205 mg/dL ⚠️ LDL: 130 ⚠️ HDL: 42 ✅ TG: 178 ⚠️ AST/ALT: Normal. Creatinine: 0.9 ✅ BUN: 15 ✅\nSummary: Mild dyslipidemia. LFT/KFT normal.', src: SourceFormat.structured, clin: 'Dr. Sarah Williams' },
    { fid: f[0].id, type: RecordType.visit, title: 'ER Visit — Chest Discomfort', dt: '2024-08-01', content: 'Presented 10:30 PM. Mild left chest discomfort ×2hrs. No radiation/diaphoresis. ECG: NSR, no ST elevation. Troponin negative. CXR: Clear. DX: Musculoskeletal chest wall pain. Discharged.', src: SourceFormat.structured, clin: 'Dr. Ahmed Malik' },
    { fid: f[0].id, type: RecordType.discharge_summary, title: 'ER Discharge Summary', dt: '2024-08-02', content: 'Admission: 08/01/24. Chest pain evaluation negative for ACS. Final DX: Musculoskeletal pain. Discharged stable. Rx: Acetaminophen PRN. F/U Dr. Williams within 7 days.', src: SourceFormat.structured, clin: 'Dr. Ahmed Malik' },
    { fid: f[2].id, type: RecordType.lab_report, title: 'Lipid Panel + HbA1c (Aug)', dt: '2024-08-15', content: 'HbA1c: 6.8% ✅↓ Total Chol: 198 ✅↓ LDL: 118 HDL: 44 TG: 170 FPG: 125\nAll markers improving. Continue.', src: SourceFormat.structured, clin: 'Dr. James Smith' },
    { fid: f[4].id, type: RecordType.lab_report, title: 'Kidney Function Panel', dt: '2024-09-10', content: 'eGFR: 88 ✅ Creatinine: 0.88 Urine Microalbumin: 15 (<30) ✅\nRenal function preserved. No diabetic nephropathy.', src: SourceFormat.structured, clin: 'Dr. James Smith' },
    { fid: f[0].id, type: RecordType.surgery, title: 'Appendectomy — Post-Op Note', dt: '2022-04-10', content: 'Laparoscopic appendectomy for acute appendicitis. No complications. DC POD#2. Pathology: Acute suppurative, no perforation.', src: SourceFormat.structured, clin: 'Dr. Faisal Qureshi' },
    { fid: f[0].id, type: RecordType.imaging, title: 'Stress ECG (Treadmill)', dt: '2024-10-05', content: 'Bruce protocol. 10 METs (Stage III). Max HR 158 (94%). BP response normal. No CP/arrhythmia. No diagnostic ST changes. Duke Score: +7 (low risk).', src: SourceFormat.structured, clin: 'Dr. Sarah Williams' },
    { fid: f[6].id, type: RecordType.vaccination, title: 'Seasonal Influenza Vaccine 2024-25', dt: '2024-10-01', content: 'Quadrivalent influenza vaccine administered. Lot #FL24-7732. No adverse reaction.', src: SourceFormat.structured, clin: 'Nurse Amna Siddiqui' },
    { fid: f[3].id, type: RecordType.visit, title: 'Lifestyle & Preventive Care', dt: '2024-11-01', content: 'Weight 78kg (↓4kg since Jan). BP 129/83. Now walking 45min 4x/week. Discussed: stress, sleep, annual eye exam (retinopathy). Vaccines current.', src: SourceFormat.structured, clin: 'Dr. Fatima Noor' },
    { fid: f[2].id, type: RecordType.lab_report, title: 'Latest Comprehensive Panel (Nov)', dt: '2024-11-20', content: 'HbA1c: 6.5% ✅ FPG: 120 ⚠️ Total Chol: 178 ✅ LDL: 105 near target HDL: 46 ✅ TG: 160 ⚠️ BP: 128/82 ✅ Weight: 78kg (BMI 25.5)\n\nEXCELLENT progress. Near all targets. Continue.', src: SourceFormat.structured, clin: 'Dr. Sarah Williams' },
  ];
  for (const r of akRecords) {
    await prisma.medicalRecord.create({ data: { patientId: p1.id, facilityId: r.fid, recordType: r.type, title: r.title, recordDate: new Date(r.dt), content: r.content, sourceFormat: r.src, clinician: r.clin, tags: [] } });
  }

  // Records for patients 2-12
  for (let pi = 1; pi < patients.length; pi++) {
    const p = patients[pi];
    const pd = patientDefs[pi];
    for (let j = 0; j < (pi < 5 ? 4 : 2); j++) {
      await prisma.medicalRecord.create({
        data: {
          patientId: p.id, facilityId: f[pi % 6].id, recordType: j === 0 ? RecordType.visit : j === 1 ? RecordType.lab_report : j === 2 ? RecordType.prescription : RecordType.note,
          title: j === 0 ? 'Initial Consultation' : j === 1 ? 'Lab Results Review' : j === 2 ? 'Medication Update' : 'Progress Note',
          recordDate: new Date(`2024-0${Math.min(j * 3 + 1, 9)}-${10 + pi}`),
          content: j === 0 ? `Initial consultation. Reviewed history.${pd.cc.length > 0 ? ' Managing: ' + pd.cc.join(', ') + '.' : ''} Ordered baseline labs.` : j === 1 ? 'Lab results reviewed. No critical abnormalities. Continue monitoring.' : j === 2 ? `Medications reviewed: ${pd.meds.join(', ') || 'none'}. No changes needed.` : 'Patient progressing as expected. Follow up in 3 months.',
          sourceFormat: SourceFormat.structured, clinician: clin[pi % 5].fullName, tags: []
        },
      });
    }
  }

  // ── LAB RESULTS — Rich 12-month trends ──
  const gVals = [155, 148, 144, 142, 140, 138, 135, 133, 130, 128, 125, 120];
  const sVals = [148, 146, 143, 141, 140, 138, 136, 134, 132, 130, 129, 128];
  const dVals = [92, 90, 89, 88, 87, 86, 85, 84, 83, 83, 82, 82];
  const cVals = [220, 215, 210, 208, 205, 200, 198, 195, 192, 188, 185, 178];
  const a1cVals = [7.8, 7.6, 7.5, 7.3, 7.2, 7.0, 6.9, 6.8, 6.7, 6.6, 6.5, 6.5];
  const ldlV = [145, 140, 138, 135, 130, 125, 122, 118, 115, 112, 110, 105];
  const hdlV = [38, 39, 40, 40, 41, 42, 42, 43, 44, 44, 45, 46];
  const tgV = [195, 190, 185, 182, 180, 178, 175, 172, 170, 168, 165, 160];

  for (let i = 0; i < 12; i++) {
    const dt = new Date(`2024-${String(i + 1).padStart(2, '0')}-15`);
    const labDefs = [
      ['Fasting Blood Glucose', gVals[i], 'mg/dL', '70-100', 'metabolic', gVals[i] > 100],
      ['Systolic Blood Pressure', sVals[i], 'mmHg', '<120', 'cardiovascular', sVals[i] >= 130],
      ['Diastolic Blood Pressure', dVals[i], 'mmHg', '<80', 'cardiovascular', dVals[i] >= 85],
      ['Total Cholesterol', cVals[i], 'mg/dL', '<200', 'lipid', cVals[i] >= 200],
      ['HbA1c', a1cVals[i], '%', '<5.7', 'metabolic', a1cVals[i] >= 5.7],
      ['LDL Cholesterol', ldlV[i], 'mg/dL', '<100', 'lipid', ldlV[i] >= 100],
      ['HDL Cholesterol', hdlV[i], 'mg/dL', '>40', 'lipid', hdlV[i] < 40],
      ['Triglycerides', tgV[i], 'mg/dL', '<150', 'lipid', tgV[i] >= 150],
    ];
    for (const [tn, val, unit, ref, cat, abn] of labDefs) {
      await prisma.labResult.create({
        data: { patientId: p1.id, facilityId: i % 2 === 0 ? f[2].id : f[4].id, testName: tn as string, value: val as number, unit: unit as string, referenceRange: ref as string, testDate: dt, category: cat as string, isAbnormal: abn as boolean, aiAnalysis: (abn as boolean) ? `${tn} outside reference range ${ref}. Monitor trend.` : null },
      });
    }
  }

  // Lab results for other patients
  for (let pi = 1; pi < patients.length; pi++) {
    for (let i = 0; i < 5; i++) {
      const dt = new Date('2024-03-01'); dt.setDate(dt.getDate() + i * 50);
      await prisma.labResult.create({ data: { patientId: patients[pi].id, facilityId: f[2].id, testName: 'Fasting Blood Glucose', value: 78 + Math.random() * 35, unit: 'mg/dL', referenceRange: '70-100', testDate: dt, category: 'metabolic', isAbnormal: Math.random() > 0.75 } });
      if (i % 2 === 0) {
        await prisma.labResult.create({ data: { patientId: patients[pi].id, facilityId: f[4].id, testName: 'Hemoglobin', value: 11 + Math.random() * 6, unit: 'g/dL', referenceRange: '12-16', testDate: dt, category: 'hematology', isAbnormal: Math.random() > 0.65 } });
        await prisma.labResult.create({ data: { patientId: patients[pi].id, facilityId: f[i % 2].id, testName: 'Systolic Blood Pressure', value: 108 + Math.floor(Math.random() * 32), unit: 'mmHg', referenceRange: '<120', testDate: dt, category: 'cardiovascular', isAbnormal: Math.random() > 0.55 } });
      }
      if (i % 3 === 0) {
        await prisma.labResult.create({ data: { patientId: patients[pi].id, facilityId: f[2].id, testName: 'Total Cholesterol', value: 150 + Math.random() * 70, unit: 'mg/dL', referenceRange: '<200', testDate: dt, category: 'lipid', isAbnormal: Math.random() > 0.6 } });
        await prisma.labResult.create({ data: { patientId: patients[pi].id, facilityId: f[4].id, testName: 'TSH', value: 1 + Math.random() * 5, unit: 'mIU/L', referenceRange: '0.4-4.0', testDate: dt, category: 'endocrine', isAbnormal: Math.random() > 0.7 } });
      }
    }
  }

  // ── DOCUMENTS ──
  const docData = [
    { pid: p1.id, fn: 'old_prescription_2020.pdf', url: '/uploads/old_prescription_2020.pdf', dt: '2024-07-10', status: OcrStatus.complete, ext: 'Prescription dated March 2020: Atenolol 50mg daily for hypertension. Discontinued in January 2022 due to bradycardia. Switched to Lisinopril.', type: 'Prescription', size: 245760, mime: 'application/pdf', tags: ['medication', 'cardiology'] },
    { pid: p1.id, fn: 'ecg_report_may2023.pdf', url: '/uploads/ecg_report_may2023.pdf', dt: '2024-07-12', status: OcrStatus.complete, ext: 'ECG Report — May 15, 2023. Normal sinus rhythm at 72 bpm. PR interval 160ms, QRS 90ms, QTc 410ms. No ST-T wave abnormalities. Normal axis.', type: 'ECG Report', size: 512000, mime: 'application/pdf', tags: ['imaging', 'cardiology'] },
    { pid: p1.id, fn: 'discharge_summary_2022.pdf', url: '/uploads/discharge_summary_2022.pdf', dt: '2024-09-01', status: OcrStatus.complete, ext: 'DISCHARGE SUMMARY — Karachi General Hospital. Admission: April 8-10, 2022. Procedure: Laparoscopic appendectomy. Uncomplicated post-op course.', type: 'Discharge Summary', size: 1024000, mime: 'application/pdf', tags: ['surgery', 'discharge'] },
    { pid: p1.id, fn: 'stress_test_oct2024.pdf', url: '/uploads/stress_oct2024.pdf', dt: '2024-10-06', status: OcrStatus.complete, ext: 'Treadmill Stress Test — Bruce Protocol. Max HR 158, achieved 10 METs. Duke Score +7. No ischemic changes. Excellent exercise tolerance.', type: 'Stress Test', size: 768000, mime: 'application/pdf', tags: ['imaging', 'cardiology'] },
    { pid: patients[1].id, fn: 'pft_report_2024.pdf', url: '/uploads/pft_jane.pdf', dt: '2024-06-20', status: OcrStatus.complete, ext: 'Pulmonary Function Test: FEV1 85% predicted, FVC 90% predicted, FEV1/FVC ratio 0.78. Mild obstruction consistent with well-controlled asthma.', type: 'PFT Report', size: 345000, mime: 'application/pdf', tags: ['pulmonary'] },
  ];
  for (const d of docData) {
    await prisma.uploadedDocument.create({ data: { patientId: d.pid, fileName: d.fn, fileUrl: d.url, uploadDate: new Date(d.dt), ocrStatus: d.status, extractedText: d.ext, documentType: d.type, fileSize: d.size, mimeType: d.mime, tags: d.tags } });
  }

  // ── AI INSIGHTS — Rich, diverse ──
  const aiData = [
    // Ahmed Khan — metabolic
    { pid: p1.id, text: 'Fasting blood glucose dropped 22.6% from 155 to 120 mg/dL over 12 months. Your diabetes management plan is working. Continue Metformin and lifestyle changes.', metric: 'Fasting Blood Glucose', td: TrendDirection.down, sev: 'positive', cat: 'metabolic', confidence: 0.94, src: 'rule-engine' },
    { pid: p1.id, text: 'HbA1c improved from 7.8% to 6.5% — a 1.3 point drop. This represents significantly improved glycemic control and reduced risk of complications.', metric: 'HbA1c', td: TrendDirection.down, sev: 'positive', cat: 'metabolic', confidence: 0.96, src: 'rule-engine' },
    { pid: p1.id, text: 'Your fasting glucose, while greatly improved, remains above the 100 mg/dL target. Consider discussing additional dietary changes or medication optimization with Dr. Smith.', metric: 'Fasting Blood Glucose', td: TrendDirection.down, sev: 'info', cat: 'metabolic', confidence: 0.85, src: 'gemini-analysis' },
    { pid: p1.id, text: 'HbA1c stabilized at 6.5% for the last 2 readings — excellent maintenance. Discuss whether your target should be lowered further with your endocrinologist.', metric: 'HbA1c', td: TrendDirection.stable, sev: 'info', cat: 'metabolic', confidence: 0.88, src: 'gemini-analysis' },
    // Cardiovascular
    { pid: p1.id, text: 'Systolic BP improved 13.5% from 148 to 128 mmHg. Now approaching the target of <130. Lisinopril + Amlodipine combination is highly effective.', metric: 'Systolic Blood Pressure', td: TrendDirection.down, sev: 'positive', cat: 'cardiovascular', confidence: 0.93, src: 'rule-engine' },
    { pid: p1.id, text: 'Diastolic BP decreased from 92 to 82 mmHg — now in the normal range (<85). Continue current antihypertensive regimen without changes.', metric: 'Diastolic Blood Pressure', td: TrendDirection.down, sev: 'positive', cat: 'cardiovascular', confidence: 0.91, src: 'rule-engine' },
    { pid: p1.id, text: 'Your 12-month BP trend shows consistent improvement with every follow-up visit. Medication adherence appears excellent. At current trajectory, optimal BP likely within 3 months.', metric: 'Blood Pressure', td: TrendDirection.down, sev: 'positive', cat: 'cardiovascular', confidence: 0.87, src: 'gemini-analysis' },
    // Lipid
    { pid: p1.id, text: 'Total cholesterol decreased 19.1% from 220 to 178 mg/dL — now firmly within the healthy range (<200). Your lipid management is proving highly effective.', metric: 'Total Cholesterol', td: TrendDirection.down, sev: 'positive', cat: 'lipid', confidence: 0.95, src: 'rule-engine' },
    { pid: p1.id, text: 'LDL ("bad") cholesterol dropped from 145 to 105 mg/dL — nearing optimal target of <100. This 27.6% reduction significantly lowers cardiovascular risk.', metric: 'LDL Cholesterol', td: TrendDirection.down, sev: 'positive', cat: 'lipid', confidence: 0.92, src: 'rule-engine' },
    { pid: p1.id, text: 'HDL ("good") cholesterol rose from 38 to 46 mg/dL (21% improvement). Regular exercise and healthier diet are likely contributing to this positive trend.', metric: 'HDL Cholesterol', td: TrendDirection.up, sev: 'positive', cat: 'lipid', confidence: 0.84, src: 'rule-engine' },
    { pid: p1.id, text: 'Triglycerides dropped 17.9% from 195 to 160 mg/dL. Still above the <150 target. Reducing refined carbs and added sugars should help achieve the goal.', metric: 'Triglycerides', td: TrendDirection.down, sev: 'info', cat: 'lipid', confidence: 0.82, src: 'rule-engine' },
    // Preventive & Safety
    { pid: p1.id, text: 'Kidney function preserved: eGFR 88, normal microalbumin. No evidence of diabetic nephropathy. Continue annual screening.', metric: 'eGFR', td: TrendDirection.stable, sev: 'positive', cat: 'preventive', confidence: 0.9, src: 'rule-engine' },
    { pid: p1.id, text: 'Stress ECG shows excellent exercise capacity (10 METs, Duke +7). Your cardiovascular fitness is well above average for your age group.', metric: 'Exercise Capacity', td: TrendDirection.stable, sev: 'positive', cat: 'cardiovascular', confidence: 0.91, src: 'rule-engine' },
    { pid: p1.id, text: 'Penicillin allergy is documented and shared across all 7 connected facilities via HealthSphere data-sharing network — ensuring safe prescribing.', metric: null, td: TrendDirection.stable, sev: 'info', cat: 'safety', confidence: 0.99, src: 'rule-engine' },
    { pid: p1.id, text: 'Based on your profile (HTN + DM), consider adding comprehensive eye exam and annual foot exam to your preventive care schedule.', metric: null, td: TrendDirection.stable, sev: 'warning', cat: 'preventive', confidence: 0.86, src: 'gemini-analysis' },
    { pid: p1.id, text: 'Weight reduced from 82kg to 78kg (4.9%). BMI improved from 26.8 to 25.5 — approaching healthy range. Lifestyle modifications are delivering results.', metric: 'Weight', td: TrendDirection.down, sev: 'positive', cat: 'lifestyle', confidence: 0.89, src: 'rule-engine' },
    // Other patients
    { pid: patients[1].id, text: 'Asthma appears well-controlled. No emergency visits in 2024. PFT shows FEV1 at 85% predicted. Continue current inhaler regimen.', metric: 'FEV1', td: TrendDirection.stable, sev: 'positive', cat: 'pulmonary', confidence: 0.87, src: 'rule-engine' },
    { pid: patients[2].id, text: 'LDL cholesterol remains elevated at 130 mg/dL despite Atorvastatin. Consider discussing dose adjustment or adding ezetimibe with your physician.', metric: 'LDL Cholesterol', td: TrendDirection.stable, sev: 'warning', cat: 'lipid', confidence: 0.83, src: 'gemini-analysis' },
    { pid: patients[3].id, text: 'Hemoglobin trending up to 11.8 g/dL from 10.5. Iron supplementation appears effective. Continue for at least 3 more months.', metric: 'Hemoglobin', td: TrendDirection.up, sev: 'positive', cat: 'hematology', confidence: 0.88, src: 'rule-engine' },
    { pid: patients[4].id, text: 'Migraine frequency reduced from 4 to 2 episodes/month with Sertraline + Sumatriptan. Anxiety scores improving on GAD-7.', metric: 'Migraine Frequency', td: TrendDirection.down, sev: 'positive', cat: 'neurological', confidence: 0.85, src: 'rule-engine' },
    { pid: patients[5].id, text: 'TSH stable at 2.1 on Levothyroxine 50mcg. Thyroid function well-controlled. No dose adjustment needed.', metric: 'TSH', td: TrendDirection.stable, sev: 'positive', cat: 'endocrine', confidence: 0.92, src: 'rule-engine' },
    { pid: patients[11].id, text: 'Fasting insulin trending down from 18 to 12 mIU/L. Metformin + lifestyle changes are reducing insulin resistance. Excellent progress.', metric: 'Fasting Insulin', td: TrendDirection.down, sev: 'positive', cat: 'metabolic', confidence: 0.86, src: 'gemini-analysis' },
  ];
  for (const ai of aiData) {
    await prisma.aIInsight.create({ data: { patientId: ai.pid, insightText: ai.text, metric: ai.metric, trendDirection: ai.td, severity: ai.sev, category: ai.cat, confidence: ai.confidence, source: ai.src, generatedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000) } });
  }

  // ── APPOINTMENTS ──
  const aptData = [
    { pid: p1.id, cid: clin[0].id, dt: '2025-01-15T10:00:00Z', status: AppointmentStatus.confirmed, reason: 'Quarterly Cardiology Follow-Up', notes: 'Bring BP log.' },
    { pid: p1.id, cid: clin[1].id, dt: '2025-01-20T14:00:00Z', status: AppointmentStatus.requested, reason: 'Diabetes Management Review', notes: 'Fasting required.' },
    { pid: p1.id, cid: clin[0].id, dt: '2024-10-01T11:00:00Z', status: AppointmentStatus.completed, reason: 'Cardiology Check', notes: 'BP stable.' },
    { pid: p1.id, cid: clin[3].id, dt: '2024-05-05T09:30:00Z', status: AppointmentStatus.completed, reason: 'Allergy Consultation', notes: 'Seasonal allergies.' },
    { pid: p1.id, cid: clin[1].id, dt: '2024-03-10T11:00:00Z', status: AppointmentStatus.completed, reason: 'Diabetes Follow-Up', notes: 'Metformin adjusted.' },
    { pid: p1.id, cid: clin[0].id, dt: '2025-04-10T10:00:00Z', status: AppointmentStatus.confirmed, reason: '6-Month Cardiology Review', notes: 'Repeat labs before.' },
    { pid: patients[1].id, cid: clin[4].id, dt: '2025-02-05T09:00:00Z', status: AppointmentStatus.confirmed, reason: 'Asthma Annual Review', notes: 'PFT scheduled.' },
    { pid: patients[2].id, cid: clin[3].id, dt: '2025-01-25T15:00:00Z', status: AppointmentStatus.requested, reason: 'Cholesterol Recheck', notes: '' },
    { pid: patients[5].id, cid: clin[1].id, dt: '2025-03-20T10:00:00Z', status: AppointmentStatus.requested, reason: 'Thyroid Function Check', notes: 'TSH labs before.' },
    { pid: patients[9].id, cid: clin[3].id, dt: '2025-02-28T14:00:00Z', status: AppointmentStatus.confirmed, reason: 'Anemia Follow-Up', notes: '' },
    { pid: patients[11].id, cid: clin[1].id, dt: '2025-02-10T12:00:00Z', status: AppointmentStatus.confirmed, reason: 'PCOS & Insulin Resistance', notes: 'Fasting insulin, HbA1c.' },
  ];
  for (const a of aptData) {
    await prisma.appointment.create({ data: { patientId: a.pid, clinicianId: a.cid, scheduledAt: new Date(a.dt), status: a.status, reason: a.reason, notes: a.notes, durationMin: 30 } });
  }

  // ── CLINICIAN NOTES ──
  await prisma.clinicianNote.create({ data: { patientId: p1.id, clinicianId: clin[0].id, noteText: 'Excellent compliance. BP 148→128 systolic. Discussed low-sodium diet. Continue regimen. F/U 3 months.', isPrivate: true } });
  await prisma.clinicianNote.create({ data: { patientId: p1.id, clinicianId: clin[1].id, noteText: 'DM improving. HbA1c 7.8→6.5. If trend continues, consider reducing Metformin. Foot exam normal.', isPrivate: true } });
  await prisma.clinicianNote.create({ data: { patientId: p1.id, clinicianId: clin[0].id, noteText: 'ER chest pain f/u reassuring. Duke +7. Reassured patient. Repeat stress in 2 years.', isPrivate: true } });
  await prisma.clinicianNote.create({ data: { patientId: patients[1].id, clinicianId: clin[4].id, noteText: 'Asthma well-controlled. FEV1 85%. No exacerbations 12mo. Continue current regimen.', isPrivate: true } });
  await prisma.clinicianNote.create({ data: { patientId: patients[4].id, clinicianId: clin[0].id, noteText: 'Migraine ↓ on Sertraline. GAD-7 improving. Consider CBT referral if plateaus.', isPrivate: true } });

  // ── NOTIFICATIONS ──
  const notifs = [
    { uid: patientUsers[0].id, title: '🔬 New Lab Results', body: 'November panel ready. HbA1c: 6.5%, Chol: 178. View trends.', type: 'info', link: '/dashboard/patient/labs' },
    { uid: patientUsers[0].id, title: '📅 Appointment Reminder', body: 'Cardiology f/u with Dr. Williams on Jan 15 at 10 AM.', type: 'alert', link: '/dashboard/patient/appointments' },
    { uid: patientUsers[0].id, title: '🧠 New AI Insight', body: 'Cholesterol decreased 19% over 12 months — great progress!', type: 'success', link: '/dashboard/patient/insights' },
    { uid: patientUsers[0].id, title: '📄 OCR Complete', body: 'Stress test report digitized and added to your timeline.', type: 'success', link: '/dashboard/patient/documents' },
    { uid: patientUsers[0].id, title: '⚠️ Refill Due', body: 'Lisinopril 10mg — 5 days remaining. Request renewal.', type: 'warning', link: '/dashboard/patient/medications' },
    { uid: patientUsers[0].id, title: '🏥 Data Sharing Updated', body: 'Ziauddin Hospital added to your network. Manage in Settings.', type: 'info', link: '/dashboard/patient/settings' },
    { uid: patientUsers[0].id, title: '🩺 Preventive Alert', body: 'Annual diabetic eye exam recommended. Book now.', type: 'alert', link: '/dashboard/patient/appointments' },
    { uid: patientUsers[1].id, title: '🔬 PFT Results Ready', body: 'Your pulmonary function test results available.', type: 'info', link: '/dashboard/patient/labs' },
    { uid: patientUsers[1].id, title: '📅 Appointment Confirmed', body: 'Asthma review with Dr. Naveed on Feb 5.', type: 'success', link: '/dashboard/patient/appointments' },
    { uid: clinicianUsers[0].id, title: '👤 Patient Update', body: 'Ahmed Khan — new labs. HbA1c improved to 6.5%. Review before appointment.', type: 'alert', link: '/dashboard/clinician/patients' },
    { uid: clinicianUsers[0].id, title: '📊 Weekly Analytics', body: 'Avg time-to-diagnosis: 2.7 days. 15 patients seen this week.', type: 'info', link: '/dashboard/clinician/analytics' },
    { uid: clinicianUsers[1].id, title: '📈 Trend Alert', body: 'Diabetic patients showing improved glycemic control this quarter.', type: 'success', link: '/dashboard/clinician/analytics' },
    { uid: adminUser.id, title: '📊 Platform Report', body: '12 patients, 5 clinicians, 7 facilities. MAU: 85%. OCR rate: 100%.', type: 'info', link: '/dashboard/admin' },
    { uid: adminUser.id, title: '🤖 AI Performance', body: '25 insights generated this month. 92% clinically relevant.', type: 'success', link: '/dashboard/admin' },
    { uid: adminUser.id, title: '🔒 Security Audit', body: 'All PHI encrypted. Zero unauthorized access attempts. Compliance: 100%.', type: 'info', link: '/dashboard/admin' },
  ];
  for (const n of notifs) {
    await prisma.notification.create({ data: { userId: n.uid, title: n.title, body: n.body, type: n.type, link: n.link, createdAt: new Date(Date.now() - Math.floor(Math.random() * 14) * 86400000) } });
  }

  // ── SYMPTOM LOGS ──
  await prisma.symptomLog.create({ data: { patientId: p1.id, symptoms: ['Headache', 'Dizziness'], severity: 4, duration: '2 hours', notes: 'After missing AM meds. BP 145/90 at home.', aiTriage: 'Hypertension-related: 55%', loggedAt: new Date('2024-11-15') } });
  await prisma.symptomLog.create({ data: { patientId: p1.id, symptoms: ['Fatigue', 'Thirst', 'Frequent urination'], severity: 3, duration: '3 days', notes: 'Possible blood sugar fluctuation.', aiTriage: 'Glycemic Instability: 45%', loggedAt: new Date('2024-10-20') } });
  await prisma.symptomLog.create({ data: { patientId: p1.id, symptoms: ['Mild chest discomfort'], severity: 2, duration: '2 hours', notes: 'After heavy meal. Resolved spontaneously.', aiTriage: 'GERD: 50% | MSK: 30%', loggedAt: new Date('2024-12-01') } });
  await prisma.symptomLog.create({ data: { patientId: patients[4].id, symptoms: ['Throbbing headache', 'Photophobia', 'Nausea'], severity: 7, duration: '6 hours', notes: 'Classic migraine. Sumatriptan partial relief.', aiTriage: 'Migraine: 85%', loggedAt: new Date('2024-10-05') } });
  await prisma.symptomLog.create({ data: { patientId: patients[6].id, symptoms: ['Heartburn', 'Reflux', 'Chest burning'], severity: 5, duration: '2 weeks', notes: 'Worse after spicy food and lying down.', aiTriage: 'GERD exacerbation: 75%', loggedAt: new Date('2024-11-10') } });

  // ── VITALS LOGS ──
  for (let i = 0; i < 12; i++) {
    const dt2 = new Date('2024-11-01'); dt2.setDate(dt2.getDate() + i * 8);
    await prisma.vitalsLog.create({ data: { patientId: p1.id, systolic: 133 - i, diastolic: 86 - Math.floor(i / 2), heartRate: 68 + Math.floor(Math.random() * 12), tempC: 36.5 + Math.random() * 0.8, spo2: 97 + Math.random() * 2, glucose: 128 - i * 3, weightKg: 79 - i * 0.25, recordedAt: dt2 } });
  }

  // ── RISK ASSESSMENTS ──
  await prisma.riskAssessment.create({ data: { patientId: p1.id, condition: 'CVD (10-year)', riskScore: 0.12, riskLevel: 'moderate', factors: ['HTN', 'DM', 'Age 40', 'Ex-smoker'], recommendation: 'Aggressive risk modification. Target LDL<100.', modelUsed: 'framingham-adapted' } });
  await prisma.riskAssessment.create({ data: { patientId: p1.id, condition: 'Diabetic Retinopathy', riskScore: 0.15, riskLevel: 'moderate', factors: ['DM 3yr+', 'Historical HbA1c>7%', 'HTN'], recommendation: 'Annual dilated eye exam.', modelUsed: 'biomedical-bert-hf' } });
  await prisma.riskAssessment.create({ data: { patientId: p1.id, condition: 'CKD', riskScore: 0.08, riskLevel: 'low', factors: ['DM', 'HTN', 'Normal eGFR', 'No microalbumin'], recommendation: 'Annual KFT + urine microalbumin.', modelUsed: 'biomedical-bert-hf' } });
  await prisma.riskAssessment.create({ data: { patientId: patients[1].id, condition: 'Asthma Exacerbation', riskScore: 0.25, riskLevel: 'low', factors: ['Well-controlled', 'Good PFT'], recommendation: 'Continue ICS+LABA. Annual PFT.', modelUsed: 'biomedical-bert-hf' } });

  // ── MED REMINDERS ──
  await prisma.medicationReminder.create({ data: { patientId: p1.id, medication: 'Lisinopril 10mg', dosage: '1 tablet', frequency: 'daily', timeOfDay: ['08:00'], startDate: new Date('2024-01-15'), isActive: true, notes: 'Take with water.' } });
  await prisma.medicationReminder.create({ data: { patientId: p1.id, medication: 'Metformin 500mg', dosage: '1 tablet', frequency: 'twice_daily', timeOfDay: ['08:00', '20:00'], startDate: new Date('2024-01-15'), isActive: true, notes: 'Take with meals.' } });
  await prisma.medicationReminder.create({ data: { patientId: p1.id, medication: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'daily', timeOfDay: ['08:00'], startDate: new Date('2024-01-15'), isActive: true, notes: 'May cause ankle swelling.' } });
  await prisma.medicationReminder.create({ data: { patientId: patients[1].id, medication: 'Montelukast 10mg', dosage: '1 tablet', frequency: 'daily', timeOfDay: ['20:00'], startDate: new Date('2024-01-01'), isActive: true, notes: 'Take in evening.' } });
  await prisma.medicationReminder.create({ data: { patientId: patients[5].id, medication: 'Levothyroxine 50mcg', dosage: '1 tablet', frequency: 'daily', timeOfDay: ['06:00'], startDate: new Date('2024-01-01'), isActive: true, notes: 'Empty stomach. Wait 30min before eating.' } });

  // ── AI CHAT ──
  const sess1 = await prisma.aIChatSession.create({ data: { userId: patientUsers[0].id, title: 'Understanding my lab results' } });
  await prisma.aIChatMessage.createMany({
    data: [
      { sessionId: sess1.id, role: 'user', content: 'Can you explain my latest HbA1c?' },
      { sessionId: sess1.id, role: 'assistant', content: 'Your HbA1c of 6.5% shows excellent improvement from 7.8% a year ago. A 1.3-point drop significantly reduces your risk of diabetes complications!' },
      { sessionId: sess1.id, role: 'user', content: 'What about cholesterol?' },
      { sessionId: sess1.id, role: 'assistant', content: 'Total cholesterol: 178 (healthy). LDL: 105 (near target of <100). HDL: 46 (good). All trending positively. Your lipid management is working well.' },
    ]
  });
  await prisma.aIChatSession.create({ data: { userId: clinicianUsers[0].id, title: 'Patient Ahmed Khan summary' } });

  // ── DATA SHARING CONSENTS ──
  for (const p of patients) {
    for (const fac of f.slice(0, 5)) {
      await prisma.dataSharingConsent.create({ data: { patientId: p.id, facilityId: fac.id, granted: Math.random() > 0.25 } });
    }
  }

  // ── HEALTH REPORTS ──
  await prisma.healthReport.create({ data: { patientId: p1.id, clinicianId: clin[0].id, title: 'Comprehensive Health Report — Dec 2024', summary: '12-month review shows significant improvement across all metrics. HbA1c: 7.8→6.5. BP: 148/92→128/82. Cholesterol: 220→178. Weight: 82→78kg. CVD risk: Moderate→Low-Moderate. Continue current management.', detailedContent: '# Comprehensive Report\n\n## Key Trends\n- HbA1c: Significant improvement\n- BP: Approaching target\n- Lipids: All within or near targets\n- Weight: 4kg reduction', reportType: 'comprehensive', generatedBy: 'ai' } });
  await prisma.healthReport.create({ data: { patientId: p1.id, title: 'Lab Results Summary — Q4 2024', summary: 'Q4 labs reviewed. All metabolic markers improving. FPG 120 (target <100). HbA1c 6.5% (stable). Lipids all within range. Renal function preserved. Recommend repeat CMP in 3 months.', detailedContent: '# Q4 Lab Summary\n\nHbA1c: 6.5%\nFPG: 120\nChol: 178\nLDL: 105\nHDL: 46\nTG: 160', reportType: 'lab_summary', generatedBy: 'ai' } });

  console.log('✅ EXTENSIVE seed complete!');
  console.log('   12 patients, 5 clinicians, 7 facilities');
  console.log('   96 lab results (12 monthly x 8 metrics for main patient)');
  console.log('   25 AI insights across patients');
  console.log('   15 notifications, 5 symptom logs, 12 vitals, 5 chat messages');
  console.log('   Demo: patient@demo.com / clinician@demo.com / admin@demo.com — pw: demo123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());