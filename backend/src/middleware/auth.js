const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes — must be logged in
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    next(error);
  }
};

// Restrict to admin role only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admins only.',
    });
  }
  next();
};

// Verify the user is the admin of the specific group
const groupAdmin = async (req, res, next) => {
  const Group = require('../models/Group');
  try {
    const group = await Group.findById(req.params.groupId || req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }
    if (group.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the admin of this group.',
      });
    }
    req.group = group;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, adminOnly, groupAdmin };
