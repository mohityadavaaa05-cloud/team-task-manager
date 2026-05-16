import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', icon: '◈', label: 'Dashboard' },
  { path: '/projects', icon: '⬡', label: 'Projects' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div style={styles.root}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.logo}>⚡</span>
          <span style={styles.brandName}>TeamFlow</span>
        </div>

        <nav style={styles.nav}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navActive : {})
            })}>
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.userSection}>
          <div style={styles.userCard}>
            <div style={{
              ...styles.avatar,
              background: getAvatarColor(user?.name)
            }}>
              {getInitials(user?.name)}
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userRole}>
                <span style={{ color: user?.role === 'admin' ? 'var(--warning)' : 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">↩</button>
        </div>
      </aside>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  root: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: '240px', flexShrink: 0,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    padding: '1.5rem 1rem',
    position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    marginBottom: '2.5rem', paddingLeft: '0.5rem'
  },
  logo: { fontSize: '1.3rem', background: 'var(--accent)', borderRadius: '8px', padding: '0.15rem 0.35rem' },
  brandName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500,
    transition: 'all 0.2s'
  },
  navActive: {
    background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600
  },
  navIcon: { fontSize: '1.1rem', width: '20px', textAlign: 'center' },
  userSection: {
    marginTop: 'auto', paddingTop: '1rem',
    borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: '0.5rem'
  },
  userCard: { display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0
  },
  userInfo: { minWidth: 0 },
  userName: { fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: {},
  logoutBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: '1rem', padding: '0.3rem', flexShrink: 0,
    borderRadius: 'var(--radius-sm)', transition: 'color 0.2s'
  },
  main: { flex: 1, overflow: 'auto', padding: '2rem', minWidth: 0 }
};
