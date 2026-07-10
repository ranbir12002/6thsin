const express = require('express');
const { body, validationResult } = require('express-validator');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const multer = require('multer');
const r2Client = require('../config/r2');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer: store files in memory (buffer) for streaming to R2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * POST /api/upload
 * Proxy upload: browser sends files to Express, Express uploads to R2.
 * Accepts multipart/form-data with field name "images" (up to 10 files).
 * Requires authentication.
 *
 * Response:
 *   { success: true, files: [{ publicUrl, key }, ...] }
 */
router.post('/', auth, upload.array('images', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided.',
      });
    }

    const results = [];

    for (const file of req.files) {
      const sanitizedName = file.originalname
        .toLowerCase()
        .replace(/[^a-z0-9.\-_]/g, '-');
      const uniqueId = crypto.randomUUID();
      const key = `products/${Date.now()}-${uniqueId}-${sanitizedName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await r2Client.send(command);

      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
      results.push({ publicUrl, key });
    }

    res.json({
      success: true,
      files: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/upload/presign
 * Generate a presigned PUT URL for direct browser-to-R2 upload.
 * Requires authentication.
 *
 * Request body:
 *   { filename: "hoodie-front.jpg", contentType: "image/jpeg" }
 *
 * Response:
 *   { uploadUrl: "https://...", publicUrl: "https://...", key: "products/..." }
 */
router.post(
  '/presign',
  auth,
  [
    body('filename').notEmpty().withMessage('Filename is required'),
    body('contentType')
      .matches(/^image\/(jpeg|png|webp|gif|svg\+xml|avif)$/)
      .withMessage(
        'Content type must be a valid image type (jpeg, png, webp, gif, svg, avif)'
      ),
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

      const { filename, contentType } = req.body;

      // Sanitize filename and create unique key
      const sanitizedName = filename
        .toLowerCase()
        .replace(/[^a-z0-9.\-_]/g, '-');
      const uniqueId = crypto.randomUUID();
      const key = `products/${Date.now()}-${uniqueId}-${sanitizedName}`;

      // Create presigned PUT URL (valid for 10 minutes)
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(r2Client, command, {
        expiresIn: 600, // 10 minutes
      });

      // The public URL where the file will be accessible
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      res.json({
        success: true,
        uploadUrl,
        publicUrl,
        key,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/upload/:key
 * Delete a file from R2. Requires authentication.
 * The key should be URL-encoded if it contains slashes.
 */
router.delete('/:key(*)', auth, async (req, res, next) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: req.params.key,
    });

    await r2Client.send(command);

    res.json({
      success: true,
      message: 'File deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
