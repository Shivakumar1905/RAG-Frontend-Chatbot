import React, { useState, useRef } from 'react';
import config from '../config';

const ACCEPTED = '.pdf,.doc,.docx,.ppt,.pptx,.csv,.jpg,.jpeg,.png';
const MAX_MB = 50;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadSection({ onUploadSuccess, onNewUpload, isReady, uploadMeta, backendOnline }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateFiles = (files) => {
    const oversized = files.filter(f => f.size / (1024 * 1024) > MAX_MB);
    if (oversized.length > 0) {
      return {
        valid: false,
        message: `File(s) exceed ${MAX_MB}MB limit: ${oversized.map(f => f.name).join(', ')}`,
      };
    }
    return { valid: true };
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const check = validateFiles(files);
    if (!check.valid) {
      setStatus({ type: 'error', message: check.message });
      return;
    }
    setSelectedFiles(files);
    setStatus(null);
    onNewUpload();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const check = validateFiles(files);
    if (!check.valid) {
      setStatus({ type: 'error', message: check.message });
      return;
    }
    setSelectedFiles(files);
    setStatus(null);
    onNewUpload();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    setIsUploading(true);
    setStatus({ type: 'info', message: 'Uploading and indexing… Large documents may take a moment.' });

    const formData = new FormData();
    selectedFiles.forEach(f => formData.append('files', f));

    try {
      const res = await fetch(`${config.API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.detail || 'Upload failed.' });
        return;
      }

      onUploadSuccess(data);
      const msg = `${data.files_processed} file(s) processed — ${data.chunks} chunks indexed.`;
      setStatus({
        type: data.warnings ? 'warning' : 'success',
        message: data.warnings ? `${msg} ⚠ ${data.warnings}` : msg,
      });
    } catch {
      setStatus({ type: 'error', message: 'Cannot reach backend. Make sure it is running.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setStatus(null);
    onNewUpload();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-num">01</div>
        <div>
          <div className="section-title">Upload Documents</div>
          <div className="section-sub">PDF · DOCX · PPTX · CSV max {MAX_MB}MB per file</div>
        </div>
      </div>

      <div
        className={`dropzone ${selectedFiles.length > 0 ? 'dropzone-filled' : ''} ${dragOver ? 'dropzone-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div className="dropzone-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        {selectedFiles.length > 0 ? (
          <div className="dropzone-files">
            {selectedFiles.map((f, i) => (
              <div key={i} className="file-chip">
                <span className="file-chip-name">{f.name}</span>
                <span className="file-chip-size">{formatSize(f.size)}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="dropzone-text">Drop files here or click to browse</div>
            <div className="dropzone-hint">Supports multiple files at once</div>
          </>
        )}
      </div>

      <div className="action-row">
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={isUploading || selectedFiles.length === 0 || !backendOnline}
        >
          {isUploading
            ? <><span className="spinner" /> Indexing…</>
            : 'Upload & Index'
          }
        </button>
        {(isReady || selectedFiles.length > 0) && (
          <button className="btn btn-ghost" onClick={handleReset} disabled={isUploading}>
            Clear
          </button>
        )}
      </div>

      {status && (
        <div className={`alert alert-${status.type}`}>
          <span className="alert-dot" />
          {status.message}
        </div>
      )}
    </div>
  );
}

export default UploadSection;