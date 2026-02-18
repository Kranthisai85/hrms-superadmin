import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const uploadPrefix = (process.env.CLOUDFLARE_R2_UPLOAD_PREFIX || "company_logo").replace(/\/$/, "");
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const region = process.env.CLOUDFLARE_R2_REGION || "auto";
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

const SIGV4_MAX_PRESIGN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 604800 (AWS SigV4 limit)
const configuredExpirySeconds = parseInt(
  process.env.CLOUDFLARE_R2_SIGNED_URL_EXPIRY_SECONDS || "604800",
  10
);
const signedUrlExpirySeconds = Number.isFinite(configuredExpirySeconds)
  ? Math.min(Math.max(configuredExpirySeconds, 1), SIGV4_MAX_PRESIGN_EXPIRY_SECONDS)
  : SIGV4_MAX_PRESIGN_EXPIRY_SECONDS;

// Don't throw error at module load - check at runtime instead
// This allows the server to start even if R2 is not configured (for development)
function validateR2Config() {
  if (!bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY env vars are required");
  }
}

// Initialize S3 client only if config is available (lazy initialization)
let s3Client = null;
function getS3Client() {
  validateR2Config();
  if (!s3Client) {
    s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

/**
 * Sanitize company name and ID for use in path
 */
function sanitizeCompanyPathSegment(value) {
  return String(value || "")
    .replace(/[\\/]/g, "-")
    .replace(/[\r\n]/g, " ")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .trim();
}

/**
 * Build active key for company logo
 * Format: company_logo/{company_name}_{company_id}/logo_pic.{ext}
 */
function buildCompanyLogoActiveKey(companyName, companyId, ext) {
  const safeName = sanitizeCompanyPathSegment(companyName);
  const safeId = sanitizeCompanyPathSegment(String(companyId));
  return `${uploadPrefix}/${safeName}_${safeId}/logo_pic${ext}`;
}

/**
 * Build trash key for company logo
 * Format: company_logo/trash/{company_name}_{company_id}/logo_pic.{ext}
 */
function buildCompanyLogoTrashKey(companyName, companyId, ext) {
  const safeName = sanitizeCompanyPathSegment(companyName);
  const safeId = sanitizeCompanyPathSegment(String(companyId));
  return `${uploadPrefix}/trash/${safeName}_${safeId}/logo_pic${ext}`;
}

/**
 * Upload buffer to R2 with trash handling
 */
async function uploadBufferToR2(buffer, originalName, mimetype, keyOptions = {}) {
  // Validate R2 config before attempting upload
  validateR2Config();
  
  const {
    activeKey: explicitActiveKey,
    trashKey: explicitTrashKey,
  } = keyOptions || {};

  let objectKey = explicitActiveKey;

  if (!objectKey) {
    throw new Error("activeKey is required for company logo upload");
  }

  // If explicitTrashKey is provided, move existing file to trash before upload
  if (explicitTrashKey) {
    try {
      await getS3Client().send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        })
      );

      // File exists, move to trash
      await getS3Client().send(
        new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${objectKey}`,
          Key: explicitTrashKey,
        })
      );

      await getS3Client().send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        })
      );
    } catch (err) {
      // If the object does not exist yet (404), just ignore. Log other errors.
      if (err && err.$metadata && err.$metadata.httpStatusCode !== 404) {
        console.error("Failed to check/copy existing R2 object before overwrite", err.message || err);
      }
    }
  }

  // Upload the new file
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: mimetype,
      CacheControl: "no-store",
    })
  );

  const signedUrl = await getSignedUrlForPath(objectKey);

  return { publicUrl: signedUrl, destination: objectKey };
}

/**
 * Extract object key from file path (handles URLs and paths)
 */
function extractObjectKeyFromPath(filePath) {
  if (!filePath) return null;

  let objectKey = filePath;

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    const url = new URL(filePath);
    objectKey = url.pathname.replace(/^\/+/, "");

    if (objectKey.startsWith(`${bucketName}/`)) {
      objectKey = objectKey.substring(bucketName.length + 1);
    }
  }

  return objectKey || null;
}

/**
 * Delete file from R2 (moves to trash instead of direct delete)
 */
async function moveFileToR2Trash(filePath, companyName, companyId) {
  validateR2Config();
  if (!filePath) return;

  try {
    const objectKey = extractObjectKeyFromPath(filePath);
    if (!objectKey) return;

    // Extract extension from existing path
    const dotIndex = objectKey.lastIndexOf(".");
    const ext = dotIndex !== -1 ? objectKey.substring(dotIndex) : "";

    // Build trash key
    const trashKey = buildCompanyLogoTrashKey(companyName, companyId, ext);

    // Copy to trash
    await getS3Client().send(
      new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${objectKey}`,
        Key: trashKey,
      })
    );

    // Delete from active location
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
    );

    return { from: objectKey, to: trashKey };
  } catch (err) {
    console.error("Failed to move R2 object to trash", filePath, err.message);
    throw err;
  }
}

