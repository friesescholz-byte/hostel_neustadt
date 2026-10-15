import React from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink } from 'lucide-react';
import './Reviews.css';

const GoogleIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const Reviews = () => {
  return (
    <section id="bewertungen" className="reviews-section-compact">
      <div className="reviews-bg-fixed" aria-hidden="true" />
      <div className="reviews-overlay" aria-hidden="true" />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <motion.div 
          className="reviews-compact-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="compact-card-header">
            <GoogleIcon size={34} />
            <div className="compact-stars">
              <Star size={18} fill="#F59E0B" stroke="none" />
              <Star size={18} fill="#F59E0B" stroke="none" />
              <Star size={18} fill="#F59E0B" stroke="none" />
              <Star size={18} fill="#F59E0B" stroke="none" />
              <Star size={18} fill="#F59E0B" stroke="none" />
            </div>
          </div>

          <div className="compact-card-body">
            <h3 className="compact-card-title">Hostel Neustadt bewerten</h3>
            <p className="compact-card-text">
              Hinterlassen Sie uns jetzt Ihre Sternebewertung und Rezension auf Google.
            </p>
          </div>

          <a 
            href="https://g.page/r/CYmSntsQVPf3ECE/review" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-google-compact"
            title="Hostel Neustadt auf Google bewerten"
          >
            <span>Jetzt Rezension schreiben</span>
            <ExternalLink size={17} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Reviews;
