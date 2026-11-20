import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import WeddingHomePage from './pages/WeddingHomePage';
import GuestUploadPage from './pages/GuestUploadPage';
import UploadSuccessPage from './pages/UploadSuccessPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminPhotoGalleryPage from './pages/AdminPhotoGalleryPage';
import AdminVideoGalleryPage from './pages/AdminVideoGalleryPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-ivory text-brown">
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#45372E',
            border: '1px solid #D8B978',
            borderRadius: '1rem',
            padding: '12px 20px',
            boxShadow: '0 10px 25px -5px rgba(69, 55, 46, 0.1)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px'
          },
          success: {
            iconTheme: {
              primary: '#8C2436',
              secondary: '#FFFFFF'
            }
          },
          error: {
            iconTheme: {
              primary: '#B91C1C',
              secondary: '#FFFFFF'
            }
          }
        }}
      />

      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public Guest Pages */}
          <Route path="/" element={<WeddingHomePage />} />
          <Route path="/w/:slug" element={<WeddingHomePage />} />
          <Route path="/upload/success" element={<UploadSuccessPage />} />
          <Route path="/upload/:slug" element={<GuestUploadPage />} />

          {/* Admin Auth */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/photos" element={<AdminPhotoGalleryPage />} />
            <Route path="/admin/videos" element={<AdminVideoGalleryPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
