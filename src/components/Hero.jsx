import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-bg" style={{backgroundImage: 'url(https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/website-datein/hostel_neustadt/hero.jpg)'}}></div>
      <div className="hero-overlay"></div>
      
      <div className="container hero-content">
        <motion.div 
          className="hero-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1>Dein Hostel in Neustadt<br/>Zentral. Unkompliziert. Bezahlbar.</h1>
          <p>
            Moderne Zimmer, faire Preise und alles, was du für deinen Aufenthalt brauchst – 
            nur wenige Minuten vom Bahnhof und der Innenstadt entfernt.
          </p>
          
          <div className="hero-actions">
            <a href="https://booking.com" target="_blank" rel="noopener noreferrer" className="btn-primary">
              Jetzt auf Booking.com buchen
            </a>
            <div className="hero-trust">
              <ShieldCheck size={20} className="trust-icon" />
              <span>Schnell, sicher & zum besten Preis</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
