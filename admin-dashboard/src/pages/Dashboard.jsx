import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, SignOutButton } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import './Dashboard.css'

function Dashboard() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    sessionsWithIssues: 0,
    totalCheckpoints: 0
  })

  useEffect(() => {
    registerAdminUser()
    loadDashboardData()
  }, [])

  const registerAdminUser = async () => {
    if (!user) return
    
    try {
      // Ensure admin user exists in database with admin role
      const { error } = await supabase
        .from('users')
        .upsert({ 
          email: user.primaryEmailAddress.emailAddress,
          role: 'admin'
        }, { onConflict: 'email' })
      
      if (error) console.error('Error registering admin:', error)
    } catch (error) {
      console.error('Error in admin registration:', error)
    }
  }

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load sessions with user data
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          users (email),
          scans (*)
        `)
        .order('start_time', { ascending: false })

      if (sessionsError) throw sessionsError

      // Calculate stats
      const totalSessions = sessionsData?.length || 0
      const completedSessions = sessionsData?.filter(s => s.complete).length || 0
      const sessionsWithIssues = sessionsData?.filter(s => s.has_notes).length || 0
      
      // Count total scanned checkpoints
      let totalCheckpoints = 0
      sessionsData?.forEach(session => {
        totalCheckpoints += session.scans?.length || 0
      })

      setStats({
        totalSessions,
        completedSessions,
        sessionsWithIssues,
        totalCheckpoints
      })

      setSessions(sessionsData || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
    setLoading(false)
  }

  const loadSessionDetails = async (sessionId) => {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select(`
          *,
          checkpoints (name, order)
        `)
        .eq('session_id', sessionId)
        .order('timestamp')

      if (error) throw error
      
      const session = sessions.find(s => s.id === sessionId)
      setSelectedSession({
        ...session,
        scanDetails: data || []
      })
    } catch (error) {
      console.error('Error loading session details:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  const getSessionDuration = (start, end) => {
    if (!start || !end) return '-'
    const duration = new Date(end) - new Date(start)
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
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
              onClick={() => navigate('/qr')}
            >
              QR-Codes
            </button>
            <span className="user-email">{user?.primaryEmailAddress?.emailAddress}</span>
            <SignOutButton>
              <button className="sign-out-btn">Sign Out</button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Sessions</h3>
            <p className="stat-value">{stats.totalSessions}</p>
          </div>
          <div className="stat-card">
            <h3>Completed</h3>
            <p className="stat-value">{stats.completedSessions}</p>
          </div>
          <div className="stat-card">
            <h3>With Issues</h3>
            <p className="stat-value issues">{stats.sessionsWithIssues}</p>
          </div>
          <div className="stat-card">
            <h3>Checkpoints Scanned</h3>
            <p className="stat-value">{stats.totalCheckpoints}</p>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="sessions-section">
          <h2>Patrol Sessions</h2>
          {loading ? (
            <p className="loading">Loading sessions...</p>
          ) : (
            <div className="sessions-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Scans</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session.id} className={session.has_notes ? 'has-issues' : ''}>
                      <td>{session.users?.email || 'Unknown'}</td>
                      <td>{formatDate(session.start_time)}</td>
                      <td>{formatDate(session.end_time)}</td>
                      <td>{getSessionDuration(session.start_time, session.end_time)}</td>
                      <td>
                        <span className={`status ${session.complete ? 'complete' : 'incomplete'}`}>
                          {session.complete ? 'Complete' : 'In Progress'}
                        </span>
                      </td>
                      <td>
                        {session.has_notes && 
                          <span className="has-notes-badge">Has Notes</span>
                        }
                      </td>
                      <td>{session.scans?.length || 0}/15</td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => loadSessionDetails(session.id)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Session Details Modal */}
        {selectedSession && (
          <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Session Details</h2>
                <button className="close-btn" onClick={() => setSelectedSession(null)}>×</button>
              </div>
              
              <div className="session-info">
                <p><strong>User:</strong> {selectedSession.users?.email}</p>
                <p><strong>Start:</strong> {formatDate(selectedSession.start_time)}</p>
                <p><strong>End:</strong> {formatDate(selectedSession.end_time)}</p>
                <p><strong>Duration:</strong> {getSessionDuration(selectedSession.start_time, selectedSession.end_time)}</p>
              </div>

              <h3>Checkpoint Scans</h3>
              <div className="scans-list">
                {selectedSession.scanDetails.map(scan => (
                  <div key={scan.id} className={`scan-item ${scan.status}`}>
                    <div className="scan-header">
                      <span className="checkpoint-name">
                        {scan.checkpoints?.name || `Checkpoint ${scan.checkpoints?.order}`}
                      </span>
                      <span className={`scan-status ${scan.status}`}>
                        {scan.status === 'ok' ? '✓ OK' : '✗ Not OK'}
                      </span>
                    </div>
                    <p className="scan-time">{formatDate(scan.timestamp)}</p>
                    {scan.note && (
                      <div className="scan-note">
                        <strong>Note:</strong> {scan.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="checkpoint-grid">
                <h4>Checkpoint Overview</h4>
                <div className="checkpoints">
                  {[...Array(15)].map((_, i) => {
                    const checkpoint = selectedSession.scanDetails.find(
                      s => s.checkpoints?.order === i + 1
                    )
                    return (
                      <div 
                        key={i}
                        className={`checkpoint-box ${
                          checkpoint 
                            ? checkpoint.status === 'ok' 
                              ? 'scanned-ok' 
                              : 'scanned-not-ok'
                            : 'not-scanned'
                        }`}
                        title={`Checkpoint ${i + 1}`}
                      >
                        {i + 1}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
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

export default Dashboard