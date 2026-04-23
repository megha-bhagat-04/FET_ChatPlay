import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, UserX, CheckCircle, AlertTriangle, Users, Flag, Ban, Check, Search } from 'lucide-react';
import axios from 'axios';
import { ScrambleText } from '../Animations';

function AdminPage() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'users'
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [reportsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5001/api/admin/reports'),
        axios.get('http://localhost:5001/api/admin/users')
      ]);
      setReports(reportsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Admin data fetch error:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (userId, newStatus) => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/admin/user/${userId}/status`, { status: newStatus });
      fetchData();
    } catch (e) {
      alert('Failed to update user status');
    } finally { setLoading(false); }
  };

  const resolveReport = async (reportId) => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/admin/report/${reportId}/resolve`);
      fetchData();
    } catch (e) {
      alert('Failed to resolve report');
    } finally { setLoading(false); }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={32} color="var(--primary-color)" />
            <ScrambleText text="Admin Control Center" />
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor reports and manage community access.</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--surface-color)', padding: '6px', borderRadius: '14px', border: '1px solid var(--surface-border)' }}>
          <button 
            onClick={() => setActiveTab('reports')}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '10px', 
              border: 'none', 
              background: activeTab === 'reports' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'reports' ? 'white' : 'var(--text-muted)',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Flag size={18} /> Reports {reports.filter(r => r.status === 'pending').length > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>{reports.filter(r => r.status === 'pending').length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '10px', 
              border: 'none', 
              background: activeTab === 'users' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'users' ? 'white' : 'var(--text-muted)',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Users size={18} /> User List
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'reports' ? (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {reports.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
                <CheckCircle size={48} style={{ color: 'var(--success-color)', marginBottom: '16px' }} />
                <h3>All Clear!</h3>
                <p style={{ color: 'var(--text-muted)' }}>No pending reports to review.</p>
              </div>
            ) : (
              reports.map((r, i) => (
                <motion.div 
                  key={r.id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderLeft: r.status === 'pending' ? '4px solid #ef4444' : '4px solid var(--success-color)' }}
                >
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ background: r.status === 'pending' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: r.status === 'pending' ? '#ef4444' : '#10b981', padding: '14px', borderRadius: '14px' }}>
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>{r.reported_username}</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>Report #{r.id}</span>
                      </div>
                      <div style={{ margin: '8px 0', fontSize: '0.95rem' }}>"{r.reason}"</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '15px' }}>
                        <span>Reporter: <b>{r.reporter_username}</b></span>
                        <span>Time: {new Date(r.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {r.status === 'pending' && (
                      <>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleStatusChange(r.reported_user_id, 'banned')} disabled={loading}
                          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>
                          <Ban size={18} /> Ban User
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => resolveReport(r.id)} disabled={loading}
                          style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--surface-border)', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                          <Check size={18} /> Dismiss
                        </motion.button>
                      </>
                    )}
                    {r.status === 'resolved' && (
                      <span style={{ color: 'var(--success-color)', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={18} /> Resolved
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="form-input" 
                style={{ paddingLeft: '48px', maxWidth: '400px' }} 
                placeholder="Search users by name or email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ background: 'var(--surface-color)', borderRadius: '20px', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>User</th>
                    <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Reports</th>
                    <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u.user_id} style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: '700' }}>{u.username}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: '800',
                          background: u.status === 'banned' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: u.status === 'banned' ? '#ef4444' : '#10b981',
                          textTransform: 'uppercase'
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <motion.span 
                          whileHover={u.report_count > 0 ? { scale: 1.1, x: 5 } : {}}
                          onClick={() => u.report_count > 0 && setActiveTab('reports')}
                          style={{ 
                            color: u.report_count > 0 ? '#ef4444' : 'var(--text-muted)',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: u.report_count > 0 ? 'pointer' : 'default'
                          }}
                        >
                          {u.report_count} {u.report_count === 1 ? 'Report' : 'Reports'}
                        </motion.span>
                      </td>
                      <td style={{ padding: '20px', textAlign: 'right' }}>
                        {u.status === 'active' ? (
                          <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleStatusChange(u.user_id, 'banned')} disabled={loading}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                            Ban Account
                          </motion.button>
                        ) : (
                          <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleStatusChange(u.user_id, 'active')} disabled={loading}
                            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                            Restore Access
                          </motion.button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminPage;
