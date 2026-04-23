import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const AnimatedTitle = ({ text, className = "" }) => {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.h1
      className={`staggered-text ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25em' }}
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          key={index}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
};

export const FadeInStagger = ({ children, delay = 0, className = "" }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {React.Children.map(children, child => (
        <motion.div variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export const TiltCard = ({ children, className = "", style = {} }) => {
  return (
    <motion.div
      whileHover={{ 
        rotateX: 2, 
        rotateY: -2, 
        scale: 1.02,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`tilt-card ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
};
export const Fireworks = () => {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: '50vw', y: '100vh', opacity: 1 }}
          animate={{ 
            scale: [0, 1, 0],
            x: `${20 + Math.random() * 60}vw`,
            y: `${20 + Math.random() * 60}vh`,
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: 1.5, 
            delay: i * 0.3, 
            repeat: Infinity,
            ease: "easeOut" 
          }}
          style={{ 
            position: 'absolute',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: i % 2 === 0 ? 'var(--primary-color)' : 'var(--secondary-color)',
            boxShadow: `0 0 20px ${i % 2 === 0 ? 'var(--primary-color)' : 'var(--secondary-color)'}`
          }}
        />
      ))}
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={`p-${i}`}
          initial={{ scale: 0, x: '50vw', y: '50vh', opacity: 1 }}
          animate={{ 
            x: `${Math.random() * 100}vw`,
            y: `${Math.random() * 100}vh`,
            scale: [0, 0.5, 0],
            opacity: [1, 0]
          }}
          transition={{ 
            duration: 2, 
            delay: Math.random() * 2, 
            repeat: Infinity,
            ease: "easeOut"
          }}
          style={{ 
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 0 10px white'
          }}
        />
      ))}
    </div>
  );
};
export const ScrambleText = ({ text }) => {
  const [display, setDisplay] = useState(text);
  const chars = "!<>-_\\/[]{}—=+*^?#________";
  
  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(text.split("").map((char, index) => {
        if (index < iteration) return text[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1/3;
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{display}</span>;
};
