import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Camera,
  Image,
  Video,
  Settings,
  LogOut,
  ShieldCheck,
  Home,
  Menu,
  X
} from 'lucide-react';
import { RoyalMandalaIcon } from './RoyalOrnament';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('royal_admin_token');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('royal_admin_token');
    localStorage.removeItem('royal_admin_user');
    localStorage.removeItem('royal_admin_wedding');
    setMobileMenuOpen(false);
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gold/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="p-1 sm:p-1.5 rounded-full border border-gold/60 bg-ivory group-hover:border-gold transition-colors">
              <RoyalMandalaIcon className="w-6 h-6 sm:w-8 sm:h-8 text-maroon" />
            </div>
            <div>
              <span className="font-serif text-lg sm:text-2xl font-bold tracking-wide text-maroon block leading-tight">
                Royal Wedding
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gold-dark font-medium block">
                Memories &amp; Blessings
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (md and above) */}
          <nav className="hidden md:flex items-center gap-2">
            {!isAdminRoute ? (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/')
                      ? 'bg-ivory text-maroon font-semibold border border-gold/40'
                      : 'text-brown hover:text-maroon'
                  }`}
                >
                  <Home className="w-4 h-4 text-gold-dark" />
                  <span>Home</span>
                </Link>

                <Link
                  to="/upload/khushbu-abhay"
                  className="px-4 py-2 text-sm font-medium bg-maroon text-ivory rounded-full hover:bg-maroon-dark transition-all shadow-sm hover:shadow-md flex items-center gap-2 border border-gold/40"
                >
                  <Camera className="w-4 h-4 text-gold" />
                  <span>Upload Memories</span>
                </Link>

                <Link
                  to="/admin/login"
                  className="ml-2 p-2 text-brown-light hover:text-maroon rounded-full hover:bg-ivory transition-colors"
                  title="Admin Portal"
                >
                  <ShieldCheck className="w-5 h-5 text-gold-dark" />
                </Link>
              </>
            ) : token ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/admin/dashboard')
                      ? 'bg-ivory text-maroon border border-gold/50 font-semibold'
                      : 'text-brown hover:text-maroon'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-gold-dark" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/admin/photos"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/admin/photos')
                      ? 'bg-ivory text-maroon border border-gold/50 font-semibold'
                      : 'text-brown hover:text-maroon'
                  }`}
                >
                  <Image className="w-4 h-4 text-gold-dark" />
                  <span>Photos</span>
                </Link>

                <Link
                  to="/admin/videos"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/admin/videos')
                      ? 'bg-ivory text-maroon border border-gold/50 font-semibold'
                      : 'text-brown hover:text-maroon'
                  }`}
                >
                  <Video className="w-4 h-4 text-gold-dark" />
                  <span>Videos</span>
                </Link>

                <Link
                  to="/admin/settings"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/admin/settings')
                      ? 'bg-ivory text-maroon border border-gold/50 font-semibold'
                      : 'text-brown hover:text-maroon'
                  }`}
                >
                  <Settings className="w-4 h-4 text-gold-dark" />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium text-maroon hover:bg-maroon/10 rounded-lg transition-colors flex items-center gap-1.5 ml-2 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="px-3 py-2 text-sm font-medium text-brown hover:text-maroon rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Home className="w-4 h-4 text-gold-dark" />
                <span>Back to Guest View</span>
              </Link>
            )}
          </nav>

          {/* Mobile Right Controls (< md) */}
          <div className="flex md:hidden items-center gap-2">
            {!isAdminRoute && (
              <Link
                to="/upload/khushbu-abhay"
                className="px-3 py-1.5 text-xs font-medium bg-maroon text-ivory rounded-full hover:bg-maroon-dark transition-all flex items-center gap-1.5 border border-gold/40 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-gold" />
                <span>Upload</span>
              </Link>
            )}

            {/* Hamburger / Close Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-gold/40 bg-ivory text-maroon hover:bg-gold/20 transition-all focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-maroon" />
              ) : (
                <Menu className="w-5 h-5 text-maroon" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 border-b border-gold/40 shadow-royal px-4 pt-3 pb-5 space-y-2 animate-fade-in">
          {!isAdminRoute ? (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-ivory text-maroon font-semibold border border-gold/40'
                    : 'text-brown hover:bg-ivory hover:text-maroon'
                }`}
              >
                <Home className="w-4 h-4 text-gold-dark" />
                <span>Wedding Home</span>
              </Link>

              <Link
                to="/upload/khushbu-abhay"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/upload')
                    ? 'bg-maroon text-white font-semibold'
                    : 'bg-ivory text-maroon border border-gold/40'
                }`}
              >
                <Camera className="w-4 h-4 text-gold" />
                <span>Upload Memories (Photos &amp; Videos)</span>
              </Link>

              <div className="pt-2 border-t border-gold/20">
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-brown-light hover:bg-ivory hover:text-maroon transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-gold-dark" />
                  <span>Admin Portal Login</span>
                </Link>
              </div>
            </>
          ) : token ? (
            <>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-dark">
                Admin Navigation
              </div>

              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/admin/dashboard')
                    ? 'bg-ivory text-maroon font-semibold border border-gold/40'
                    : 'text-brown hover:bg-ivory hover:text-maroon'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-gold-dark" />
                <span>Dashboard Overview</span>
              </Link>

              <Link
                to="/admin/photos"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/admin/photos')
                    ? 'bg-ivory text-maroon font-semibold border border-gold/40'
                    : 'text-brown hover:bg-ivory hover:text-maroon'
                }`}
              >
                <Image className="w-4 h-4 text-gold-dark" />
                <span>Photo Gallery</span>
              </Link>

              <Link
                to="/admin/videos"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/admin/videos')
                    ? 'bg-ivory text-maroon font-semibold border border-gold/40'
                    : 'text-brown hover:bg-ivory hover:text-maroon'
                }`}
              >
                <Video className="w-4 h-4 text-gold-dark" />
                <span>Video Gallery</span>
              </Link>

              <Link
                to="/admin/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/admin/settings')
                    ? 'bg-ivory text-maroon font-semibold border border-gold/40'
                    : 'text-brown hover:bg-ivory hover:text-maroon'
                }`}
              >
                <Settings className="w-4 h-4 text-gold-dark" />
                <span>Settings &amp; QR Code</span>
              </Link>

              <div className="pt-2 border-t border-gold/20 flex flex-col gap-2">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium text-brown/70 hover:bg-ivory"
                >
                  <Home className="w-4 h-4 text-gold-dark" />
                  <span>Switch to Guest View</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout from Admin</span>
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-brown hover:bg-ivory"
            >
              <Home className="w-4 h-4 text-gold-dark" />
              <span>Back to Guest View</span>
            </Link>
          )}
        </div>
      )}

      {/* Decorative Gold Border Under Nav */}
      <div className="h-[2px] bg-gradient-to-r from-gold/20 via-gold to-gold/20 w-full"></div>
    </header>
  );
}
