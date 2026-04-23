import React, { useContext, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  MessageSquare, 
  Gamepad2, 
  User, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X,
  Shield,
  Moon,
  Sun
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { io } from 'socket.io-client';

// Pages
import HomePage from './dashboard/HomePage';
import FindFriendsPage from './dashboard/FindFriendsPage';
import MyFriendsPage from './dashboard/MyFriendsPage';
import GameInvitesPage from './dashboard/GameInvitesPage';
import ChatPage from './dashboard/ChatPage';
import ProfilePage from './dashboard/ProfilePage';
import AdminPage from './dashboard/AdminPage';
import InboxPage from './dashboard/InboxPage';
import { ScrambleText } from './Animations';

const SOCKET_URL = 'http://localhost:5001';

// Shared Components

const AnimatedDashboardBackground = ({ isDarkMode }) => {
  const bubbles = Array.from({ length: 15 });
  
  return (
    <div style={{ 
      position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none',
      background: isDarkMode 
          ? 'linear-gradient(to bottom right, #1e1b4b, #3b0764, #0f172a)'
          : 'linear-gradient(to bottom right, #f3e8ff, #f8fafc, #f5f3ff)'
    }}>
      {bubbles.map((_, i) => {
        const size = 40 + (i * 27) % 100;
        const left = (i * 13) % 100;
        const duration = 12 + (i * 7) % 20;
        const delay = (i * 3) % 10;
        
        return (
          <motion.div
            key={i}
            initial={{ y: '120vh', x: `${left}vw`, opacity: isDarkMode ? 0.15 : 0.3 }}
            animate={{ 
              y: '-20vh',
              x: [`${left}vw`, `${left + (i%2===0?10:-10)}vw`, `${left}vw`]
            }}
            transition={{
              y: { duration: duration, repeat: Infinity, ease: "linear", delay: delay },
              x: { duration: duration / 1.5, repeat: Infinity, ease: "easeInOut", delay: delay }
            }}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              background: isDarkMode 
                ? `linear-gradient(135deg, rgba(168,85,247,0.2), rgba(126,34,206,0.1))` 
                : `linear-gradient(135deg, rgba(168,85,247,0.3), rgba(216,180,254,0.1))`,
              backdropFilter: 'blur(5px)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'}`,
              boxShadow: isDarkMode ? 'none' : 'inset 0 0 20px rgba(255,255,255,0.5)'
            }}
          />
        );
      })}
    </div>
  );
};

function Dashboard({ theme, toggleTheme }) {
  const isDarkMode = theme === 'dark';
  const setIsDarkMode = toggleTheme;
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [socket, setSocket] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [unreadGameInvites, setUnreadGameInvites] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [gameInvite, setGameInvite] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [toast, setToast] = useState(null);
  const [friendsInitialTab, setFriendsInitialTab] = useState('friends');

  // Initialize socket once
  useEffect(() => {
    if (!user) return;
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit('register_user', user.id);
    });

    return () => {
      console.log("Disconnecting socket");
      newSocket.disconnect();
    };
  }, [user?.id]);

  // Global listeners and initial data
  useEffect(() => {
    if (!socket || !user) return;

    // 1. Initial fetches
    axios.get(`${SOCKET_URL}/api/messages/count/unread/${user.id}`)
      .then(r => setUnreadMessages(r.data.count))
      .catch(() => {});
    axios.get(`${SOCKET_URL}/api/friends/requests/${user.id}`)
      .then(r => setUnreadRequests(r.data.length))
      .catch(() => {});
    axios.get(`${SOCKET_URL}/api/games/invites/received/${user.id}`)
      .then(r => setUnreadGameInvites(r.data.length))
      .catch(() => {});
    axios.get(`${SOCKET_URL}/api/notifications/${user.id}`)
      .then(r => setNotifications(r.data))
      .catch(() => {});

    // 2. Socket Listeners
    const triggerToast = (title, message) => {
      setToast({ title, message });
      setTimeout(() => setToast(null), 3000);
    };

    const onMessage = (msg) => {
      if (activeTab === 'chat' && activeChatFriend?.user_id === msg.sender_id) return;
      if (activeTab !== 'inbox' && activeTab !== 'chat') setUnreadMessages(prev => prev + 1);
      const txt = msg.message_text || `A new message from ${msg.sender_username || 'a friend'}`;
      setNotifications(prev => [{
        id: msg.notif_id || Date.now(),
        message: txt,
        type: 'message',
        target_id: msg.sender_id
      }, ...prev]);
      triggerToast('New Message', txt);
    };

    const onFriendRequest = (data) => {
      if (activeTab !== 'friends') setUnreadRequests(prev => prev + 1);
      const txt = data.message || `${data.sender_username} sent you a friend request.`;
      setNotifications(prev => [{ id: data.id || Date.now(), message: txt, type: 'friend_request', target_id: data.sender_id }, ...prev]);
      triggerToast('Friend Request', txt);
    };

    const onGameInvite = (data) => {
      if (activeTab !== 'invites') setUnreadGameInvites(prev => prev + 1);
      const txt = data.message || `${data.sender_username} invited you to play`;
      setNotifications(prev => [{ id: data.notif_id || Date.now(), message: txt, type: 'game_invite', target_id: data.id }, ...prev]);
      
      // Only show the intrusive popup if it came from chat
      if (data.source === 'chat') {
        setGameInvite(data);
      }
      
      triggerToast('Game Challenge', txt);
    };

    const onAccepted = (data) => {
      const txt = data.message || `Friend request accepted.`;
      setNotifications(prev => [{ id: data.id || Date.now(), message: txt, type: 'friend_accepted', target_id: data.receiver_id }, ...prev]);
      triggerToast('Request Accepted', txt);
    };

    const onGameStarted = (game) => {
      setActiveGame({ id: game.game_id, board: '---------', turn: game.turn, opponent: game.opponent_id, myTurn: game.turn === user.id, winner: 0 });
      setGameInvite(null);
      handleNavigate('chat');
    };

    const onGameUpdate = (data) => {
      setActiveGame(prev => {
        if (!prev || prev.id !== data.game_id) return prev;
        return { ...prev, board: data.board, turn: data.turn, winner: data.winner, myTurn: data.turn === user.id };
      });
    };

    const onUserProfileUpdate = (updatedUserData) => {
      setActiveChatFriend(prev => {
        if (prev && prev.user_id === updatedUserData.user_id) {
          return { ...prev, username: updatedUserData.username, profile_pic: updatedUserData.profile_pic, bio: updatedUserData.bio };
        }
        return prev;
      });
      window.dispatchEvent(new CustomEvent('friend_profile_updated', { detail: updatedUserData }));
    };

    socket.on('receive_message', onMessage);
    socket.on('receive_friend_request', onFriendRequest);
    socket.on('receive_game_invite', onGameInvite);
    socket.on('friend_request_accepted', onAccepted);
    socket.on('game_started', onGameStarted);
    socket.on('game_updated', onGameUpdate);
    socket.on('user_profile_updated', onUserProfileUpdate);

    return () => {
      socket.off('receive_message', onMessage);
      socket.off('receive_friend_request', onFriendRequest);
      socket.off('receive_game_invite', onGameInvite);
      socket.off('friend_request_accepted', onAccepted);
      socket.off('game_started', onGameStarted);
      socket.off('game_updated', onGameUpdate);
      socket.off('user_profile_updated', onUserProfileUpdate);
    };
  }, [socket, user, activeTab, activeChatFriend]);

  const clearNotifications = async () => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/clear/${user.id}`);
      setNotifications([]);
    } catch { alert("Failed to clear notifications"); }
  };

  const markAsRead = async (notifId, type, targetId) => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/read/${notifId}`);
    } catch (err) {
      // Ignore API errors for local-only real-time notifications
    }
    
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    
    // Smart Redirection (execute regardless of API success)
    if (type === 'message') {
      handleNavigate('inbox');
    } else if (type === 'game_invite') {
      handleNavigate('invites');
    } else if (type === 'friend_request') {
      handleNavigate('friends', 'requests');
    } else if (type === 'friend_accepted') {
      handleNavigate('friends', 'friends');
    }
  };

  // Clear notifications when visiting relevant tabs or receiving while on tab
  useEffect(() => {
    if (activeTab === 'inbox' || activeTab === 'chat') {
      const toClear = notifications.filter(n => n.type === 'message');
      toClear.forEach(n => markAsRead(n.id, n.type, n.target_id));
    } else if (activeTab === 'invites') {
      const toClear = notifications.filter(n => n.type === 'game_invite');
      toClear.forEach(n => markAsRead(n.id, n.type, n.target_id));
    } else if (activeTab === 'friends') {
      const toClear = notifications.filter(n => n.type === 'friend_request' || n.type === 'friend_accepted');
      toClear.forEach(n => markAsRead(n.id, n.type, n.target_id));
    }
  }, [activeTab, notifications.length]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return <Navigate to="/login" />;

  const handleNavigate = (tab, data = null) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      setUnreadMessages(0);
      if (data) setActiveChatFriend(data);
    } else if (tab === 'inbox') {
      setUnreadMessages(0);
    } else if (tab === 'friends') {
      setUnreadRequests(0);
      setFriendsInitialTab(data || 'friends');
    } else if (tab === 'invites') {
      setUnreadGameInvites(0);
    }
  };

  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'find', icon: Search, label: 'Find Friends' },
    { id: 'friends', icon: Users, label: 'My Friends', badge: unreadRequests },
    { id: 'inbox', icon: MessageSquare, label: 'Messages', badge: unreadMessages },
    { id: 'invites', icon: Gamepad2, label: 'Invites', badge: unreadGameInvites },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  if (user.role === 'admin') {
    menuItems.push({ id: 'admin', icon: Shield, label: 'Admin Panel' });
  }

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark-mode' : ''}`} style={{ display: 'flex', height: '100vh', background: 'var(--bg-color)', color: 'var(--text-main)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? '280px' : '80px' }}
        style={{ 
          background: 'var(--surface-color)', 
          borderRight: '1px solid var(--surface-border)', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '24px 16px',
          zIndex: 100,
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', padding: '0 8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)' }}>
            <MessageSquare size={24} fill="white" />
          </div>
          {isSidebarOpen && <span style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ChatPlay</span>}
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ 
                x: 5, 
                background: activeTab === item.id ? 'var(--primary-color)' : 'rgba(168, 85, 247, 0.1)',
                backdropFilter: 'blur(8px)'
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigate(item.id)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px', 
                padding: '12px 16px', 
                borderRadius: '14px', 
                border: 'none', 
                background: activeTab === item.id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === item.id ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {isSidebarOpen && <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{item.label}</span>}
              {item.badge > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  right: isSidebarOpen ? '16px' : '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: '#ef4444', 
                  color: 'white', 
                  fontSize: '0.7rem', 
                  fontWeight: '900', 
                  padding: '2px 6px', 
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                }}>
                  {item.badge}
                </span>
              )}
            </motion.button>
          ))}
        </nav>

        <button 
          onClick={logout} 
          className="btn-danger"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px', 
            padding: '14px 16px', 
            borderRadius: '16px', 
            marginTop: 'auto',
            background: 'rgba(239, 68, 68, 0.05)',
            border: 'none',
            color: '#ef4444',
            fontWeight: '800'
          }}
        >
          <LogOut size={22} />
          {isSidebarOpen && <span>Sign Out</span>}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-color)', position: 'relative' }}>
        <AnimatedDashboardBackground isDarkMode={isDarkMode} />
        {/* Header */}
        <header style={{ 
          height: '80px', 
          padding: '0 32px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'var(--surface-color)',
          borderBottom: '1px solid var(--surface-border)',
          backdropFilter: 'blur(10px)',
          zIndex: 90
        }}>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button 
              onClick={() => setIsDarkMode()}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', position: 'relative', padding: '8px' }}
              >
                <Bell size={22} />
                {notifications.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '10px', height: '10px', background: 'var(--primary-color)', borderRadius: '50%', border: '2px solid var(--surface-color)' }} />}
              </button>
              
              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{ position: 'absolute', top: '100%', right: 0, width: '320px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 8px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Notifications</h3>
                      {notifications.length > 0 && (
                        <button onClick={clearNotifications} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Clear All</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No new notifications</p>
                      ) : notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markAsRead(n.id, n.type, n.target_id)}
                          style={{ 
                            padding: '12px', 
                            borderRadius: '12px', 
                            background: 'var(--input-bg)', 
                            border: '1px solid var(--surface-border)', 
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary-color)', marginBottom: '4px', textTransform: 'capitalize' }}>
                            {n.type?.replace('_', ' ') || 'Notification'}
                          </div>
                          <div style={{ color: 'var(--text-main)' }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '24px', borderLeft: '1px solid var(--surface-border)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{user.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '1.2rem', overflow: 'hidden', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}>
                {user.profile_pic ? (
                  <img 
                    src={`http://localhost:5001/${user.profile_pic}`} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerText = user.username?.[0]?.toUpperCase() || '?';
                    }}
                  />
                ) : user.username?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Rendering */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab + (activeChatFriend?.user_id || '')} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.15 }} style={{ height: '100%', width: '100%' }}>
              {activeTab === 'home' && <HomePage user={user} socket={socket} onNavigate={handleNavigate} />}
              {activeTab === 'find' && <FindFriendsPage user={user} socket={socket} />}
              {activeTab === 'friends' && <MyFriendsPage user={user} socket={socket} onChat={(f) => handleNavigate('chat', f)} onGameInvite={(f) => { socket.emit('send_game_invite', { sender_id: user.id, receiver_id: f.user_id, game_type: 'tic_tac_toe', source: 'friends' }); setToast({ title: 'Success', message: 'Invitation Sent!' }); setTimeout(() => setToast(null), 3000); }} initialTab={friendsInitialTab} />}
              {activeTab === 'invites' && <GameInvitesPage user={user} socket={socket} />}
              {activeTab === 'chat' && <ChatPage user={user} friend={activeChatFriend} socket={socket} activeGame={activeGame} onBack={() => handleNavigate('home')} triggerToast={(t,m) => { setToast({title:t, message:m}); setTimeout(()=>setToast(null),3000); }} onGameInvite={(f) => { socket.emit('send_game_invite', { sender_id: user.id, receiver_id: f.user_id, game_type: 'tic_tac_toe', source: 'chat' }); }} />}
              {activeTab === 'profile' && <ProfilePage user={user} socket={socket} />}
              {activeTab === 'admin' && <AdminPage />}
              {activeTab === 'inbox' && <InboxPage user={user} socket={socket} onChat={(f) => handleNavigate('chat', f)} onNavigate={handleNavigate} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Game Invite Modal */}
      <AnimatePresence>
        {gameInvite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: 'var(--surface-color)', padding: '40px', borderRadius: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 40px 100px rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)' }}>
                <Gamepad2 size={40} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '12px' }}>Game Challenge!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.1rem' }}>
                <b style={{ color: 'var(--primary-color)' }}>{gameInvite.sender_username}</b> wants to play Tic-Tac-Toe with you.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => {
                   axios.post('http://localhost:5001/api/games/invites/accept', { invite_id: gameInvite.id, receiver_id: user.id });
                   socket.emit('accept_game_invite', { invite_id: gameInvite.id, sender_id: gameInvite.sender_id, receiver_id: user.id, game_type: gameInvite.game_type });
                   setGameInvite(null);
                }} className="btn-primary" style={{ flex: 1, padding: '16px' }}>Accept</button>
                <button onClick={() => {
                  axios.post('http://localhost:5001/api/games/invites/decline', { invite_id: gameInvite.id });
                  setGameInvite(null);
                }} className="btn-secondary" style={{ flex: 1, padding: '16px' }}>Decline</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }}
            style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', padding: '16px 24px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2000 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <MessageSquare size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{toast.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{toast.message}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
