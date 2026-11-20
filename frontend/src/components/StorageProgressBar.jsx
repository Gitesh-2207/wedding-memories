import React from 'react';
import { HardDrive, AlertTriangle, ShieldCheck } from 'lucide-react';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function StorageProgressBar({ storage }) {
  if (!storage) return null;

  const {
    totalQuotaBytes = 5368709120, // 5 GiB
    usedBytes = 0,
    reservedBytes = 0,
    availableBytes = 5368709120,
    percentageUsed = 0
  } = storage;

  const usedPercentage = Math.min(100, (usedBytes / totalQuotaBytes) * 100);
  const reservedPercentage = Math.min(100 - usedPercentage, (reservedBytes / totalQuotaBytes) * 100);
  const totalOccupiedPercentage = Math.min(100, usedPercentage + reservedPercentage);

  const isNearingLimit = totalOccupiedPercentage >= 85;
  const isFull = totalOccupiedPercentage >= 99;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gold/40 shadow-royal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-ivory border border-gold/50 text-maroon">
            <HardDrive className="w-5 h-5 text-gold-dark" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-maroon">
              Wedding Cloud Storage Allocation
            </h3>
            <p className="text-xs text-brown/70">
              Total Enforced Quota: <span className="font-semibold text-brown">{formatBytes(totalQuotaBytes)} (5.00 GiB)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isFull ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5" /> Quota Exhausted
            </span>
          ) : isNearingLimit ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" /> High Storage Usage
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Optimal Availability
            </span>
          )}
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="relative w-full h-4 bg-ivory-200 rounded-full overflow-hidden border border-gold/40 p-[2px]">
        <div className="h-full flex rounded-full overflow-hidden">
          {/* Used Bar */}
          <div
            className="h-full bg-gradient-to-r from-maroon to-maroon-light transition-all duration-500 ease-out"
            style={{ width: `${usedPercentage}%` }}
            title={`Used: ${formatBytes(usedBytes)} (${usedPercentage.toFixed(1)}%)`}
          />
          {/* Reserved Bar */}
          <div
            className="h-full bg-gold transition-all duration-500 ease-out opacity-80"
            style={{ width: `${reservedPercentage}%` }}
            title={`Reserved: ${formatBytes(reservedBytes)} (${reservedPercentage.toFixed(1)}%)`}
          />
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-ivory-200 text-xs">
        <div>
          <span className="text-brown/60 block">Used Storage</span>
          <span className="font-semibold text-maroon text-sm">{formatBytes(usedBytes)}</span>
          <span className="text-[10px] text-brown/50 block">({usedPercentage.toFixed(1)}%)</span>
        </div>
        <div>
          <span className="text-brown/60 block">Active Reserved</span>
          <span className="font-semibold text-gold-dark text-sm">{formatBytes(reservedBytes)}</span>
          <span className="text-[10px] text-brown/50 block">({reservedPercentage.toFixed(1)}%)</span>
        </div>
        <div>
          <span className="text-brown/60 block">Free Storage</span>
          <span className="font-semibold text-emerald-700 text-sm">{formatBytes(availableBytes)}</span>
          <span className="text-[10px] text-brown/50 block">
            {((availableBytes / totalQuotaBytes) * 100).toFixed(1)}% available
          </span>
        </div>
        <div>
          <span className="text-brown/60 block">Quota Limit</span>
          <span className="font-semibold text-brown text-sm">5.00 GiB</span>
          <span className="text-[10px] text-brown/50 block">5,368,709,120 bytes</span>
        </div>
      </div>
    </div>
  );
}
