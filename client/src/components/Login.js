import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await login(username, password);
    if (res.success) {
      if (window.triggerWipe) window.triggerWipe();
      setTimeout(() => navigate('/dashboard'), 800);
    } else {
      setError(res.message);
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, x: shouldShake ? [-10, 10, -10, 10, -5, 5, 0] : 0 }}
        transition={{ duration: shouldShake ? 0.4 : 0.3 }}
        className="auth-content"
      >
        <div className="glass-panel auth-size">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 className="form-title" style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
              {"Welcome Back".split("").map((char, i) => (
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
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="form-subtitle">
              Enter your credentials to access your account
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <label className="input-label">Username</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
                <input className="form-input" type="text" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </motion.div>

            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Password</label>
                <Link to="/forgot-password" style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', padding: '0 0 8px 0', textDecoration: 'none' }}>Forgot?</Link>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
                <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '16px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </motion.button>
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
              type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px' }}
            >
              {loading ? 'Signing In...' : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>Sign In <ArrowRight size={20} /></div>}
            </motion.button>
          </form>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px', fontSize: '0.9rem' }}
          >
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '700' }}>Create an account</Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
