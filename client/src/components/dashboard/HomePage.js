import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, MessageSquare, TrendingUp, Star, Zap } from 'lucide-react';
import axios from 'axios';
import { AnimatedTitle, FadeInStagger, TiltCard, ScrambleText } from '../Animations';

function HomePage({ user, socket, onNavigate }) {
  const [recentMsgs, setRecentMsgs] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, streak: 0 });

  const fetchData = () => {
    if (!user) return;
    axios.get(`http://localhost:5001/api/users/profile/${user.id}`)
      .then(r => setStats({ wins: r.data.wins || 0, losses: r.data.losses || 0, streak: r.data.streak || 0 }))
      .catch(() => {});
    axios.get(`http://localhost:5001/api/messages/recent/${user.id}`)
      .then(r => setRecentMsgs(r.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
    const refreshProfile = () => fetchData();
    window.addEventListener('friend_profile_updated', refreshProfile);
    if (user && socket) {
      const refresh = () => fetchData();
      socket.on('receive_message', refresh);
      socket.on('message_sent', refresh);
      return () => {
        socket.off('receive_message', refresh);
        socket.off('message_sent', refresh);
        window.removeEventListener('friend_profile_updated', refreshProfile);
      };
    }
    return () => window.removeEventListener('friend_profile_updated', refreshProfile);
  }, [user, socket]);

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.03em' }}>
          Welcome back, <span style={{ color: 'var(--primary-color)' }}><ScrambleText text={user.username} /></span>!
        </h1>
      </header>
      
      <FadeInStagger delay={0.2}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { label: 'Total Wins', value: stats.wins, color: 'var(--success-color)', icon: Trophy },
            { label: 'Losses', value: stats.losses, color: 'var(--error-color)', icon: Star },
            { label: 'Current Streak', value: stats.streak, color: '#f59e0b', icon: Zap },
          ].map((s, i) => (
            <TiltCard key={i}>
              <div style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '20px', padding: '24px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', background: `${s.color}15`, color: s.color }}>
                    <s.icon size={24} />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '900', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{s.label}</div>
              </div>
            </TiltCard>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          <TiltCard onClick={() => onNavigate('find')}>
            <div className="glass-panel" style={{ padding: '28px', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                <Users size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '6px' }}>Discover Friends</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>Connect with new players and expand your gaming network across the platform.</p>
              </div>
            </div>
          </TiltCard>

          <TiltCard onClick={() => onNavigate('friends')}>
            <div className="glass-panel" style={{ padding: '28px', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-color)' }}>
                <TrendingUp size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '6px' }}>Challenge Others</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>View your active friends and jump into a quick game of Tic Tac Toe to keep your streak.</p>
              </div>
            </div>
          </TiltCard>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <MessageSquare size={22} style={{ color: 'var(--primary-color)' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Recent Conversations</h3>
          </div>
          {recentMsgs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Your inbox is quiet today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentMsgs.map((m, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: 10, background: 'rgba(255,255,255,0.03)' }}
                  onClick={() => onNavigate('chat', m)} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'white', overflow: 'hidden' }}>
                      {m.profile_pic ? (
                        <img src={`http://localhost:5001/${m.profile_pic}`} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = m.username[0].toUpperCase(); }} />
                      ) : m.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: m.unread_count > 0 ? '900' : '700', fontSize: '1.05rem', color: m.unread_count > 0 ? 'var(--primary-color)' : 'var(--text-main)' }}>{m.username}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{m.last_msg || 'Click to start chatting...'}</div>
                    </div>
                  </div>
                  {m.unread_count > 0 && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ background: 'var(--primary-color)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' }}
                    >
                      {m.unread_count}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </FadeInStagger>
    </div>
  );
}

export default HomePage;
