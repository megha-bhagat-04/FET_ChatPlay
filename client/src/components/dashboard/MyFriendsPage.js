import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Gamepad2, UserX, Check, X, Trophy } from 'lucide-react';
import axios from 'axios';
import { ScrambleText } from '../Animations';

function MyFriendsPage({ user, socket, onChat, onGameInvite, initialTab = 'friends' }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [h2hStats, setH2hStats] = useState({});
  const [tab, setTab] = useState(initialTab);
  
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  const [imgErrors, setImgErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [inviteStatus, setInviteStatus] = useState({});

  const handleGameInviteClick = (f) => {
    onGameInvite(f);
    setInviteStatus(prev => ({ ...prev, [f.user_id]: true }));
    setTimeout(() => {
      setInviteStatus(prev => ({ ...prev, [f.user_id]: false }));
    }, 2000);
  };

  const fetchFriends = () => {
    if (!user) return;
    axios.get(`http://localhost:5001/api/social/friends/${user.id}`).then(async r => {
      setFriends(r.data);
      const stats = {};
      await Promise.all(r.data.map(async f => {
        try {
          const res = await axios.get(`http://localhost:5001/api/social/head-to-head/${user.id}/${f.user_id}`);
          stats[f.user_id] = res.data;
        } catch { stats[f.user_id] = { wins: 0, losses: 0, currentStreak: 0 }; }
      }));
      setH2hStats(stats);
      setLoading(false);
    }).catch(() => { setLoading(false); });
    
    axios.get(`http://localhost:5001/api/friends/requests/${user.id}`).then(r => setRequests(r.data)).catch(() => {});
  };

  useEffect(() => { 
    fetchFriends(); 
    const refreshProfile = () => fetchFriends();
    window.addEventListener('friend_profile_updated', refreshProfile);
    if (user && socket) {
      const refresh = () => fetchFriends();
      socket.on('receive_friend_request', refresh);
      socket.on('user_status_change', refresh);
      socket.on('friend_request_accepted', refresh);
      return () => {
        socket.off('receive_friend_request', refresh);
        socket.off('user_status_change', refresh);
        socket.off('friend_request_accepted', refresh);
        window.removeEventListener('friend_profile_updated', refreshProfile);
      };
    }
    return () => window.removeEventListener('friend_profile_updated', refreshProfile);
  }, [user, socket]);

  const unfriend = async (friendId) => {
    if (!window.confirm('Remove this friend?')) return;
    await axios.post('http://localhost:5001/api/friends/remove', { user_id: user.id, friend_id: friendId });
    fetchFriends();
  };

  const acceptRequest = async (requestId, senderId) => {
    await axios.post('http://localhost:5001/api/friends/accept', { user_id: user.id, friend_id: senderId });
    if (socket) socket.emit('accept_friend_request', { sender_id: senderId, receiver_id: user.id });
    fetchFriends();
  };

  const rejectRequest = async (requestId, senderId) => {
    await axios.post('http://localhost:5001/api/friends/reject', { user_id: user.id, friend_id: senderId });
    fetchFriends();
  };

  const handleImgError = (id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  const TabBtn = ({ id, label, count }) => (
    <button onClick={() => setTab(id)} style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', background: tab === id ? 'var(--primary-color)' : 'transparent', color: tab === id ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
      {label} {count > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{count}</span>}
    </button>
  );

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '8px' }}>
          <ScrambleText text="My Friends" />
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Stay connected with your gaming buddies.</p>
      </header>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <TabBtn id="friends" label="My Friends" count={0} />
        <TabBtn id="requests" label="Requests" count={requests.length} />
      </div>

      {tab === 'friends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {friends.length === 0 && !loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No friends yet. Find some!</p>}
          {friends.map((f, i) => {
            const stats = h2hStats[f.user_id] || { wins: 0, losses: 0, currentStreak: 0 };
            return (
              <motion.div key={f.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ position: 'relative' }}>
                    {f.profile_pic && !imgErrors[f.user_id]
                      ? <img src={`http://localhost:5001/${f.profile_pic}`} alt="pic" onError={() => handleImgError(f.user_id)} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white' }}>{f.username[0].toUpperCase()}</div>
                    }
                    <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '11px', height: '11px', borderRadius: '50%', background: f.online ? 'var(--success-color)' : '#94a3b8', border: '2px solid var(--bg-color)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {f.username}
                      {stats.currentStreak > 1 && <span style={{ fontSize: '0.7rem', background: 'rgba(255,165,0,0.1)', color: 'orange', padding: '2px 6px', borderRadius: '4px' }}>🔥 {stats.currentStreak} streak</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <span>Wins: <b style={{ color: 'var(--success-color)' }}>{stats.wins}</b></span>
                      <span>Losses: <b style={{ color: '#ef4444' }}>{stats.losses}</b></span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onChat(f)} style={{ background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem' }}>
                    <MessageSquare size={16} /> Chat
                  </motion.button>
                  <motion.button whileHover={inviteStatus[f.user_id] ? {} : { scale: 1.05 }} whileTap={inviteStatus[f.user_id] ? {} : { scale: 0.95 }} onClick={() => !inviteStatus[f.user_id] && handleGameInviteClick(f)} className={inviteStatus[f.user_id] ? "btn-secondary" : "btn-primary"} style={{ padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', width: 'auto', background: inviteStatus[f.user_id] ? 'var(--success-color)' : 'var(--primary-color)', color: 'white', border: 'none', cursor: inviteStatus[f.user_id] ? 'default' : 'pointer' }}>
                    {inviteStatus[f.user_id] ? <><Check size={16} /> Sent!</> : <><Gamepad2 size={16} /> Play</>}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => unfriend(f.user_id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <UserX size={16} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No pending friend requests.</p>}
          {requests.map((r, i) => (
            <motion.div key={r.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', overflow: 'hidden' }}>
                  {r.profile_pic ? (
                    <img 
                      src={`http://localhost:5001/${r.profile_pic}`} 
                      alt="" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerText = r.username?.[0]?.toUpperCase() || '?';
                      }}
                    />
                  ) : r.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '700' }}>{r.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>sent you a friend request</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => acceptRequest(r.id, r.user_id)} style={{ background: 'var(--success-color)', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem' }}>
                  <Check size={16} /> Accept
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => rejectRequest(r.id, r.user_id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem' }}>
                  <X size={16} /> Reject
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyFriendsPage;
