import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, User, Bed, ChevronDown } from 'lucide-react';
import RotatingText from './RotatingText';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState('1');

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    navigate(`/buchen?checkin=${checkin}&checkout=${checkout}&guests=${guests}`);
  };
  return (
    <section className="hero">
      <div className="hero-bg" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1920&q=80)'}}></div>
      <div className="hero-overlay"></div>
      
      <div className="hero-container">
        <div className="hero-content-left">
          <motion.div 
            className="hero-text"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hero-eyebrow">
              <span className="star-icon">★</span> NEU GEBAUT. MODERN GEDACHT.
            </span>
            <h1>
              Das Perfekte<br/>
              Zuhause für<br/>
              <RotatingText
                texts={["Handwerker.", "Monteure.", "Geschäftsreisende.", "Dich."]}
                mainClassName="highlight"
                staggerDuration={0.03}
                staggerFrom="last"
                rotationInterval={3000}
              />
            </h1>
            <p>
              Moderne Zimmer, faire Preise und alles, was du für deinen Aufenthalt brauchst – 
              nur wenige Minuten vom Bahnhof und der Innenstadt entfernt.
            </p>
            
            <div className="hero-actions" style={{ marginTop: '2rem' }}>
              <Link to="/buchen" className="btn-hero-special">
                Jetzt Zimmer buchen
              </Link>
              <div className="hero-trust">
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
            <form className="booking-form" onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Anreise</label>
                <div className="input-wrapper">
                  <Calendar size={18} className="input-icon" />
                  <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Abreise</label>
                <div className="input-wrapper">
                  <Calendar size={18} className="input-icon" />
                  <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Gäste</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <select value={guests} onChange={e => setGuests(e.target.value)}>
                    <option value="1">1 Gast</option>
                    <option value="2">2 Gäste</option>
                    <option value="3">3 Gäste</option>
                    <option value="4">4+ Gäste</option>
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
