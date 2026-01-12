import React, { useState } from 'react';
import { multiModalCommsService, CommMode } from '../services/multiModalCommsService';

const modes: { label: string; value: CommMode }[] = [
  { label: 'Text', value: 'text' },
  { label: 'SMS', value: 'sms' },
  { label: 'Voice', value: 'voice' },
  { label: 'Video', value: 'video' },
  { label: 'Push-to-Talk', value: 'pushToTalk' },
  { label: 'Translate', value: 'translation' }
];

export const MultiModalCommsPanel: React.FC = () => {
  const [mode, setMode] = useState<CommMode>('text');
  const [to, setTo] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('en');
  const [mediaUrl, setMediaUrl] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const handleSend = async () => {
    let msg;
    if (mode === 'translation') {
      const translated = await multiModalCommsService.translateMessage(content, 'en', language);
      msg = multiModalCommsService.sendMessage('translation', 'me', to, content, 'en');
      msg.translatedContent = translated;
    } else if (mode === 'voice') {
      msg = multiModalCommsService.sendVoice('me', to, mediaUrl);
    } else if (mode === 'video') {
      msg = multiModalCommsService.sendVideo('me', to, mediaUrl);
    } else if (mode === 'pushToTalk') {
      msg = multiModalCommsService.sendPushToTalk('me', to, mediaUrl);
    } else if (mode === 'sms') {
      msg = multiModalCommsService.sendSMS('me', to, content);
    } else {
      msg = multiModalCommsService.sendMessage('text', 'me', to, content);
    }
    setMessages([...messages, msg]);
    setContent('');
    setMediaUrl('');
  };

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001', maxWidth: 600, margin: '32px auto' }}>
      <h3 style={{ fontSize: 22, marginBottom: 16 }}>Multi-Modal Communication Panel</h3>
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Mode:</label>
        <select value={mode} onChange={e => setMode(e.target.value as CommMode)}>
          {modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>To:</label>
        <input value={to} onChange={e => setTo(e.target.value)} placeholder="Recipient" />
      </div>
      {(mode === 'text' || mode === 'sms' || mode === 'translation') && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 8 }}>Message:</label>
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="Type message..." />
        </div>
      )}
      {(mode === 'voice' || mode === 'video' || mode === 'pushToTalk') && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 8 }}>Media URL:</label>
          <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="Paste media URL..." />
        </div>
      )}
      {mode === 'translation' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 8 }}>Target Language:</label>
          <input value={language} onChange={e => setLanguage(e.target.value)} placeholder="e.g. es, fr, zh" />
        </div>
      )}
      <button onClick={handleSend} style={{ background: '#3b82f6', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 16 }}>Send</button>
      <div>
        <h4 style={{ fontSize: 18, marginBottom: 8 }}>Messages</h4>
        <ul>
          {messages.map((m, idx) => (
            <li key={idx} style={{ marginBottom: 6 }}>
              <b>{m.mode.toUpperCase()}</b> to <b>{m.to}</b>: {m.content || m.mediaUrl} {m.translatedContent && <span style={{ color: '#10b981' }}>({m.translatedContent})</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
