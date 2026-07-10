const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with email and password, returns JWT token.
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((e) => e.msg),
        });
      }

      const { email, password } = req.body;

      // Find admin and explicitly select password field
      const admin = await Admin.findOne({ email }).select('+password');
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // Generate JWT
      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      res.json({
        success: true,
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/register-admin
 * Create a new admin user. Protected by admin secret header.
 */
router.post(
  '/register-admin',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  async (req, res, next) => {
    try {
      const secret = req.headers['x-admin-secret'];
      if (!secret || secret !== process.env.JWT_SECRET) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid registration secret.',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((e) => e.msg),
        });
      }

      const { email, password, name } = req.body;

      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Admin with this email already exists.',
        });
      }

      const admin = await Admin.create({ email, password, name });
      res.status(201).json({
        success: true,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated admin user info.
 */
router.get('/me', auth, async (req, res) => {
  res.json({
    success: true,
    admin: req.admin,
  });
});

module.exports = router;
