import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Zimmer', href: '#zimmer' },
    { name: 'Ausstattung', href: '#ausstattung' },
    { name: 'Lage', href: '#lage' },
    { name: 'Bewertungen', href: '#bewertungen' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Kontakt', href: '#kontakt' },
  ];

  return (
    <motion.header 
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container nav-container">
        <a href="#" className="logo">
          <img src="https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Logo_Hostel_Neustadt_transparent.png" alt="Hostel Neustadt Logo" />
        </a>

        <nav className="desktop-nav">
          <ul>
            {navLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href}>{link.name}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-actions">
          <a href="https://booking.com" target="_blank" rel="noopener noreferrer" className="btn-primary nav-btn">
            Jetzt buchen<br/><small style={{fontSize: '0.7em', fontWeight: 'normal'}}>auf Booking.com</small>
          </a>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div 
          className="mobile-nav"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <ul>
            {navLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.name}</a>
              </li>
            ))}
            <li>
              <a href="https://booking.com" target="_blank" rel="noopener noreferrer" className="btn-primary mobile-book-btn">
                Jetzt buchen auf Booking.com
              </a>
            </li>
          </ul>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Navbar;
