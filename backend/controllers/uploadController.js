const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Organize by date: uploads/YYYY/MM/DD/
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const dateDir = path.join(uploadsDir, String(year), month, day);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dateDir)) {
            fs.mkdirSync(dateDir, { recursive: true });
        }
        
        cb(null, dateDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        const sanitizedBasename = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
        cb(null, sanitizedBasename + '-' + uniqueSuffix + ext);
    }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
    // Allowed image types
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    // Allowed video types
    const videoTypes = ['video/webm', 'video/mp4'];
    
    const allowedTypes = [...imageTypes, ...videoTypes];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PNG, JPG, WEBP, WEBM, MP4`), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max (will validate per type in controller)
        files: 5 // Maximum 5 files
    }
});

/**
 * Upload media files
 */
async function uploadMedia(req, res) {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        // Validate file sizes based on type
        const errors = [];
        const validFiles = [];
        
        for (const file of req.files) {
            const isImage = file.mimetype.startsWith('image/');
            const isVideo = file.mimetype.startsWith('video/');
            
            // Check size limits: 5MB for images, 20MB for videos
            if (isImage && file.size > 5 * 1024 * 1024) {
                errors.push(`${file.originalname}: Image files must be 5MB or less`);
                // Delete the file
                fs.unlinkSync(file.path);
            } else if (isVideo && file.size > 20 * 1024 * 1024) {
                errors.push(`${file.originalname}: Video files must be 20MB or less`);
                // Delete the file
                fs.unlinkSync(file.path);
            } else {
                validFiles.push(file);
            }
        }

        if (validFiles.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid files uploaded',
                details: errors
            });
        }

        // Generate URLs for uploaded files
        const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const fileUrls = validFiles.map(file => {
            // Get relative path from uploads directory
            const relativePath = path.relative(uploadsDir, file.path);
            // Convert to URL path (use forward slashes)
            const urlPath = relativePath.split(path.sep).join('/');
            return `${baseURL}/uploads/${urlPath}`;
        });

        res.status(200).json({
            success: true,
            count: validFiles.length,
            urls: fileUrls,
            warnings: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error uploading files:', error);
        
        // Clean up any uploaded files on error
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to upload files',
            message: error.message
        });
    }
}

module.exports = {
    upload,
    uploadMedia
};
