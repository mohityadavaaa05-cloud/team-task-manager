import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue, isDueSoon, getInitials, getAvatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const STATUSES = [
  { key: 'todo', label: 'To Do', color: 'var(--text-muted)' },
  { key: 'in-progress', label: 'In Progress', color: 'var(--info)' },
  { key: 'review', label: 'Review', color: 'var(--warning)' },
  { key: 'done', label: 'Done', color: 'var(--success)' }
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS = { low: 'var(--success)', medium: 'var(--info)', high: 'var(--warning)', urgent: 'var(--danger)' };

function TaskModal({ task, project, onClose, onSaved, onDeleted }) {
  const { user } = useAuth();
  const isNew = !task;
  const [form, setForm] = useState(task ? {
    title: task.title, description: task.description, status: task.status,
    priority: task.priority, assignedTo: task.assignedTo?._id || '',
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', tags: task.tags?.join(', ') || ''
  } : {
    title: '', description: '', status: 'todo', priority: 'medium',
    assignedTo: '', dueDate: '', tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const members = project?.members || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        project: project._id,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        assignedTo: form.assignedTo || null
      };
      let res;
      if (isNew) {
        res = await api.post('/tasks', payload);
        toast.success('Task created!');
      } else {
        res = await api.put(`/tasks/${task._id}`, payload);
        toast.success('Task updated!');
      }
      onSaved(res.data, isNew);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Task deleted');
      onDeleted(task._id);
      onClose();
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{isNew ? 'New Task' : 'Edit Task'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" placeholder="Task title" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" placeholder="What needs to be done?" rows={3}
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Assign To</label>
              <select className="input" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => m.user && (
                  <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Tags (comma-separated)</label>
            <input className="input" placeholder="frontend, bug, urgent" value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <div>
              {!isNew && <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? '...' : '🗑 Delete'}
              </button>}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : isNew ? 'Create Task' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ project, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/projects/${project._id}/members`, { email, role });
      toast.success('Member added!');
      onAdded(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.5rem' }}>Add Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">User Email</label>
            <input className="input" type="email" placeholder="member@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick }) {
  const overdue = isOverdue(task.dueDate, task.status);
  const dueSoon = isDueSoon(task.dueDate, task.status);

  return (
    <div onClick={onClick} className="card" style={{
      padding: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
      borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
      borderColor: overdue ? 'var(--danger)' : undefined
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', lineHeight: 1.4 }}>{task.title}</div>
      {task.description && (
        <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}
      {task.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {task.tags.map(tag => (
            <span key={tag} style={{ fontSize: '0.65rem', background: 'var(--accent-light)', color: 'var(--accent)', padding: '0.1rem 0.4rem', borderRadius: '99px', fontWeight: 600 }}>{tag}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {task.assignedTo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: getAvatarColor(task.assignedTo.name),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: 700, color: 'white'
            }}>{getInitials(task.assignedTo.name)}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.assignedTo.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unassigned</span>
        )}
        {task.dueDate && (
          <span style={{ fontSize: '0.7rem', color: overdue ? 'var(--danger)' : dueSoon ? 'var(--warning)' : 'var(--text-muted)', fontWeight: overdue ? 700 : 400 }}>
            {overdue ? '⚠️ ' : ''}{formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project=${id}`)
    ]).then(([projRes, taskRes]) => {
      setProject(projRes.data);
      setTasks(taskRes.data);
    }).catch(() => { toast.error('Project not found'); navigate('/projects'); })
      .finally(() => setLoading(false));
  }, [id]);

  const isProjectAdmin = () => {
    if (!project || !user) return false;
    if (project.owner?._id === user._id) return true;
    const me = project.members?.find(m => m.user?._id === user._id);
    return me?.role === 'admin';
  };

  const handleTaskSaved = (task, isNew) => {
    if (isNew) setTasks(prev => [task, ...prev]);
    else setTasks(prev => prev.map(t => t._id === task._id ? task : t));
  };

  const handleTaskDeleted = (taskId) => setTasks(prev => prev.filter(t => t._id !== taskId));

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProject(prev => ({ ...prev, members: prev.members.filter(m => m.user?._id !== userId) }));
      toast.success('Member removed');
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s.key] = tasks.filter(t => t.status === s.key);
    return acc;
  }, {});

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: project.color, flexShrink: 0 }} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>{project.name}</h1>
              {project.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{project.description}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            {isProjectAdmin() && (
              <>
                <button className="btn btn-ghost" onClick={() => setShowAddMember(true)}>+ Member</button>
                <button className="btn btn-primary" onClick={() => setShowNewTask(true)}>+ Task</button>
                <button className="btn btn-danger" onClick={handleDeleteProject} style={{ padding: '0.5rem 0.7rem' }}>🗑</button>
              </>
            )}
            {!isProjectAdmin() && (
              <button className="btn btn-primary" onClick={() => setShowNewTask(true)}>+ Task</button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            👤 Owner: <span style={{ color: 'var(--text-primary)' }}>{project.owner?.name}</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            👥 {project.members?.length} members
          </span>
          {project.deadline && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              📅 Due: <span style={{ color: 'var(--text-primary)' }}>{formatDate(project.deadline)}</span>
            </span>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            📋 {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        {[['board', '⬡ Board'], ['members', '👥 Members']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              padding: '0.6rem 1.2rem', background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === key ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
              marginBottom: '-1px', transition: 'color 0.2s'
            }}>{label}</button>
        ))}
      </div>

      {/* Board */}
      {activeTab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'start' }}>
          {STATUSES.map(col => (
            <div key={col.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                <span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: col.color }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', background: 'var(--bg-hover)', padding: '0.1rem 0.45rem', borderRadius: '99px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {tasksByStatus[col.key].length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {tasksByStatus[col.key].map(task => (
                  <TaskCard key={task._id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
                <button onClick={() => setShowNewTask(true)} className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  + Add task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {project.members?.map(m => m.user && (
              <div key={m.user._id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: getAvatarColor(m.user.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, color: 'white'
                  }}>{getInitials(m.user.name)}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.user.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.user.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                    color: m.role === 'admin' ? 'var(--warning)' : 'var(--text-secondary)',
                    background: m.role === 'admin' ? 'var(--warning-light)' : 'var(--bg-hover)',
                    padding: '0.2rem 0.6rem', borderRadius: '99px'
                  }}>{m.role}</span>
                  {isProjectAdmin() && project.owner?._id !== m.user._id && m.user._id !== user._id && (
                    <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                      onClick={() => handleRemoveMember(m.user._id)}>Remove</button>
                  )}
                  {project.owner?._id === m.user._id && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>Owner</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isProjectAdmin() && (
            <button className="btn btn-ghost" style={{ marginTop: '1rem', borderStyle: 'dashed' }} onClick={() => setShowAddMember(true)}>
              + Add Member
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {(showNewTask || selectedTask) && (
        <TaskModal
          task={selectedTask}
          project={project}
          onClose={() => { setShowNewTask(false); setSelectedTask(null); }}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          project={project}
          onClose={() => setShowAddMember(false)}
          onAdded={updated => setProject(updated)}
        />
      )}
    </div>
  );
}
