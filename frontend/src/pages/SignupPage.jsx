import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
      toast.success('Account created! Welcome to TeamFlow.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <span style={styles.logo}>⚡</span>
            <span style={styles.brandName}>TeamFlow</span>
          </Link>
          <h1 style={styles.title}>Create your account</h1>
          <p style={styles.subtitle}>Already have one? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link></p>
        </div>

        <div className="card fade-in">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input" type="text" placeholder="Jane Smith"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="jane@company.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Minimum 6 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={styles.roleInfo}>
              <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                {form.role === 'admin' ? '👑 Admin' : '👤 Member'}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                {form.role === 'admin'
                  ? 'Admins can create projects, manage members, and assign tasks.'
                  : 'Members can view projects they are added to and manage their assigned tasks.'}
              </p>
            </div>

            {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
 container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '2rem',
    background: '#0e1117',
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px'
  },
  wrapper: { width: '100%', maxWidth: '440px' },
  header: { marginBottom: '1.5rem' },
  logo: { fontSize: '1.5rem', background: 'var(--accent)', borderRadius: '8px', padding: '0.2rem 0.4rem' },
  brandName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.3rem', fontSize: '0.9rem' },
  roleInfo: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1.2rem'
  }
};
