import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, User, Bed, ChevronDown } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-bg" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1920&q=80)'}}></div>
      <div className="hero-overlay"></div>
      
      <div className="container hero-container">
        <div className="hero-content-left">
          <motion.div 
            className="hero-text"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hero-eyebrow">✨ NEU ERÖFFNET: IDEAL FÜR HANDWERKER & MONTEURE</span>
            <h1>
              Dein Hostel in Neustadt<br/>
              <span className="highlight">Zentral. Unkompliziert. Bezahlbar.</span>
            </h1>
            <p>
              Moderne Zimmer, faire Preise und alles, was du für deinen Aufenthalt brauchst – 
              nur wenige Minuten vom Bahnhof und der Innenstadt entfernt.
            </p>
            
            <div className="hero-actions" style={{ marginTop: '2rem' }}>
              <a href="#buchen" className="btn-primary">
                Jetzt Zimmer buchen
              </a>
              <div className="hero-trust" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', opacity: 0.8, fontSize: '0.9rem', flexWrap: 'wrap' }}>
                <span>✓ Flexible Stornierung</span>
                <span>✓ 24/7 Self-Check-in</span>
                <span>✓ Kostenlose Parkplätze</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="hero-content-right">
          <motion.div 
            className="booking-form-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="form-header">
              <h3>Jetzt buchen</h3>
              <Bed className="header-icon" size={28} />
            </div>
            <form className="booking-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label>Anreise</label>
                <div className="input-wrapper">
                  <Calendar size={18} className="input-icon" />
                  <input type="text" placeholder="Datum wählen" readOnly />
                </div>
              </div>
              <div className="form-group">
                <label>Abreise</label>
                <div className="input-wrapper">
                  <Calendar size={18} className="input-icon" />
                  <input type="text" placeholder="Datum wählen" readOnly />
                </div>
              </div>
              <div className="form-group">
                <label>Gäste</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <select defaultValue="1 Gast">
                    <option value="1 Gast">1 Gast</option>
                    <option value="2 Gäste">2 Gäste</option>
                    <option value="3 Gäste">3 Gäste</option>
                    <option value="4+ Gäste">4+ Gäste</option>
                  </select>
                  <ChevronDown size={18} className="select-arrow" />
                </div>
              </div>
              <button type="submit" className="btn-primary form-submit-btn">
                Verfügbarkeit prüfen
              </button>
            </form>
            <div className="form-footer">
              <ShieldCheck size={16} className="trust-icon-small" />
              <span>Schnell, sicher & zum besten Preis</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
