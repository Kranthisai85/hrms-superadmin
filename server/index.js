import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
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

// Multer setup for form-data
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'C:/Users/kmlro/Downloads/abmmm');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', companyRoutes);
app.use('/api/logo', logoRoutes);
app.use('/api', upload.none(), roleRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/email', emailRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
