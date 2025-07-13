import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import BackButton from '../components/BackButton';
import './SettingsPage.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const userId = Cookies.get('id');
  const designation = Cookies.get('designation');
  
  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmEmail: ''
  });
  
  // Settings states
  const [theme, setTheme] = useState('light');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  // Load user settings on component mount
  useEffect(() => {
    if (!userId || !designation) {
      navigate('/login');
      return;
    }
    
    // Fetch user data to get current settings
    axios.get(`http://localhost:3001/api/user/${userId}`)
      .then(res => {
        const userData = res.data;
        setTheme(userData.theme || 'light');
        setEmailNotifications(userData.emailNotifications !== false);
        setInAppNotifications(userData.inAppNotifications !== false);
      })
      .catch(err => {
        console.error('Failed to load user settings:', err);
      });
  }, [userId, designation, navigate]);
  
  // Apply theme to body
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);
  
  const setGlobalTheme = (theme) => {
    document.body.className = `theme-${theme}`;
    document.documentElement.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const token = Cookies.get('authToken');
      await axios.patch(`http://localhost:3001/api/user/${userId}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (emailForm.newEmail !== emailForm.confirmEmail) {
      setError('Email addresses do not match');
      setLoading(false);
      return;
    }
    
    try {
      const token = Cookies.get('authToken');
      await axios.patch(`http://localhost:3001/api/user/${userId}/email`, {
        newEmail: emailForm.newEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Email updated successfully');
      setEmailForm({
        newEmail: '',
        confirmEmail: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };
  
  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    setGlobalTheme(newTheme);
    try {
      const token = Cookies.get('authToken');
      await axios.patch(`http://localhost:3001/api/user/${userId}`, { theme: newTheme }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to save theme preference:', err);
    }
  };
  
  const handleNotificationChange = async (type, value) => {
    const updates = {};
    if (type === 'email') {
      setEmailNotifications(value);
      updates.emailNotifications = value;
    } else if (type === 'inApp') {
      setInAppNotifications(value);
      updates.inAppNotifications = value;
    }
    
    try {
      const token = Cookies.get('authToken');
      await axios.patch(`http://localhost:3001/api/user/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };
  
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = Cookies.get('authToken');
      await axios.delete(`http://localhost:3001/api/user/${userId}`, {
        data: { password: deletePassword },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear cookies and redirect
      Cookies.remove('id');
      Cookies.remove('authToken');
      Cookies.remove('designation');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };
  
  if (!userId || !designation) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 flex items-center justify-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10 animate-float"
            style={{
              background: ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0"][i % 4],
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      {/* Main Content */}
      <div className="settings-page relative z-10 w-full max-w-2xl mx-auto">
        <div className="settings-header">
          <BackButton onClick={() => navigate('/dashboard')} text="Back" />
          <h1>Settings</h1>
        </div>
        
        {error && <ErrorMessage message={error} />}
        {success && <div className="success-message">{success}</div>}
        
        <div className="settings-container">
          {/* Account Section */}
          <section className="settings-section">
            <h2>Account</h2>
            
            {/* Change Password */}
            <div className="setting-card">
              <h3>Change Password</h3>
              <form onSubmit={handlePasswordChange} className="setting-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value
                    })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
            
            {/* Update Email */}
            <div className="setting-card">
              <h3>Update Email</h3>
              <form onSubmit={handleEmailChange} className="setting-form">
                <div className="form-group">
                  <label htmlFor="newEmail">New Email</label>
                  <input
                    type="email"
                    id="newEmail"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({
                      ...emailForm,
                      newEmail: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmEmail">Confirm New Email</label>
                  <input
                    type="email"
                    id="confirmEmail"
                    value={emailForm.confirmEmail}
                    onChange={(e) => setEmailForm({
                      ...emailForm,
                      confirmEmail: e.target.value
                    })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Email'}
                </button>
              </form>
            </div>
          </section>
          
          {/* Personalization Section */}
          <section className="settings-section">
            <h2>Personalization</h2>
            <div className="setting-card">
              <h3>Theme</h3>
              <div className="theme-options">
                <label className="theme-option">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={() => handleThemeChange('light')}
                  />
                  <span className="theme-label">☀️ Light</span>
                </label>
                <label className="theme-option">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={() => handleThemeChange('dark')}
                  />
                  <span className="theme-label">🌙 Dark</span>
                </label>
                <label className="theme-option">
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={theme === 'system'}
                    onChange={() => handleThemeChange('system')}
                  />
                  <span className="theme-label">⚙️ System</span>
                </label>
              </div>
            </div>
          </section>
          
          {/* Notifications Section */}
          <section className="settings-section">
            <h2>Notifications</h2>
            <div className="setting-card">
              <div className="notification-setting-row">
                <div className="setting-info">
                  <h3>📧 Email Notifications</h3>
                  <p>Receive notifications via email</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="notification-setting-row">
                <div className="setting-info">
                  <h3>🔔 In-App Notifications</h3>
                  <p>Receive notifications within the app</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={inAppNotifications}
                    onChange={(e) => handleNotificationChange('inApp', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>
          
          {/* Danger Zone */}
          <section className="settings-section">
            <div className="setting-card danger-card">
              <div className="danger-content">
                <h3>🗑️ Delete Account</h3>
                <p>This action cannot be undone. This will permanently delete your account and remove all your data.</p>
                <button
                  className="btn btn-danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  🗑️ Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
        
        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>🗑️ Delete Account</h3>
              <p>This action cannot be undone. Please enter your password to confirm.</p>
              <form onSubmit={handleDeleteAccount}>
                <div className="form-group">
                  <label htmlFor="deletePassword">Password</label>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {/* Floating animation keyframes */}
      <style jsx="true">{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;