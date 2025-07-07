import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { uploadLogo } from '../controllers/logoController.js';

// Define upload directory (Windows path)
const uploadDir = path.join(process.cwd(), 'uploads', 'logos');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
        // If you really want the original name, keep file.originalname.
        // Adding a timestamp avoids accidental overwrites.
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Initialize Multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

const router = express.Router();

// Route for single file upload
router.post('/', upload.single('file'), uploadLogo);

export default router;