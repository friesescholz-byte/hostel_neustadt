import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Coins, Bed, Key, Wifi, Users } from 'lucide-react';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: <MapPin size={40} />,
      title: "Top Lage",
      desc: "Zentral und bestens angebunden"
    },
    {
      icon: <Coins size={40} />,
      title: "Faire Preise",
      desc: "Top Qualität zum besten Preis"
    },
    {
      icon: <Bed size={40} />,
      title: "Komfortable Zimmer",
      desc: "Sauber, modern und bequem"
    },
    {
      icon: <Key size={40} />,
      title: "Einfach ankommen",
      desc: "24/7 Check-in & Self-Check-in"
    },
    {
      icon: <Wifi size={40} />,
      title: "Kostenloses WLAN",
      desc: "Überall schnell verbunden"
    },
    {
      icon: <Users size={40} />,
      title: "Für Alle geeignet",
      desc: "Alleinreisende, Paare, Gruppen & Familien"
    }
  ];

  return (
    <section className="features section-padding">
      <div className="container">
        <h2 className="section-title">Warum unser Hostel?</h2>
        
        <div className="features-grid">
          {features.map((feature, i) => (
            <motion.div 
              className="feature-item"
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h4>{feature.title}</h4>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
