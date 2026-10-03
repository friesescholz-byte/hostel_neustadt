import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ImprintPage from './pages/ImprintPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import AdminPage from './pages/AdminPage';
import './App.css';

function App() {
  return (
    <div className="app-wrapper">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/buchen" element={<BookingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/impressum" element={<ImprintPage />} />
        <Route path="/datenschutz" element={<PrivacyPage />} />
        <Route path="/agb" element={<TermsPage />} />
        <Route path="/stornierung" element={<TermsPage />} />
      </Routes>
    </div>
  );
}

export default App;
