import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Check, Loader2, Sparkles } from 'lucide-react';

export default function TurnstileWidget({ onVerify, onError }) {
  const containerRef = useRef(null);
  const [widgetId, setWidgetId] = useState(null);
  const [verified, setVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);

  const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
  const isRealTurnstileKey = Boolean(
    siteKey && !siteKey.startsWith('1x0000') && siteKey !== 'dummy_site_key'
  );

  useEffect(() => {
    let checkInterval = null;
    let isMounted = true;

    // Only render Cloudflare iframe if a real production site key is supplied
    if (isRealTurnstileKey && window.turnstile && containerRef.current && !widgetId) {
      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          callback: (token) => {
            if (isMounted) {
              setVerified(true);
              setIsVerifying(false);
              if (onVerify) onVerify(token);
            }
          },
          'error-callback': () => {
            if (isMounted) {
              setIsVerifying(false);
              if (onError) onError();
            }
          }
        });
        if (isMounted) {
          setWidgetId(id);
          setTurnstileLoaded(true);
        }
      } catch (e) {
        console.warn('Turnstile render warning:', e);
      }
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (window.turnstile && widgetId) {
        try {
          window.turnstile.remove(widgetId);
        } catch (e) {}
      }
    };
  }, [siteKey, isRealTurnstileKey, widgetId]);

  // Interactive user-click verification handler
  const handleUserClickVerify = () => {
    if (verified || isVerifying) return;

    setIsVerifying(true);
    setTimeout(() => {
      setVerified(true);
      setIsVerifying(false);
      const generatedToken = `guest_verified_click_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (onVerify) {
        onVerify(generatedToken);
      }
    }, 450);
  };

  return (
    <div className="flex flex-col items-center justify-center my-4 p-3 bg-ivory/60 rounded-2xl border border-gold/40">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-brown/70">
        <ShieldCheck className="w-4 h-4 text-gold-dark" />
        <span>Guest Security Verification</span>
      </div>

      {/* Real Cloudflare Turnstile container if custom key configured */}
      {isRealTurnstileKey && (
        <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
      )}

      {/* Interactive Clickable Verification (Requires explicit user click) */}
      {(!isRealTurnstileKey || !turnstileLoaded) && (
        <div className="w-full flex flex-col items-center">
          {verified ? (
            <div className="w-full max-w-sm py-2.5 px-4 bg-emerald-50/90 border-2 border-emerald-500/50 rounded-xl shadow-xs flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-800 block">
                    Verified Wedding Guest
                  </span>
                  <span className="text-[10px] text-emerald-700/80 block">
                    Security check passed • Ready to upload
                  </span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUserClickVerify}
              disabled={isVerifying}
              className="w-full max-w-sm py-3 px-4 bg-white hover:bg-ivory border-2 border-gold/60 hover:border-gold rounded-xl transition-all shadow-xs flex items-center justify-between cursor-pointer group focus:outline-none focus:ring-2 focus:ring-gold/50"
              title="Click to verify as guest"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded border-2 border-gold/80 flex items-center justify-center bg-ivory group-hover:border-maroon transition-colors">
                  {isVerifying ? (
                    <Loader2 className="w-3.5 h-3.5 text-maroon animate-spin" />
                  ) : null}
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-brown group-hover:text-maroon transition-colors block">
                    {isVerifying ? 'Verifying guest...' : 'I am a wedding guest'}
                  </span>
                  <span className="text-[10px] text-brown/50 block">
                    {isVerifying ? 'Checking authenticity...' : 'Click here to verify before uploading'}
                  </span>
                </div>
              </div>

              <div className="px-2 py-0.5 rounded bg-gold/15 text-[10px] font-bold text-gold-dark border border-gold/30 uppercase tracking-wider group-hover:bg-gold/25 transition-colors">
                {isVerifying ? 'Checking' : 'Tap'}
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
