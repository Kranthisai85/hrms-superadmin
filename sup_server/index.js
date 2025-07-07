import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import multer from 'multer';
import roleRoutes from './routes/roleRoutes.js';

// import userRoutes from './routes/users.js';
// import roleRoutes from './routes/roles.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Multer setup for form-data
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', upload.none(), companyRoutes); // use upload.single('logo') if uploading file
app.use('/api', upload.none(), roleRoutes);

// app.use('/api/users', userRoutes);
// app.use('/api/roles', roleRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});