import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wifi, User, Info, ArrowUpRight, Bed } from 'lucide-react';
import './Rooms.css';

const Rooms = () => {
  const rooms = [
    {
      id: "einzelzimmer",
      name: "Einzelzimmer",
      desc: "Ideal für Handwerker, Monteure & Alleinreisende",
      basePrice: "ab 60 €",
      tiers: [
        { duration: "1–3 Tage", price: "70,- €" },
        { duration: "4–6 Tage", price: "65,- €" },
        { duration: "ab 7 Tage", price: "60,- €", highlight: true },
        { duration: "ab 14 Tage", price: "Auf Anfrage" }
      ],
      img: "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_133148_67288b61-b237-4d39-a77a-77344a73cdcc_ergebnis.webp",
      icons: [<Wifi key="w" size={18} />, <User key="u" size={18} />]
    },
    {
      id: "doppelzimmer",
      name: "Doppelzimmer",
      desc: "Perfekt für Paare, Kollegen & Zwei-Personen-Teams",
      basePrice: "ab 80 €",
      tiers: [
        { duration: "1–3 Tage", price: "100,- €" },
        { duration: "4–6 Tage", price: "90,- €" },
        { duration: "ab 7 Tage", price: "80,- €", highlight: true },
        { duration: "ab 14 Tage", price: "Auf Anfrage" }
      ],
      img: "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_134014_fb04fac6-65c1-4b1e-b4b7-00038e0f899c_ergebnis.webp",
      icons: [<Wifi key="w" size={18} />, <User key="u1" size={18} />, <User key="u2" size={18} />]
    }
  ];

  return (
    <section id="zimmer" className="rooms section-padding bg-light">
      <div className="container">
        <div className="section-header-wrap">
          <span className="section-kicker">Übernachten in Neustadt</span>
          <h2 className="section-title">Unsere Zimmer auf einen Blick</h2>
          <p className="section-lead">
            Faire, gestaffelte Übernachtungspreise – je länger Sie bleiben, desto günstiger wird Ihre Nacht.
          </p>
        </div>
        
        <div className="rooms-grid">
          {rooms.map((room, i) => (
            <motion.div 
              className="room-card" 
              key={room.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="room-img-wrapper">
                <div className="room-img" style={{ backgroundImage: `url('${room.img}')` }}></div>
                <div className="room-badge-overlay">{room.basePrice} / Nacht</div>
              </div>
              <div className="room-content">
                <div className="room-top">
                  <h3>{room.name}</h3>
                  <div className="room-icons">
                    {room.icons}
                  </div>
                </div>
                <p className="room-desc">{room.desc}</p>

                {/* Staffelpreise Tabelle */}
                <div className="room-pricing-table">
                  <div className="table-heading">Staffelpreise pro Zimmer / Nacht</div>
                  <div className="tiers-list">
                    {room.tiers.map((t, idx) => (
                      <div key={idx} className={`tier-row ${t.highlight ? 'tier-highlight' : ''}`}>
                        <span className="tier-duration">{t.duration}</span>
                        <span className="tier-price">{t.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="room-footer">
                  <Link to={`/buchen?room=${room.id}`} className="btn-primary w-100">
                    Jetzt buchen
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dezent gestaltete Sonderkonditionen-Hinweise (Scholz & Friese Style) */}
        <motion.div 
          className="rooms-special-notice"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="notice-item">
            <div className="notice-icon">
              <Info size={18} />
            </div>
            <div className="notice-text">
              <strong>Für längerfristige Aufenthalte gelten Sonderkonditionen</strong>
              <p>Sie planen ein größeres Bauprojekt oder mehrere Wochen Aufenthalt? Wir erstellen Ihnen gerne ein individuelles Angebot.</p>
            </div>
            <Link to="/buchen?inquiry=1" className="notice-link">
              <span>Jetzt anfragen</span>
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="notice-divider" />

          <div className="notice-item">
            <div className="notice-icon">
              <Bed size={18} />
            </div>
            <div className="notice-text">
              <strong>Zu Messezeiten gelten Sonderkonditionen</strong>
              <p>Für Messen in Hannover & Großevents gelten gesonderte Saisonraten. Verfügbarkeit und aktuelle Tagespreise werden im Buchungssystem live berechnet.</p>
            </div>
            <Link to="/buchen" className="notice-link">
              <span>Termin prüfen</span>
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Rooms;
