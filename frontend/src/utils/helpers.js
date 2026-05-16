import { format, isAfter, isBefore, addDays } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy · h:mm a');
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  return isBefore(new Date(dueDate), new Date());
};

export const isDueSoon = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  const soon = addDays(new Date(), 2);
  return isBefore(new Date(dueDate), soon) && isAfter(new Date(dueDate), new Date());
};

export const getInitials = (name = '') => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getAvatarColor = (name = '') => {
  const colors = ['#7c5cfc', '#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#fb923c'];
  let hash = 0;
  for (let c of name) hash += c.charCodeAt(0);
  return colors[hash % colors.length];
};
