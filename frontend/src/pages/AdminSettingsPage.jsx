import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Settings,
  QrCode,
  Download,
  Copy,
  Check,
  Save,
  HardDrive,
  Loader2,
  Calendar,
  Users,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  SlidersHorizontal,
  Image as ImageIcon,
  Video as VideoIcon
} from 'lucide-react';
import { adminService } from '../services/adminService';
import StorageProgressBar from '../components/StorageProgressBar';
import { RoyalCornerBorder, RoyalDivider } from '../components/RoyalOrnament';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Settings state
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [uploadEnabled, setUploadEnabled] = useState(true);

  // Upload size limits state (Controlled exclusively by Admin)
  const [minPhotoKB, setMinPhotoKB] = useState(10);
  const [maxPhotoMB, setMaxPhotoMB] = useState(15);
  const [minVideoKB, setMinVideoKB] = useState(50);
  const [maxVideoMB, setMaxVideoMB] = useState(30);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Storage and QR state
  const [storage, setStorage] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);

  const fetchSettingsAndQr = async () => {
    try {
      const [dashRes, qrRes, storageRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getQrCode(),
        adminService.getStorage()
      ]);

      if (dashRes.wedding) {
        setBrideName(dashRes.wedding.brideName || '');
        setGroomName(dashRes.wedding.groomName || '');
        setWeddingDate(
          dashRes.wedding.weddingDate ? new Date(dashRes.wedding.weddingDate).toISOString().split('T')[0] : ''
        );
        setWelcomeMessage(dashRes.wedding.welcomeMessage || '');
        setUploadEnabled(dashRes.wedding.uploadEnabled);
        if (dashRes.wedding.minPhotoBytes !== undefined) {
          setMinPhotoKB(Math.round(dashRes.wedding.minPhotoBytes / 1024));
        }
        if (dashRes.wedding.maxPhotoBytes !== undefined) {
          setMaxPhotoMB(Math.round(dashRes.wedding.maxPhotoBytes / (1024 * 1024)));
        }
        if (dashRes.wedding.minVideoBytes !== undefined) {
          setMinVideoKB(Math.round(dashRes.wedding.minVideoBytes / 1024));
        }
        if (dashRes.wedding.maxVideoBytes !== undefined) {
          setMaxVideoMB(Math.round(dashRes.wedding.maxVideoBytes / (1024 * 1024)));
        }
      }

      setQrCodeData(qrRes);
      setStorage(storageRes.storage);
    } catch (err) {
      toast.error('Failed to load settings data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndQr();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();

    const minP = Number(minPhotoKB);
    const maxP = Number(maxPhotoMB);
    const minV = Number(minVideoKB);
    const maxV = Number(maxVideoMB);

    if (minP < 0 || maxP <= 0) {
      toast.error('Photo size limits must be valid positive values.');
      return;
    }
    if ((minP * 1024) > (maxP * 1024 * 1024)) {
      toast.error('Minimum photo size cannot exceed maximum photo size.');
      return;
    }
    if (minV < 0 || maxV <= 0) {
      toast.error('Video size limits must be valid positive values.');
      return;
    }
    if ((minV * 1024) > (maxV * 1024 * 1024)) {
      toast.error('Minimum video size cannot exceed maximum video size.');
      return;
    }

    setSaving(true);

    try {
      await adminService.updateSettings({
        brideName,
        groomName,
        weddingDate,
        welcomeMessage,
        uploadEnabled,
        minPhotoBytes: minP * 1024,
        maxPhotoBytes: maxP * 1024 * 1024,
        minVideoBytes: minV * 1024,
        maxVideoBytes: maxV * 1024 * 1024
      });
      toast.success('Wedding settings and upload size limits updated successfully!');
      fetchSettingsAndQr();
    } catch (err) {
      toast.error(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setChangingPass(true);

    try {
      await adminService.changePassword(currentPassword, newPassword);
      toast.success('Admin password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password. Check current password.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleCopyLink = () => {
    if (!qrCodeData?.uploadUrl) return;
    navigator.clipboard.writeText(qrCodeData.uploadUrl);
    setCopied(true);
    toast.success('Upload URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
          Configuration &amp; Security
        </span>
        <h1 className="font-serif text-3xl font-bold text-maroon mt-1">
          Wedding Settings &amp; QR Code
        </h1>
        <p className="text-xs text-brown/70 mt-1">
          Manage celebration details, guest upload permissions, banquet QR codes, and administrator credentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings Form & Password Update */}
        <div className="lg:col-span-2 space-y-6">
          {/* Celebration Details */}
          <RoyalCornerBorder className="p-6 sm:p-8">
            <h2 className="font-serif text-xl font-bold text-maroon mb-1">
              Celebration Details
            </h2>
            <p className="text-xs text-brown/60 mb-6">
              Update the names, dates, and welcome messages displayed to your guests
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brown mb-1">
                    Bride's Name
                  </label>
                  <input
                    type="text"
                    required
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    className="royal-input w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown mb-1">
                    Groom's Name
                  </label>
                  <input
                    type="text"
                    required
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    className="royal-input w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brown mb-1">
                  Wedding Date
                </label>
                <input
                  type="date"
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="royal-input w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brown mb-1">
                  Welcome Message for Guests
                </label>
                <textarea
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="royal-input w-full text-sm resize-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadEnabled}
                    onChange={(e) => setUploadEnabled(e.target.checked)}
                    className="w-4 h-4 text-maroon rounded border-gold/60 focus:ring-maroon"
                  />
                  <div>
                    <span className="text-sm font-semibold text-brown block">
                      Enable Guest Uploads
                    </span>
                    <span className="text-xs text-brown/60 block">
                      When unchecked, guests visiting the upload page will see a notice that uploads are paused.
                    </span>
                  </div>
                </label>
              </div>

              {/* Media Upload Size Limits (Admin-Only Control) */}
              <div className="pt-5 border-t border-gold/25 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-gold-dark" />
                    <h3 className="font-serif text-base font-bold text-maroon">
                      Media Upload Size Controls (Admin Exclusive)
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-gold/20 text-maroon border border-gold/40">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-brown/70 leading-relaxed">
                  Set the minimum and maximum file size thresholds allowed for guest uploads. Prevents corrupted zero-byte files and ensures guest uploads stay well within your 5 GiB storage capacity.
                </p>

                {/* Photo Limits */}
                <div className="p-4 rounded-xl bg-ivory/70 border border-gold/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-maroon">
                    <ImageIcon className="w-4 h-4 text-gold-dark" />
                    <span>Photo Limits (JPEG, PNG, WebP)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-brown mb-1">
                        Minimum Photo Size (KB)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={10240}
                          value={minPhotoKB}
                          onChange={(e) => setMinPhotoKB(e.target.value)}
                          className="royal-input w-full pr-12 text-sm"
                          placeholder="e.g. 10"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-brown/50 font-medium pointer-events-none">
                          KB
                        </span>
                      </div>
                      <span className="text-[10px] text-brown/50 mt-1 block">
                        Prevents empty/corrupt images (default: 10 KB)
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-brown mb-1">
                        Maximum Photo Size (MB)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={maxPhotoMB}
                          onChange={(e) => setMaxPhotoMB(e.target.value)}
                          className="royal-input w-full pr-12 text-sm"
                          placeholder="e.g. 15"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-brown/50 font-medium pointer-events-none">
                          MB
                        </span>
                      </div>
                      <span className="text-[10px] text-brown/50 mt-1 block">
                        Maximum single photo upload limit (default: 15 MB)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Video Limits */}
                <div className="p-4 rounded-xl bg-ivory/70 border border-gold/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-maroon">
                    <VideoIcon className="w-4 h-4 text-gold-dark" />
                    <span>Video Limits (MP4, WebM)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-brown mb-1">
                        Minimum Video Size (KB)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={51200}
                          value={minVideoKB}
                          onChange={(e) => setMinVideoKB(e.target.value)}
                          className="royal-input w-full pr-12 text-sm"
                          placeholder="e.g. 50"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-brown/50 font-medium pointer-events-none">
                          KB
                        </span>
                      </div>
                      <span className="text-[10px] text-brown/50 mt-1 block">
                        Prevents zero-byte video clips (default: 50 KB)
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-brown mb-1">
                        Maximum Video Size (MB)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={maxVideoMB}
                          onChange={(e) => setMaxVideoMB(e.target.value)}
                          className="royal-input w-full pr-12 text-sm"
                          placeholder="e.g. 30"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-brown/50 font-medium pointer-events-none">
                          MB
                        </span>
                      </div>
                      <span className="text-[10px] text-brown/50 mt-1 block">
                        Maximum single video upload limit (default: 30 MB)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Rules Badge */}
                <div className="p-3 rounded-xl bg-gold/10 border border-gold/40 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-brown gap-1">
                  <span className="font-semibold text-gold-dark">Active Upload Window:</span>
                  <div className="font-mono text-xs text-maroon font-semibold flex items-center gap-3">
                    <span>📷 {minPhotoKB} KB – {maxPhotoMB} MB</span>
                    <span className="text-gold">|</span>
                    <span>🎥 {minVideoKB} KB – {maxVideoMB} MB</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-ivory-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-maroon text-white font-medium rounded-full hover:bg-maroon-dark transition-all text-xs sm:text-sm flex items-center gap-2 border border-gold shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 text-gold animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-gold" />
                      <span>Save Wedding Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </RoyalCornerBorder>

          {/* Admin Security & Password Change */}
          <RoyalCornerBorder className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-gold-dark" />
              <h2 className="font-serif text-xl font-bold text-maroon">
                Administrator Security &amp; Password
              </h2>
            </div>
            <p className="text-xs text-brown/60 mb-6">
              Update your administrator login password with visibility controls
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brown mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="royal-input w-full pr-10 text-sm"
                    disabled={changingPass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-brown/50 hover:text-maroon transition-colors"
                    title={showCurrentPass ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4 text-maroon" /> : <Eye className="w-4 h-4 text-gold-dark" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brown mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="royal-input w-full pr-10 text-sm"
                      disabled={changingPass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-brown/50 hover:text-maroon transition-colors"
                      title={showNewPass ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4 text-maroon" /> : <Eye className="w-4 h-4 text-gold-dark" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="royal-input w-full pr-10 text-sm"
                      disabled={changingPass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-brown/50 hover:text-maroon transition-colors"
                      title={showConfirmPass ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4 text-maroon" /> : <Eye className="w-4 h-4 text-gold-dark" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-6 py-2.5 bg-maroon text-white font-medium rounded-full hover:bg-maroon-dark transition-all text-xs sm:text-sm flex items-center gap-2 border border-gold shadow-sm"
                >
                  {changingPass ? (
                    <>
                      <Loader2 className="w-4 h-4 text-gold animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-gold" />
                      <span>Update Admin Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </RoyalCornerBorder>
        </div>

        {/* Right Column: QR Code & Sharing */}
        <div className="space-y-6">
          <RoyalCornerBorder className="p-6 text-center">
            <h3 className="font-serif text-lg font-bold text-maroon mb-1">
              Banquet Table QR Code
            </h3>
            <p className="text-xs text-brown/60 mb-4">
              Display this QR code at wedding tables for guests to scan and upload directly
            </p>

            {qrCodeData?.qrCodeDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-gold/60 shadow-royal mb-4 inline-block">
                  <img
                    src={qrCodeData.qrCodeDataUrl}
                    alt="Wedding Upload QR Code"
                    className="w-48 h-48 object-contain"
                  />
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <a
                    href={qrCodeData.qrCodeDataUrl}
                    download={`royal-wedding-qr-${qrCodeData.uploadSlug}.png`}
                    className="w-full py-2.5 px-4 bg-maroon text-white font-medium rounded-full hover:bg-maroon-dark transition-all text-xs flex items-center justify-center gap-2 border border-gold"
                  >
                    <Download className="w-4 h-4 text-gold" />
                    <span>Download High-Res PNG</span>
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 px-4 bg-white text-brown font-medium rounded-full hover:bg-ivory transition-all text-xs flex items-center justify-center gap-2 border border-gold/50"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-gold-dark" />
                        <span>Copy Public Upload URL</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-brown/50 mt-3 break-all font-mono">
                  {qrCodeData.uploadUrl}
                </p>
              </div>
            ) : (
              <div className="py-12 text-xs text-brown/60">
                Failed to generate QR code. Please reload.
              </div>
            )}
          </RoyalCornerBorder>
        </div>
      </div>

      {/* Storage Management Progress Bar */}
      {storage && <StorageProgressBar storage={storage} />}
    </div>
  );
}
