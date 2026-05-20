import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Wifi, ShieldCheck, CalendarCheck } from 'lucide-react';
import './TrustBar.css';

const TrustBar = () => {
  const items = [
    {
      icon: null,
      title: (
        <>
          <div className="stars" style={{ justifyContent: 'flex-start', marginBottom: '0.2rem' }}>
            <Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" />
          </div>
          4,7/5 bei Google
        </>
      ),
      subtitle: "Über 350 Bewertungen"
    },
    {
      icon: <MapPin size={28} strokeWidth={1.5} />,
      title: "Zentrale Lage",
      subtitle: "5 Min. zum Bahnhof"
    },
    {
      icon: <Wifi size={28} strokeWidth={1.5} />,
      title: "Kostenloses WLAN",
      subtitle: "Highspeed Internet"
    },
    {
      icon: <ShieldCheck size={28} strokeWidth={1.5} />,
      title: "Sicher & Sauber",
      subtitle: "Schließfächer & tägliche Reinigung"
    },
    {
      icon: <CalendarCheck size={28} strokeWidth={1.5} />,
      title: "Flexible Buchung",
      subtitle: "Einfache Stornierung"
    }
  ];

  return (
    <div className="trust-bar-section">
      {/* Decorative background elements */}
      <div className="trust-bg-shapes">
        <div className="trust-bg-circle trust-bg-circle-1"></div>
        <div className="trust-bg-circle trust-bg-circle-2"></div>
        <div className="trust-bg-line trust-bg-line-1"></div>
        <div className="trust-bg-line trust-bg-line-2"></div>
      </div>

      <div className="trust-bar-inner">
        <div className="trust-grid">
          {items.map((item, index) => (
            <motion.div
              className="trust-card"
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              {/* Decorative top accent line */}
              <div className="trust-card-accent"></div>
              <div className="trust-card-content">
                {item.icon && <div className="trust-icon-wrap">{item.icon}</div>}
                <div className="trust-text">
                  <h4>{item.title}</h4>
                  <p>{item.subtitle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
