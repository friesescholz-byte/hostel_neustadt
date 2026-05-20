import React from 'react';
import { Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Instagram = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const Facebook = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const Footer = () => {
  return (
    <footer id="kontakt" className="footer">
      <div className="container">
        <div className="footer-grid">
          
          <div className="footer-brand">
            <img 
              src="https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Logo_Hostel_Neustadt_transparent.png" 
              alt="Hostel Neustadt Logo" 
              className="footer-logo"
            />
          </div>

          <div className="footer-address">
            <p><strong>Hostel Neustadt</strong></p>
            <p>Bahnhofstraße 10</p>
            <p>31535 Neustadt am Rübenberge</p>
          </div>

          <div className="footer-contact">
            <a href="tel:+491234567890" className="contact-link">
              <Phone size={20} />
              <span>+49 123 4567890</span>
            </a>
            <a href="mailto:info@hostel-neustadt.de" className="contact-link">
              <Mail size={20} />
              <span>info@hostel-neustadt.de</span>
            </a>
          </div>

          <div className="footer-social">
            <a href="#" className="social-icon" aria-label="Instagram"><Instagram size={24} /></a>
            <a href="#" className="social-icon" aria-label="Facebook"><Facebook size={24} /></a>
          </div>

        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Hostel Neustadt. Alle Rechte vorbehalten.</p>
          <div className="footer-links">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
