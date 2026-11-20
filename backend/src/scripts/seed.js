import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Wedding } from '../models/Wedding.js';
import { Admin } from '../models/Admin.js';
import { connectDatabase } from '../config/db.js';

// Parse command line arguments if provided: --email, --password, --slug, --bride, --groom
const args = process.argv.slice(2);
const getArg = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
};

export async function runSeed() {
  console.log('👑 Checking Royal Wedding Memories Database Setup & Seed...');

  if (mongoose.connection.readyState !== 1) {
    await connectDatabase();
  }

  const adminEmail = (getArg('--email') || process.env.INITIAL_ADMIN_EMAIL || 'admin@royalwedding.com').toLowerCase();
  const brideName = getArg('--bride') || 'Khushbu';
  const groomName = getArg('--groom') || 'Abhay';
  const uploadSlug = (getArg('--slug') || 'khushbu-abhay').toLowerCase();
  
  const initialPassword = getArg('--password') || process.env.INITIAL_ADMIN_PASSWORD || 'RoyalAdmin2026!';

  let wedding = await Wedding.findOne({ uploadSlug });
  if (!wedding) {
    wedding = await Wedding.create({
      brideName,
      groomName,
      weddingDate: new Date('2026-11-24T18:00:00Z'),
      uploadSlug,
      uploadEnabled: true,
      storageLimit: 5368709120, // Exactly 5 GiB
      welcomeMessage: 'Welcome to the royal celebration of Khushbu & Abhay! Thank you for gracing our union on 24-25 November 2026. Please upload your memorable photos and video blessings here.'
    });
    console.log(`✨ Created Wedding: "${brideName} & ${groomName}" with slug: "${uploadSlug}"`);
  } else {
    // Keep updated with new details
    wedding.brideName = brideName;
    wedding.groomName = groomName;
    wedding.weddingDate = new Date('2026-11-24T18:00:00Z');
    wedding.welcomeMessage = 'Welcome to the royal celebration of Khushbu & Abhay! Thank you for gracing our union on 24-25 November 2026. Please upload your memorable photos and video blessings here.';
    if (wedding.minPhotoBytes === undefined) wedding.minPhotoBytes = 10 * 1024;
    if (wedding.maxPhotoBytes === undefined) wedding.maxPhotoBytes = 15 * 1024 * 1024;
    if (wedding.minVideoBytes === undefined) wedding.minVideoBytes = 50 * 1024;
    if (wedding.maxVideoBytes === undefined) wedding.maxVideoBytes = 30 * 1024 * 1024;
    await wedding.save();
    console.log(`ℹ️ Updated Wedding details for "${uploadSlug}"`);
  }

  let admin = await Admin.findOne({ email: adminEmail });
  if (!admin) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(initialPassword, salt);

    admin = await Admin.create({
      email: adminEmail,
      passwordHash,
      weddingId: wedding._id,
      role: 'admin'
    });

    console.log('\n======================================================');
    console.log('🎉 ROYAL WEDDING ADMIN ACCOUNT CREATED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`Wedding:        ${wedding.brideName} & ${wedding.groomName}`);
    console.log(`Slug:           ${wedding.uploadSlug}`);
    console.log(`Admin Email:    ${adminEmail}`);
    console.log(`Admin Password: ${initialPassword}`);
    console.log('⚠️  Store these credentials securely. You can update this password in the Admin Settings.');
    console.log('======================================================\n');
  } else {
    admin.weddingId = wedding._id;
    await admin.save();
    console.log(`ℹ️ Synchronized Admin account for ${adminEmail} to wedding "${uploadSlug}" (${wedding._id}).`);
  }

  console.log('✨ Setup complete.');
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed().then(() => process.exit(0)).catch((err) => {
    console.error('❌ Error during setup:', err);
    process.exit(1);
  });
}
