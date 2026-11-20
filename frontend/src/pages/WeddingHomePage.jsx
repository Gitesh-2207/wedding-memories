import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Camera, Calendar, Heart, QrCode, Sparkles, ShieldCheck } from 'lucide-react';
import { uploadService } from '../services/uploadService';
import { RoyalDivider, RoyalCornerBorder, RoyalMandalaIcon } from '../components/RoyalOrnament';

export default function WeddingHomePage() {
  const { slug = 'khushbu-abhay' } = useParams();
  const [wedding, setWedding] = useState({
    brideName: 'Khushbu',
    groomName: 'Abhay',
    weddingDate: '2026-11-24T18:00:00Z',
    uploadSlug: 'khushbu-abhay',
    uploadEnabled: true,
    welcomeMessage: 'With joyful hearts, we invite you to share the moments, laughter, and candid memories captured through your eyes during our wedding celebration on 24–25 November 2026.'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWedding() {
      try {
        const res = await uploadService.getWedding(slug);
        if (res.wedding) {
          setWedding(res.wedding);
        }
      } catch (err) {
        console.warn('Using default wedding configuration:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadWedding();
  }, [slug]);

  const formattedDate = new Date(wedding.weddingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="relative overflow-hidden py-10 sm:py-16">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <RoyalCornerBorder className="py-12 sm:py-16">
          {/* Royal Seal */}
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full border-2 border-gold/70 bg-ivory shadow-gold-glow animate-pulse">
              <RoyalMandalaIcon className="w-12 h-12 text-maroon" />
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-gold-dark font-semibold mb-2">
            The Auspicious Wedding Celebration of
          </p>

          <h1 className="font-serif text-4xl sm:text-6xl text-maroon font-bold tracking-tight mb-4">
            {wedding.brideName} <span className="text-gold font-light">&amp;</span> {wedding.groomName}
          </h1>

          <div className="flex items-center justify-center gap-2 text-brown-light font-medium text-sm sm:text-base mb-4">
            <Calendar className="w-4 h-4 text-gold-dark" />
            <span>24 – 25 November 2026</span>
          </div>

          <RoyalDivider className="max-w-xs mx-auto" />

          <p className="text-sm sm:text-base text-brown/85 max-w-xl mx-auto leading-relaxed mb-8 italic font-serif">
            "{wedding.welcomeMessage}"
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {wedding.uploadEnabled ? (
              <Link
                to={`/upload/${wedding.uploadSlug}`}
                className="w-full sm:w-auto px-8 py-3.5 bg-maroon text-white font-medium rounded-full hover:bg-maroon-dark transition-all duration-300 shadow-royal hover:shadow-royal-lg flex items-center justify-center gap-2 border border-gold"
              >
                <Camera className="w-5 h-5 text-gold" />
                <span>Upload Wedding Memories</span>
              </Link>
            ) : (
              <div className="px-6 py-3 bg-ivory-200 text-brown/70 rounded-full text-sm border border-gold/40">
                Uploads are currently closed by the couple
              </div>
            )}
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 pt-8 border-t border-gold/20 text-left">
            <div className="p-4 rounded-xl bg-ivory/50 border border-gold/20">
              <div className="flex items-center gap-2 text-maroon font-semibold text-sm mb-1">
                <Sparkles className="w-4 h-4 text-gold-dark" />
                <span>No App or Login</span>
              </div>
              <p className="text-xs text-brown/70">
                Instant guest uploads directly from any smartphone camera or album without registration.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-ivory/50 border border-gold/20">
              <div className="flex items-center gap-2 text-maroon font-semibold text-sm mb-1">
                <ShieldCheck className="w-4 h-4 text-gold-dark" />
                <span>Private &amp; Secure</span>
              </div>
              <p className="text-xs text-brown/70">
                Your memories go straight into private cloud storage. Only the couple can view the gallery.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-ivory/50 border border-gold/20">
              <div className="flex items-center gap-2 text-maroon font-semibold text-sm mb-1">
                <QrCode className="w-4 h-4 text-gold-dark" />
                <span>Scan &amp; Share</span>
              </div>
              <p className="text-xs text-brown/70">
                Scan table QR codes at the banquet to effortlessly upload high-resolution photos and videos.
              </p>
            </div>
          </div>
        </RoyalCornerBorder>
      </div>
    </div>
  );
}
