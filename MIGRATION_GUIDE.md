# Company Logo Migration to Cloudflare R2

This guide explains how to migrate existing company logos from local storage to Cloudflare R2.

## Overview

The system has been updated to store company logos in Cloudflare R2 instead of local disk storage. The new storage structure is:

- **Active logos**: `company_logo/{company_name}_{company_id}/logo_pic.{ext}`
- **Trash/old logos**: `company_logo/trash/{company_name}_{company_id}/logo_pic.{ext}`

## Prerequisites

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** in your `.env` file:
   ```env
   CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
   CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
   CLOUDFLARE_R2_REGION=auto
   CLOUDFLARE_R2_SIGNED_URL_EXPIRY_SECONDS=604800
   CLOUDFLARE_R2_UPLOAD_PREFIX=company_logo
   ```

## Migration Steps

### 1. Run the Migration Script

The migration script will:
- Find all companies with local logo files
- Upload them to R2 with the new path structure
- Update the database with the new R2 paths
- Skip companies that already have logos in R2

```bash
node server/scripts/migrateLogosToR2.js
```

### 2. Verify Migration

After running the migration, check:
- All companies have their logos accessible via signed URLs
- The database `logo` field contains paths starting with `company_logo/`
- Old local files can be safely deleted (optional)

### 3. Update Frontend (if needed)

The frontend should now use the `logoUrl` field from the API response, or call the logo URL endpoint:
- `GET /api/logo/:companyId/url` - Returns signed URL for company logo

## API Changes

### Logo Upload
- **Endpoint**: `POST /api/logo`
- **Body**: `multipart/form-data` with:
  - `file`: The logo image file
  - `companyId`: The company ID
- **Response**: Returns `filePath` (R2 key) and `fileUrl` (signed URL)

### Get Logo URL
- **Endpoint**: `GET /api/logo/:companyId/url`
- **Response**: Returns signed URL for the company logo

### Company Data
- When fetching company data via `GET /api/companies/:id`, the response now includes:
  - `logo`: R2 path (e.g., `company_logo/acme-corp_123/logo_pic.jpg`)
  - `logoUrl`: Signed URL for immediate use (cached for 30 minutes)

## Features

1. **Trash System**: Old logos are automatically moved to trash before new uploads
2. **No Direct Deletes**: All deletions move files to trash, never permanently delete
3. **Signed URLs**: Secure, time-limited URLs for logo access
4. **Caching**: Logo URLs are cached for 30 minutes to reduce R2 API calls
5. **Backward Compatibility**: Local file paths are still supported during migration

## Troubleshooting

### Migration fails with "Company not found"
- Ensure the database connection is working
- Check that companies table exists and has data

### Migration fails with "File not found"
- Verify local logo files exist at the expected paths
- Check file permissions

### R2 upload fails
- Verify all R2 environment variables are set correctly
- Check R2 bucket permissions and access keys
- Ensure the bucket exists and is accessible

### Signed URLs not working
- Check R2 endpoint URL is correct
- Verify signed URL expiry time is reasonable (default: 7 days)
- Check network connectivity to R2

## Notes

- The migration script does NOT delete local files by default
- You can manually delete local logo files after verifying migration success
- Old local file paths in the database will be automatically migrated on next logo upload
- Logo URLs are cached for 30 minutes to improve performance
