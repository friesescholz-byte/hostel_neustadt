import React from 'react';
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
      icon: <MapPin size={32} strokeWidth={1.5} />,
      title: "Zentrale Lage",
      subtitle: "5 Min. zum Bahnhof"
    },
    {
      icon: <Wifi size={32} strokeWidth={1.5} />,
      title: "Kostenloses WLAN",
      subtitle: "Highspeed Internet"
    },
    {
      icon: <ShieldCheck size={32} strokeWidth={1.5} />,
      title: "Sicher & Sauber",
      subtitle: "Schließfächer & tägliche Reinigung"
    },
    {
      icon: <CalendarCheck size={32} strokeWidth={1.5} />,
      title: "Flexible Buchung",
      subtitle: "Einfache Stornierung"
    }
  ];

  return (
    <div className="trust-bar-wrapper">
      <div className="container">
        <div className="trust-bar">
          <div className="trust-grid">
            {items.map((item, index) => (
              <div className="trust-item" key={index}>
                {item.icon && <div className="trust-icon-container">{item.icon}</div>}
                <div className="trust-text">
                  <h4>{item.title}</h4>
                  <p>{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
