import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/login',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
  ],
  authController.login
);

router.post('/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty()
  ],
  authController.register
);

export default router;

