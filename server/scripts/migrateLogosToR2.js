import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';
import {
  uploadBufferToR2,
  buildCompanyLogoActiveKey,
  buildCompanyLogoTrashKey,
} from '../services/cloudflareR2Service.js';
import { inferExtension } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

/**
 * Migration script to move existing local logos to Cloudflare R2
 * 
 * This script:
 * 1. Finds all companies with local logo paths (starting with /uploads/)
 * 2. Reads the local logo files
 * 3. Uploads them to R2 with the new path structure
 * 4. Updates the database with the new R2 path
 * 5. Optionally keeps or deletes local files
 */
async function migrateLogosToR2() {
  try {
    console.log('🚀 Starting logo migration to R2...\n');

    // Get all companies with logos
    const [companies] = await db.query(
      "SELECT id, name, logo FROM companies WHERE logo IS NOT NULL AND logo != ''"
    );

    console.log(`Found ${companies.length} companies with logos\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const company of companies) {
      const { id, name, logo } = company;

      // Skip if already in R2
      if (logo && logo.startsWith('company_logo/')) {
        console.log(`⏭️  Skipping company ${id} (${name}) - already in R2`);
        skipped++;
        continue;
      }

      // Skip if logo path is a URL
      if (logo && (logo.startsWith('http://') || logo.startsWith('https://'))) {
        console.log(`⏭️  Skipping company ${id} (${name}) - logo is a URL`);
        skipped++;
        continue;
      }

      try {
        // Determine local file path
        let localFilePath = logo;
        
        // If logo path is relative (starts with /uploads/), make it absolute
        if (logo && logo.startsWith('/uploads/')) {
          localFilePath = path.join(process.cwd(), logo);
        } else if (logo && !path.isAbsolute(logo)) {
          // Relative path, try to resolve
          localFilePath = path.join(process.cwd(), 'uploads', 'logos', path.basename(logo));
        }

        // Check if file exists
        if (!fs.existsSync(localFilePath)) {
          console.log(`⚠️  Company ${id} (${name}) - logo file not found: ${localFilePath}`);
          errors++;
          continue;
        }

        // Read file
        const buffer = fs.readFileSync(localFilePath);
        
        if (!buffer || buffer.length === 0) {
          console.log(`⚠️  Company ${id} (${name}) - logo file is empty`);
          errors++;
          continue;
        }

        // Determine file extension
        const ext = path.extname(localFilePath) || inferExtension({ name: localFilePath });
        
        // Determine mimetype from extension
        let mimetype = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') mimetype = 'image/jpeg';
        else if (ext === '.png') mimetype = 'image/png';
        else if (ext === '.gif') mimetype = 'image/gif';
        else if (ext === '.webp') mimetype = 'image/webp';
        else if (ext === '.bmp') mimetype = 'image/bmp';

        // Build R2 keys
        const activeKey = buildCompanyLogoActiveKey(name, id, ext);
        const trashKey = buildCompanyLogoTrashKey(name, id, ext);

        // Upload to R2
        console.log(`📤 Uploading logo for company ${id} (${name})...`);
        const { destination } = await uploadBufferToR2(
          buffer,
          `logo${ext}`,
          mimetype,
          {
            activeKey,
            trashKey,
          }
        );

        // Update database
        await db.query("UPDATE companies SET logo = ? WHERE id = ?", [
          destination,
          id,
        ]);

        console.log(`✅ Migrated company ${id} (${name}) - ${destination}`);

        // Optionally delete local file (uncomment if you want to remove local files after migration)
        // fs.unlinkSync(localFilePath);
        // console.log(`🗑️  Deleted local file: ${localFilePath}`);

        migrated++;
      } catch (err) {
        console.error(`❌ Error migrating company ${id} (${name}):`, err.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('\n✨ Migration completed!');

    process.exit(0);
  } catch (err) {
    console.error('💥 Fatal error during migration:', err);
    process.exit(1);
  }
}

// Run migration
migrateLogosToR2();
