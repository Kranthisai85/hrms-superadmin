# Company Logo R2 Storage Implementation Summary

## ✅ Implementation Complete

Full replication of the hrms-backend R2 storage system has been implemented for company logos in hrms-superadmin.

## 📁 Files Created/Modified

### New Files
1. **`server/services/cloudflareR2Service.js`**
   - R2 service with ESM syntax
   - Functions: `uploadBufferToR2`, `getSignedUrlForPath`, `moveFileToR2Trash`, etc.
   - Path structure: `company_logo/{company_name}_{company_id}/logo_pic.{ext}`

2. **`server/utils/fileUtils.js`**
   - Utility functions: `getUploadedFileBuffer`, `inferExtension`
   - Supports both file objects and string paths

3. **`server/scripts/migrateLogosToR2.js`**
   - Migration script to move existing local logos to R2
   - Handles both absolute and relative paths
   - Skips already migrated logos

4. **`MIGRATION_GUIDE.md`**
   - Complete migration instructions

### Modified Files
1. **`package.json`**
   - Added: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `express-fileupload`

2. **`server/index.js`**
   - Replaced `multer` with `express-fileupload`
   - Configured with `useTempFiles: true`
   - 10MB file size limit

3. **`server/routes/logo.js`**
   - Removed multer configuration
   - Added GET route for logo URLs: `GET /api/logo/:companyId/url`

4. **`server/controllers/logoController.js`**
   - Complete rewrite to use R2
   - Checks for existing logo before upload
   - Moves old logos to trash
   - Generates signed URLs
   - Caches logo URLs

5. **`server/controllers/companyController.js`**
   - Updated `getCompanyById` to cache logo URLs
   - Adds `logoUrl` field to response when logo is in R2
   - Caches signed URLs separately for 30 minutes

## 🔑 Key Features

### 1. Storage Path Structure
- **Active**: `company_logo/{company_name}_{company_id}/logo_pic.{ext}`
- **Trash**: `company_logo/trash/{company_name}_{company_id}/logo_pic.{ext}`

### 2. Trash System
- ✅ No direct deletes - all deletions move to trash
- ✅ Old logos automatically moved to trash before new upload
- ✅ Prevents accidental data loss

### 3. Logo Upload Flow
1. Validate file type and size
2. Check for existing logo
3. Move existing logo to trash (if in R2)
4. Upload new logo to R2
5. Update database with R2 path
6. Generate and return signed URL
7. Clear cache

### 4. Caching
- Logo URLs cached for 30 minutes
- Cache key: `company_logo:{companyId}`
- Company data also cached with logo URL included

### 5. Signed URLs
- Secure, time-limited URLs (default: 7 days)
- Generated on-demand
- Cached to reduce R2 API calls

## 🔧 Environment Variables Required

```env
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_REGION=auto
CLOUDFLARE_R2_SIGNED_URL_EXPIRY_SECONDS=604800
CLOUDFLARE_R2_UPLOAD_PREFIX=company_logo
```

## 📡 API Endpoints

### Upload Logo
```
POST /api/logo
Content-Type: multipart/form-data
Body:
  - file: <image file>
  - companyId: <company ID>
Response:
  {
    success: true,
    filePath: "company_logo/acme-corp_123/logo_pic.jpg",
    fileUrl: "https://signed-url..."
  }
```

### Get Logo URL
```
GET /api/logo/:companyId/url
Response:
  {
    success: true,
    url: "https://signed-url..."
  }
```

### Get Company (includes logoUrl)
```
GET /api/companies/:id
Response:
  {
    id: 123,
    name: "Acme Corp",
    logo: "company_logo/acme-corp_123/logo_pic.jpg",
    logoUrl: "https://signed-url...",  // Added if logo is in R2
    ...
  }
```

## 🚀 Next Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** in `.env` file

3. **Run migration script** (if you have existing local logos):
   ```bash
   node server/scripts/migrateLogosToR2.js
   ```

4. **Test the implementation**:
   - Upload a new logo
   - Verify it's stored in R2
   - Check that signed URLs work
   - Verify caching works

## 🔍 Differences from hrms-backend

1. **Path Structure**: Uses `company_logo` prefix instead of multiple prefixes
2. **Naming**: Uses `logo_pic` as filename instead of employee codes
3. **Company-based**: Organized by company name and ID instead of employee
4. **Simplified**: Single upload type (logos only) vs multiple document types

## ⚠️ Important Notes

- Old local logo files are NOT automatically deleted during migration
- You can manually delete them after verifying migration success
- The system supports both R2 paths and local paths during transition
- Logo URLs expire after 7 days (configurable via env var)
- Cache TTL is 30 minutes for logo URLs

## 🐛 Troubleshooting

### "CLOUDFLARE_R2_* env vars are required"
- Ensure all R2 environment variables are set in `.env`

### "Failed to check/copy existing R2 object"
- Check R2 bucket permissions
- Verify access keys are correct

### Migration script fails
- Check database connection
- Verify local logo files exist
- Check file permissions

### Signed URLs not working
- Verify R2 endpoint URL is correct
- Check network connectivity
- Ensure bucket is accessible
