import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        {question}
        <ChevronDown className={`faq-icon ${isOpen ? 'rotated' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="faq-answer-wrapper"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="faq-answer">
              <p>{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const faqs = [
    {
      question: "Wann ist Check-in und Check-out?",
      answer: "Der Check-in ist ab 15:00 Uhr möglich. Der Check-out muss bis 11:00 Uhr erfolgen. Wir bieten auch einen Self-Check-in für späte Anreisen an."
    },
    {
      question: "Gibt es Parkplätze?",
      answer: "Ja, wir stellen unseren Gästen kostenlose Parkplätze direkt am Hostel zur Verfügung."
    },
    {
      question: "Sind Handtücher inklusive?",
      answer: "Ja, in all unseren Einzel- und Doppelzimmern sind Handtücher und frisch bezogene Bettwäsche bereits im Preis enthalten."
    },
    {
      question: "Gibt es Frühstück?",
      answer: "Wir bieten kein eigenes Frühstück an. In unmittelbarer Nähe (Supermärkte, Bäckereien und Cafés nur wenige Gehminuten entfernt) finden Sie eine vielfältige Auswahl an Frühstücksmöglichkeiten."
    },
    {
      question: "Kann ich spät anreisen?",
      answer: "Ja, durch unseren 24/7 Self-Check-in kannst du jederzeit anreisen. Du erhältst vorab alle nötigen Informationen und Codes per E-Mail."
    },
    {
      question: "Welche Zimmerkategorien gibt es?",
      answer: "Wir bieten komfortable Einzelzimmer für Alleinreisende sowie gemütliche Doppelzimmer für Paare oder Kollegen an."
    },
    {
      question: "Wie funktioniert die Stornierung?",
      answer: "Du kannst deine Buchung bis zu 24 Stunden vor Anreise kostenlos stornieren. Bei späteren Stornierungen berechnen wir den Preis für die erste Nacht."
    },
    {
      question: "Gibt es eine Küche?",
      answer: "Nein, um für alle Gäste ein Höchstmaß an Ruhe, Sauberkeit und Privatsphäre zu gewährleisten, bieten wir keine Gemeinschaftsküche an. In direkter Fußnähe gibt es zahlreiche Restaurants, Imbisse, Bäckereien und Einkaufsmöglichkeiten."
    },
    {
      question: "Ist das WLAN kostenlos?",
      answer: "Ja, wir bieten im gesamten Hostel schnelles, kostenloses WLAN für alle unsere Gäste an."
    }
  ];

  return (
    <section id="faq" className="faq-section section-padding bg-light">
      <div className="container">
        <h2 className="section-title">Häufige Fragen</h2>
        
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
