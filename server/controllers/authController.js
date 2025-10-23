// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import { validationResult } from 'express-validator';

// export const login = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { email, password } = req.body;

//     // TODO: Replace with actual database query
//     if (email !== 'admin@example.com' || password !== 'admin123') {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const token = jwt.sign(
//       { id: '1', email, role: 'admin' },
//       process.env.JWT_SECRET,
//       { expiresIn: '1d' }
//     );

//     res.json({ token });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// export const register = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { email, password, name } = req.body;

//     // TODO: Check if user exists
//     // TODO: Hash password
//     // TODO: Save user to database

//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };
// const express = require('express');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
// const User = require('../models/User');

// // Register a new user
// exports.register = async (req, res) => {
//   const { name, email, password } = req.body;

//   try {
//     console.log('Received registration request:', { name, email, password });

//     // Hash the password before saving it to the database
//     const hashedPassword = await bcrypt.hash(password, 10);
//     console.log('Hashed password:', hashedPassword);

//     // Create the user in the database
//     const userId = await User.create({ name, email, password: hashedPassword });
//     console.log('User created with ID:', userId);

//     // Return success response
//     res.status(201).json({ message: 'User registered successfully', userId });
//   } catch (err) {
//     console.error('Error during registration:', err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Login an existing user
// exports.login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Find the user by email
//     const user = await User.findByEmail(email);
//     if (!user) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Compare the provided password with the hashed password in the database
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Generate a JWT token for authentication
//     const token = jwt.sign({ userId: user.id }, 'your_secret_key', { expiresIn: '1h' });

//     // Return the token and user details (optional)
//     res.status(200).json({ message: 'Login successful', token, user });
//   } catch (err) {
//     // Handle errors (e.g., database error, bcrypt error)
//     res.status(500).json({ error: err.message });
//   }
// };
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import dotenv from 'dotenv';
import db from '../config/db.js';
dotenv.config();


if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    console.log('Received registration request:', { name, email, password });

    // Create the user in the database (store plain-text password)
    const [result] = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [name, email, password] // Store plain-text password
    );
    const userId = result.insertId;
    console.log('User created with ID:', userId);

    // Return success response
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: err.message });
  }
};

// Helper function to check if password is hashed
const isPasswordHashed = (password) => {
  // bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$ followed by cost and salt
  // bcrypt hashes are typically 60 characters long
  const hasValidPrefix = password.startsWith('$2a$') || password.startsWith('$2b$') || 
                        password.startsWith('$2x$') || password.startsWith('$2y$');
  const hasValidLength = password.length === 60;
  
  return hasValidPrefix && hasValidLength;
};

// Helper function to verify password (handles both hashed and plain-text)
const verifyPassword = async (inputPassword, storedPassword) => {
  if (isPasswordHashed(storedPassword)) {
    // Password is hashed, use bcrypt to compare
    return await bcrypt.compare(inputPassword, storedPassword);
  } else {
    // Password is plain-text, do direct comparison
    return inputPassword === storedPassword;
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find the user with matching password and super_admin role
    let validUser = null;
    for (const user of users) {
      const isPasswordValid = await verifyPassword(password, user.password);
      if (isPasswordValid && user.role === 'super_admin') {
        validUser = user;
        break;
      }
    }

    if (!validUser) {
      // Check if any user exists with this email but wrong password or role
      const userExists = users.some(user => user.email === email);
      if (userExists) {
        // Check if user exists but doesn't have super_admin role
        for (const user of users) {
          const isPasswordValid = await verifyPassword(password, user.password);
          if (isPasswordValid && user.role !== 'super_admin') {
            return res.status(403).json({ error: 'User is not a super admin and does not have access to login' });
          }
        }
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: validUser.id },  // Omit email if not needed
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Login successful
    res.status(200).json({ message: 'Login successful', user: validUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};