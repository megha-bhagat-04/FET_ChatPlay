import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Gamepad2, ArrowLeft, AlertCircle, Trophy } from 'lucide-react';
import axios from 'axios';
import { Fireworks } from '../Animations';

function ChatPage({ user, friend, socket, activeGame, onBack, onGameInvite, triggerToast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showBoard, setShowBoard] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [rematchStatus, setRematchStatus] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!user || !friend) return;
    axios.get(`http://localhost:5001/api/messages/${user.id}/${friend.user_id}`)
      .then(r => setMessages(r.data))
      .catch(() => {});
    
    // Mark as read
    axios.post(`http://localhost:5001/api/messages/read/${user.id}/${friend.user_id}`)
      .catch(() => {});
  }, [user, friend]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if ((msg.sender_id === friend?.user_id) || (msg.receiver_id === friend?.user_id)) {
        setMessages(prev => [...prev, msg]);
      }
    };
    socket.on('receive_message', handler);
    socket.on('message_sent', handler);
    return () => { socket.off('receive_message', handler); socket.off('message_sent', handler); };
  }, [socket, friend]);

  const send = () => {
    if (!input.trim() || !socket || !friend) return;
    socket.emit('send_message', { sender_id: user.id, receiver_id: friend.user_id, message: input.trim() });
    setInput('');
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') send(); };

  const fireworksFiredForGame = useRef(null);

  useEffect(() => {
    if (activeGame && activeGame.winner !== 0 && fireworksFiredForGame.current !== activeGame.id) {
      fireworksFiredForGame.current = activeGame.id;
      setShowFireworks(true);
      const timer = setTimeout(() => setShowFireworks(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [activeGame]);

  const handleCellClick = (idx) => {
    if (activeGame && activeGame.myTurn && activeGame.board[idx] === '-') {
      socket.emit('make_move', { game_id: activeGame.id, player_id: user.id, index: idx });
    }
  };

  const filtered = messages.filter(m =>
    (m.sender_id === user.id && m.receiver_id === friend?.user_id) ||
    (m.sender_id === friend?.user_id && m.receiver_id === user.id)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-color)' }}>
      {showFireworks && <Fireworks />}
      {/* Header */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--nav-bg)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', overflow: 'hidden' }}>
              {friend?.profile_pic ? (
                <img 
                  src={`http://localhost:5001/${friend.profile_pic}`} 
                  alt="" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerText = friend.username?.[0]?.toUpperCase() || '?';
                  }}
                />
              ) : friend?.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', background: friend?.online ? 'var(--success-color)' : '#94a3b8', border: '2px solid var(--nav-bg)' }} />
          </div>
          <div>
            <div style={{ fontWeight: '700' }}>{friend?.username}</div>
            <div style={{ fontSize: '0.75rem', color: friend?.online ? 'var(--success-color)' : 'var(--text-muted)' }}>
              {friend?.online ? 'Online' : 'Offline'}
            </div>
          </div>
          <button 
            onClick={async () => {
              const reason = prompt("Enter reason for report:");
              if (reason) {
                try {
                  await axios.post('http://localhost:5001/api/social/report', { reported_user: friend.user_id, reported_by: user.id, reason });
                  alert("User reported to admin.");
                } catch { alert("Failed to send report."); }
              }
            }}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', opacity: 0.6 }}
            title="Report User"
          >
            <AlertCircle size={18} />
          </button>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onGameInvite(friend)} className="btn-primary btn-fit" style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', width: 'auto' }}>
          <Gamepad2 size={18} /> Invite to Game
        </motion.button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* In-chat Tic Tac Toe board (Moved above messages) */}
        {activeGame && (
          <div style={{ alignSelf: 'center', margin: '20px 0', textAlign: 'center' }}>
            {activeGame.winner === user.id && <Fireworks />}
            
            {(activeGame.winner !== 0 && !showBoard) ? (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowBoard(true)}
                className="glass-panel" 
                style={{ 
                  padding: '20px 30px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '12px',
                  border: '2px solid var(--primary-color)',
                  background: 'rgba(99,102,241,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trophy size={20} style={{ color: '#f59e0b' }} />
                  <h4 style={{ fontWeight: '800' }}>Game Summary</h4>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>
                  {activeGame.winner === -1 ? (
                    <span style={{ color: '#f59e0b' }}>Draw!</span>
                  ) : activeGame.winner === user.id ? (
                    <span style={{ color: 'var(--success-color)' }}>You Won! 🏆</span>
                  ) : (
                    <span style={{ color: '#ef4444' }}>You Lost! 💀</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to view full board</div>
              </motion.div>
            ) : (
              <div className="glass-panel" style={{ padding: '28px', display: 'inline-block', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Gamepad2 size={22} style={{ color: 'var(--primary-color)' }} />
                  <h4 style={{ fontWeight: '800', fontSize: '1.1rem' }}>Tic-Tac-Toe</h4>
                </div>
                
                <div style={{ marginBottom: '16px', fontWeight: '800', fontSize: '1.2rem' }}>
                  {activeGame.winner === 0 ? (
                    <div style={{ color: activeGame.myTurn ? 'var(--success-color)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {activeGame.myTurn ? <><motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}>🎯</motion.span> Your Turn (X)</> : 'Opponent\'s Turn (O)'}
                    </div>
                  ) : activeGame.winner === -1 ? (
                    <div style={{ color: '#f59e0b' }}>🤝 It's a Draw!</div>
                  ) : activeGame.winner === user.id ? (
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity }} style={{ color: 'var(--success-color)' }}>🏆 YOU WON!</motion.div>
                  ) : (
                    <div style={{ color: '#ef4444' }}>💀 You Lost!</div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 76px)', gap: '10px', opacity: activeGame.winner !== 0 ? 0.6 : 1 }}>
                  {activeGame.board.split('').map((cell, idx) => (
                    <motion.div key={idx} whileHover={cell === '-' && activeGame.myTurn && activeGame.winner === 0 ? { scale: 1.05 } : {}} whileTap={cell === '-' && activeGame.myTurn && activeGame.winner === 0 ? { scale: 0.95 } : {}} onClick={() => handleCellClick(idx)}
                      style={{ width: '76px', height: '76px', borderRadius: '14px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800', color: cell === 'X' ? 'var(--primary-color)' : 'var(--secondary-color)', cursor: cell === '-' && activeGame.myTurn && activeGame.winner === 0 ? 'pointer' : 'default' }}>
                      {cell !== '-' ? cell : ''}
                    </motion.div>
                  ))}
                </div>
                
                {activeGame.winner !== 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    <motion.button 
                      whileHover={rematchStatus ? {} : { scale: 1.02 }} 
                      whileTap={rematchStatus ? {} : { scale: 0.98 }}
                      onClick={() => {
                        if (rematchStatus) return;
                        onGameInvite(friend);
                        setRematchStatus(true);
                        setTimeout(() => setRematchStatus(false), 2000);
                      }} 
                      className="btn-primary" 
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '700', background: rematchStatus ? 'var(--success-color)' : 'var(--primary-color)', color: 'white', border: 'none', cursor: rematchStatus ? 'default' : 'pointer' }}
                    >
                      {rematchStatus ? 'Rematch Sent!' : 'Play Again'}
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowBoard(false);
                        if (triggerToast) triggerToast('Info', 'Returned to Chat');
                      }} 
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        borderRadius: '12px', 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid var(--surface-border)', 
                        color: 'var(--text-main)', 
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Exit to Chat
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {filtered.map((msg, idx) => {
          const isMe = msg.sender_id === user.id;
          return (
            <motion.div key={msg.message_id || idx} initial={{ opacity: 0, scale: 0.95, x: isMe ? 20 : -20 }} animate={{ opacity: 1, scale: 1, x: 0 }}
              style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
              <div style={{ 
                padding: '12px 16px', 
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', 
                background: isMe ? 'var(--primary-color)' : 'var(--surface-color)', 
                color: isMe ? 'white' : 'var(--text-main)', 
                fontSize: '0.95rem', 
                lineHeight: '1.5',
                border: isMe ? 'none' : '1px solid var(--surface-border)',
                boxShadow: isMe ? '0 4px 12px rgba(99, 102, 241, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}>
                {msg.message}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: isMe ? 'right' : 'left', padding: '0 4px' }}>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </motion.div>
          );
        })}


        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 28px', background: 'var(--nav-bg)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', gap: '10px', background: 'var(--input-bg)', borderRadius: '18px', padding: '8px 8px 8px 18px', border: '1px solid var(--input-border)', alignItems: 'center' }}>
          <input type="text" placeholder="Type your message..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={handleKeyPress}
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem', padding: '6px 0' }} />
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={send} 
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '50%', 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              flexShrink: 0
            }}
          >
            <Send size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
