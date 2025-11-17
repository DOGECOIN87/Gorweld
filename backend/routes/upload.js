const express = require('express');
const router = express.Router();
const { upload, uploadMedia } = require('../controllers/uploadController');

/**
 * POST /api/upload
 * Upload media files (images and videos)
 * Accepts multipart/form-data with field name 'media'
 * Maximum 5 files per request
 */
router.post('/', upload.array('media', 5), uploadMedia);

module.exports = router;
