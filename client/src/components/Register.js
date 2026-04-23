import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');
    setIsLoading(true);
    setError('');
    try {
      const res = await register(username, email, password);
      if (res.success) {
        if (window.triggerWipe) window.triggerWipe();
        setTimeout(() => navigate('/login'), 800);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="auth-content"
      >
        <div className="glass-panel auth-size">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 className="form-title" style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
              {"Join ChatPlay".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.03, type: "spring", stiffness: 150 }}
                  className="char-span"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="form-subtitle">
              Create your secure account to start chatting
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <label className="input-label">Username</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
                <input className="form-input" type="text" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </motion.div>

            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
                <input className="form-input" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </motion.div>

            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
                <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <label className="input-label">Confirm Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Check size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
                <input className="form-input" type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </motion.div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ color: 'var(--error-color)', fontSize: '0.9rem', textAlign: 'center', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginTop: '10px' }}
              >
                {error}
              </motion.div>
            )}

            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(99, 102, 241, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              animate={{ boxShadow: ["0 8px 16px rgba(99, 102, 241, 0.2)", "0 8px 32px rgba(99, 102, 241, 0.5)", "0 8px 16px rgba(99, 102, 241, 0.2)"] }}
              transition={{ boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
              type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '16px' }}
            >
              {isLoading ? 'Creating Account...' : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>Get Started <ArrowRight size={20} /></div>}
            </motion.button>
          </form>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px', fontSize: '0.9rem' }}
          >
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '700' }}>Sign In</Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;
