const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Check if user is admin of a project
const requireProjectAdmin = async (req, res, next) => {
  const Project = require('../models/Project');
  const project = await Project.findById(req.params.projectId || req.body.project);

  if (!project) return res.status(404).json({ message: 'Project not found' });

  const isOwner = project.owner.toString() === req.user._id.toString();
  const memberEntry = project.members.find(m => m.user.toString() === req.user._id.toString());
  const isAdmin = memberEntry && memberEntry.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  req.project = project;
  next();
};

module.exports = { protect, requireProjectAdmin };
