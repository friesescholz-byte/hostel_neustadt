import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TextRotate = ({ words, className = "" }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words]);

  return (
    <div className={`text-rotate-wrapper ${className}`} style={{ display: 'inline-block', position: 'relative', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '5px' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ display: 'inline-block', minWidth: '350px' }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default TextRotate;
