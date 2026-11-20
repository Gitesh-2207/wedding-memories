import React, { useEffect } from 'react';
import { X, Download, Trash2, Calendar, User, FileText } from 'lucide-react';
import { adminService } from '../services/adminService';

export default function MediaModal({ item, onClose, onDelete }) {
  if (!item) return null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const streamUrl = item.fileUrl || adminService.getStreamUrl(item._id);
  const downloadUrl = item.fileUrl || adminService.getDownloadUrl(item._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-brown-dark/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[94vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-gold">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-4 border-b border-ivory-200 bg-ivory">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full uppercase tracking-wider bg-gold/20 text-maroon border border-gold/40 shrink-0">
              {item.fileType}
            </span>
            <span className="font-medium text-xs sm:text-sm text-brown truncate max-w-[140px] sm:max-w-md">
              {item.fileName}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <a
              href={downloadUrl}
              download={item.fileName}
              className="p-1.5 sm:p-2 text-brown hover:text-maroon rounded-lg hover:bg-white transition-colors"
              title="Download memory"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 text-gold-dark" />
            </a>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item._id)}
                className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete memory"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-brown hover:text-maroon rounded-lg hover:bg-white transition-colors ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="flex-1 overflow-auto bg-brown-dark flex items-center justify-center p-2 sm:p-4 min-h-[220px]">
          {item.fileType === 'video' ? (
            <video
              src={streamUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[55vh] sm:max-h-[65vh] w-auto max-w-full rounded-lg shadow-lg"
            >
              Your browser does not support HTML5 video streaming.
            </video>
          ) : (
            <img
              src={streamUrl}
              alt={item.caption || item.fileName}
              className="max-h-[55vh] sm:max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/royal-mandala.svg';
                e.currentTarget.className = 'w-24 h-24 m-auto object-contain opacity-50';
              }}
            />
          )}
        </div>

        {/* Footer Details */}
        <div className="px-3.5 py-3 sm:px-6 sm:py-4 bg-white border-t border-ivory-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs text-brown/80">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-maroon">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-dark shrink-0" />
              <span className="truncate">{item.guestName || 'Royal Guest'}</span>
            </div>
            {item.caption && (
              <div className="flex items-start gap-1.5 text-brown italic text-[11px] sm:text-xs">
                <FileText className="w-3.5 h-3.5 text-gold-dark shrink-0 mt-0.5" />
                <p className="line-clamp-2">"{item.caption}"</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-brown/60 text-[10px] sm:text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gold-dark" />
              {new Date(item.uploadedAt).toLocaleDateString()}
            </span>
            <span className="font-medium">{(item.fileSize / 1024 / 1024).toFixed(2)} MiB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
