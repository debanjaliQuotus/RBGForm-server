const fs = require('fs')
const path = require('path')
const multer = require('multer');
// Create uploads directory if it doesn't exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp and random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, `pdf-${uniqueSuffix}${fileExtension}`);
    }
});

// File filter to only allow PDF files
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

// Configure multer with file size limit (10MB)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB in bytes
    }
});

module.exports = upload