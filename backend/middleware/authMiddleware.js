const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Attach this to any route that requires login
const protect = async (req, res, next) => {
  let token;

  // Token comes in the Authorization header as: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token and decode the payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (minus password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      res.status(401);
      next(new Error('Not authorized — token failed'));
    }
  }

  if (!token) {
    res.status(401);
    next(new Error('Not authorized — no token'));
  }
};

module.exports = { protect };
