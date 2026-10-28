import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { importBhavcopy, switchDataset } from '../services/api';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        setErrorMsg('Please select a valid CSV file.');
        return;
      }
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvPreview(text.slice(0, 500) + (text.length > 500 ? '\n... [truncated]' : ''));
      };
      reader.readAsText(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
          const res = await importBhavcopy(file.name, content);
          setSuccessMsg(`${res.message} (${res.records} rows loaded)`);
          setTimeout(() => {
            onImportSuccess();
            onClose();
          }, 1200);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to upload CSV.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing file.');
      setIsUploading(false);
    }
  };

  const handleResetToDemo = async () => {
    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await switchDataset('demo');
      setSuccessMsg(res.message);
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch to Demo data.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl glass-card rounded-[28px] border border-white/15 p-6 md:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#D1B15F]/20 text-[#D1B15F] flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-display">
              Import Genuine MCX Bhavcopy
            </h3>
            <p className="text-xs text-zinc-400">
              Upload daily settlement Bhavcopy CSV from Multi Commodity Exchange
            </p>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div className="mt-5 border-2 border-dashed border-white/15 hover:border-[#D1B15F]/50 rounded-2xl p-6 text-center transition-all bg-black/20">
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
            <FileText className="w-10 h-10 text-zinc-500 mb-2" />
            <span className="text-sm font-semibold text-white">
              {file ? file.name : 'Click to select MCX Bhavcopy CSV'}
            </span>
            <span className="text-xs text-zinc-500 mt-1">
              Supports standard format: Date, Symbol, Expiry, Open, High, Low, Close, Volume, OpenInterest
            </span>
          </label>
        </div>

        {/* Preview snippet if selected */}
        {csvPreview && (
          <div className="mt-4">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">
              Data Preview
            </span>
            <pre className="p-3 rounded-xl bg-black/50 border border-white/5 text-[11px] font-mono text-zinc-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
              {csvPreview}
            </pre>
          </div>
        )}

        {/* Error / Success alerts */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleResetToDemo}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-amber-300/80 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 transition-all"
            title="Reset active dataset to baseline Synthetic Demo Data"
          >
            Reset to Synthetic Demo
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D1B15F] to-[#B8933D] text-black font-semibold text-xs tracking-wide shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isUploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Ingest & Normalize Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
