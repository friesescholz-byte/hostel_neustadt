import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import './Location.css';

const Location = () => {
  const points = [
    "5 Min. zum Bahnhof",
    "10 Min. in die Innenstadt",
    "Supermarkt um die Ecke",
    "Bus direkt vor der Tür"
  ];

  return (
    <section id="lage" className="location section-padding bg-light">
      <div className="container">
        <div className="location-wrapper">
          <motion.div 
            className="location-content"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Mitten in Neustadt</h2>
            <ul className="location-points">
              {points.map((point, i) => (
                <li key={i}>
                  <Check className="check-icon" size={24} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div 
            className="location-map"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Placeholder for actual Google Maps iframe or Map image */}
            <div className="map-placeholder">
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="btn-primary map-btn">
                Route planen
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Location;