/**
 * Get signed URL for viewing file
 */
async function getSignedUrlForPath(filePath) {
  validateR2Config();
  const objectKey = extractObjectKeyFromPath(filePath);
  if (!objectKey) {
    throw new Error("Invalid file path for signed URL generation");
  }

  const lowerKey = objectKey.toLowerCase();
  const responseContentType = lowerKey.endsWith(".pdf")
    ? "application/pdf"
    : lowerKey.endsWith(".png")
      ? "image/png"
      : lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")
        ? "image/jpeg"
        : lowerKey.endsWith(".webp")
          ? "image/webp"
          : lowerKey.endsWith(".gif")
            ? "image/gif"
            : undefined;

  const responseContentDisposition = lowerKey.endsWith(".pdf")
    ? "inline"
    : undefined;

  const signedUrl = await getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ResponseContentType: responseContentType,
      ResponseContentDisposition: responseContentDisposition,
      ResponseCacheControl: "no-store",
    }),
    { expiresIn: signedUrlExpirySeconds }
  );

  return signedUrl;
}

/**
 * Get signed download URL with filename
 */
async function getSignedDownloadUrlForPath(filePath, fileName) {
  const objectKey = extractObjectKeyFromPath(filePath);
  if (!objectKey) {
    throw new Error("Invalid file path for signed URL generation");
  }

  const lowerKey = objectKey.toLowerCase();
  const responseContentType = lowerKey.endsWith(".pdf")
    ? "application/pdf"
    : lowerKey.endsWith(".png")
      ? "image/png"
      : lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")
        ? "image/jpeg"
        : lowerKey.endsWith(".webp")
          ? "image/webp"
          : lowerKey.endsWith(".gif")
            ? "image/gif"
            : undefined;

  const safeName = (fileName || "logo")
    .toString()
    .replace(/[\r\n"]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  const responseContentDisposition = `attachment; filename="${safeName}"`;

  const signedUrl = await getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ResponseContentType: responseContentType,
      ResponseContentDisposition: responseContentDisposition,
      ResponseCacheControl: "no-store",
    }),
    { expiresIn: signedUrlExpirySeconds }
  );

  return signedUrl;
}

/**
 * Get file content as buffer (for proxy downloads)
 */
async function getFileContentFromR2(filePath) {
  validateR2Config();
  const objectKey = extractObjectKeyFromPath(filePath);
  if (!objectKey) {
    throw new Error("Invalid file path for content retrieval");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const response = await getS3Client().send(command);
  
  // Convert stream to buffer
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  
  // Determine content type from key
  const lowerKey = objectKey.toLowerCase();
  let contentType = 'application/octet-stream';
  if (lowerKey.endsWith(".png")) contentType = "image/png";
  else if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) contentType = "image/jpeg";
  else if (lowerKey.endsWith(".webp")) contentType = "image/webp";
  else if (lowerKey.endsWith(".gif")) contentType = "image/gif";
  else if (lowerKey.endsWith(".pdf")) contentType = "application/pdf";
  
  return { buffer, contentType };
}

export {
  uploadBufferToR2,
  moveFileToR2Trash,
  getSignedUrlForPath,
  getSignedDownloadUrlForPath,
  getFileContentFromR2,
  extractObjectKeyFromPath,
  buildCompanyLogoActiveKey,
  buildCompanyLogoTrashKey,
  uploadPrefix,
};
