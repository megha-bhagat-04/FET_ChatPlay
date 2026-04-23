import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, ArrowLeft, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const STEPS = {
  EMAIL: 'EMAIL',
  RESET: 'RESET',
  SUCCESS: 'SUCCESS'
};

function ForgotPassword() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get(`http://localhost:5001/api/auth/check-email?email=${email}`);
      if (res.data.exists) {
        setStep(STEPS.RESET);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No account found with this email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5001/api/auth/reset-password', { email, newPassword });
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <div className="glass-panel auth-size" style={{ padding: '48px' }}>
          <AnimatePresence mode="wait">
            {step === STEPS.EMAIL && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailSubmit}
              >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <h1 className="form-title" style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                    {"Forgot Password?".split("").map((char, i) => (
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
                    Enter your email to reset your password.
                  </motion.p>
                </div>

                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <label className="input-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>

                {error && <p style={{ color: 'var(--error-color)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  className="btn-primary" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Checking...' : 'Continue'} <ArrowRight size={18} />
                </motion.button>
                
                <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
                  Back to Login
                </Link>
              </motion.form>
            )}

            {step === STEPS.RESET && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetSubmit}
              >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <h1 className="form-title" style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                    {"New Password".split("").map((char, i) => (
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
                    Choose a secure new password.
                  </motion.p>
                </div>

                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <label className="input-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  </div>
                </div>

                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <label className="input-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>

                {error && <p style={{ color: 'var(--error-color)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Update Password'}
                </motion.button>
              </motion.form>
            )}

            {step === STEPS.SUCCESS && (
              <motion.div
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '64px', height: '64px', background: 'var(--success-color)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Check size={32} />
                  </div>
                </div>
                <h2 className="form-title">Success!</h2>
                <p className="form-subtitle">Your password has been reset successfully.</p>
                <button className="btn-primary" onClick={() => navigate('/login')} style={{ marginTop: '24px' }}>
                  Back to Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
