import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Lock, Mail, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { adminService } from '../services/adminService';
import { RoyalCornerBorder, RoyalDivider, RoyalMandalaIcon } from '../components/RoyalOrnament';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      toast.error('Please enter both admin email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await adminService.login(cleanEmail, cleanPassword);
      toast.success('Welcome to Royal Wedding Administration!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <RoyalCornerBorder className="py-10 px-6 sm:px-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full border border-gold/60 bg-ivory shadow-sm">
                <RoyalMandalaIcon className="w-10 h-10 text-maroon" />
              </div>
            </div>

            <p className="text-xs uppercase tracking-widest text-gold-dark font-medium mb-1">
              Authorized Personnel Only
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-maroon">
              Admin Portal Login
            </h2>
            <p className="text-xs text-brown/60 mt-1">
              Access the private wedding gallery and management vault
            </p>
          </div>

          <RoyalDivider className="max-w-xs mx-auto my-4" />

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brown mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-dark">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@royalwedding.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="royal-input w-full pl-10 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brown mb-1">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-dark">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="royal-input w-full pl-10 pr-10 text-sm"
                  disabled={loading}
                />
                {/* Password Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-brown/50 hover:text-maroon transition-colors focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-maroon" />
                  ) : (
                    <Eye className="w-4 h-4 text-gold-dark" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-full font-medium text-white flex items-center justify-center gap-2 border border-gold transition-all duration-300 shadow-royal mt-6 ${
                loading
                  ? 'bg-brown/50 cursor-not-allowed'
                  : 'bg-maroon hover:bg-maroon-dark hover:shadow-royal-lg cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 text-gold animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-gold" />
                  <span>Sign In to Vault</span>
                </>
              )}
            </button>
          </form>
        </RoyalCornerBorder>
      </div>
    </div>
  );
}
