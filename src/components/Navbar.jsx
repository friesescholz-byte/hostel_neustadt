import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './Navbar.css';

const WhatsAppIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isSubPage = location.pathname !== '/';

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
      className={`navbar ${scrolled || isSubPage ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container nav-container">
        <Link to="/" className="logo">
          <img src="https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Logo_Hostel_Neustadt_transparent.png" alt="Hostel Neustadt Logo" />
        </Link>

        {!isSubPage && (
          <nav className="desktop-nav">
            <ul>
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="nav-actions">
          <a 
            href="https://wa.me/491728572368" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="nav-whatsapp"
            title="Direkt per WhatsApp schreiben (+49 172 8572368)"
            aria-label="WhatsApp (+49 172 8572368)"
          >
            <WhatsAppIcon size={16} />
            <span className="nav-whatsapp-text">+49 172 8572368</span>
          </a>

          {!isSubPage ? (
            <>
              <Link to="/buchen" className="btn-primary nav-btn">
                Jetzt buchen
              </Link>
              <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menü öffnen">
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </>
          ) : (
            <Link to="/" className="btn-link" style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
              &larr; Zurück zur Startseite
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && !isSubPage && (
        <motion.div 
          className="mobile-nav"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ul>
            {navLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.name}</a>
              </li>
            ))}
            <li>
              <a 
                href="https://wa.me/491728572368" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mobile-whatsapp-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <WhatsAppIcon size={20} />
                <span>WhatsApp: +49 172 8572368</span>
              </a>
            </li>
            <li>
              <Link to="/buchen" onClick={() => setMobileMenuOpen(false)} className="btn-primary mobile-book-btn">
                Jetzt buchen
              </Link>
            </li>
          </ul>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Navbar;
