import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import logoRoutes from './routes/logo.js'; // Import the logo.js route
import emailRoutes from './routes/mailsender.js';
import roleRoutes from './routes/roleRoutes.js';


import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();
const __dirname = path.resolve();          // ESM replacement for __dirname

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Express-fileupload middleware (replaces multer)
app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
    useTempFiles: true,
    tempFileDir: process.platform === 'win32' ? path.join(__dirname, 'tmp') : '/tmp/',
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', companyRoutes);
app.use('/api/logo', logoRoutes);
app.use('/api', roleRoutes);
// Keep static uploads route for backward compatibility during migration
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/email', emailRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
