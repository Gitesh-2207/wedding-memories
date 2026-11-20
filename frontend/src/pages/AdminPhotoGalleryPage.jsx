import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Image as ImageIcon,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminService } from '../services/adminService';
import MediaModal from '../components/MediaModal';
import { RoyalDivider } from '../components/RoyalOrnament';

export default function AdminPhotoGalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await adminService.getMemories({
        type: 'photo',
        search: search.trim(),
        sort,
        page,
        limit: 12
      });
      setPhotos(res.memories || []);
      setPagination(res.pagination || { totalPages: 1, totalItems: 0 });
    } catch (err) {
      toast.error('Failed to load photos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [page, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPhotos();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this photo? Quota will be freed immediately.')) {
      return;
    }

    // 1. Optimistic UI removal: immediately remove from admin panel view
    setPhotos((prev) => prev.filter((p) => p._id !== id));
    setPagination((prev) => ({
      ...prev,
      totalItems: Math.max(0, prev.totalItems - 1)
    }));
    setSelectedPhoto(null);

    try {
      // 2. Delete from storage and MongoDB database
      await adminService.deleteMemory(id);
      toast.success('Photo permanently deleted from database and storage freed.');
      fetchPhotos();
    } catch (err) {
      if (err.message && (err.message.includes('not found') || err.message.includes('Memory not found'))) {
        toast.success('Photo was already removed from the database.');
      } else {
        toast.error(err.message || 'Failed to delete photo.');
      }
      fetchPhotos();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
            Wedding Album
          </span>
          <h1 className="font-serif text-3xl font-bold text-maroon mt-1">
            Photo Memories Gallery
          </h1>
          <p className="text-xs text-brown/70 mt-1">
            Total Photos: <strong className="text-maroon">{pagination.totalItems}</strong>
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

      {/* Gallery Grid */}
      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gold/30">
          <ImageIcon className="w-12 h-12 text-gold mx-auto mb-3 opacity-60" />
          <h3 className="font-serif text-lg font-bold text-maroon">No Photos Found</h3>
          <p className="text-xs text-brown/60 mt-1">
            {search ? 'No photos match your search criteria.' : 'Guests have not uploaded any photos yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="group bg-white rounded-2xl border border-gold/30 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between transition-all"
            >
              {/* Image Preview with Hover Overlay */}
              <div
                onClick={() => setSelectedPhoto(photo)}
                className="relative w-full h-48 sm:h-56 bg-ivory cursor-pointer overflow-hidden"
              >
                <img
                  src={photo.fileUrl || adminService.getStreamUrl(photo._id)}
                  alt={photo.caption || photo.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/royal-mandala.svg';
                    e.currentTarget.className = 'w-16 h-16 m-auto object-contain opacity-40';
                  }}
                />
                <div className="absolute inset-0 bg-maroon/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="p-2 rounded-full bg-white/90 text-maroon shadow">
                    <Eye className="w-5 h-5" />
                  </span>
                </div>
              </div>

              {/* Photo Card Details */}
              <div className="p-3.5 bg-white flex flex-col justify-between flex-1">
                <div>
                  <h4 className="font-medium text-xs text-maroon truncate" title={photo.guestName}>
                    {photo.guestName || 'Royal Guest'}
                  </h4>
                  {photo.caption && (
                    <p className="text-[11px] text-brown/80 line-clamp-2 mt-0.5 italic">
                      "{photo.caption}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-brown/60 mt-3 pt-2 border-t border-ivory-200">
                  <span>{(photo.fileSize / 1024 / 1024).toFixed(2)} MiB</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={photo.fileUrl || adminService.getDownloadUrl(photo._id)}
                      download={photo.fileName}
                      className="p-1 text-brown hover:text-maroon rounded"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(photo._id)}
                      className="p-1 text-red-600 hover:text-red-800 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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

      {/* Fullscreen Photo Modal */}
      {selectedPhoto && (
        <MediaModal
          item={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
