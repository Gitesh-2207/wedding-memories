import React from 'react';
import { RoyalDivider, RoyalMandalaIcon } from './RoyalOrnament';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gold/30 mt-auto pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-2 rounded-full border border-gold/50 bg-ivory">
            <RoyalMandalaIcon className="w-8 h-8 text-maroon" />
          </div>
        </div>

        <h3 className="font-serif text-xl sm:text-2xl text-maroon font-bold tracking-wide">
          Royal Wedding Memories
        </h3>
        <p className="text-xs uppercase tracking-widest text-gold-dark mt-1 font-medium">
          Captured with Love • Preserved with Honor
        </p>

        <RoyalDivider className="my-6 max-w-md mx-auto" />

        <div className="flex items-center justify-center gap-1.5 text-xs text-brown/70 mb-2">
          <span>Celebrating the auspicious union of hearts</span>
          <Heart className="w-3.5 h-3.5 text-maroon fill-current inline" />
        </div>

        <p className="text-[11px] text-brown/50">
          Private & Secure Storage Enforced • Cloudflare R2 & Turnstile Protected
        </p>
      </div>
    </footer>
  );
}
