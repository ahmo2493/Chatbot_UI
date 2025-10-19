// src/components/Home.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ⬇️ Adjust if your ChatWidget lives elsewhere
import ChatWidget from './EditWidget/ChatWidget';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7237/api',
  withCredentials: true,
});

const msgFromAxios = (e) =>
  e?.response?.data?.message ||
  (typeof e?.response?.data === 'string' ? e.response.data : '') ||
  e?.message ||
  'Request failed';

export default function Home() {
  const navigate = useNavigate();

  // ---------- data ----------
  const [projects, setProjects] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // ---------- preview chat state ----------
  const [chatOpen, setChatOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const [settingsCache, setSettingsCache] = useState({});
  const [messagesByProject, setMessagesByProject] = useState({});
  const [inputByProject, setInputByProject] = useState({});
  const [sendingByProject, setSendingByProject] = useState({});

  const defaultSettings = {
    inactiveMessage: '👋 Hey! Still there? Let us know if you have any questions. 💬',
    primaryColor: '#6a11cb',
    secondaryColor: '#2575fc',
    useGradient: true,
    cornerRadius: 16,
    scriptTag: '',
    chatHeaderText: 'Chat Support',
  };

  // ---------- load user + projects ----------
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/Users/me');
        setUserEmail(data?.email ?? data?.Email ?? localStorage.getItem('userEmail') ?? '');
      } catch {
        setUserEmail(localStorage.getItem('userEmail') || '');
      }
    })();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/Projects');
      const list = (Array.isArray(data) ? data : data?.items ?? []).map((p) => ({
        id: p.id ?? p.Id,
        name: p.name ?? p.Name ?? 'Draft',
        createdAt: p.createdAt ?? p.CreatedAt,
        updatedAt: p.updatedAt ?? p.UpdatedAt,
        userEmail: p.userEmail ?? p.UserEmail ?? p.user?.email ?? p.User?.Email ?? '',
      }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProjects(list);
    } catch (err) {
      alert(msgFromAxios(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // ---------- actions ----------
  const createAndGo = async () => {
    try {
      setCreating(true);
      const { data } = await api.post('/Projects', { name: null });
      const id = data?.id ?? data?.Id;
      if (!id) throw new Error('Create project response missing id.');
      navigate(`/edit-widget/${id}`);
    } catch (err) {
      alert(msgFromAxios(err));
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (id) => {
    if (!confirm('Delete this chatbot? This cannot be undone.')) return;
    try {
      await api.delete(`/Projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        setChatOpen(false);
        setActiveProjectId(null);
      }
    } catch (err) {
      alert(msgFromAxios(err));
    }
  };

  const logout = async () => {
    try {
      await api.post('/Auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('authToken');
      navigate('/', { replace: true });
    }
  };

  // ---------- preview chat logic ----------
  const openChat = async (projectId) => {
    if (chatOpen && activeProjectId === projectId) {
      setChatOpen(false);
      setActiveProjectId(null);
      return;
    }

    try {
      setLoadingSettings(true);

      // fetch widget settings if not cached
      if (!settingsCache[projectId]) {
        try {
          const { data } = await api.get(`/WidgetSettings/${projectId}`);
          setSettingsCache((prev) => ({ ...prev, [projectId]: { ...defaultSettings, ...data } }));
        } catch (err) {
          if (err?.response?.status === 404) {
            setSettingsCache((prev) => ({ ...prev, [projectId]: defaultSettings }));
          } else {
            throw err;
          }
        }
      }

      // init per-project message/input/sending stores
      setMessagesByProject((prev) => (prev[projectId] ? prev : { ...prev, [projectId]: [] }));
      setInputByProject((prev) => (prev[projectId] !== undefined ? prev : { ...prev, [projectId]: '' }));
      setSendingByProject((prev) => (prev[projectId] !== undefined ? prev : { ...prev, [projectId]: false }));

      setActiveProjectId(projectId);
      setChatOpen(true);
    } catch (err) {
      alert(msgFromAxios(err));
    } finally {
      setLoadingSettings(false);
    }
  };

  const activeSettings = activeProjectId ? settingsCache[activeProjectId] ?? defaultSettings : null;
  const activeMessages = activeProjectId ? messagesByProject[activeProjectId] ?? [] : [];
  const activeInput = activeProjectId ? inputByProject[activeProjectId] ?? '' : '';
  const isSending = !!sendingByProject[activeProjectId];

  const setActiveInput = (val) => {
    if (!activeProjectId) return;
    setInputByProject((prev) => ({ ...prev, [activeProjectId]: val }));
  };

  const pushMessage = (msg) => {
    if (!activeProjectId) return;
    setMessagesByProject((prev) => ({
      ...prev,
      [activeProjectId]: [...(prev[activeProjectId] ?? []), msg],
    }));
  };

  const setSending = (pid, val) =>
    setSendingByProject((prev) => ({ ...prev, [pid]: val }));

  // 🔗 Wire to your existing /api/chat endpoint
  const handleSendMessage = async () => {
    const text = (activeInput ?? '').trim();
    if (!text || !activeProjectId) return;

    // add user message immediately
    pushMessage({ text, from: 'user' });
    setActiveInput('');

    try {
      setSending(activeProjectId, true);

      const { data } = await api.post('/chat', {
        projectId: activeProjectId,
        sessionId: 'preview-' + activeProjectId, // simple stable session id
        userMessage: text,
      });

      const botReply = data?.response ?? data?.botResponse ?? '(no response)';
      pushMessage({ text: botReply, from: 'bot' });
    } catch (err) {
      pushMessage({ text: `⚠️ ${msgFromAxios(err)}`, from: 'system' });
    } finally {
      setSending(activeProjectId, false);
    }
  };

  const relativeTime = (d) => {
    const dt = new Date(d);
    const diff = (Date.now() - dt.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return dt.toLocaleString();
  };

  const isActivePreview = (id) => chatOpen && activeProjectId === id;

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <div style={styles.topbar}>
        <div>
          <div style={styles.kicker}>Dashboard</div>
          <h1 style={styles.title}>Welcome, {userEmail || 'user'}!</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            style={{
              ...styles.cta,
              opacity: creating ? 0.7 : 1,
              cursor: creating ? 'not-allowed' : 'pointer',
            }}
            onClick={createAndGo}
            disabled={creating}
            title="Create a new chatbot"
          >
            {creating ? 'Creating…' : 'Create Chatbot +'}
          </button>
          <button style={styles.logout} onClick={logout} title="Log out">
            Logout
          </button>
        </div>
      </div>

      {/* Card with projects */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Your Chatbots</h2>
          <button style={styles.refresh} onClick={loadProjects}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={styles.empty}>Loading projects…</div>
        ) : projects.length === 0 ? (
          <div style={styles.empty}>
            No chatbots yet. Click <b>Create Chatbot +</b> to start.
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={{ ...styles.th, textAlign: 'center', width: 140 }}>Preview</th>
                  <th style={styles.th}>Owner</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Updated</th>
                  <th style={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.tdName}>
                      <span
                        style={{
                          ...styles.nameLink,
                          color: p.name === 'Draft' ? '#6b7280' : '#111827',
                        }}
                        onClick={() => navigate(`/edit-widget/${p.id}`)}
                        title="Edit widget"
                      >
                        {p.name || 'Draft'}
                      </span>
                      {p.name === 'Draft' && <span style={styles.badge}>Draft</span>}
                    </td>

                    {/* Preview column with outlined gradient button */}
                    <td style={styles.tdCenter}>
                      <button
                        onClick={() => openChat(p.id)}
                        aria-pressed={isActivePreview(p.id)}
                        title={isActivePreview(p.id) ? 'Hide preview' : 'Preview chat'}
                        style={{
                          ...styles.previewBtn,
                          ...(isActivePreview(p.id) ? styles.previewBtnActive : {}),
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={styles.previewIcon}
                          aria-hidden="true"
                        >
                          <path
                            d="M12 3C7.03 3 3 6.58 3 11c0 2.07 1.02 3.94 2.68 5.31-.09 1.04-.48 2.5-1.6 3.69-.2.21-.05.57.24.54 1.84-.2 3.2-.86 4.09-1.45.98.28 2.03.41 3.09.41 4.97 0 9-3.58 9-8s-4.03-8-9-8Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span>{isActivePreview(p.id) ? 'Hide' : 'Preview'}</span>
                      </button>
                    </td>

                    <td style={styles.td}>{p.userEmail || '—'}</td>
                    <td style={styles.td}>{relativeTime(p.createdAt)}</td>
                    <td style={styles.td}>{relativeTime(p.updatedAt)}</td>
                    <td style={styles.tdRight}>
                      <button style={styles.action} onClick={() => navigate(`/edit-widget/${p.id}`)}>
                        Edit
                      </button>
                      <button style={styles.action} onClick={() => navigate(`/training-widget/${p.id}`)}>
                        Train
                      </button>
                      <button style={styles.danger} onClick={() => deleteProject(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Chat Widget */}
      {chatOpen && activeProjectId && (
        <div style={styles.chatContainer}>
          <div style={styles.chatHeaderBar}>
            <div style={styles.chatTitle}>
              {projects.find((x) => x.id === activeProjectId)?.name || 'Chat'}
              <span style={styles.chatSub}>
                &nbsp;•&nbsp;{loadingSettings ? 'loading settings…' : isSending ? 'sending…' : 'preview'}
              </span>
            </div>
            <button
              style={styles.chatClose}
              onClick={() => {
                setChatOpen(false);
                setActiveProjectId(null);
              }}
            >
              ✕
            </button>
          </div>

          <ChatWidget
            settings={activeSettings ?? defaultSettings}
            isOpen={true}
            setIsOpen={(open) => {
              if (!open) {
                setChatOpen(false);
                setActiveProjectId(null);
              }
            }}
            messages={activeMessages}
            inputMessage={activeInput}
            setInputMessage={setActiveInput}
            handleSendMessage={handleSendMessage}
            widgetPreviewOpen={true}
            setWidgetPreviewOpen={() => {}}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f7faff',
    padding: '32px',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  kicker: { fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280' },
  title: { margin: 0, fontSize: 24, color: '#111827' },
  cta: {
    padding: '12px 18px',
    background: 'linear-gradient(135deg,#6a11cb,#2575fc)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
  },
  logout: {
    padding: '12px 18px',
    background: '#fff',
    color: '#111827',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    cursor: 'pointer',
  },
  card: { background: '#fff', borderRadius: 16, boxShadow: '0 10px 24px rgba(0,0,0,0.06)', padding: 16 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { margin: 0, fontSize: 18, color: '#111827' },
  refresh: { border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
  th: { textAlign: 'left', fontSize: 12, color: '#6b7280', padding: '10px 12px', borderBottom: '1px solid #e5e7eb' },
  thRight: { textAlign: 'right', fontSize: 12, color: '#6b7280', padding: '10px 12px', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px' },
  tdRight: { padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' },
  tdCenter: { padding: '12px', textAlign: 'center' },
  tdName: { padding: '12px', display: 'flex', alignItems: 'center', gap: 8 },
  nameLink: { cursor: 'pointer', fontWeight: 600 },
  badge: { marginLeft: 8, fontSize: 10, color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: 999 },
  action: { marginLeft: 8, border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' },
  danger: { marginLeft: 8, border: '1px solid #ef4444', background: '#fff', color: '#b91c1c', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' },
  empty: { padding: '24px', color: '#6b7280' },

  // Fancy preview button (outline w/ gradient border, black icon/text)
  previewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 999,
    border: '2px solid transparent',
    backgroundImage: 'linear-gradient(#fff, #fff), linear-gradient(135deg, #6a11cb, #2575fc)',
    backgroundClip: 'padding-box, border-box',
    color: '#111827',
    backgroundColor: '#fff',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease',
  },
  previewBtnActive: {
    backgroundImage: 'linear-gradient(#fff, #fff), linear-gradient(135deg, #10b981, #059669)',
  },
  previewIcon: { display: 'block' },

  // floating chat styles
  chatContainer: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    width: 380,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    zIndex: 9999,
  },
  chatHeaderBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  chatTitle: { fontWeight: 600, color: '#111827' },
  chatSub: { fontWeight: 400, fontSize: 12, color: '#6b7280' },
  chatClose: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 16,
    color: '#6b7280',
  },
};
