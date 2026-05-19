import React from 'react';
import { motion } from 'framer-motion';
import './CTA.css';

const CTA = () => {
  return (
    <section id="buchen" className="cta-section">
      <div className="cta-bg"></div>
      <div className="container cta-content">
        <motion.div 
          className="cta-text"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <h2>Bereit für deinen Aufenthalt in Neustadt?</h2>
          <p>Buche jetzt dein Zimmer direkt bei uns und sichere dir den besten Preis.</p>
          
          <motion.a 
            href="#buchen" 
            className="btn-primary btn-large btn-light"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            Jetzt Zimmer buchen
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
