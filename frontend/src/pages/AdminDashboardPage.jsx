import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Users,
  HardDrive,
  Camera,
  Settings,
  QrCode,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Trash2
} from 'lucide-react';
import { adminService } from '../services/adminService';
import StorageProgressBar from '../components/StorageProgressBar';
import MediaModal from '../components/MediaModal';
import { RoyalDivider } from '../components/RoyalOrnament';

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [togglingUpload, setTogglingUpload] = useState(false);

  const fetchDashboard = async () => {
    try {
      const data = await adminService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleUploads = async () => {
    if (!dashboardData?.wedding) return;
    setTogglingUpload(true);
    const newStatus = !dashboardData.wedding.uploadEnabled;

    try {
      await adminService.updateSettings({ uploadEnabled: newStatus });
      toast.success(newStatus ? 'Guest uploads enabled.' : 'Guest uploads paused.');
      setDashboardData((prev) => ({
        ...prev,
        wedding: { ...prev.wedding, uploadEnabled: newStatus }
      }));
    } catch (err) {
      toast.error('Failed to update upload status.');
    } finally {
      setTogglingUpload(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this memory? Quota will be freed immediately.')) {
      return;
    }

    // 1. Optimistic UI removal from dashboard view
    setDashboardData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        recentMemories: (prev.recentMemories || []).filter((m) => m._id !== id)
      };
    });
    setSelectedMedia(null);

    try {
      // 2. Delete from storage and MongoDB database
      await adminService.deleteMemory(id);
      toast.success('Memory deleted from database and storage quota recovered.');
      fetchDashboard();
    } catch (err) {
      if (err.message && (err.message.includes('not found') || err.message.includes('Memory not found'))) {
        toast.success('Memory was already removed from the database.');
      } else {
        toast.error(err.message || 'Failed to delete memory.');
      }
      fetchDashboard();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  const { wedding, statistics, recentMemories = [] } = dashboardData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Quick Toggle */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gold/40 shadow-royal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
            Wedding Administrator Vault
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon mt-1">
            {wedding?.brideName} &amp; {wedding?.groomName}'s Celebration
          </h1>
          <p className="text-xs text-brown/70 mt-1">
            Public Upload Link Slug:{' '}
            <code className="bg-ivory px-2 py-0.5 rounded text-maroon font-mono font-semibold">
              /upload/{wedding?.uploadSlug}
            </code>
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleToggleUploads}
            disabled={togglingUpload}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 border transition-all ${
              wedding?.uploadEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
            }`}
          >
            {wedding?.uploadEnabled ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">Uploads Active (Click to Pause)</span>
                <span className="sm:hidden">Uploads Active</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="hidden sm:inline">Uploads Paused (Click to Enable)</span>
                <span className="sm:hidden">Uploads Paused</span>
              </>
            )}
          </button>

          <Link
            to="/admin/settings"
            className="p-2 sm:p-2.5 rounded-full bg-ivory text-brown hover:text-maroon border border-gold/40 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gold-dark" />
          </Link>
        </div>
      </div>

      {/* Real-Time Storage Progress Bar (5 GiB limit) */}
      <StorageProgressBar storage={statistics} />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gold/30 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-maroon/10 text-maroon">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-brown/60 block">Total Memories</span>
            <span className="font-serif text-2xl font-bold text-maroon">
              {statistics?.totalMemories || 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gold/30 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gold/20 text-gold-dark">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-brown/60 block">Total Photos</span>
            <span className="font-serif text-2xl font-bold text-brown">
              {statistics?.totalPhotos || 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gold/30 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-maroon/10 text-maroon">
            <VideoIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-brown/60 block">Total Videos</span>
            <span className="font-serif text-2xl font-bold text-brown">
              {statistics?.totalVideos || 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gold/30 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-brown/60 block">Unique Guests</span>
            <span className="font-serif text-2xl font-bold text-brown">
              {statistics?.uniqueGuests || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Links Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/photos"
          className="p-5 rounded-2xl bg-white border border-gold/40 hover:border-gold shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-gold-dark" />
            <span className="font-medium text-brown group-hover:text-maroon transition-colors text-sm">
              Manage Photo Gallery
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/admin/videos"
          className="p-5 rounded-2xl bg-white border border-gold/40 hover:border-gold shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <VideoIcon className="w-5 h-5 text-gold-dark" />
            <span className="font-medium text-brown group-hover:text-maroon transition-colors text-sm">
              Manage Video Gallery
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/admin/settings"
          className="p-5 rounded-2xl bg-white border border-gold/40 hover:border-gold shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-gold-dark" />
            <span className="font-medium text-brown group-hover:text-maroon transition-colors text-sm">
              QR Code &amp; Settings
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Uploads Activity */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gold/40 shadow-royal">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-maroon">
              Recent Guest Uploads
            </h2>
            <p className="text-xs text-brown/60">
              Latest moments vaulted by your wedding guests
            </p>
          </div>

          <Link
            to="/admin/photos"
            className="text-xs font-semibold text-maroon hover:text-maroon-dark flex items-center gap-1"
          >
            <span>View Full Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentMemories.length === 0 ? (
          <div className="py-12 text-center text-brown/60 text-sm">
            No memories uploaded yet. Share your wedding QR code or upload link with guests to begin!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentMemories.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedMedia(item)}
                className="group relative rounded-xl border border-gold/30 bg-ivory overflow-hidden cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="w-full h-32 bg-brown-dark relative overflow-hidden flex items-center justify-center">
                  {item.fileType === 'video' ? (
                    <div className="flex flex-col items-center justify-center text-white">
                      <VideoIcon className="w-8 h-8 text-gold" />
                      <span className="text-[10px] uppercase font-bold mt-1 text-gold">Video</span>
                    </div>
                  ) : (
                    <img
                      src={item.fileUrl || adminService.getStreamUrl(item._id)}
                      alt={item.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/royal-mandala.svg';
                        e.currentTarget.className = 'w-10 h-10 m-auto object-contain opacity-40';
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-maroon/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="p-2.5 bg-white">
                  <p className="text-xs font-medium text-brown truncate" title={item.guestName}>
                    {item.guestName || 'Royal Guest'}
                  </p>
                  <p className="text-[10px] text-brown/60 truncate">
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Fullscreen Modal */}
      {selectedMedia && (
        <MediaModal
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onDelete={handleDeleteMemory}
        />
      )}
    </div>
  );
}
