import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localStorageDir = path.resolve(__dirname, '../../../storage/uploads');

let s3ClientInstance = null;
let cloudinaryConfigured = false;

// Check if Cloudinary credentials are provided
export const isCloudinaryConfigured = () => {
  return Boolean(
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET) ||
      process.env.CLOUDINARY_URL
  );
};

// Check if Cloudflare R2 is configured
export const isR2Configured = () => {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      !process.env.R2_ACCOUNT_ID.includes('placeholder')
  );
};

// Initialize Storage Provider
export const getR2Client = () => {
  if (isCloudinaryConfigured()) {
    if (!cloudinaryConfigured) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
      cloudinaryConfigured = true;
      console.log('☁️ Connected to Cloudinary Media Storage.');
    }
    return cloudinary;
  }

  if (isR2Configured()) {
    if (!s3ClientInstance) {
      s3ClientInstance = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        }
      });
      console.log('☁️ Connected to Cloudflare R2 Storage.');
    }
    return s3ClientInstance;
  }

  console.log('📁 Cloudinary/R2 credentials not set. Falling back to local private secure storage adapter.');
  if (!fs.existsSync(localStorageDir)) {
    fs.mkdirSync(localStorageDir, { recursive: true });
  }
  return null;
};

/**
 * Upload object to Cloudinary, R2, or Local Storage
 */
export const uploadObject = async ({ key, buffer, contentType, metadata = {} }) => {
  // 1. Cloudinary Integration
  if (isCloudinaryConfigured()) {
    getR2Client();
    const isVideo = contentType.startsWith('video/') || key.endsWith('.mp4') || key.endsWith('.webm');
    const cleanKey = key.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'royal_wedding_memories',
          public_id: cleanKey,
          resource_type: isVideo ? 'video' : 'image',
          context: metadata
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve({
            key,
            url: result.secure_url,
            publicId: result.public_id,
            size: buffer.length
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // 2. Cloudflare R2 Integration
  if (isR2Configured()) {
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata
    });
    await client.send(command);
    return { key, size: buffer.length };
  }

  // 3. Local Secure Storage Fallback
  const filePath = path.join(localStorageDir, key.replace(/\//g, '_'));
  await fs.promises.writeFile(filePath, buffer);
  return { key, size: buffer.length, localPath: filePath };
};

/**
 * Get readable stream / redirect URL of object from Storage
 */
export const getObjectStream = async (key) => {
  // 1. Cloudinary
  if (isCloudinaryConfigured()) {
    getR2Client();
    const isVideo = key.includes('/videos/') || key.endsWith('.mp4') || key.endsWith('.webm');
    const extMatch = key.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : (isVideo ? 'mp4' : 'jpg');
    const cleanKey = key.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedPublicId = `royal_wedding_memories/${cleanKey}`;

    const url = cloudinary.url(sanitizedPublicId, {
      resource_type: isVideo ? 'video' : 'image',
      format: ext,
      secure: true
    });

    return {
      redirectUrl: url,
      contentType: isVideo ? 'video/mp4' : `image/${ext === 'jpg' ? 'jpeg' : ext}`
    };
  }

  // 2. Cloudflare R2
  if (isR2Configured()) {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key
    });
    const response = await client.send(command);
    return {
      stream: response.Body,
      contentType: response.ContentType,
      contentLength: response.ContentLength
    };
  }

  // 3. Local Storage
  const filePath = path.join(localStorageDir, key.replace(/\//g, '_'));
  if (!fs.existsSync(filePath)) {
    throw new Error('Object not found in storage');
  }
  const stat = await fs.promises.stat(filePath);
  const stream = fs.createReadStream(filePath);
  return {
    stream,
    contentLength: stat.size,
    contentType: 'application/octet-stream'
  };
};

/**
 * Delete object from Storage
 */
export const deleteObject = async (key) => {
  if (isCloudinaryConfigured()) {
    getR2Client();
    const isVideo = key.includes('/videos/') || key.endsWith('.mp4') || key.endsWith('.webm');
    const cleanKey = key.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedPublicId = `royal_wedding_memories/${cleanKey}`;
    try {
      await cloudinary.uploader.destroy(sanitizedPublicId, {
        resource_type: isVideo ? 'video' : 'image'
      });
    } catch (err) {
      console.warn('Cloudinary delete warning:', err.message);
    }
    return;
  }

  if (isR2Configured()) {
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key
    });
    await client.send(command);
    return;
  }

  const filePath = path.join(localStorageDir, key.replace(/\//g, '_'));
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
};

/**
 * Generate short-lived presigned download URL
 */
export const generatePresignedDownloadUrl = async (key, expiresInSeconds = 900) => {
  if (isCloudinaryConfigured()) {
    const isVideo = key.includes('/videos/') || key.endsWith('.mp4') || key.endsWith('.webm');
    const extMatch = key.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : (isVideo ? 'mp4' : 'jpg');
    const cleanKey = key.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedPublicId = `royal_wedding_memories/${cleanKey}`;
    return cloudinary.url(sanitizedPublicId, {
      resource_type: isVideo ? 'video' : 'image',
      format: ext,
      secure: true,
      flags: 'attachment'
    });
  }

  if (isR2Configured()) {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  return null;
};
