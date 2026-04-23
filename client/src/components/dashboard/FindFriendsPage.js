import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { ScrambleText } from '../Animations';

function FindFriendsPage({ user, socket }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [imgErrors, setImgErrors] = useState({});

  const fetchUsers = () => {
    if (!user) return;
    axios.get(`http://localhost:5001/api/users/all?userId=${user.id}`)
      .then(async r => {
        setUsers(r.data);
        const s = {};
        await Promise.all(r.data.map(async u => {
          try {
            const res = await axios.get(`http://localhost:5001/api/friends/status?userId=${user.id}&friendId=${u.user_id}`);
            s[u.user_id] = res.data.status;
          } catch { s[u.user_id] = 'none'; }
        }));
        setStatuses(s);
      }).catch(() => {});
  };

  useEffect(() => { 
    fetchUsers(); 
    const refreshProfile = () => fetchUsers();
    window.addEventListener('friend_profile_updated', refreshProfile);
    if (socket) {
      const refresh = () => fetchUsers();
      socket.on('receive_friend_request', refresh);
      socket.on('friend_request_accepted', refresh);
      return () => {
        socket.off('receive_friend_request', refresh);
        socket.off('friend_request_accepted', refresh);
        window.removeEventListener('friend_profile_updated', refreshProfile);
      };
    }
    return () => window.removeEventListener('friend_profile_updated', refreshProfile);
  }, [user, socket]);

  const sendRequest = async (friendId) => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/friends/request', { user_id: user.id, friend_id: friendId });
      setStatuses(prev => ({ ...prev, [friendId]: 'pending' }));
      
      // Real-time notify
      if (socket) {
        socket.emit('send_friend_request', {
          sender_id: user.id,
          receiver_id: friendId,
          sender_username: user.username
        });
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send request');
    } finally { setLoading(false); }
  };

  const handleImgError = (id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '8px' }}>
          <ScrambleText text="Find New Friends" />
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Expand your circle and start new chats.</p>
      </header>
      <input type="text" placeholder="Search by username..." value={search} onChange={e => setSearch(e.target.value)}
        className="form-input no-icon" style={{ marginBottom: '24px', maxWidth: '400px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No users found.</p>}
        {filtered.map((u, i) => (
          <motion.div key={u.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {u.profile_pic && !imgErrors[u.user_id]
                ? <img 
                    src={`http://localhost:5001/${u.profile_pic}`} 
                    alt="pic" 
                    onError={() => handleImgError(u.user_id)}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '1.1rem' }}>{u.username[0].toUpperCase()}</div>
              }
              <div>
                <div style={{ fontWeight: '700' }}>{u.username}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.bio || 'No bio.'}</div>
              </div>
            </div>
            {statuses[u.user_id] === 'accepted' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', fontWeight: '600', fontSize: '0.85rem' }}>
                <CheckCircle size={16} /> Friends
              </div>
            ) : statuses[u.user_id] === 'pending' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>
                <Clock size={16} /> Pending
              </div>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => sendRequest(u.user_id)} disabled={loading}
                className="btn-primary btn-fit" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', width: 'auto' }}>
                <UserPlus size={16} /> Add Friend
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default FindFriendsPage;
