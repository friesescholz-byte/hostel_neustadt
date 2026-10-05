import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Coffee, WashingMachine, Lock, Briefcase, Bike, Wifi } from 'lucide-react';
import './Amenities.css';

const Amenities = () => {
  const amenities = [
    { icon: <Utensils size={32} />, name: "Gemeinschaftsküche" },
    { icon: <Coffee size={32} />, name: "Aufenthaltsraum" },
    { icon: <WashingMachine size={32} />, name: "Waschmaschine" },
    { icon: <Lock size={32} />, name: "Schließfächer" },
    { icon: <Briefcase size={32} />, name: "Gepäckaufbewahrung" },
    { icon: <Bike size={32} />, name: "Fahrradstellplätze" },
    { icon: <Wifi size={32} />, name: "Kostenloses WLAN" }
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
