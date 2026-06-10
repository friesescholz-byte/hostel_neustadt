import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wifi, User } from 'lucide-react';
import './Rooms.css';

const Rooms = () => {
  const rooms = [
    {
      id: "einzelzimmer",
      name: "Einzelzimmer",
      desc: "Ideal für Handwerker, Monteure & Alleinreisende",
      price: "ab 39 € / Nacht",
      img: "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_133148_67288b61-b237-4d39-a77a-77344a73cdcc_ergebnis.webp",
      icons: [<Wifi key="w" size={20} />, <User key="u" size={20} />]
    },
    {
      id: "doppelzimmer",
      name: "Doppelzimmer",
      desc: "Ideal für Paare & Kollegen",
      price: "ab 49 € / Nacht",
      img: "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_134014_fb04fac6-65c1-4b1e-b4b7-00038e0f899c_ergebnis.webp",
      icons: [<Wifi key="w" size={20} />, <User key="u1" size={20} />, <User key="u2" size={20} />]
    }
  ];

  return (
    <section id="zimmer" className="rooms section-padding bg-light">
      <div className="container">
        <h2 className="section-title">Unsere Zimmer auf einen Blick</h2>
        
        <div className="rooms-grid">
          {rooms.map((room, i) => (
            <motion.div 
              className="room-card" 
              key={room.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="room-img-wrapper">
                <div className="room-img" style={{ backgroundImage: `url('${room.img}')` }}></div>
              </div>
              <div className="room-content">
                <h3>{room.name}</h3>
                <p className="room-desc">{room.desc}</p>
                <div className="room-icons">
                  {room.icons}
                </div>
                <div className="room-footer">
                  <span className="room-price">{room.price}</span>
                  <Link to={`/buchen?room=${room.id}`} className="btn-primary w-100">
                    Jetzt buchen
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Rooms;
