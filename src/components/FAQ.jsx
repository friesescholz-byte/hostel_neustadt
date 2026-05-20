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
      answer: "Ja, wir haben eigene Parkplätze für unsere Gäste direkt am Hostel. Diese kosten 5€ pro Nacht."
    },
    {
      question: "Sind Handtücher inklusive?",
      answer: "In den Doppel- und Familienzimmern sind Handtücher inklusive. Für die Mehrbettzimmer können Handtücher an der Rezeption für 2€ ausgeliehen werden."
    },
    {
      question: "Gibt es Frühstück?",
      answer: "Wir bieten kein eigenes Frühstück an, aber in unserer voll ausgestatteten Gemeinschaftsküche kannst du dir jederzeit selbst etwas zubereiten. Ein Supermarkt ist direkt um die Ecke."
    },
    {
      question: "Kann ich spät anreisen?",
      answer: "Ja, durch unseren 24/7 Self-Check-in kannst du jederzeit anreisen. Du erhältst vorab alle nötigen Informationen und Codes per E-Mail."
    },
    {
      question: "Gibt es Einzelzimmer?",
      answer: "Aktuell bieten wir Mehrbettzimmer, Doppelzimmer und Familienzimmer an. Doppelzimmer können auch zur Einzelnutzung gebucht werden."
    },
    {
      question: "Wie funktioniert die Stornierung?",
      answer: "Du kannst deine Buchung bis zu 24 Stunden vor Anreise kostenlos stornieren. Bei späteren Stornierungen berechnen wir den Preis für die erste Nacht."
    },
    {
      question: "Gibt es eine Küche?",
      answer: "Ja, wir haben eine große, gut ausgestattete Gemeinschaftsküche, die von allen Gästen genutzt werden kann."
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
