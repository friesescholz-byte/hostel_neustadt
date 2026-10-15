import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Wifi, ShieldCheck, CalendarCheck } from 'lucide-react';
import './TrustBar.css';

const GoogleIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const TrustBar = () => {
  const items = [
    {
      icon: <GoogleIcon size={24} />,
      link: "https://g.page/r/CYmSntsQVPf3ECE/review",
      title: "Google Bewertungen",
      subtitle: (
        <span className="trust-google-sub">
          <span className="stars-gold">★★★★★</span> · Jetzt bewerten →
        </span>
      )
    },
    {
      icon: <MapPin size={26} strokeWidth={1.5} />,
      title: "Zentrale Lage",
      subtitle: "5 Min. zum Bahnhof"
    },
    {
      icon: <Wifi size={26} strokeWidth={1.5} />,
      title: "Kostenloses WLAN",
      subtitle: "Highspeed Internet"
    },
    {
      icon: <ShieldCheck size={26} strokeWidth={1.5} />,
      title: "Sicher & Sauber",
      subtitle: "Gepflegte Zimmer & Reinigung"
    },
    {
      icon: <CalendarCheck size={26} strokeWidth={1.5} />,
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
          {items.map((item, index) => {
            const CardWrapper = item.link ? 'a' : 'div';
            const cardProps = item.link ? {
              href: item.link,
              target: "_blank",
              rel: "noopener noreferrer",
              title: "Hostel Neustadt auf Google bewerten",
              style: { textDecoration: 'none', color: 'inherit', display: 'block' }
            } : {};

            return (
              <motion.div
                className={`trust-card ${index === 0 ? 'trust-card-wide' : ''} ${item.link ? 'trust-card-interactive' : ''}`}
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <CardWrapper {...cardProps}>
                  {/* Decorative top accent line */}
                  <div className="trust-card-accent"></div>
                  <div className="trust-card-content">
                    {item.icon && <div className="trust-icon-wrap">{item.icon}</div>}
                    <div className="trust-text">
                      <h4>{item.title}</h4>
                      <p>{item.subtitle}</p>
                    </div>
                  </div>
                </CardWrapper>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
