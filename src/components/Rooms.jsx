import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, User, Users } from 'lucide-react';
import './Rooms.css';

const Rooms = () => {
  const rooms = [
    {
      id: 1,
      name: "Mehrbettzimmer",
      desc: "Ideal für Backpacker & Gruppen",
      price: "ab 18 € / Nacht",
      img: "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/website-datein/hostel_neustadt/room-1.jpg",
      icons: [<Wifi key="w" size={20} />, <Users key="u" size={20} />]
    },
    {
      id: 2,
      name: "Doppelzimmer",
      desc: "Ideal für Paare & Freunde",
      price: "ab 49 € / Nacht",
      img: "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/website-datein/hostel_neustadt/room-2.jpg",
      icons: [<Wifi key="w" size={20} />, <User key="u1" size={20} />, <User key="u2" size={20} />]
    },
    {
      id: 3,
      name: "Familienzimmer",
      desc: "Ideal für Familien",
      price: "ab 79 € / Nacht",
      img: "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/website-datein/hostel_neustadt/room-3.jpg",
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
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <div className="room-img" style={{ backgroundImage: `url(${room.img})` }}></div>
              <div className="room-content">
                <h3>{room.name}</h3>
                <p className="room-desc">{room.desc}</p>
                <div className="room-icons">
                  {room.icons}
                </div>
                <div className="room-footer">
                  <span className="room-price">{room.price}</span>
                  <a href="https://booking.com" target="_blank" rel="noopener noreferrer" className="btn-primary w-100">
                    Jetzt auf Booking.com buchen
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-4">
          <a href="#alle-zimmer" className="btn-link">Alle Zimmer ansehen &rarr;</a>
        </div>
      </div>
    </section>
  );
};

export default Rooms;
