import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Lock,
  Sparkles
} from 'lucide-react';
import { uploadService } from '../services/uploadService';
import { RoyalCornerBorder, RoyalDivider } from '../components/RoyalOrnament';
import TurnstileWidget from '../components/TurnstileWidget';

const DEFAULT_MIN_PHOTO = 10 * 1024; // 10 KiB
const DEFAULT_MAX_PHOTO = 15 * 1024 * 1024; // 15 MiB
const DEFAULT_MIN_VIDEO = 50 * 1024; // 50 KiB
const DEFAULT_MAX_VIDEO = 30 * 1024 * 1024; // 30 MiB

function formatBytes(bytes) {
  if (bytes === undefined || bytes === null) return '';
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

export default function GuestUploadPage() {
  const { slug = 'khushbu-abhay' } = useParams();
  const navigate = useNavigate();

  const [wedding, setWedding] = useState(null);
  const [loadingWedding, setLoadingWedding] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // { [fileId]: number }
  const [uploadErrors, setUploadErrors] = useState({});

  useEffect(() => {
    async function fetchWedding() {
      try {
        const res = await uploadService.getWedding(slug);
        if (res.wedding) {
          setWedding(res.wedding);
        }
      } catch (err) {
        toast.error('Wedding not found. Using default celebration.');
        setWedding({
          brideName: 'Khushbu',
          groomName: 'Abhay',
          uploadEnabled: true,
          uploadSlug: slug
        });
      } finally {
        setLoadingWedding(false);
      }
    }
    fetchWedding();
  }, [slug]);

  const minPhotoBytes = wedding?.minPhotoBytes ?? DEFAULT_MIN_PHOTO;
  const maxPhotoBytes = wedding?.maxPhotoBytes ?? DEFAULT_MAX_PHOTO;
  const minVideoBytes = wedding?.minVideoBytes ?? DEFAULT_MIN_VIDEO;
  const maxVideoBytes = wedding?.maxVideoBytes ?? DEFAULT_MAX_VIDEO;

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      rejectedFiles.forEach((f) => {
        toast.error(`File "${f.file.name}" rejected: ${f.errors[0]?.message || 'Invalid format or size'}`);
      });
    }

    const newFiles = acceptedFiles.map((file) => {
      const isVideo = file.type.startsWith('video/');
      const minLimit = isVideo ? minVideoBytes : minPhotoBytes;
      const maxLimit = isVideo ? maxVideoBytes : maxPhotoBytes;

      if (file.size < minLimit) {
        toast.error(
          `"${file.name}" is too small (${Math.round(file.size / 1024)} KB). Minimum allowed is ${formatBytes(minLimit)}.`
        );
        return null;
      }

      if (file.size > maxLimit) {
        toast.error(
          `"${file.name}" exceeds the ${formatBytes(maxLimit)} maximum limit for ${isVideo ? 'video' : 'photo'}.`
        );
        return null;
      }

      return {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        preview: isVideo ? URL.createObjectURL(file) : URL.createObjectURL(file),
        isVideo,
        size: file.size,
        name: file.name
      };
    }).filter(Boolean);

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }, [minPhotoBytes, maxPhotoBytes, minVideoBytes, maxVideoBytes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm']
    },
    maxSize: Math.max(maxVideoBytes, maxPhotoBytes, 100 * 1024 * 1024)
  });

  const removeFile = (idToRemove) => {
    setSelectedFiles((prev) => {
      const filtered = prev.filter((item) => item.id !== idToRemove);
      const toRemove = prev.find((item) => item.id === idToRemove);
      if (toRemove?.preview) {
        URL.revokeObjectURL(toRemove.preview);
      }
      return filtered;
    });
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one photo or video to upload.');
      return;
    }

    if (!turnstileToken) {
      toast.error('Please click the guest verification box to verify before uploading.');
      return;
    }

    if (wedding && !wedding.uploadEnabled) {
      toast.error('Uploads are currently closed for this wedding.');
      return;
    }

    setIsUploading(true);
    setUploadErrors({});

    try {
      // Step 1: Create session & reserve storage atomically
      toast.loading('Reserving storage quota & validating security...', { id: 'uploadToast' });

      const sessionResponse = await uploadService.createSession({
        slug,
        turnstileToken: turnstileToken || 'dev_turnstile_pass_token',
        files: selectedFiles.map((f) => f.file)
      });

      const { reservations } = sessionResponse;

      if (!reservations || reservations.length !== selectedFiles.length) {
        throw new Error('Upload reservation mismatch from server');
      }

      toast.loading(`Uploading ${selectedFiles.length} memories securely...`, { id: 'uploadToast' });

      let successCount = 0;

      // Step 2: Upload each file with its designated reservation ID
      for (let i = 0; i < selectedFiles.length; i++) {
        const item = selectedFiles[i];
        const reservation = reservations[i];

        try {
          await uploadService.uploadFile({
            reservationId: reservation.reservationId,
            guestName: guestName.trim() || 'Royal Guest',
            caption: caption.trim(),
            file: item.file,
            onProgress: (percent) => {
              setUploadProgress((prev) => ({ ...prev, [item.id]: percent }));
            }
          });
          successCount++;
        } catch (fileErr) {
          console.error(`Failed to upload ${item.name}:`, fileErr);
          setUploadErrors((prev) => ({
            ...prev,
            [item.id]: fileErr.message || 'Upload failed'
          }));
        }
      }

      if (successCount === selectedFiles.length) {
        toast.success('All memories uploaded with honor!', { id: 'uploadToast' });
        navigate('/upload/success', {
          state: {
            count: successCount,
            brideName: wedding?.brideName,
            groomName: wedding?.groomName
          }
        });
      } else if (successCount > 0) {
        toast.success(`${successCount} out of ${selectedFiles.length} memories uploaded.`, { id: 'uploadToast' });
      } else {
        toast.error('Failed to upload files. Please check limits or retry.', { id: 'uploadToast' });
      }
    } catch (err) {
      console.error('Session or upload error:', err);
      toast.error(err.message || 'Failed to complete upload reservation.', { id: 'uploadToast' });
    } finally {
      setIsUploading(false);
    }
  };

  if (loadingWedding) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-maroon hover:text-maroon-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Wedding Welcome</span>
        </Link>
      </div>

      <RoyalCornerBorder className="py-8 px-6 sm:px-10">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-gold-dark font-medium mb-1">
            Guest Memory Portal
          </p>
          <h2 className="font-serif text-3xl font-bold text-maroon">
            Share Your Cherished Moments
          </h2>
          <p className="text-xs text-brown/70 mt-1">
            Celebrating {wedding?.brideName} &amp; {wedding?.groomName}
          </p>
        </div>

        <RoyalDivider className="max-w-xs mx-auto my-4" />

        <form onSubmit={handleUploadSubmit} className="space-y-6">
          {/* Guest Name & Caption */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brown mb-1">
                Your Name <span className="text-brown/50 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Uncle Rajesh, Priya &amp; Rohan"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={100}
                className="royal-input w-full text-sm"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brown mb-1">
                Warm Wishes / Caption <span className="text-brown/50 font-normal">(Optional)</span>
              </label>
              <textarea
                placeholder="Write a message, blessing, or describe the moment..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={1000}
                rows={2}
                className="royal-input w-full text-sm resize-none"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div>
            <label className="block text-xs font-semibold text-brown mb-1">
              Select Photos &amp; Videos
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-maroon bg-maroon/5 shadow-inner'
                  : 'border-gold/60 hover:border-gold bg-ivory/50 hover:bg-ivory'
              } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full bg-white border border-gold/40 shadow-sm text-maroon">
                  <UploadCloud className="w-8 h-8 text-gold-dark" />
                </div>
              </div>
              <p className="text-sm font-medium text-brown mb-1">
                {isDragActive
                  ? 'Drop photos &amp; videos here'
                  : 'Drag &amp; drop your memories here, or browse files'}
              </p>
              <p className="text-xs text-brown/60">
                Photos: <strong className="text-maroon">{formatBytes(minPhotoBytes)} – {formatBytes(maxPhotoBytes)}</strong> (JPEG, PNG, WebP) • Videos: <strong className="text-maroon">{formatBytes(minVideoBytes)} – {formatBytes(maxVideoBytes)}</strong> (MP4, WebM)
              </p>
            </div>
          </div>

          {/* Selected Files Previews */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-brown/70">
                <span>Selected Memories ({selectedFiles.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  disabled={isUploading}
                  className="text-maroon hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                {selectedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="relative rounded-xl border border-gold/40 bg-white p-2 shadow-sm flex flex-col justify-between group"
                  >
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        className="absolute -top-1.5 -right-1.5 bg-maroon text-white rounded-full p-1 shadow hover:bg-maroon-dark transition-colors z-10"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="w-full h-24 rounded-lg bg-ivory overflow-hidden flex items-center justify-center relative mb-2">
                      {item.isVideo ? (
                        <div className="flex flex-col items-center justify-center text-maroon">
                          <VideoIcon className="w-8 h-8 text-gold-dark" />
                          <span className="text-[10px] uppercase font-bold mt-1 text-gold-dark">Video</span>
                        </div>
                      ) : (
                        <img
                          src={item.preview}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="text-[11px] truncate text-brown font-medium" title={item.name}>
                      {item.name}
                    </div>
                    <div className="text-[10px] text-brown/60">
                      {(item.size / 1024 / 1024).toFixed(2)} MiB
                    </div>

                    {/* Progress Bar for File */}
                    {isUploading && (
                      <div className="mt-2">
                        <div className="w-full bg-ivory-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-maroon h-full transition-all duration-300"
                            style={{ width: `${uploadProgress[item.id] || 0}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-brown/60 block text-right mt-0.5">
                          {uploadProgress[item.id] ? `${uploadProgress[item.id]}%` : 'Waiting...'}
                        </span>
                      </div>
                    )}

                    {uploadErrors[item.id] && (
                      <div className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{uploadErrors[item.id]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cloudflare Turnstile Bot Protection */}
          <TurnstileWidget
            onVerify={(token) => setTurnstileToken(token)}
            onError={() => toast.error('Security challenge failed. Please refresh.')}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || selectedFiles.length === 0 || !turnstileToken}
            className={`w-full py-3.5 px-6 rounded-full font-medium text-white flex items-center justify-center gap-2 border border-gold transition-all duration-300 shadow-royal ${
              isUploading || selectedFiles.length === 0 || !turnstileToken
                ? 'bg-brown/40 cursor-not-allowed opacity-70'
                : 'bg-maroon hover:bg-maroon-dark hover:shadow-royal-lg cursor-pointer'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 text-gold animate-spin" />
                <span>Uploading to Royal Vault...</span>
              </>
            ) : !turnstileToken ? (
              <>
                <Lock className="w-5 h-5 text-gold" />
                <span>Click Verification Above to Enable Upload</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-gold" />
                <span>Submit {selectedFiles.length > 0 ? `${selectedFiles.length} Memories` : 'Upload'}</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-brown/60 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-gold-dark" />
            <span>Private upload. Memories will only be viewable by the wedding hosts.</span>
          </p>
        </form>
      </RoyalCornerBorder>
    </div>
  );
}
