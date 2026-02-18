import fs from 'fs';
import path from 'path';

/**
 * Get buffer from uploaded file (supports express-fileupload)
 */
export function getUploadedFileBuffer(file) {
  if (!file) return null;
  if (file.data && file.data.length) return file.data;
  if (file.tempFilePath) {
    return fs.readFileSync(file.tempFilePath);
  }
  return null;
}

/**
 * Infer file extension from file name or mimetype
 * Supports both file objects and string paths
 */
export function inferExtension(file) {
  // If file is a string (path), extract extension
  if (typeof file === "string") {
    const ext = path.extname(file);
    if (ext) return ext;
    return "";
  }
  
  // If file is an object with name property
  const ext = path.extname(file?.name || "");
  if (ext) return ext;
  const mt = String(file?.mimetype || "").toLowerCase();
  if (mt === "image/jpeg" || mt === "image/jpg") return ".jpg";
  if (mt === "image/png") return ".png";
  if (mt === "image/gif") return ".gif";
  if (mt === "image/webp") return ".webp";
  if (mt === "image/bmp") return ".bmp";
  if (mt === "application/pdf") return ".pdf";
  return "";
}
