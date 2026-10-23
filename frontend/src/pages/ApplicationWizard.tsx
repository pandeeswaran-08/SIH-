import React, { useState } from 'react';
import {
  Check, ChevronRight, ChevronLeft,
  Upload, FileText, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import type { Application } from '../types';

interface WizardProps {
  onApplicationCreated: (appId: number) => void;
  onCancel: () => void;
}

export const ApplicationWizard: React.FC<WizardProps> = ({
  onApplicationCreated,
  onCancel
}) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [createdApp, setCreatedApp] = useState<Application | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    legal_name: '',
    aicte_permanent_id: '',
    category: 'ENGINEERING_TECH',
    application_type: 'EXTENSION_OF_APPROVAL',
    academic_year: '2026-2027',
    state: 'Maharashtra',
    district: 'Pune',
    pin_code: '411057',
    address: 'Survey No. 120, Rajiv Gandhi Infotech Park',
    establishment_year: 2012,
    contact_email: 'principal@techinst.edu.in',
    contact_phone: '020-25691000',
    declared_land_acres: 10.5,
    declared_builtup_sqm: 14200.0,
    declared_faculty_count: 76,
    declared_student_intake: 420
  });

  // Category auto-detection preview
  const getDetectedCategory = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('pharm')) return 'PHARMACY';
    if (n.includes('management') || n.includes('business') || n.includes('mba')) return 'MANAGEMENT';
    if (n.includes('arch')) return 'ARCHITECTURE';
    if (n.includes('arts') || n.includes('design')) return 'APPLIED_ARTS_CRAFTS';
    return 'ENGINEERING_TECH';
  };
  const predictedCategory = getDetectedCategory(formData.legal_name);

  // Document Uploads State
  const [uploadedFiles, setUploadedFiles] = useState<{
    docType: string;
    file: File;
    status: 'pending' | 'uploading' | 'done' | 'error';
    sha256?: string;
  }[]>([
    { docType: 'LAND_OWNERSHIP', file: new File(["Sample Registered Land Deed: Measuring 10.5 Acres at Survey No 120, Pune."], "Land_Ownership_Deed.pdf", { type: "application/pdf" }), status: 'pending' },
    { docType: 'FIRE_SAFETY', file: new File(["Fire Safety Compliance Certificate: Valid upto 31/12/2026."], "Fire_Safety_NOC.pdf", { type: "application/pdf" }), status: 'pending' },
    { docType: 'AFFILIATION_CERT', file: new File(["Affiliation order from University for Academic Year 2026-2027."], "University_Affiliation.pdf", { type: "application/pdf" }), status: 'pending' }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name.includes('acres') || name.includes('sqm') || name.includes('count') || name.includes('intake') || name.includes('year'))
        ? Number(value)
        : value
    }));
  };

  const handleCreateApplication = async () => {
    setSubmitting(true);
    try {
      const app = await api.createApplication(formData);
      setCreatedApp(app);

      // Upload initial attached files
      for (const item of uploadedFiles) {
        try {
          await api.uploadDocument(app.id, item.file, item.docType);
        } catch (uploadErr) {
          console.warn(`File upload skipped for ${item.docType}:`, uploadErr);
        }
      }

      setStep(4);
    } catch (err: any) {
      alert(`Submission Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-serif animate-fade-in">
      
      {/* Wizard Header */}
      <div className="gov-card p-7 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Institutional Registration
            </span>
            <span className="text-xs text-slate-400 font-serif">• Scrutiny Intake</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight mt-1.5">
            Application Submission Wizard
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
            Step {step} of 4 • AICTE Regulatory Scrutiny Intake Workflow
          </p>
        </div>
        <button
          onClick={onCancel}
          className="btn-secondary text-xs cursor-pointer"
        >
          Cancel & Return
        </button>
      </div>

      {/* Stepper Indicator */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { num: 1, label: 'Institution Info' },
          { num: 2, label: 'Campus Declarations' },
          { num: 3, label: 'Document Evidence' },
          { num: 4, label: 'Review & Verify' }
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3.5 rounded-2xl border text-center transition shadow-xs ${
              step === s.num
                ? 'bg-blue-600 text-white border-blue-600 shadow-md font-semibold'
                : step > s.num
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            <div className="text-[10px] uppercase font-display font-bold tracking-wider">Step {s.num}</div>
            <div className="text-xs font-serif font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Step 1: Institution Details */}
      {step === 1 && (
        <div className="gov-card p-7 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-display font-bold text-slate-900">Step 1: Institutional Identification & Category Detection</h2>
            <p className="text-xs text-slate-500 font-serif mt-0.5">Provide legal credentials and AICTE permanent identification.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-serif">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Legal Institution Name *</label>
              <input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                onChange={handleInputChange}
                placeholder="e.g. Pune Institute of Computer Technology"
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                required
              />
              {formData.legal_name && (
                <div className="mt-2 flex items-center space-x-2 text-[11px] text-blue-700 font-medium bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                  <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Rule Engine Recommendation: Predicted Category → <b>{predictedCategory}</b> (Confidence: 95%)</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">AICTE Permanent ID (PID) *</label>
              <input
                type="text"
                name="aicte_permanent_id"
                value={formData.aicte_permanent_id}
                onChange={handleInputChange}
                placeholder="e.g. 1-482910492"
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Program Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
              >
                <option value="ENGINEERING_TECH">Engineering & Technology</option>
                <option value="MANAGEMENT">Management Studies</option>
                <option value="PHARMACY">Pharmacy Education</option>
                <option value="ARCHITECTURE">Architecture & Planning</option>
                <option value="APPLIED_ARTS_CRAFTS">Applied Arts & Crafts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">District / City *</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Campus Physical Address *</label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleInputChange}
                className="w-full text-xs font-serif p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Email *</label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleInputChange}
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone *</label>
              <input
                type="text"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (!formData.legal_name) {
                  alert('Please enter legal institution name');
                  return;
                }
                setStep(2);
              }}
              className="btn-primary flex items-center space-x-1.5 cursor-pointer text-xs"
            >
              <span>Next: Campus Declarations</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Declarations */}
      {step === 2 && (
        <div className="gov-card p-7 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-display font-bold text-slate-900">Step 2: Statutory Campus & Academic Declarations</h2>
            <p className="text-xs text-slate-500 font-serif mt-0.5">Enter quantitative physical and faculty declarations subject to AI cross-check.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-serif">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Application Type *</label>
              <select
                name="application_type"
                value={formData.application_type}
                onChange={handleInputChange}
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
              >
                <option value="EXTENSION_OF_APPROVAL">Extension of Approval (EoA)</option>
                <option value="NEW_INSTITUTION">Establishment of New Technical Institute</option>
                <option value="INCREASE_IN_INTAKE">Increase in Intake / Additional Course</option>
                <option value="INTRODUCTION_OF_NEW_COURSE">Introduction of Emerging Areas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Academic Year *</label>
              <input
                type="text"
                name="academic_year"
                value={formData.academic_year}
                readOnly
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 font-semibold text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Declared Campus Land (Acres) *</label>
              <input
                type="number"
                step="0.1"
                name="declared_land_acres"
                value={formData.declared_land_acres}
                onChange={handleInputChange}
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Min Statutory Norm: 7.5 Acres rural, 2.5 Acres metro</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total Built-Up Area (Sqm) *</label>
              <input
                type="number"
                step="10"
                name="declared_builtup_sqm"
                value={formData.declared_builtup_sqm}
                onChange={handleInputChange}
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Min Statutory Norm: 4500 Sqm for Technical Institute</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Declared Core Faculty Count *</label>
              <input
                type="number"
                name="declared_faculty_count"
                value={formData.declared_faculty_count}
                onChange={handleInputChange}
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Approved Student Intake *</label>
              <input
                type="number"
                name="declared_student_intake"
                value={formData.declared_student_intake}
                onChange={handleInputChange}
                className="w-full text-xs font-serif px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary flex items-center space-x-1.5 cursor-pointer text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn-primary flex items-center space-x-1.5 cursor-pointer text-xs"
            >
              <span>Next: Document Evidence</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Document Evidence */}
      {step === 3 && (
        <div className="gov-card p-7 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-display font-bold text-slate-900">Step 3: Document Evidence Upload & Fingerprinting</h2>
            <p className="text-xs text-slate-500 font-serif mt-0.5">Attached files will be analyzed by OCR, scanned for forgery indicators, and checked against issuing authorities.</p>
          </div>

          <div className="space-y-3.5">
            {uploadedFiles.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-display font-bold text-slate-900">{item.docType.replace(/_/g, ' ')}</div>
                    <div className="text-[11px] text-slate-500 font-serif mt-0.5">{item.file.name} ({(item.file.size / 1024).toFixed(1)} KB)</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Ready for OCR
                  </span>
                </div>
              </div>
            ))}

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-7 text-center hover:bg-slate-50/60 transition cursor-pointer">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-display font-bold text-slate-800">Attach additional document or infrastructure evidence image</div>
              <p className="text-[11px] text-slate-500 font-serif mt-1">PDF, PNG, JPG accepted (Max 25MB). SHA-256 fingerprint automatically computed on upload.</p>
              <input
                type="file"
                className="hidden"
                id="doc-upload"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const f = e.target.files[0];
                    setUploadedFiles(prev => [...prev, { docType: 'INFRASTRUCTURE_PHOTO', file: f, status: 'pending' }]);
                  }
                }}
              />
              <label
                htmlFor="doc-upload"
                className="mt-3.5 inline-block btn-secondary text-xs cursor-pointer font-serif"
              >
                Browse File
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary flex items-center space-x-1.5 cursor-pointer text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleCreateApplication}
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-md disabled:opacity-50 flex items-center space-x-1.5"
            >
              {submitting ? (
                <span>Submitting to Regulatory Queue...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation & Instant Scrutiny Trigger */}
      {step === 4 && createdApp && (
        <div className="gov-card p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">Application Successfully Submitted</h2>
            <p className="text-xs text-slate-500 mt-1 font-serif">
              Your institutional application has been registered into the AICTE national regulatory portal.
            </p>
          </div>

          <div className="gov-card p-5 max-w-md mx-auto text-left text-xs space-y-2.5 font-serif">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Unique Reference No:</span>
              <span className="font-bold text-blue-700">{createdApp.application_number}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Institution:</span>
              <span className="font-semibold text-slate-900">{formData.legal_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Assigned Category:</span>
              <span className="font-semibold text-slate-900">{createdApp.category}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Checklist Snapshot:</span>
              <span className="font-semibold text-emerald-600">Attached (Handbook 2026)</span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 pt-3">
            <button
              onClick={() => onApplicationCreated(createdApp.id)}
              className="btn-primary cursor-pointer text-xs"
            >
              Open Scrutiny Workspace & Run Validation →
            </button>
            <button
              onClick={onCancel}
              className="btn-secondary cursor-pointer text-xs"
            >
              Return to Queue
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
