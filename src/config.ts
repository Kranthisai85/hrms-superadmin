// src/config.ts

// Change this value to switch environments
export const API_BASE_URL = 'http://localhost:5000/api';
 // export const API_BASE_URL = 'https://sec.pacehrm.com/api';

export const LOGO_UPLOAD_URL = `${API_BASE_URL}/logo`;
export const EMAIL_SEND_URL = `${API_BASE_URL}/email/send`;
export const AUTH_URL = `${API_BASE_URL}/auth/login`; 