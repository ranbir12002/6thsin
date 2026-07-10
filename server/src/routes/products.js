const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();
const mongoose = require('mongoose');

/**
 * Helper: find a product by slug first, then fall back to _id.
 * The frontend may send either identifier.
 */
async function findProduct(identifier) {
  let product = await Product.findOne({ slug: identifier });
  if (!product && mongoose.Types.ObjectId.isValid(identifier)) {
    product = await Product.findById(identifier);
  }
  return product;
}

/**
 * GET /api/products
 * List all products. Supports query filters:
 *   ?category=MENSWEAR
 *   ?published=true|false
 *   ?search=hoodie
 */
router.get('/', async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category.toUpperCase();
    }

    if (req.query.published !== undefined) {
      filter.isPublished = req.query.published === 'true';
    }

    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:identifier
 * Get a single product by slug or _id.
 */
router.get('/:identifier', async (req, res, next) => {
  try {
    const product = await findProduct(req.params.identifier);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products
 * Create a new product. Requires authentication.
 */
router.post(
  '/',
  auth,
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').notEmpty().withMessage('Price is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category')
      .isIn(['MENSWEAR', 'WOMENSWEAR', 'ACCESSORIES', 'ACTIVEWEAR', 'HOME'])
      .withMessage('Invalid category'),
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

      const product = await Product.create(req.body);

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/products/:identifier
 * Update an existing product. Requires authentication.
 */
router.put('/:identifier', auth, async (req, res, next) => {
  try {
    const product = await findProduct(req.params.identifier);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Update fields from request body
    const allowedFields = [
      'name',
      'price',
      'description',
      'images',
      'category',
      'subcategory',
      'color',
      'colors',
      'sizes',
      'material',
      'careInstructions',
      'fit',
      'articleNumber',
      'supplierInfo',
      'countryOfProduction',
      'isPublished',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/products/:identifier
 * Delete a product. Requires authentication.
 */
router.delete('/:identifier', auth, async (req, res, next) => {
  try {
    const identifier = req.params.identifier;

    // Try deleting by slug first, then by _id
    let product = await Product.findOneAndDelete({ slug: identifier });
    if (!product && mongoose.Types.ObjectId.isValid(identifier)) {
      product = await Product.findByIdAndDelete(identifier);
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
