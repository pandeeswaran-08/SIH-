import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, RefreshCw, ExternalLink, FileText
} from 'lucide-react';
import { api } from '../services/api';
import type { ApplicationDocument, ExtractedField } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface DocumentViewerProps {
  applicationId: number;
  onBack: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ applicationId, onBack }) => {
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ApplicationDocument | null>(null);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const [docs, fields] = await Promise.all([
        api.getDocuments(applicationId),
        api.getExtractedFields(applicationId)
      ]);
      setDocuments(docs);
      setExtractedFields(fields);
      if (docs.length > 0) {
        setSelectedDoc(docs[0]);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 font-serif">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-medium text-slate-600">Loading Document Evidence & OCR Bounding Boxes...</span>
        </div>
      </div>
    );
  }

  const fieldsForSelectedDoc = extractedFields.filter(f => f.document_id === selectedDoc?.id);

  return (
    <div className="space-y-6 font-serif max-w-7xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="gov-card p-7 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer"
            title="Return to Application"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Module 01
              </span>
              <span className="text-xs text-slate-400 font-serif">• Document Intelligence</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight mt-1.5">
              Interactive Document Viewer & OCR Extraction
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
              Side-by-side inspection of statutory documents with page bounding boxes, text stream, and field verification.
            </p>
          </div>
        </div>

        {selectedDoc && (
          <a
            href={api.getDocumentFileUrl(selectedDoc.id)}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary flex items-center space-x-2 cursor-pointer text-xs"
          >
            <span>Open Original File</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Main Grid: Document List + Document Pane + Extracted Fields Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Document Tabs (3 cols) */}
        <div className="lg:col-span-3 gov-card p-5 space-y-3">
          <div className="text-xs font-display font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Uploaded Evidence ({documents.length})
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {documents.map((d) => {
              const isSelected = selectedDoc?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDoc(d)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center space-x-1.5 truncate max-w-[150px]">
                      <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="font-semibold text-slate-900 truncate">{d.original_filename}</span>
                    </div>
                    <StatusBadge type="status" value={d.status} />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 font-serif truncate">
                    {d.document_type} • {d.page_count} p.
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Document Text / Preview Pane (5 cols) */}
        <div className="lg:col-span-5 gov-card overflow-hidden flex flex-col min-h-[580px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 text-xs">
            <span className="font-display font-bold text-slate-900 truncate max-w-[220px]">
              {selectedDoc?.original_filename || 'No document selected'}
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              SHA: {selectedDoc?.sha256_hash.substring(0, 14)}...
            </span>
          </div>

          <div className="p-5 flex-1 overflow-y-auto bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed max-h-[520px]">
            {selectedDoc?.extracted_text ? (
              <pre className="whitespace-pre-wrap selection:bg-blue-500/30">{selectedDoc.extracted_text}</pre>
            ) : (
              <div className="text-center text-slate-500 py-20 font-serif italic">
                No OCR extracted text recorded for this document.
              </div>
            )}
          </div>

          <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center text-[11px] text-slate-600 font-serif">
            <span>OCR Status: <b className="text-slate-800">{selectedDoc?.ocr_completed ? 'Completed' : 'Pending'}</b></span>
            <span>Unreadable: <b className={selectedDoc?.is_unreadable ? 'text-rose-600' : 'text-emerald-700'}>{selectedDoc?.is_unreadable ? 'Yes (Flagged)' : 'Passed'}</b></span>
          </div>
        </div>

        {/* Right: Extracted Structured Fields & Bounding Boxes (4 cols) */}
        <div className="lg:col-span-4 gov-card p-5 space-y-4 min-h-[580px]">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xs font-display font-bold text-slate-900 uppercase tracking-wider">
              Extracted Fields & Bounding Boxes
            </h2>
            <p className="text-[11px] text-slate-500 font-serif mt-0.5">Source page coordinates and recognition confidence</p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {fieldsForSelectedDoc.length > 0 ? (
              fieldsForSelectedDoc.map((field) => (
                <div key={field.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold uppercase text-[10px] tracking-wider text-blue-700">
                      {field.field_name.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold px-2 py-0.5 rounded-lg">
                      {(field.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-serif font-semibold text-slate-900 text-xs break-all">
                    {field.extracted_value || 'N/A'}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-serif">
                    <span>Source Page: {field.source_page}</span>
                    <span className="font-mono text-[9px] text-slate-400">
                      BBox: {field.bbox_json ? field.bbox_json.replace(/"/g, '') : '[50, 100, 500, 130]'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs font-serif italic">
                No specific regulatory fields extracted from this document yet. Click 'Re-Run All 5 Modules' to re-extract.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
