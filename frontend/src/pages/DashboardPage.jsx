import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue, isDueSoon, getInitials, getAvatarColor } from '../utils/helpers';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{
      width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
      background: `${color}22`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color }}>{value}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.1rem' }}>{label}</div>
    </div>
  </div>
);

const getPriorityColor = (p) => ({ low: 'var(--success)', medium: 'var(--info)', high: 'var(--warning)', urgent: 'var(--danger)' }[p] || 'var(--text-muted)');

export default function DashboardPage() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tasks/my'),
      api.get('/tasks/overdue'),
      api.get('/projects')
    ]).then(([tasksRes, overdueRes, projRes]) => {
      setMyTasks(tasksRes.data);
      setOverdueTasks(overdueRes.data);
      setProjects(projRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;

  const totalTasks = myTasks.length;
  const doneTasks = myTasks.filter(t => t.status === 'done').length;
  const inProgress = myTasks.filter(t => t.status === 'in-progress').length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
          Here's what's happening across your projects today.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon="📁" label="Active Projects" value={projects.filter(p => p.status === 'active').length} color="var(--accent)" />
        <StatCard icon="✅" label="Tasks Assigned" value={totalTasks} color="var(--info)" />
        <StatCard icon="🔄" label="In Progress" value={inProgress} color="var(--warning)" />
        <StatCard icon="🎯" label="Completed" value={doneTasks} color="var(--success)" />
        {overdueTasks.length > 0 && <StatCard icon="⚠️" label="Overdue" value={overdueTasks.length} color="var(--danger)" />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* My Tasks */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
            My Tasks
          </h2>
          {myTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              No tasks assigned to you
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myTasks.slice(0, 8).map(task => (
                <div key={task._id} className="card" style={{ padding: '1rem', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.title}
                      </div>
                      {task.project && (
                        <Link to={`/projects/${task.project._id}`} style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.project.color, display: 'inline-block' }} />
                          {task.project.name}
                        </Link>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: getPriorityColor(task.priority), textTransform: 'uppercase', flexShrink: 0 }}>
                      {task.priority}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                    <StatusBadge status={task.status} />
                    {task.dueDate && (
                      <span style={{ fontSize: '0.75rem', color: isOverdue(task.dueDate, task.status) ? 'var(--danger)' : isDueSoon(task.dueDate, task.status) ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {isOverdue(task.dueDate, task.status) ? '⚠️ ' : ''}{formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--danger)' }}>
                ⚠️ Overdue Tasks
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {overdueTasks.slice(0, 5).map(task => (
                  <div key={task._id} className="card" style={{ padding: '0.875rem', borderColor: 'rgba(248,113,113,0.3)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{task.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{task.project?.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Due {formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>Recent Projects</h2>
              <Link to="/projects" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {projects.slice(0, 5).map(proj => {
                const total = Object.values(proj.taskCounts || {}).reduce((a, b) => a + b, 0);
                const done = proj.taskCounts?.done || 0;
                const progress = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Link to={`/projects/${proj._id}`} key={proj._id} className="card" style={{ padding: '1rem', display: 'block', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: proj.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{progress}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-hover)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: proj.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    'todo': { label: 'To Do', cls: 'badge-todo' },
    'in-progress': { label: 'In Progress', cls: 'badge-inprogress' },
    'review': { label: 'Review', cls: 'badge-review' },
    'done': { label: 'Done', cls: 'badge-done' }
  };
  const s = map[status] || map.todo;
  return <span className={`badge ${s.cls}`} style={{ fontSize: '0.7rem' }}>{s.label}</span>;
}
