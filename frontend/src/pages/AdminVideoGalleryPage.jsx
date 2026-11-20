import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Video as VideoIcon,
  Search,
  Download,
  Trash2,
  Play,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminService } from '../services/adminService';
import MediaModal from '../components/MediaModal';
import { RoyalDivider } from '../components/RoyalOrnament';

export default function AdminVideoGalleryPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await adminService.getMemories({
        type: 'video',
        search: search.trim(),
        sort,
        page,
        limit: 12
      });
      setVideos(res.memories || []);
      setPagination(res.pagination || { totalPages: 1, totalItems: 0 });
    } catch (err) {
      toast.error('Failed to load videos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [page, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVideos();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video? Quota will be freed immediately.')) {
      return;
    }

    // 1. Optimistic UI removal: immediately remove from admin panel view
    setVideos((prev) => prev.filter((v) => v._id !== id));
    setPagination((prev) => ({
      ...prev,
      totalItems: Math.max(0, prev.totalItems - 1)
    }));
    setSelectedVideo(null);

    try {
      // 2. Delete from storage and MongoDB database
      await adminService.deleteMemory(id);
      toast.success('Video permanently deleted from database and storage freed.');
      fetchVideos();
    } catch (err) {
      if (err.message && (err.message.includes('not found') || err.message.includes('Memory not found'))) {
        toast.success('Video was already removed from the database.');
      } else {
        toast.error(err.message || 'Failed to delete video.');
      }
      fetchVideos();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
            Wedding Cinema
          </span>
          <h1 className="font-serif text-3xl font-bold text-maroon mt-1">
            Video Memories Vault
          </h1>
          <p className="text-xs text-brown/70 mt-1">
            Total Videos: <strong className="text-maroon">{pagination.totalItems}</strong>
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search guest or caption..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="royal-input w-full pl-9 pr-4 py-2 text-xs"
            />
            <Search className="w-4 h-4 text-gold-dark absolute left-3 top-2.5" />
          </form>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="royal-input text-xs py-2 px-3 w-full sm:w-auto"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <RoyalDivider className="my-2" />

      {/* Video Grid */}
      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gold/30">
          <VideoIcon className="w-12 h-12 text-gold mx-auto mb-3 opacity-60" />
          <h3 className="font-serif text-lg font-bold text-maroon">No Videos Found</h3>
          <p className="text-xs text-brown/60 mt-1">
            {search ? 'No videos match your search criteria.' : 'Guests have not uploaded any video blessings yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video._id}
              className="group bg-white rounded-2xl border border-gold/30 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between transition-all"
            >
              {/* Video Thumbnail / Player trigger */}
              <div
                onClick={() => setSelectedVideo(video)}
                className="relative w-full h-52 bg-brown-dark cursor-pointer overflow-hidden flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />
                <div className="p-4 rounded-full bg-maroon/90 text-gold border border-gold shadow-lg z-20 group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <div className="absolute bottom-3 left-3 z-20 text-white text-xs font-medium">
                  {video.fileName}
                </div>
              </div>

              {/* Video Card Details */}
              <div className="p-4 bg-white flex flex-col justify-between flex-1">
                <div>
                  <h4 className="font-semibold text-sm text-maroon truncate" title={video.guestName}>
                    {video.guestName || 'Royal Guest'}
                  </h4>
                  {video.caption && (
                    <p className="text-xs text-brown/80 line-clamp-2 mt-1 italic">
                      "{video.caption}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-brown/60 mt-4 pt-3 border-t border-ivory-200">
                  <span>{(video.fileSize / 1024 / 1024).toFixed(2)} MiB (MP4/WebM)</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={video.fileUrl || adminService.getDownloadUrl(video._id)}
                      download={video.fileName}
                      className="p-1.5 text-brown hover:text-maroon rounded"
                      title="Download Video"
                    >
                      <Download className="w-4 h-4 text-gold-dark" />
                    </a>
                    <button
                      onClick={() => handleDelete(video._id)}
                      className="p-1.5 text-red-600 hover:text-red-800 rounded"
                      title="Delete Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gold/40 text-brown disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ivory"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-brown">
            Page <strong className="text-maroon">{page}</strong> of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="p-2 rounded-lg border border-gold/40 text-brown disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ivory"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fullscreen Video Modal */}
      {selectedVideo && (
        <MediaModal
          item={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
