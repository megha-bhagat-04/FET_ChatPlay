import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, Search, ArrowRight, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { ScrambleText, FadeInStagger, TiltCard } from '../Animations';

function InboxPage({ user, socket, onChat, onNavigate }) {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInbox = () => {
    if (!user) return;
    axios.get(`http://localhost:5001/api/messages/inbox/${user.id}`)
      .then(r => {
        setConversations(r.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchInbox();
    const refreshProfile = () => fetchInbox();
    window.addEventListener('friend_profile_updated', refreshProfile);
    if (user && socket) {
      const refresh = () => fetchInbox();
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

  const deleteChat = async (e, friendId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this entire chat history?")) return;
    
    try {
      await axios.delete(`http://localhost:5001/api/messages/conversation/${user.id}/${friendId}`);
      setConversations(prev => prev.filter(c => c.user_id !== friendId));
    } catch (err) {
      alert("Failed to delete conversation.");
    }
  };

  const filtered = conversations.filter(c => 
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const markAllRead = async () => {
    try {
      await axios.post(`http://localhost:5001/api/messages/read-all/${user.id}`);
      fetchInbox();
      if (onNavigate) onNavigate('inbox');
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '8px' }}>
            <ScrambleText text="Messages" />
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your conversations and stay in touch.</p>
        </div>
        {conversations.some(c => c.unread_count > 0) && (
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={markAllRead}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '12px', 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: 'var(--primary-color)', 
              border: 'none', 
              fontSize: '0.85rem', 
              fontWeight: '700', 
              cursor: 'pointer' 
            }}
          >
            Mark all as read
          </motion.button>
        )}
      </header>

      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search conversations..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="form-input" 
          style={{ maxWidth: '400px' }} 
        />
      </div>

      <FadeInStagger>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: 'inline-block' }}>
              <MessageCircle size={40} style={{ color: 'var(--primary-color)', opacity: 0.5 }} />
            </motion.div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', margin: '0 auto 24px' }}>
              <MessageSquare size={40} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>No messages yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Start a conversation with one of your friends.</p>
            <button onClick={() => onNavigate('friends')} className="btn-primary btn-fit">Start Chat</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((c, i) => (
              <motion.div 
                key={c.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.01, x: 5 }}
                onClick={() => onChat(c)}
                className="glass-panel"
                style={{ 
                  padding: '20px 24px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderLeft: c.unread_count > 0 ? '4px solid var(--primary-color)' : '1px solid var(--surface-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'white', fontSize: '1.2rem', overflow: 'hidden' }}>
                      {c.profile_pic ? (
                        <img 
                          src={`http://localhost:5001/${c.profile_pic}`} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerText = c.username?.[0]?.toUpperCase() || '?';
                          }}
                        />
                      ) : c.username?.[0]?.toUpperCase()}
                    </div>
                    {c.unread_count > 0 && (
                      <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', fontSize: '0.7rem', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', border: '2px solid var(--bg-color)' }}>
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', fontSize: '1.1rem', color: c.unread_count > 0 ? 'var(--primary-color)' : 'var(--text-main)' }}>{c.username}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.last_time ? new Date(c.last_time).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: c.unread_count > 0 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: c.unread_count > 0 ? '600' : '400', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                        {c.last_msg || 'No messages yet'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '24px' }}>
                  <motion.button 
                    whileHover={{ scale: 1.1, color: '#ef4444' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => deleteChat(e, c.user_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
                    title="Delete Conversation"
                  >
                    <Trash2 size={20} />
                  </motion.button>
                  <ArrowRight size={20} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </FadeInStagger>
    </div>
  );
}

export default InboxPage;
