import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css'; 

axios.defaults.withCredentials = true; 
const API_URL = "http://localhost:5000"; 

// --- ICONS ---
const Icons = {
  Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
  Lock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
};

const Loader = () => <div className="loader-overlay"><div className="spinner"></div></div>;

// --- ✅ NEW: 404 COMPONENT ---
const NotFound = () => (
  <div style={{textAlign: 'center', marginTop: '50px', color: 'var(--text-main)'}}>
    <h1 style={{fontSize: '3rem', margin: 0}}>404</h1>
    <p>Page Not Found</p>
    <a href="/" style={{color: 'var(--primary)', textDecoration: 'none'}}>Return Home</a>
  </div>
);

// --- THEME HOOK ---
const useTheme = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  return { theme, toggleTheme };
};

// --- AUTH COMPONENT (With Password Recovery) ---
const Auth = ({ setUser }) => {
  const [view, setView] = useState('login'); // 'login', 'register', 'recovery'
  const [formData, setFormData] = useState({ email: '', password: '', username: '', role: 'Resident', new_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    
    let endpoint = '/login';
    if (view === 'register') endpoint = '/register';
    if (view === 'recovery') endpoint = '/reset-password';
    
    try {
      await new Promise(r => setTimeout(r, 800)); // Simulating delay
      const res = await axios.post(`${API_URL}${endpoint}`, formData);
      
      if (view === 'login') {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        navigate('/dashboard');
      } else if (view === 'recovery') {
        setSuccess("Password reset successfully! Please Login.");
        setTimeout(() => setView('login'), 2000);
      } else {
        alert("Account Created! Please Login.");
        setView('login');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {loading && <Loader />}
      <div className="auth-card">
        <div className="brand-icon">唱</div>
        <h2 style={{marginBottom: '5px'}}>NexusCare</h2>
        <p className="subtitle">
            {view === 'recovery' ? 'Recover Password' : 'Smart Community Ecosystem'}
        </p>

        {view !== 'recovery' && (
          <div className="auth-toggle">
            <button type="button" className={`toggle-btn ${view === 'login' ? 'active' : ''}`} onClick={() => setView('login')}>Login</button>
            <button type="button" className={`toggle-btn ${view === 'register' ? 'active' : ''}`} onClick={() => setView('register')}>Sign Up</button>
          </div>
        )}

        {error && <p className="error">{error}</p>}
        {success && <p className="success" style={{color: 'green', fontSize: '0.9rem', textAlign:'center'}}>{success}</p>}
        
        <form onSubmit={handleSubmit}>
          {view === 'register' && (
            <>
              <div className="input-group"><span className="input-icon"><Icons.User /></span><input name="username" placeholder="Full Name" onChange={handleChange} required /></div>
              <div className="input-group"><span className="input-icon"><Icons.Shield /></span>
                <select name="role" onChange={handleChange} style={{paddingLeft: '48px'}}>
                  <option value="Resident">Resident</option>
                  <option value="Security">Security Staff</option>
                  <option value="Medical">Medical Assistant</option>
                </select>
              </div>
            </>
          )}

          <div className="input-group"><span className="input-icon"><Icons.Mail /></span><input name="email" type="email" placeholder="Email Address" onChange={handleChange} required /></div>

          {view !== 'recovery' ? (
             <div className="input-group"><span className="input-icon"><Icons.Lock /></span><input name="password" type="password" placeholder="Password" onChange={handleChange} required /></div>
          ) : (
             <div className="input-group"><span className="input-icon"><Icons.Lock /></span><input name="new_password" type="password" placeholder="New Password" onChange={handleChange} required /></div>
          )}

          <button type="submit" style={{marginTop: '10px'}}>
            {view === 'login' ? 'Access Dashboard' : (view === 'register' ? 'Create Account' : 'Reset Password')}
          </button>

          {view === 'login' && (
            <p onClick={() => setView('recovery')} style={{marginTop:'15px', cursor:'pointer', color:'var(--primary)', fontSize:'0.9rem'}}>
              Forgot Password?
            </p>
          )}
          {view === 'recovery' && (
            <p onClick={() => setView('login')} style={{marginTop:'15px', cursor:'pointer', color:'var(--text-sub)', fontSize:'0.9rem'}}>
              Back to Login
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENT (With Status Filters) ---
const Dashboard = ({ user, handleLogout }) => {
  const [complaints, setComplaints] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All'); // ✅ NEW STATE
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_URL}/complaints`);
      setComplaints(res.data);
    } catch (err) { console.error(err); }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/complaints`, { title, description: desc });
      setTitle(''); setDesc('');
      await fetchComplaints();
    } catch (err) { alert("Submission Failed"); } 
    finally { setLoading(false); }
  };

  const deleteComplaint = async (id) => {
    if(!window.confirm("Delete record?")) return;
    setLoading(true);
    try { await axios.delete(`${API_URL}/complaints/${id}`); await fetchComplaints(); } 
    catch (err) { alert("Access Denied"); } finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    setLoading(true);
    try { await axios.put(`${API_URL}/complaints/${id}/status`, { status }); await fetchComplaints(); } 
    catch (err) { alert("Update Failed"); } finally { setLoading(false); }
  };

  // ✅ NEW: Filter Logic
  const filteredComplaints = complaints.filter(c => {
      if (filterStatus === 'All') return true;
      return c.status === filterStatus;
  });

  const getStatusClass = (status) => status ? status.toLowerCase().replace(' ', '-') : 'pending';

  return (
    <div className="dashboard-container">
      {loading && <Loader />}
      <header className="navbar">
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <h3 style={{margin:0}}>NexusCare</h3>
          <span className="status pending" style={{background:'var(--primary)', color:'white'}}>{user.role}</span>
        </div>
        
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
           <button onClick={toggleTheme} style={{background:'transparent', border:'1px solid var(--border)', width:'40px', height:'40px', padding:0, color:'var(--text-main)', borderRadius:'50%', cursor:'pointer'}}>
             {theme === 'light' ? '嫌' : '笘 ｸ'}
           </button>
           <span style={{color:'var(--text-sub)'}}><b>{user.username}</b></span>
           <button onClick={handleLogout} className="logout-btn">Log Out</button>
        </div>
      </header>

      <div className="content">
        <div className="section">
          <h3>統 New Report</h3>
          <form onSubmit={submitComplaint}>
            <div className="input-group"><input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required /></div>
            <div className="input-group"><textarea placeholder="Details..." value={desc} onChange={e => setDesc(e.target.value)} required rows="4" style={{paddingLeft:'16px'}} /></div>
            <button type="submit">Submit Ticket</button>
          </form>
        </div>

        <div className="section">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
              <h3>搭 History</h3>
              {/* ✅ NEW: Filter Dropdown */}
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{width:'150px', padding:'8px', borderRadius:'6px', border:'1px solid var(--border)', cursor:'pointer'}}
              >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
              </select>
          </div>

          {filteredComplaints.length === 0 ? <p style={{color:'var(--text-sub)', textAlign:'center', padding:'20px'}}>No records found.</p> : (
            <div className="list">
              {filteredComplaints.map(c => (
                <div key={c.id} className="item">
                  <div className="item-header">
                    <strong>{c.title}</strong>
                    <span className={`status ${getStatusClass(c.status)}`}>{c.status || 'Pending'}</span>
                  </div>
                  <small style={{color:'var(--text-sub)', display:'block', marginBottom:'8px'}}>By: {c.username || 'Me'}</small>
                  <p style={{margin:'0 0 10px 0', color: 'var(--text-main)'}}>{c.description}</p>
                  
                  {user.role === 'Admin' && (
                    <div style={{display:'flex', gap:'10px', marginTop:'10px', borderTop:'1px solid var(--border)', paddingTop:'10px'}}>
                      <select onChange={(e) => updateStatus(c.id, e.target.value)} value={c.status} style={{padding:'5px', margin:0, width:'auto', cursor:'pointer'}}>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                      <button onClick={() => deleteComplaint(c.id)} style={{background:'#ef4444', width:'auto', padding:'5px 15px'}}>Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) setUser(JSON.parse(loggedInUser));
  }, []);

  const handleLogout = async () => {
    try { await axios.post(`${API_URL}/logout`); } catch (e) { } 
    finally { localStorage.removeItem('user'); setUser(null); window.location.href = "/"; }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <Auth setUser={setUser} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} handleLogout={handleLogout} /> : <Navigate to="/" />} />
        {}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}