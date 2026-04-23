import React, { useEffect, useState, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2, Camera, Lock, AlertCircle, Trophy, TrendingUp, XCircle, Edit3 } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import ChangePassword from '../ChangePassword';
import { TiltCard, ScrambleText } from '../Animations';

function ProfilePage({ user, socket }) {
  const { logout, updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', bio: '' });
  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [tab, setTab] = useState('view');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const fileRef = useRef();

  const fetchProfile = () => {
    if (!user || !user.id) return;
    setFetchError(false);
    axios.get(`http://localhost:5001/api/users/profile/${user.id}`)
      .then(r => {
        if (r.data) {
          setProfile(r.data);
          setForm({ 
            username: r.data.username || '', 
            email: r.data.email || '', 
            bio: r.data.bio || '' 
          });
        }
      })
      .catch(() => setFetchError(true));
  };

  useEffect(() => {
    fetchProfile();
    return () => { if (picPreview) URL.revokeObjectURL(picPreview); };
  }, [user]);

  const handlePic = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFile(file);
    setPicPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(''); setErr('');
    try {
      const fd = new FormData();
      fd.append('userId', user.id);
      fd.append('username', form.username.trim());
      fd.append('email', form.email.trim().toLowerCase());
      fd.append('bio', form.bio.trim());
      if (picFile) fd.append('profile_pic', picFile);
      
      const res = await axios.put('http://localhost:5001/api/users/profile', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      const updatedUser = res.data.user;
      const updatedContextUser = {
        id: updatedUser.user_id,
        username: updatedUser.username,
        email: updatedUser.email,
        profile_pic: updatedUser.profile_pic,
        role: updatedUser.role
      };
      
      setProfile(updatedUser);
      updateUser(updatedContextUser);
      
      if (socket) {
        socket.emit('profile_updated', updatedUser);
      }
      
      setMsg('Profile updated successfully!');
      setTab('view');
      setPicFile(null); setPicPreview(null);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to update profile');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you absolutely sure? This will delete your account and all data permanently.')) return;
    try {
      await axios.delete(`http://localhost:5001/api/users/profile/${user.id}`);
      logout();
    } catch (e) {
      setErr('Failed to delete account');
    }
  };

  if (fetchError) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
      <h3>Failed to load profile</h3>
      <button onClick={fetchProfile} className="btn-primary btn-fit">Retry</button>
    </div>
  );

  if (!profile) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Profile...</div>;

  const picUrl = picPreview || (profile.profile_pic ? `http://localhost:5001/${profile.profile_pic}` : null);

  return (
    <div style={{ padding: '40px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Profile Card */}
        <TiltCard>
          <div className="glass-panel" style={{ borderRadius: '32px', overflow: 'hidden', padding: 0 }}>
            <div style={{ height: '180px', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', position: 'relative' }}>
               {/* Abstract decorative elements */}
               <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', top: '-50px', right: '-30px', width: '200px', height: '200px', borderRadius: '40%', background: 'rgba(255,255,255,0.1)' }} />
               
               <div style={{ position: 'absolute', bottom: '-60px', left: '40px', zIndex: 2 }}>
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ 
                      width: '140px', 
                      height: '140px', 
                      borderRadius: '40px', 
                      background: 'var(--primary-color)', 
                      border: '8px solid var(--bg-color)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '4rem',
                      fontWeight: '900',
                      color: 'white',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                    {picUrl ? (
                      <img 
                        src={picUrl} 
                        alt="p" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = profile.username[0].toUpperCase(); }}
                      />
                    ) : profile.username?.[0]?.toUpperCase()}
                  </motion.div>
               </div>
            </div>

            <div style={{ padding: '80px 40px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '32px' }}>
                <div>
                  <h1 className="form-title" style={{ fontSize: '3rem', marginBottom: '4px' }}>
                    <ScrambleText text={profile.username} />
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '24px' }}>{profile.email}</p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ color: 'var(--text-main)', fontSize: '1.15rem', lineHeight: '1.6', maxWidth: '550px', opacity: 0.8 }}
                  >
                    {profile.bio || "No bio yet. Tell your friends something about yourself!"}
                  </motion.p>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  {[
                    { label: 'Wins', value: profile.wins, icon: Trophy, color: 'var(--success-color)' },
                    { label: 'Losses', value: profile.losses, icon: XCircle, color: '#ef4444' },
                    { label: 'Streak', value: profile.streak, icon: TrendingUp, color: 'var(--primary-color)' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5, scale: 1.05 }}
                      style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '28px', textAlign: 'center', minWidth: '110px', border: '1px solid var(--surface-border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' }}
                    >
                      <stat.icon size={24} style={{ color: stat.color, marginBottom: '12px' }} />
                      <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{stat.value || 0}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '48px', flexWrap: 'wrap' }}>
                <button onClick={() => {
                  setForm({ username: profile.username || '', email: profile.email || '', bio: profile.bio || '' });
                  setPicFile(null);
                  setPicPreview(null);
                  setTab('edit');
                }} className={`btn-primary btn-fit ${tab === 'edit' ? '' : 'pulse-primary'}`} style={{ padding: '16px 32px', fontSize: '1.05rem', background: tab === 'edit' ? 'var(--primary-hover)' : 'var(--primary-color)' }}>
                  <Edit3 size={20} /> Edit Profile
                </button>
                
                <button onClick={() => setTab('password')} className="btn-primary btn-fit" style={{ padding: '16px 32px', fontSize: '1.05rem', background: tab === 'password' ? 'var(--secondary-color)' : 'rgba(168, 85, 247, 0.1)', color: tab === 'password' ? 'white' : 'var(--secondary-color)', border: tab === 'password' ? 'none' : '1px solid var(--secondary-color)' }}>
                  <Lock size={20} /> Security Settings
                </button>

                <button onClick={handleDelete} className="btn-primary btn-fit" style={{ marginLeft: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <Trash2 size={20} /> Delete Account
                </button>
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Action Panels */}
        <div style={{ marginTop: '32px' }}>
          <AnimatePresence mode="wait">
            {tab === 'edit' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}
                className="glass-panel" style={{ padding: '40px' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '32px' }}>Update Your Profile</h3>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '32px', overflow: 'hidden', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '900', color: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                      {picUrl ? <img src={picUrl} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = form.username[0].toUpperCase(); }} /> : form.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <button type="button" onClick={() => fileRef.current.click()} className="btn-primary btn-fit" style={{ fontSize: '0.95rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--surface-border)' }}>
                        <Camera size={20} /> Choose New Photo
                      </button>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Recommended: Square image, max 2MB.</p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePic} style={{ display: 'none' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div><label className="input-label">Display Name</label><input className="form-input no-icon" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required /></div>
                    <div><label className="input-label">Email Address</label><input type="email" className="form-input no-icon" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></div>
                  </div>
                  <div><label className="input-label">About You (Bio)</label><textarea className="form-input no-icon" style={{ minHeight: '140px', padding: '20px', lineHeight: '1.6' }} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Share your story with the community..." /></div>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    <button type="submit" className="btn-primary btn-fit pulse-primary" style={{ padding: '16px 40px' }} disabled={loading}>{loading ? 'Saving...' : 'Save Profile Changes'}</button>
                    <button type="button" onClick={() => {
                      setForm({ username: profile.username || '', email: profile.email || '', bio: profile.bio || '' });
                      setPicFile(null);
                      setPicPreview(null);
                      setTab('view');
                    }} className="btn-primary btn-fit" style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>Discard Changes</button>
                  </div>
                </form>
              </motion.div>
            )}

            {tab === 'password' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}
                className="glass-panel" style={{ padding: '40px' }}>
                <ChangePassword onSuccess={() => { setMsg('Password updated successfully!'); setTab('view'); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Toast */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: 30, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 30, x: '-50%' }}
              style={{ position: 'fixed', bottom: '40px', left: '50%', background: 'var(--success-color)', color: 'white', padding: '20px 40px', borderRadius: '100px', fontWeight: '800', boxShadow: '0 20px 50px rgba(16, 185, 129, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%' }}><Save size={20} /></div> {msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ProfilePage;
