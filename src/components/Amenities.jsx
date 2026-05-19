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
        
        <div className="amenities-grid">
          {amenities.map((item, i) => (
            <motion.div 
              className="amenity-item"
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="amenity-icon">{item.icon}</div>
              <span>{item.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Amenities;
