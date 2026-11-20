import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Camera, Home, Heart, Sparkles } from 'lucide-react';
import { RoyalCornerBorder, RoyalDivider, RoyalMandalaIcon } from '../components/RoyalOrnament';

export default function UploadSuccessPage() {
  const location = useLocation();
  const { count = 1, brideName = 'Khushbu', groomName = 'Abhay' } = location.state || {};

  useEffect(() => {
    // Fire festive royal gold and maroon confetti
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      confetti({
        particleCount: 40,
        startVelocity: 30,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#D8B978', '#8C2436', '#F8F3E9', '#E6D0A3']
      });
    }, 350);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center">
      <RoyalCornerBorder className="py-12 px-6 sm:px-10">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-emerald-50 border-2 border-gold shadow-gold-glow">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.25em] text-gold-dark font-semibold mb-1">
          Thank You Deeply
        </p>

        <h1 className="font-serif text-3xl sm:text-4xl text-maroon font-bold mb-2">
          Memories Received!
        </h1>

        <p className="text-sm text-brown/80 mb-6">
          Your precious photos &amp; videos have been safely vaulted into {brideName} &amp; {groomName}'s wedding collection.
        </p>

        <RoyalDivider className="max-w-xs mx-auto my-6" />

        <div className="bg-ivory/60 p-4 rounded-xl border border-gold/30 mb-8 text-xs text-brown/70 leading-relaxed font-serif italic">
          "The memories you shared today will be cherished by the couple and their families for generations to come."
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/upload/khushbu-abhay"
            className="w-full sm:w-auto px-6 py-3 bg-maroon text-white font-medium rounded-full hover:bg-maroon-dark transition-all shadow-royal flex items-center justify-center gap-2 border border-gold text-xs sm:text-sm"
          >
            <Camera className="w-4 h-4 text-gold" />
            <span>Upload More Memories</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-white text-brown font-medium rounded-full hover:bg-ivory transition-all border border-gold/50 flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <Home className="w-4 h-4 text-gold-dark" />
            <span>Back to Home</span>
          </Link>
        </div>
      </RoyalCornerBorder>
    </div>
  );
}
