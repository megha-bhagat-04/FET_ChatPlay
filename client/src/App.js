import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import './App.css';

// --- REFERENCE ANIMATION COMPONENTS ---

const AnimatedBackground = () => (
  <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: -1, pointerEvents: 'none' }}>
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        animate={{
          x: [0, 40, -40, 0],
          y: [0, -40, 40, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 15 + i * 2,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: i % 2 === 0 ? 'var(--primary-color)' : 'var(--secondary-color)',
          filter: 'blur(100px)',
          opacity: 0.07,
          left: `${(i * 25) % 100}%`,
          top: `${(i * 30) % 100}%`,
        }}
      />
    ))}
  </div>
);

const ClickRipple = () => {
  const [ripples, setRipples] = useState([]);
  useEffect(() => {
    const handleClick = (e) => {
      const id = Date.now();
      setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);
  return (
    <AnimatePresence>
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '2px solid var(--primary-color)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      ))}
    </AnimatePresence>
  );
};

const Fireworks = ({ active }) => {
  if (!active) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10001 }}>
      {[...Array(5)].map((_, burstIdx) => (
        <div key={burstIdx} style={{ 
          position: 'absolute', 
          left: `${15 + Math.random() * 70}%`, 
          top: `${20 + Math.random() * 40}%` 
        }}>
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, scale: 0 }}
              animate={{ 
                x: (Math.random() - 0.5) * 450, 
                y: (Math.random() - 0.5) * 450, 
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0] 
              }}
              transition={{ duration: 1.2, ease: "easeOut", delay: burstIdx * 0.4 }}
              style={{
                position: 'absolute',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: `hsl(${Math.random() * 360}, 100%, 70%)`,
                boxShadow: '0 0 15px currentColor'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const carouselImages = [
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=1932&auto=format&fit=crop'
];

const BackgroundCarousel = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % carouselImages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="carousel-root" style={{ background: '#000' }}>
      <AnimatedBackground />
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            inset: 0,
            background: `url(${carouselImages[index]}) center/cover`,
            zIndex: -1
          }}
        />
      </AnimatePresence>
      <div className="auth-overlay" style={{ backdropFilter: 'blur(10px) brightness(0.7)' }} />
    </div>
  );
};

const ThemeToggle = ({ theme, toggle }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="theme-toggle"
    onClick={toggle}
  >
    {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
  </motion.button>
);

function App() {
  const [theme, setTheme] = useState('light'); // User requested light as default
  const [isWiping, setIsWiping] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : '';
  }, [theme]);

  useEffect(() => {
    window.triggerWipe = () => {
      setIsWiping(true);
      setTimeout(() => setIsWiping(false), 1000);
    };
    window.triggerFireworks = () => {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 4000);
    };
  }, []);

  return (
    <AuthProvider>
      <div className={`App ${theme === 'light' ? 'light-mode' : ''}`}>
        <ClickRipple />
        <Fireworks active={showFireworks} />
        
        <AnimatePresence>
          {isWiping && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '-100%' }}
              exit={{ y: '-100%' }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
              className="liquid-wipe"
            />
          )}
        </AnimatePresence>

        <Router>
          <Routes>
            <Route path="/login" element={<><BackgroundCarousel /><Login /><ThemeToggle theme={theme} toggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')} /></>} />
            <Route path="/register" element={<><BackgroundCarousel /><Register /><ThemeToggle theme={theme} toggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')} /></>} />
            <Route path="/forgot-password" element={<><BackgroundCarousel /><ForgotPassword /><ThemeToggle theme={theme} toggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')} /></>} />
            <Route path="/dashboard/*" element={<Dashboard theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
