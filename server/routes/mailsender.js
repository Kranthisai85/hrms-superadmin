import express from 'express';
import { sendEmail } from '../controllers/emailController.js';

const router = express.Router();

// POST route for sending emails
router.post('/send', sendEmail);

export default router;