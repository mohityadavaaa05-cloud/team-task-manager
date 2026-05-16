import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* LEFT PANEL */}
      <div style={styles.left}>
        <div style={styles.gridBg} />
        <div style={styles.blob1} />
        <div style={styles.blob2} />

        <div style={styles.logoRow}>
          <div style={styles.logoBox}>⚡</div>
          <span style={styles.logoText}>TeamFlow</span>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={styles.eyebrow}>Project management</div>
          <h1 style={styles.bigTitle}>
            Built for teams<br />
            that <span style={{ color: '#00c896' }}>ship fast</span>
          </h1>
        </div>

        <div style={styles.pillRow}>
          {['Role-based access', 'Kanban board', 'Dashboard', 'Overdue alerts'].map(p => (
            <div key={p} style={styles.pill}>
              <span style={{ color: '#00c896', fontSize: '0.7rem' }}>✦</span> {p}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={styles.right}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={styles.formTitle}>Sign in</h2>
            <p style={styles.formSub}>
              No account?{' '}
              <Link to="/signup" style={{ color: '#00c896', fontWeight: 600 }}>
                Sign up
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem', background: '#00c896', color: '#0e1117', fontWeight: 700, borderRadius: '10px', marginTop: '0.5rem' }}
            >
              {loading ? 'Signing in...' : 'Continue →'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex', minHeight: '100vh',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    background: '#141820'
  },
  left: {
    flex: '0 0 50%', padding: '3rem 3.5rem',
    background: '#0e1117',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative', overflow: 'hidden'
  },
  gridBg: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px'
  },
  blob1: {
    position: 'absolute', width: '320px', height: '320px',
    borderRadius: '50%', background: '#00c896',
    opacity: 0.08, top: '-90px', left: '-90px'
  },
  blob2: {
    position: 'absolute', width: '200px', height: '200px',
    borderRadius: '50%', background: '#5b8dee',
    opacity: 0.06, bottom: '40px', right: '20px'
  },
  logoRow: {
    display: 'flex', alignItems: 'center',
    gap: '0.6rem', position: 'relative', zIndex: 1
  },
  logoBox: {
    width: '38px', height: '38px', background: '#00c896',
    borderRadius: '10px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
  },
  logoText: {
    fontSize: '1.15rem', fontWeight: 700,
    color: '#fff', letterSpacing: '-0.5px'
  },
  eyebrow: {
    fontSize: '0.7rem', fontWeight: 600, color: '#00c896',
    letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '1rem'
  },
  bigTitle: {
    fontSize: '2.5rem', fontWeight: 700, color: '#fff',
    lineHeight: 1.15, letterSpacing: '-1px', margin: 0
  },
  pillRow: {
    display: 'flex', gap: '0.5rem',
    flexWrap: 'wrap', position: 'relative', zIndex: 1
  },
  pill: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '99px',
    border: '1px solid rgba(255,255,255,0.08)',
    fontSize: '0.75rem', color: '#9ca3af',
    background: 'rgba(255,255,255,0.03)'
  },
  right: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center',
    padding: '3rem 4rem',
    background: '#141820',
    borderLeft: '1px solid rgba(255,255,255,0.06)'
  },
  formTitle: {
    fontSize: '1.5rem', fontWeight: 700,
    color: '#f9fafb', letterSpacing: '-0.5px', margin: 0
  },
  formSub: {
    fontSize: '0.85rem', color: '#6b7280', marginTop: '0.4rem'
  },
};