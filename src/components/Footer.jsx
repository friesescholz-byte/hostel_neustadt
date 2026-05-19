import React from 'react';
import { Phone, Mail, Instagram, Facebook } from 'lucide-react';
import './Footer.css';

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
            <p>12345 Neustadt</p>
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
            <a href="#" className="social-icon" aria-label="TripAdvisor">
              {/* Using a custom span for tripadvisor if no lucide icon */}
              <span style={{fontWeight: 'bold'}}>TA</span>
            </a>
          </div>

        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Hostel Neustadt. Alle Rechte vorbehalten.</p>
          <div className="footer-links">
            <a href="#impressum">Impressum</a>
            <a href="#datenschutz">Datenschutz</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
