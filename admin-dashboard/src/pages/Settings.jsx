import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, SignOutButton } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import './Dashboard.css'

function Settings() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [notificationEmail, setNotificationEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'notification_email')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setNotificationEmail(data.value)
      } else {
        setNotificationEmail('info@northproservices.de')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setNotificationEmail('info@northproservices.de')
    }
    setLoading(false)
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'notification_email',
          value: notificationEmail,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })

      if (error) throw error

      setMessage({ type: 'success', text: 'Einstellungen gespeichert!' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Fehler beim Speichern: ' + error.message })
    }
    setSaving(false)
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <img src="/logo_north_20250115_2D_black_bildmarke.svg" alt="NorthPatrol" className="header-logo" />
            <h1>NorthPatrol Admin</h1>
          </div>
          <div className="user-controls">
            <button
              className="qr-btn"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
            <button
              className="qr-btn"
              onClick={() => navigate('/qr')}
            >
              QR-Codes
            </button>
            <span className="user-email">{user?.primaryEmailAddress?.emailAddress}</span>
            <SignOutButton>
              <button className="sign-out-btn">Abmelden</button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="sessions-section">
          <div className="modal-header" style={{ borderBottom: '1px solid #333' }}>
            <h2>Einstellungen</h2>
          </div>

          <div style={{ padding: '2rem' }}>
            {loading ? (
              <p className="loading">Lade Einstellungen...</p>
            ) : (
              <div className="settings-form">
                <div className="setting-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#888',
                    textTransform: 'uppercase',
                    fontSize: '0.85rem',
                    letterSpacing: '0.5px'
                  }}>
                    Benachrichtigungs-E-Mail
                  </label>
                  <p style={{
                    color: '#666',
                    fontSize: '0.9rem',
                    marginBottom: '0.75rem'
                  }}>
                    An diese Adresse werden nach jeder Patrouille Berichte gesendet.
                  </p>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="info@northproservices.de"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      padding: '0.75rem 1rem',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                {message.text && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    borderRadius: '6px',
                    background: message.type === 'success' ? '#1a3a1a' : '#3a1a1a',
                    border: `1px solid ${message.type === 'success' ? '#4CAF50' : '#ff3333'}`,
                    color: message.type === 'success' ? '#4CAF50' : '#ff3333'
                  }}>
                    {message.text}
                  </div>
                )}

                <button
                  onClick={saveSettings}
                  disabled={saving}
                  style={{
                    background: '#5B74A6',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {saving ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <div className="footer-content">
          <p>© 2025 North Pro Services • NorthPatrol Security System</p>
          <p>Developed by <a href="https://dev.sen.studio" target="_blank" rel="noopener noreferrer">SenDev</a></p>
        </div>
      </footer>
    </div>
  )
}

export default Settings
