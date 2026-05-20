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
    <span className={`text-rotate ${className}`} style={{ display: 'inline-block', position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ display: 'inline-block', whiteSpace: 'nowrap', color: 'inherit' }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default TextRotate;
