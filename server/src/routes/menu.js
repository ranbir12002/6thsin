const express = require('express');
const { body, validationResult } = require('express-validator');
const MenuCategory = require('../models/Menu');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/menu
 * Get all menu categories sorted by order.
 */
router.get('/', async (req, res, next) => {
  try {
    const categories = await MenuCategory.find().sort({ order: 1 });

    res.json({
      success: true,
      menu: categories,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/menu
 * Add a new menu category. Requires authentication.
 */
router.post(
  '/',
  auth,
  [body('label').notEmpty().withMessage('Category label is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((e) => e.msg),
        });
      }

      // Set order to be after the last category
      const lastCategory = await MenuCategory.findOne().sort({ order: -1 });
      const order = lastCategory ? lastCategory.order + 1 : 0;

      const category = await MenuCategory.create({
        label: req.body.label,
        children: req.body.children || [],
        order,
      });

      res.status(201).json({
        success: true,
        category,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/menu/:id
 * Update a menu category (label, children, order). Requires authentication.
 */
router.put('/:id', auth, async (req, res, next) => {
  try {
    const category = await MenuCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (req.body.label !== undefined) category.label = req.body.label;
    if (req.body.order !== undefined) category.order = req.body.order;
    if (req.body.children !== undefined) category.children = req.body.children;

    await category.save();

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/menu/:id
 * Delete a menu category. Requires authentication.
 */
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const category = await MenuCategory.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/menu/:id/items
 * Add a menu item to a category. Requires authentication.
 */
router.post(
  '/:id/items',
  auth,
  [body('label').notEmpty().withMessage('Item label is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((e) => e.msg),
        });
      }

      const category = await MenuCategory.findById(req.params.id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found.',
        });
      }

      category.children.push({
        label: req.body.label,
        href: req.body.href || '#',
      });

      await category.save();

      res.status(201).json({
        success: true,
        category,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/menu/:id/items/:itemId
 * Update a menu item within a category. Requires authentication.
 */
router.put('/:id/items/:itemId', auth, async (req, res, next) => {
  try {
    const category = await MenuCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const item = category.children.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    if (req.body.label !== undefined) item.label = req.body.label;
    if (req.body.href !== undefined) item.href = req.body.href;

    await category.save();

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/menu/:id/items/:itemId
 * Remove a menu item from a category. Requires authentication.
 */
router.delete('/:id/items/:itemId', auth, async (req, res, next) => {
  try {
    const category = await MenuCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const item = category.children.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    item.deleteOne();
    await category.save();

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
