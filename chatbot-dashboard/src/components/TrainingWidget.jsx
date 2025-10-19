// src/components/TrainingWidget.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './TrainingWidget.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7237/api';
const api = axios.create({ baseURL: API_BASE });

const msgFromAxios = (e) =>
  e?.response?.data?.message || e?.response?.data || e?.message || 'Request failed';

const fromApi = (d) => ({
  businessName: d?.businessName ?? d?.BusinessName ?? '',
  websiteUrl:   d?.websiteUrl   ?? d?.WebsiteUrl   ?? '',
  contactLink:  d?.contactLink  ?? d?.ContactLink  ?? '',
  trainingText: d?.trainingText ?? d?.TrainingText ?? '',
});

const toPayload = (s) => ({
  businessName: s.businessName,
  websiteUrl:   s.websiteUrl,
  contactLink:  s.contactLink,
  trainingText: s.trainingText,
});

export default function TrainingWidget() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    businessName: '',
    websiteUrl: '',
    contactLink: '',
    trainingText: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!projectId) {
        alert('Missing projectId in the URL. Route must be /training-widget/:projectId');
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(`/TrainingData/${projectId}`);
        setForm(fromApi(data));
      } catch (err) {
        if (err?.response?.status !== 404) {
          alert(`Failed to load: ${msgFromAxios(err)}`);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const next = {};
    if (!form.businessName.trim()) next.businessName = 'Business Name is required';
    if (!form.websiteUrl.trim()) next.websiteUrl = 'Website URL is required';
    if (!form.contactLink.trim()) next.contactLink = 'Contact Link is required';
    if (!form.trainingText.trim()) next.trainingText = 'Training Info is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await api.post(`/TrainingData/${projectId}`, toPayload(form)); // upsert
      // Optional toast, then navigate home
      // toast.success('Saved!');
     navigate('/home', { replace: true }); // ← go to Home when save succeeds
    } catch (err) {
      const msg = msgFromAxios(err);
      alert(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const renderError = (key) =>
    errors[key] ? <div className="error">{errors[key]}</div> : null;

  if (loading) {
    return (
      <div className="container">
        <h2 className="header">Train Chatbot</h2>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="header">Train Chatbot</h2>

      <label className="label">Business Name</label>
      <input
        type="text"
        value={form.businessName}
        onChange={(e) => setField('businessName', e.target.value)}
        className="input"
      />
      {renderError('businessName')}

      <label className="label">Website URL</label>
      <input
        type="url"
        value={form.websiteUrl}
        onChange={(e) => setField('websiteUrl', e.target.value)}
        className="input"
        placeholder="https://example.com"
      />
      {renderError('websiteUrl')}

      <label className="label">Contact Link</label>
      <input
        type="url"
        value={form.contactLink}
        onChange={(e) => setField('contactLink', e.target.value)}
        className="input"
        placeholder="https://example.com/contact"
      />
      {renderError('contactLink')}

      <label className="label">Custom Training Info</label>
      <textarea
        value={form.trainingText}
        onChange={(e) => setField('trainingText', e.target.value)}
        className="textarea"
        rows={6}
        placeholder="Paste core information about the business/services here…"
      />
      {renderError('trainingText')}

      <button
        type="button"
        onClick={handleSave}
        className="train-button"
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save & Train'}
      </button>
    </div>
  );
}
