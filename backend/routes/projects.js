const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: check if user is project member or owner
const isMember = (project, userId) => {
  return project.owner.toString() === userId.toString() ||
    project.members.some(m => m.user.toString() === userId.toString());
};

// @GET /api/projects — Get all projects for current user
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    // Add task counts
    const projectsWithCounts = await Promise.all(projects.map(async (p) => {
      const taskCounts = await Task.aggregate([
        { $match: { project: p._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
      taskCounts.forEach(t => { counts[t._id] = t.count; });
      return { ...p.toObject(), taskCounts: counts };
    }));

    res.json(projectsWithCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/projects — Create project
router.post('/', protect, [
  body('name').trim().isLength({ min: 2 }).withMessage('Project name required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, deadline, color } = req.body;
    const project = await Project.create({
      name, description, deadline, color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    await project.populate('owner', 'name email');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/projects/:id — Get single project
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isMember(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/projects/:id — Update project (admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const memberEntry = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!isOwner && !(memberEntry && memberEntry.role === 'admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, description, status, deadline, color } = req.body;
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, deadline, color },
      { new: true, runValidators: true }
    ).populate('owner', 'name email').populate('members.user', 'name email');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/projects/:id — Delete project (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this project' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/projects/:id/members — Add member
router.post('/:id/members', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const memberEntry = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!isOwner && !(memberEntry && memberEntry.role === 'admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const User = require('../models/User');
    const { email, role } = req.body;
    const newMember = await User.findOne({ email });
    if (!newMember) return res.status(404).json({ message: 'User not found' });

    const alreadyMember = project.members.some(m => m.user.toString() === newMember._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User already a member' });

    project.members.push({ user: newMember._id, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email');

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/projects/:id/members/:userId — Remove member
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ message: 'Only owner can remove members' });

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
