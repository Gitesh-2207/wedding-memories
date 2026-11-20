import { fileTypeFromBuffer } from 'file-type';
import { ALLOWED_FILE_TYPES } from '../config/constants.js';

/**
 * Inspects binary buffer magic numbers / file signatures.
 * Never trusts client headers or file extensions.
 */
export const validateFileSignature = async (buffer, originalName, declaredMimeType) => {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      error: 'Empty file buffer received'
    };
  }

  // Detect genuine file type from buffer binary signature
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    return {
      isValid: false,
      error: 'Unable to verify file signature. File format is unrecognized or corrupted.'
    };
  }

  const { ext, mime } = detected;

  const isPhoto = ALLOWED_FILE_TYPES.PHOTO.mimeTypes.includes(mime);
  const isVideo = ALLOWED_FILE_TYPES.VIDEO.mimeTypes.includes(mime);

  if (!isPhoto && !isVideo) {
    return {
      isValid: false,
      error: `Disallowed file type detected: ${mime}. Only JPEG, PNG, WebP photos and MP4, WebM videos are permitted.`
    };
  }

  // Cross-verify with declared MIME type to detect spoofing
  if (declaredMimeType && declaredMimeType !== mime) {
    // Some browsers send image/x-png or audio/video aliases, but let's check safety
    if (
      !(declaredMimeType === 'image/jpg' && mime === 'image/jpeg') &&
      !(declaredMimeType === 'image/jpeg' && mime === 'image/jpeg')
    ) {
      console.warn(`MIME type mismatch: declared=${declaredMimeType}, signature=${mime}`);
    }
  }

  return {
    isValid: true,
    fileType: isPhoto ? 'photo' : 'video',
    detectedMime: mime,
    detectedExt: ext
  };
};
