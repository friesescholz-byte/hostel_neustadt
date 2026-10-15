import React from 'react';
import { motion } from 'framer-motion';
import { Accessibility, Car, Wifi, ShowerHead, Tv, Bed, KeyRound, CigaretteOff } from 'lucide-react';
import './Amenities.css';

const Amenities = () => {
  const amenities = [
    { icon: <Accessibility size={32} strokeWidth={1.5} />, name: "Barrierefreies Zimmer (Zimmer 2)" },
    { icon: <Car size={32} strokeWidth={1.5} />, name: "Kostenlose Parkplätze" },
    { icon: <Wifi size={32} strokeWidth={1.5} />, name: "Kostenloses WLAN" },
    { icon: <ShowerHead size={32} strokeWidth={1.5} />, name: "Eigenes Bad mit Dusche & WC" },
    { icon: <Tv size={32} strokeWidth={1.5} />, name: "Flachbild-TV im Zimmer" },
    { icon: <Bed size={32} strokeWidth={1.5} />, name: "Bettwäsche & Handtücher inkl." },
    { icon: <KeyRound size={32} strokeWidth={1.5} />, name: "24/7 Self-Check-in" },
    { icon: <CigaretteOff size={32} strokeWidth={1.5} />, name: "Nichtraucherzimmer" }
  ];

  return (
    <section id="ausstattung" className="amenities section-padding">
      <div className="container">
        <h2 className="section-title" style={{ display: 'none' }}>Ausstattung</h2>
        
        <motion.div 
          className="amenities-grid"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {amenities.map((item, i) => (
            <div className="amenity-item" key={i}>
              <div className="amenity-icon">{item.icon}</div>
              <span className="amenity-name">{item.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Amenities;
