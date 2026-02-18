import db from "../config/db.js";
import {
  uploadBufferToR2,
  buildCompanyLogoActiveKey,
  buildCompanyLogoTrashKey,
  getSignedUrlForPath,
} from "../services/cloudflareR2Service.js";
import { getUploadedFileBuffer, inferExtension } from "../utils/fileUtils.js";

/**
 * Upload company logo to R2
 * POST /api/logo
 * Body: multipart/form-data with 'file' field and 'companyId' field
 */
export const uploadLogo = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const logoFile = req.files.file;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
    ];

    if (!allowedTypes.includes(logoFile.mimetype)) {
      return res.status(400).json({
        success: false,
        error: "Only image files (JPG, PNG, GIF, BMP, WebP) are allowed",
      });
    }

    // Check file size (10MB limit)
    if (logoFile.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: "File size should not exceed 10MB",
      });
    }

    // Get buffer from uploaded file
    const buffer = getUploadedFileBuffer(logoFile);
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Uploaded file has no content",
      });
    }

    // Infer file extension
    const ext = inferExtension(logoFile);

    let destination;
    let signedUrl;

    // If companyId is provided, use proper R2 path structure
    if (companyId) {
      // Get company information
      const [companies] = await db.query(
        "SELECT id, name, logo FROM companies WHERE id = ?",
        [companyId]
      );

      if (companies.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Company not found",
        });
      }

      const company = companies[0];
      const companyName = company.name;
      const existingLogoPath = company.logo;

      // Build R2 keys
      const activeKey = buildCompanyLogoActiveKey(companyName, companyId, ext);
      const trashKey = buildCompanyLogoTrashKey(companyName, companyId, ext);

      // If existing logo exists, move it to trash before uploading new one
      if (existingLogoPath && existingLogoPath.trim() !== "") {
        try {
          // Check if existing logo is already in R2 (starts with company_logo/)
          if (existingLogoPath.startsWith("company_logo/")) {
            // Already in R2, move it to trash
            const { moveFileToR2Trash } = await import("../services/cloudflareR2Service.js");
            await moveFileToR2Trash(existingLogoPath, companyName, companyId);
          }
          // If it's a local file path, we'll handle it during migration
          // For now, just proceed with upload
        } catch (err) {
          console.error("Error moving existing logo to trash:", err);
          // Continue with upload even if trash move fails
        }
      }

      // Upload to R2 with proper path structure
      const uploadResult = await uploadBufferToR2(
        buffer,
        logoFile.name,
        logoFile.mimetype,
        {
          activeKey,
          trashKey,
        }
      );
      destination = uploadResult.destination;

      // Update company logo path in database
      await db.query("UPDATE companies SET logo = ? WHERE id = ?", [
        destination,
        companyId,
      ]);

      // Generate signed URL for immediate use
      signedUrl = await getSignedUrlForPath(destination);

      // Clear company cache if it exists
      try {
        if (typeof global.cacheService !== "undefined" && global.cacheService?.del) {
          global.cacheService.del(`companies:${companyId}`);
          global.cacheService.del(`company_logo:${companyId}`);
        }
      } catch (cacheErr) {
        console.log("Error clearing cache:", cacheErr.message);
      }
    } else {
      // For new companies (no companyId yet), upload to temporary location
      // This will be moved to proper location after company creation
      const timestamp = Date.now();
      const tempKey = `company_logo/temp/${timestamp}_${logoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}${ext}`;
      
      const uploadResult = await uploadBufferToR2(
        buffer,
        logoFile.name,
        logoFile.mimetype,
        {
          activeKey: tempKey,
        }
      );
      destination = uploadResult.destination;
      signedUrl = await getSignedUrlForPath(destination);
    }

    res.json({
      success: true,
      message: "Logo uploaded successfully",
      filePath: destination,
      fileUrl: signedUrl,
    });
  } catch (err) {
    console.error("Logo upload error:", err);
    
    // Check if it's an R2 configuration error
    if (err.message && err.message.includes("CLOUDFLARE_R2")) {
      return res.status(500).json({
        success: false,
        error: "R2 storage is not configured. Please set CLOUDFLARE_R2_* environment variables.",
      });
    }
    
    res.status(500).json({
      success: false,
      error: err.message || "Error uploading logo",
    });
  }
};

/**
 * Get signed URL for company logo
 * GET /api/logo/:companyId/url
 */
export const getLogoUrl = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Get company logo path
    const [companies] = await db.query(
      "SELECT logo FROM companies WHERE id = ?",
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
      });
    }

    const logoPath = companies[0].logo;

    if (!logoPath || logoPath.trim() === "") {
      return res.status(404).json({
        success: false,
        error: "Company has no logo",
      });
    }

    // If logo is in R2, generate signed URL
    if (logoPath.startsWith("company_logo/")) {
      const signedUrl = await getSignedUrlForPath(logoPath);
      
      // Cache the signed URL
      try {
        if (typeof global.cacheService !== "undefined" && global.cacheService?.set) {
          global.cacheService.set(`company_logo:${companyId}`, signedUrl, 1800); // 30 minutes
        }
      } catch (cacheErr) {
        console.log("Error caching logo URL:", cacheErr.message);
      }

      return res.json({
        success: true,
        url: signedUrl,
      });
    }

    // If it's a local file path, return it as-is (for backward compatibility during migration)
    return res.json({
      success: true,
      url: logoPath.startsWith("http") ? logoPath : `${req.protocol}://${req.get("host")}${logoPath}`,
    });
  } catch (err) {
    console.error("Error getting logo URL:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Error getting logo URL",
    });
  }
};
