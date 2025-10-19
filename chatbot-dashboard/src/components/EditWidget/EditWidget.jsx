// src/components/EditWidget.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ChatWidget from './ChatWidget';
import './EditWidget.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7237/api';
const api = axios.create({ baseURL: API_BASE });

// Helper for readable error messages
const msgFromAxios = (e) =>
  e?.response?.data?.message || e?.response?.data || e?.message || 'Request failed';

const defaultSettings = {
  // Server takes projectId from route; not needed in body
  inactiveMessage: '👋 Hey! Still there? Let us know if you have any questions. 💬',
  primaryColor: '#6a11cb',
  secondaryColor: '#2575fc',
  useGradient: true,
  cornerRadius: 16,
  scriptTag: '',
  chatHeaderText: 'Chat Support',
};

// Only send fields the API expects
const toPayload = (s) => ({
  inactiveMessage: s.inactiveMessage,
  primaryColor: s.primaryColor,
  secondaryColor: s.secondaryColor,
  useGradient: s.useGradient,
  cornerRadius: s.cornerRadius,
  scriptTag: s.scriptTag,
  chatHeaderText: s.chatHeaderText,
});

const EditWidget = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [settings, setSettings] = useState(defaultSettings);
  const [widgetPreviewOpen, setWidgetPreviewOpen] = useState(true);
  const [enableInactiveMessage, setEnableInactiveMessage] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---------- Load existing settings (if any) ----------
  useEffect(() => {
    const load = async () => {
      if (!projectId) {
        alert('Missing projectId in the URL. Route must be /edit-widget/:projectId');
        setLoading(false);
        return;
      }
      console.log('🔵 EditWidget mounted for projectId:', projectId);

      try {
        const { data } = await api.get(`/WidgetSettings/${projectId}`);
        console.log('✅ Existing widget settings loaded:', data);
        setSettings({ ...defaultSettings, ...data });
      } catch (err) {
        if (err?.response?.status === 404) {
          console.log('ℹ️ No existing settings found for this project — using defaults.');
          setSettings(defaultSettings);
        } else {
          console.error('❌ Failed to load settings:', err);
          alert(`Failed to load settings: ${msgFromAxios(err)}`);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId]);

  // ---------- Save (single POST upsert) ----------
  const saveSettingsToDB = async () => {
    if (!projectId) {
      alert('Missing projectId in the URL.');
      return false;
    }

    try {
      console.log('🟣 Upsert → POST /WidgetSettings/{id}');
      await api.post(`/WidgetSettings/${projectId}`, toPayload(settings));
      return true;
    } catch (err) {
      console.error('❌ Save failed:', err);
      const msg = msgFromAxios(err);

      // Helpful message if project wasn't created first
      if (typeof msg === 'string' && msg.includes('Unknown projectId')) {
        alert(
          'This project id does not exist on the server. Create your project from the Home page (the button calls /api/Projects) before editing widget settings.'
        );
      } else {
        alert(`Save failed: ${msg}`);
      }
      return false;
    }
  };

  // ---------- Inactive message countdown display ----------
  useEffect(() => {
    if (!enableInactiveMessage || isOpen) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const timePassed = Date.now() - lastInteraction;
      const secondsLeft = Math.ceil((10000 - timePassed) / 1000);
      setCountdown(secondsLeft > 0 ? secondsLeft : null);
    };

    updateCountdown(); // initial
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [enableInactiveMessage, isOpen, lastInteraction]);

  // ---------- Trigger inactive message ----------
  useEffect(() => {
    if (!enableInactiveMessage || isOpen) return;

    const interval = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastInteraction;

      setMessages((prev) => {
        const exists = prev.some(
          (m) => m.from === 'system' && m.text === settings.inactiveMessage
        );
        if (timeSinceInteraction > 10000 && !exists) {
          setIsOpen(true);
          return [...prev, { text: settings.inactiveMessage, from: 'system' }];
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enableInactiveMessage, isOpen, lastInteraction, settings.inactiveMessage]);

  // ---------- Remove system message when toggled off ----------
  useEffect(() => {
    if (!enableInactiveMessage) {
      setMessages((prev) => prev.filter((m) => !(m.from === 'system')));
    }
  }, [enableInactiveMessage]);

  // ---------- Reset timer + prune old system message when the text changes ----------
  useEffect(() => {
    setLastInteraction(Date.now());
    setMessages((prev) => prev.filter((m) => !(m.from === 'system')));
  }, [settings.inactiveMessage]);

  // ---------- Delayed widget appearance ----------
  useEffect(() => {
    const timer = setTimeout(() => setShowWidget(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // ---------- Handlers ----------
  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    if (field !== 'inactiveMessage') {
      setLastInteraction(Date.now());
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages((prev) => [...prev, { text: inputMessage, from: 'user' }]);
      setInputMessage('');
      setLastInteraction(Date.now());
    }
  };

  const generateGradient = settings.useGradient
    ? `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`
    : settings.primaryColor;

  if (loading) {
    return (
      <div className="edit-widget-container">
        <div className="edit-widget-editor">
          <h2 className="edit-widget-title">Edit Widget</h2>
          <p>Loading widget settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-widget-container">
      <div className="edit-widget-editor">
        <h2 className="edit-widget-title">Edit Widget</h2>

        <div className="edit-widget-row">
          <label className="edit-widget-label">
            Enable Inactive Message
            <span
              className="tooltip-icon"
              title="This message appears if the user doesn't interact with the chat icon within 10 seconds."
            >
              ℹ️
            </span>
          </label>
          <input
            type="checkbox"
            checked={enableInactiveMessage}
            onChange={(e) => setEnableInactiveMessage(e.target.checked)}
          />
        </div>

        {enableInactiveMessage && countdown !== null && (
          <span style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
            Showing message in {countdown}s
          </span>
        )}

        {enableInactiveMessage && (
          <textarea
            className="edit-widget-textarea"
            value={settings.inactiveMessage}
            onChange={(e) => handleChange('inactiveMessage', e.target.value)}
          />
        )}

        <label className="edit-widget-label">Primary Color</label>
        <input
          type="color"
          value={settings.primaryColor}
          onChange={(e) => handleChange('primaryColor', e.target.value)}
        />

        <label className="edit-widget-label">Secondary Color</label>
        <input
          type="color"
          value={settings.secondaryColor}
          onChange={(e) => handleChange('secondaryColor', e.target.value)}
          disabled={!settings.useGradient}
        />

        <label className="edit-widget-label">
          <input
            type="checkbox"
            checked={settings.useGradient}
            onChange={(e) => handleChange('useGradient', e.target.checked)}
          />{' '}
          Use Gradient
        </label>

        <label className="edit-widget-label">
          Corner Radius ({settings.cornerRadius}px)
        </label>
        <input
          type="range"
          min="0"
          max="30"
          value={settings.cornerRadius}
          onChange={(e) => handleChange('cornerRadius', parseInt(e.target.value, 10))}
        />

        <label className="edit-widget-label">Chat Header Text</label>
        <input
          type="text"
          className="edit-widget-input"
          value={settings.chatHeaderText || ''}
          onChange={(e) => handleChange('chatHeaderText', e.target.value)}
          placeholder="Chat Support"
        />

        {/* Save / Next */}
        <div className="edit-widget-footer">
          <button
            className="chat-widget-button"
            disabled={saving}
            onClick={async () => {
              console.log('🟢 Next clicked. projectId:', projectId);
              setSaving(true);
              const ok = await saveSettingsToDB();
              setSaving(false);
              if (ok) {
                console.log('✅ Saved. Navigating…');
                navigate(`/training-widget/${projectId}`); // <-- pass id forward
              }
            }}
            style={{ background: generateGradient, borderRadius: `${settings.cornerRadius}px` }}
          >
            {saving ? 'Saving…' : 'Next'}
          </button>
        </div>
      </div>

      {/* Live Chat Widget Preview */}
      {showWidget && (
        <ChatWidget
          settings={settings}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
          widgetPreviewOpen={widgetPreviewOpen}
          setWidgetPreviewOpen={setWidgetPreviewOpen}
        />
      )}
    </div>
  );
};

export default EditWidget;
