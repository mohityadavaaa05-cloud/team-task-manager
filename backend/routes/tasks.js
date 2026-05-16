const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

const hasProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isMember = project.owner.toString() === userId.toString() ||
    project.members.some(m => m.user.toString() === userId.toString());
  return isMember ? project : null;
};

// @GET /api/tasks?project=:id — Get tasks for a project
router.get('/', protect, async (req, res) => {
  try {
    const { project, status, priority, assignedTo } = req.query;
    if (!project) return res.status(400).json({ message: 'Project ID required' });

    const hasAccess = await hasProjectAccess(project, req.user._id);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const filter = { project };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/tasks/my — Get tasks assigned to current user
router.get('/my', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name color')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/tasks/overdue — Get overdue tasks
router.get('/overdue', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).select('_id');

    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' }
    })
      .populate('project', 'name color')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/tasks — Create task
router.post('/', protect, [
  body('title').trim().isLength({ min: 2 }).withMessage('Task title required'),
  body('project').notEmpty().withMessage('Project ID required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, project, assignedTo, priority, dueDate, tags } = req.body;

    const hasAccess = await hasProjectAccess(project, req.user._id);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const task = await Task.create({
      title, description, project, assignedTo: assignedTo || null,
      priority, dueDate, tags, createdBy: req.user._id
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email');

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/tasks/:id — Update task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const hasAccess = await hasProjectAccess(task.project, req.user._id);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const { title, description, status, priority, assignedTo, dueDate, tags } = req.body;
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status, priority, assignedTo: assignedTo || null, dueDate, tags },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/tasks/:id — Delete task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await hasProjectAccess(task.project, req.user._id);
    if (!project) return res.status(403).json({ message: 'Access denied' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = project.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
