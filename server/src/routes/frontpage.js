const express = require('express');
const Frontpage = require('../models/Frontpage');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/frontpage
 * Get frontpage settings (singleton). Creates default if none exist.
 */
router.get('/', async (req, res, next) => {
  try {
    const settings = await Frontpage.getSettings();
    res.json({
      success: true,
      frontpage: settings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/frontpage
 * Update frontpage settings. Requires authentication.
 * Supports partial updates (only send the fields you want to change).
 */
router.put('/', auth, async (req, res, next) => {
  try {
    let settings = await Frontpage.getSettings();

    const { hero, featuredCollections, newArrivals, lookbook } = req.body;

    if (hero) {
      if (hero.text !== undefined) settings.hero.text = hero.text;
    }

    if (featuredCollections) {
      if (featuredCollections.heading !== undefined)
        settings.featuredCollections.heading = featuredCollections.heading;
      if (featuredCollections.body !== undefined)
        settings.featuredCollections.body = featuredCollections.body;
      if (featuredCollections.ctaText !== undefined)
        settings.featuredCollections.ctaText = featuredCollections.ctaText;
      if (featuredCollections.images !== undefined)
        settings.featuredCollections.images = featuredCollections.images;
    }

    if (newArrivals) {
      if (newArrivals.title !== undefined)
        settings.newArrivals.title = newArrivals.title;
    }

    if (lookbook) {
      if (lookbook.images !== undefined)
        settings.lookbook.images = lookbook.images;
    }

    await settings.save();

    res.json({
      success: true,
      frontpage: settings,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
