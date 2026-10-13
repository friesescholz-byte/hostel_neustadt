import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, User, Bed, ChevronDown } from 'lucide-react';
import RotatingText from './RotatingText';
import './Hero.css';

const parseDateParts = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
};

const addDaysToDateStr = (dateStr, days = 1) => {
  const p = parseDateParts(dateStr);
  if (!p) return dateStr;
  const dt = new Date(p.year, p.month - 1, p.day, 12, 0, 0);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatISODate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Hero = () => {
  const navigate = useNavigate();
  const todayStr = formatISODate(new Date());

  const [checkin, setCheckin] = useState(() => {
    return formatISODate(new Date());
  });

  const [checkout, setCheckout] = useState(() => {
    return addDaysToDateStr(formatISODate(new Date()), 1);
  });

  const [guests, setGuests] = useState('1');

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    navigate(`/buchen?checkin=${checkin}&checkout=${checkout}&guests=${guests}`);
  };

  const handleCheckinChange = (val) => {
    setCheckin(val);
    if (!val) return;
    if (!checkout || checkout <= val) {
      setCheckout(addDaysToDateStr(val, 1));
    }
  };

  const handleCheckoutChange = (val) => {
    if (!val) return;
    if (val <= checkin) {
      setCheckout(addDaysToDateStr(checkin, 1));
      return;
    }
    setCheckout(val);
  };

  return (
    <section className="hero">
      <div className="hero-bg" style={{backgroundImage: "url('https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_133100_27b50ece-1bb3-4038-bcd6-e04b22539324_ergebnis.webp')"}}></div>
      <div className="hero-overlay"></div>
      
      <div className="hero-container">
        <div className="hero-content-left">
          <motion.div 
            className="hero-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                  <input 
                    type="date" 
                    value={checkin} 
                    min={todayStr}
                    onChange={e => handleCheckinChange(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Abreise</label>
                <div className="input-wrapper">
                  <Calendar size={18} className="input-icon" />
                  <input 
                    type="date" 
                    value={checkout} 
                    min={checkin ? addDaysToDateStr(checkin, 1) : todayStr}
                    onChange={e => handleCheckoutChange(e.target.value)} 
                    required 
                  />
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
