import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, getInitials, getAvatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const COLORS = ['#7c5cfc', '#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#ec4899'];

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#7c5cfc', deadline: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      toast.success('Project created!');
      onCreated(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.5rem' }}>New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Project Name *</label>
            <input className="input" placeholder="E.g. Website Redesign" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" placeholder="What is this project about?" rows={3}
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="label">Deadline</label>
            <input className="input" type="date" value={form.deadline}
              onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button type="button" key={c} onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: c,
                    border: form.color === c ? '3px solid white' : '2px solid transparent',
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);
  const isAdmin = (proj) => {
    if (!user) return false;
    if (proj.owner?._id === user._id) return true;
    const me = proj.members?.find(m => m.user?._id === user._id);
    return me?.role === 'admin';
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontSize: '0.9rem' }}>{projects.length} projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Project</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['all', 'active', 'completed', 'archived'].map(f => (
          <button key={f} className={filter === f ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
            onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⬡</div>
          <p>No projects yet. Create your first one!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filtered.map(proj => {
            const total = Object.values(proj.taskCounts || {}).reduce((a, b) => a + b, 0);
            const done = proj.taskCounts?.done || 0;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Link to={`/projects/${proj._id}`} key={proj._id} className="card" style={{ display: 'block', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = proj.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: proj.color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: proj.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{proj.name}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: proj.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }}>
                    {proj.status}
                  </span>
                </div>

                {proj.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {proj.description}
                  </p>
                )}

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    <span>{done}/{total} tasks done</span><span>{progress}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-hover)', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: proj.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex' }}>
                    {proj.members?.slice(0, 4).map((m, i) => (
                      <div key={m.user?._id || i} title={m.user?.name} style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: getAvatarColor(m.user?.name || ''),
                        border: '2px solid var(--bg-card)',
                        marginLeft: i > 0 ? '-8px' : 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', fontWeight: 700, color: 'white'
                      }}>{getInitials(m.user?.name || '')}</div>
                    ))}
                    {proj.members?.length > 4 && (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--bg-hover)', border: '2px solid var(--bg-card)', marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                        +{proj.members.length - 4}
                      </div>
                    )}
                  </div>
                  {proj.deadline && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 {formatDate(proj.deadline)}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </div>
  );
}
