import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wifi, User, Users } from 'lucide-react';
import './Rooms.css';

const Rooms = () => {
  const rooms = [
    {
      id: "mehrbettzimmer",
      name: "Mehrbettzimmer",
      desc: "Ideal für Backpacker & Gruppen",
      price: "ab 18 € / Nacht",
      img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
      icons: [<Wifi key="w" size={20} />, <Users key="u" size={20} />]
    },
    {
      id: "doppelzimmer",
      name: "Doppelzimmer",
      desc: "Ideal für Paare & Freunde",
      price: "ab 49 € / Nacht",
      img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
      icons: [<Wifi key="w" size={20} />, <User key="u1" size={20} />, <User key="u2" size={20} />]
    },
    {
      id: "familienzimmer",
      name: "Familienzimmer",
      desc: "Ideal für Familien",
      price: "ab 79 € / Nacht",
      img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      icons: [<Wifi key="w" size={20} />, <Users key="u" size={20} />]
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
                <div className="room-img" style={{ backgroundImage: `url(${room.img})` }}></div>
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
