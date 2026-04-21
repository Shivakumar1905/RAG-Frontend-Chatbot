import React, { useState, useRef, useEffect } from 'react';
import config from '../config';

function renderAnswer(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      elements.push(<div key={i} style={{ height: '8px' }} />);
      i++;
      continue;
    }

    if (/^[-•*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-•*]\s+/.test(lines[i])) {
        items.push(<li key={i}>{formatInline(lines[i].replace(/^[-•*]\s+/, ''))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="answer-list">{items}</ul>);
      continue;
    }


    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(<li key={i}>{formatInline(lines[i].replace(/^\d+\.\s+/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="answer-list answer-list-ol">{items}</ol>);
      continue;
    }

   
    elements.push(<p key={i} className="answer-para">{formatInline(line)}</p>);
    i++;
  }

  return elements;
}

function formatInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="inline-code">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function QASection({ isReady }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]); 
  const [isAsking, setIsAsking] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || !isReady || isAsking) return;

    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setQuestion('');
    setIsAsking(true);

    const formData = new FormData();
    formData.append('question', q);

    try {
      const res = await fetch(`${config.API_BASE}/ask`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.detail || 'Something went wrong.', error: true }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Cannot reach backend.', error: true }]);
    } finally {
      setIsAsking(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAsk();
  };

  const handleClearChat = () => setMessages([]);

  return (
    <div className="section-card qa-card">
      <div className="section-header">
        <div className="section-num">02</div>
        <div style={{ flex: 1 }}>
          <div className="section-title">Ask a Question</div>
          <div className="section-sub">Get answers from your documents</div>
        </div>
        {messages.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleClearChat}>
            Clear chat
          </button>
        )}
      </div>

      {messages.length > 0 && (
        <div className="chat-thread">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-msg chat-msg-${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === 'user'
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
                }
              </div>
              <div className={`chat-bubble ${msg.error ? 'chat-bubble-error' : ''}`}>
                {msg.role === 'assistant' && !msg.error
                  ? <div className="answer-body">{renderAnswer(msg.text)}</div>
                  : <p className="answer-para">{msg.text}</p>
                }
              </div>
            </div>
          ))}

          {isAsking && (
            <div className="chat-msg chat-msg-assistant">
              <div className="chat-avatar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
              </div>
              <div className="chat-bubble chat-bubble-thinking">
                <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      <div className="textarea-wrap">
        <textarea
          ref={textareaRef}
          className="qa-textarea"
          placeholder={isReady ? 'Ask anything about your documents…' : 'Upload documents first to enable Q&A…'}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isReady || isAsking}
          rows={4}
        />
        <span className="textarea-hint">Ctrl + Enter to send</span>
      </div>

      <div className="action-row">
        <button
          className="btn btn-primary"
          onClick={handleAsk}
          disabled={!isReady || !question.trim() || isAsking}
        >
          {isAsking ? <><span className="spinner" /> Thinking…</> : 'Ask'}
        </button>
        {!isReady && (
          <span className="input-notice">Upload a document first</span>
        )}
      </div>
    </div>
  );
}

export default QASection;