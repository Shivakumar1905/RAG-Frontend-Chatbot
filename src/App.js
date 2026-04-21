import React, { useState, useEffect } from 'react';
import UploadSection from './components/UploadSection';
import QASection from './components/QASection';
import config from './config';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [uploadMeta, setUploadMeta] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 6;

    const check = async () => {
      try {
        const res = await fetch(`${config.API_BASE}/health`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          setBackendStatus('online');
          if (data.vectorstore_ready) setIsReady(true);
          return true;
        }
      } catch {
        attempts++;
        if (attempts === 1) setBackendStatus('waking');
        if (attempts >= maxAttempts) { setBackendStatus('offline'); return true; }
      }
      return false;
    };

    const poll = async () => {
      const done = await check();
      if (!done) setTimeout(poll, 5000);
    };
    poll();
  }, []);

  const handleNewUpload = () => {
    setIsReady(false);
    setUploadMeta(null);
    setUploadKey(k => k + 1); 
  };

 
  const handleUploadSuccess = (data) => {
    setUploadMeta(data);
    setIsReady(true);
    setUploadKey(k => k + 1); 
  };

  const statusLabel = {
    checking: { text: 'Connecting…',    cls: 'pill-checking' },
    waking:   { text: 'Waking up…',     cls: 'pill-waking'   },
    online:   { text: 'Backend online',  cls: 'pill-online'   },
    offline:  { text: 'Backend offline', cls: 'pill-offline'  },
  }[backendStatus];

  return (
    <div className="app-root">

      <header className="mobile-bar">
        <div className="mobile-brand">
          <div className="brand-icon">R</div>
          <span className="brand-name">RAG Chatbot</span>
        </div>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(o => !o)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </header>

      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">R</div>
          <div className="brand-text">
            <div className="brand-name">RAG Chatbot</div>
            <div className="brand-tagline">Document Q&amp;A</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Workspace</div>
          <div className={`nav-item ${!isReady ? 'nav-item-active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Files
          </div>
          <div className={`nav-item ${isReady ? 'nav-item-active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Ask Questions
          </div>
        </nav>

        <div className="sidebar-status">
          <div className="status-label">Backend</div>
          <div className={`status-pill ${statusLabel.cls}`}>
            <span className="status-pip" />
            {statusLabel.text}
          </div>

          <div className="status-label" style={{ marginTop: '14px' }}>Index Status</div>
          <div className={`status-pill ${isReady ? 'pill-ready' : 'pill-idle'}`}>
            <span className="status-pip" />
            {isReady ? `Ready · ${uploadMeta?.chunks} chunks` : 'No documents loaded'}
          </div>
          {isReady && (
            <div className="status-meta">{uploadMeta?.files_processed} file(s) indexed</div>
          )}
        </div>

      </aside>

      <main className="main-content" onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}>
        <div className="main-inner">
          {backendStatus === 'waking' && (
            <div className="alert alert-warning">
              <span className="alert-dot" />
              Backend is waking up from sleep — this can take up to 30 seconds on Render. Please wait…
            </div>
          )}
          {backendStatus === 'offline' && (
            <div className="alert alert-error">
              <span className="alert-dot" />
              Cannot reach backend at <code>{config.API_BASE}</code>. Make sure the server is running.
            </div>
          )}
          <UploadSection
            onUploadSuccess={handleUploadSuccess}
            onNewUpload={handleNewUpload}
            isReady={isReady}
            uploadMeta={uploadMeta}
            backendOnline={backendStatus === 'online' || backendStatus === 'waking'}
          />
          {}
          <QASection key={uploadKey} isReady={isReady} />
        </div>
      </main>
    </div>
  );
}

export default App;