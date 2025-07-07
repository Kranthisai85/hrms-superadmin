import express from 'express';
import multer from 'multer';
import { createCompany, getCompanies,getCompanyById, updateCompany, deleteCompany } from '../controllers/companyController.js';

const router = express.Router();
const upload = multer(); // Use memory storage for parsing form-data

// Create a new company
router.post('/companies',upload.none(), createCompany);

// Get all companies
router.get('/companies', getCompanies);
//get company by id
router.get('/companies/:id', getCompanyById);

// Update a company by ID
router.put('/companies/:id', upload.none(), updateCompany);

// Delete a company by ID
router.delete('/companies/:id', deleteCompany);

export default router;