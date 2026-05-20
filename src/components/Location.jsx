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
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
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
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div className="map-placeholder">
              <iframe
                title="Google Maps Location"
                src="https://maps.google.com/maps?q=Bahnhofstra%C3%9Fe%2010,%2031535%20Neustadt%20am%20R%C3%BCbenberge&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, position: 'absolute', top: 0, left: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Location;
