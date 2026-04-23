import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Check, X, Clock } from 'lucide-react';
import axios from 'axios';
import { ScrambleText } from '../Animations';

function GameInvitesPage({ user, socket }) {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);

  const fetchInvites = () => {
    if (!user) return;
    axios.get(`http://localhost:5001/api/games/invites/received/${user.id}`).then(r => setReceived(r.data)).catch(() => {});
    axios.get(`http://localhost:5001/api/games/invites/sent/${user.id}`).then(r => setSent(r.data)).catch(() => {});
  };

  useEffect(() => { fetchInvites(); }, [user]);

  useEffect(() => {
    if (!socket) return;
    socket.on('receive_game_invite', fetchInvites);
    return () => socket.off('receive_game_invite', fetchInvites);
  }, [socket]);

  const accept = async (invite) => {
    try {
      await axios.post('http://localhost:5001/api/games/invites/accept', { invite_id: invite.id, receiver_id: user.id });
      if (socket) socket.emit('accept_game_invite', { invite_id: invite.id, sender_id: invite.sender_id, receiver_id: user.id, game_type: invite.game_type });
      fetchInvites();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const decline = async (inviteId) => {
    await axios.post('http://localhost:5001/api/games/invites/decline', { invite_id: inviteId });
    fetchInvites();
  };

  const cancel = async (inviteId) => {
    await axios.post('http://localhost:5001/api/games/invites/cancel', { invite_id: inviteId });
    fetchInvites();
  };

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '8px' }}>
          <ScrambleText text="Game Invites" />
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Respond to challenges or check your sent requests.</p>
      </header>

      {/* Received */}
      <div style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '20px', padding: '24px', marginBottom: '24px', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Gamepad2 size={20} style={{ color: 'var(--primary-color)' }} />
          <h3 style={{ fontWeight: '700' }}>Challenges Received</h3>
        </div>
        {received.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No challenges received.</p> : received.map((inv, i) => (
          <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < received.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
            <div>
              <span style={{ fontWeight: '700' }}>{inv.sender_username}</span>
              <span style={{ color: 'var(--text-muted)' }}> challenged you to </span>
              <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>{(inv.game_type || '').replace(/_/g, ' ')}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => accept(inv)} className="btn-primary btn-fit" style={{ padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', width: 'auto' }}>
                <Check size={16} /> Accept & Play
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => decline(inv.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                <X size={16} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sent */}
      <div style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '20px', padding: '24px', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Clock size={20} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ fontWeight: '700' }}>Challenges Sent</h3>
        </div>
        {sent.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No pending challenges sent.</p> : sent.map((inv, i) => (
          <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < sent.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Challenge to </span>
              <span style={{ fontWeight: '700' }}>{inv.receiver_username}</span>
              <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: inv.status === 'pending' ? '#f59e0b' : '#ef4444', fontWeight: '600', textTransform: 'uppercase' }}>{inv.status}</span>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => cancel(inv.id)} style={{ background: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
              {inv.status === 'declined' ? 'Dismiss' : 'Cancel'}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default GameInvitesPage;
