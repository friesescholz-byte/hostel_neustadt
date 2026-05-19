import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-bg" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1920&q=80)'}}></div>
      <div className="hero-overlay"></div>
      
      <div className="container hero-content">
        <motion.div 
          className="hero-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Dein Hostel in Neustadt<br/>Zentral. Unkompliziert. Bezahlbar.</h1>
          <p>
            Moderne Zimmer, faire Preise und alles, was du für deinen Aufenthalt brauchst – 
            nur wenige Minuten vom Bahnhof und der Innenstadt entfernt.
          </p>
          
          <div className="hero-actions">
            <a href="#buchen" className="btn-primary">
              Jetzt Zimmer buchen
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
