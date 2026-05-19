import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import './Reviews.css';

const Reviews = () => {
  const reviews = [
    {
      text: "Super Lage, alles sauber und sehr freundliches Personal.",
      author: "Lisa, Deutschland"
    },
    {
      text: "Perfekt für einen Kurztrip. Komme gerne wieder!",
      author: "Tom, Österreich"
    },
    {
      text: "Tolles Hostel, moderne Zimmer und top Preis-Leistung.",
      author: "Sarah, Schweiz"
    }
  ];

  return (
    <section id="bewertungen" className="reviews section-padding">
      <div className="container">
        <div className="reviews-header">
          <div className="reviews-title">
            <h2>Das sagen unsere Gäste</h2>
          </div>
          <div className="reviews-score">
            <span className="score-number">4,7</span>
            <div className="score-stars">
              <Star fill="currentColor" size={24} />
              <Star fill="currentColor" size={24} />
              <Star fill="currentColor" size={24} />
              <Star fill="currentColor" size={24} />
              <Star fill="currentColor" size={24} />
            </div>
            <span className="score-text">bei Google</span>
          </div>
        </div>

        <div className="reviews-grid">
          {reviews.map((review, i) => (
            <motion.div 
              className="review-card"
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <p className="review-text">"{review.text}"</p>
              <div className="review-author">
                <span className="author-name">- {review.author}</span>
                <div className="google-icon">G</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-4">
          <a href="https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="google-icon" style={{ width: '20px', height: '20px', fontSize: '0.7rem' }}>G</div>
            Auf Google bewerten
          </a>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
