import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Eye, EyeOff, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

function ChangePassword({ onSuccess }) {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await axios.put('http://localhost:5001/api/users/change-password',
        { userId: user.id, currentPassword: formData.currentPassword, newPassword: formData.newPassword },
        { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } }
      );
      setIsSuccess(true);
      setTimeout(() => { if (onSuccess) onSuccess(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ label, id, value, onChange, show, onToggle }) => (
    <div style={{ marginBottom: '18px' }}>
      <label className="input-label">{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Lock style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} size={18} />
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} className="form-input" required placeholder={`Enter ${label.toLowerCase()}`} />
        <button type="button" onClick={onToggle} style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  if (isSuccess) return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: 'var(--success-color)', marginBottom: '12px' }}>
        <CheckCircle size={48} style={{ margin: '0 auto' }} />
      </motion.div>
      <h3 style={{ fontWeight: '800' }}>Password Changed!</h3>
      <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Updating your security settings...</p>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <h3 style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '20px' }}>Security Settings</h3>
      {error && <p style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <InputField label="Current Password" value={formData.currentPassword} onChange={e => setFormData({ ...formData, currentPassword: e.target.value })} show={showPass.current} onToggle={() => setShowPass({ ...showPass, current: !showPass.current })} />
        <div style={{ height: '1px', background: 'var(--surface-border)', margin: '24px 0' }} />
        <InputField label="New Password" value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} show={showPass.new} onToggle={() => setShowPass({ ...showPass, new: !showPass.new })} />
        <InputField label="Confirm New Password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} show={showPass.confirm} onToggle={() => setShowPass({ ...showPass, confirm: !showPass.confirm })} />
        
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', marginTop: '12px', padding: '14px' }}>
          {isLoading ? 'Updating Password...' : 'Update Password'}
        </motion.button>
      </form>
    </div>
  );
}

export default ChangePassword;
