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

const WhatsApp = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
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
            <p>Bertha-Sicius-Str. 6</p>
            <p>31535 Neustadt am Rübenberge</p>
          </div>

          <div className="footer-contact">
            <a href="tel:+491728572368" className="contact-link">
              <Phone size={20} />
              <span>+49 172 8572368</span>
            </a>
            <a href="mailto:vermietung@bh-am-ruebenberge.de" className="contact-link">
              <Mail size={20} />
              <span>vermietung@bh-am-ruebenberge.de</span>
            </a>
          </div>

          <div className="footer-social">
            <a 
              href="https://wa.me/491728572368" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-icon whatsapp-social" 
              aria-label="WhatsApp (+49 172 8572368)"
              title="WhatsApp: +49 172 8572368"
            >
              <WhatsApp size={22} />
            </a>
            <a href="#" className="social-icon" aria-label="Instagram"><Instagram size={24} /></a>
            <a href="#" className="social-icon" aria-label="Facebook"><Facebook size={24} /></a>
          </div>

        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Hostel Neustadt. Alle Rechte vorbehalten.</p>
          <div className="footer-links">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
            <Link to="/barrierefreiheit">Barrierefreiheit</Link>
            <Link to="/agb">AGB & Stornierung</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
