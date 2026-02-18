import express from 'express';
import { uploadLogo, getLogoUrl } from '../controllers/logoController.js';

const router = express.Router();

// Route for logo upload (uses express-fileupload middleware from app.js)
router.post('/', uploadLogo);

// Route for getting signed URL for company logo
router.get('/:companyId/url', getLogoUrl);

export default router;