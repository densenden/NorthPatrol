import { useState, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { useUser, SignOutButton } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import './Scanner.css'

function ScannerPage() {
  const { user } = useUser()
  const [currentCheckpoint, setCurrentCheckpoint] = useState(1)
  const [sessionId, setSessionId] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState('')
  const [checkpoints, setCheckpoints] = useState([])
  const [scannedCheckpoints, setScannedCheckpoints] = useState([])

  useEffect(() => {
    initializeSession()
    loadCheckpoints()
  }, [])

  const initializeSession = async () => {
    try {
      // First, ensure user exists in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({ 
          email: user.primaryEmailAddress.emailAddress,
          role: 'scanner'
        }, { onConflict: 'email' })
        .select()
        .single()

      if (userError) throw userError

      // Create new session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: userData.id,
          complete: false,
          has_notes: false
        })
        .select()
        .single()

      if (sessionError) throw sessionError
      setSessionId(session.id)
    } catch (error) {
      console.error('Error initializing session:', error)
    }
  }

  const loadCheckpoints = async () => {
    try {
      const { data, error } = await supabase
        .from('checkpoints')
        .select('*')
        .order('order')

      if (error) throw error
      setCheckpoints(data || [])
    } catch (error) {
      console.error('Error loading checkpoints:', error)
    }
  }

  const handleScan = async (result) => {
    if (!result || !sessionId || lastScan === result[0].rawValue) return
    
    setLastScan(result[0].rawValue)
    const scannedQR = result[0].rawValue

    // Find matching checkpoint
    const checkpoint = checkpoints.find(cp => cp.qrcode === scannedQR)
    
    if (!checkpoint) {
      alert('Invalid QR code!')
      return
    }

    if (checkpoint.order !== currentCheckpoint) {
      alert(`Wrong checkpoint! Expected checkpoint ${currentCheckpoint}`)
      return
    }

    setScanning(false)
    // Show status selection
  }

  const handleStatusSelect = async (status) => {
    if (status === 'not_ok') {
      setShowNoteInput(true)
      return
    }
    
    await saveScan(status, '')
  }

  const saveScan = async (status, scanNote) => {
    try {
      const checkpoint = checkpoints[currentCheckpoint - 1]
      
      // Get user ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.primaryEmailAddress.emailAddress)
        .single()

      // Save scan
      const { error } = await supabase
        .from('scans')
        .insert({
          session_id: sessionId,
          user_id: userData.id,
          checkpoint_id: checkpoint.id,
          status,
          note: scanNote || null
        })

      if (error) throw error

      setScannedCheckpoints([...scannedCheckpoints, currentCheckpoint])
      
      // Check if this was the last checkpoint
      if (currentCheckpoint === 20) {
        await completeSession()
      } else {
        setCurrentCheckpoint(currentCheckpoint + 1)
        setShowNoteInput(false)
        setNote('')
      }
    } catch (error) {
      console.error('Error saving scan:', error)
    }
  }

  const completeSession = async () => {
    try {
      // Check if any notes exist
      const { data: scans } = await supabase
        .from('scans')
        .select('note')
        .eq('session_id', sessionId)
        .not('note', 'is', null)

      const hasNotes = scans && scans.length > 0

      // Update session
      await supabase
        .from('sessions')
        .update({
          complete: true,
          has_notes: hasNotes,
          end_time: new Date().toISOString()
        })
        .eq('id', sessionId)

      alert('Patrol completed successfully!')
      // Reset for new session
      setCurrentCheckpoint(1)
      setScannedCheckpoints([])
      initializeSession()
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  return (
    <div className="scanner-container">
      <header className="scanner-header">
        <h1>NorthPatrol Scanner</h1>
        <div className="user-info">
          <span>{user?.primaryEmailAddress?.emailAddress}</span>
          <SignOutButton>
            <button className="sign-out-button">Sign Out</button>
          </SignOutButton>
        </div>
      </header>

      <div className="scanner-content">
        <div className="checkpoint-info">
          <h2>Checkpoint {currentCheckpoint} of 20</h2>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(scannedCheckpoints.length / 20) * 100}%` }}
            />
          </div>
        </div>

        {scanning ? (
          <div className="scanner-box">
            <Scanner
              onScan={handleScan}
              onError={(error) => console.error(error)}
              constraints={{ facingMode: 'environment' }}
            />
            <button 
              className="cancel-button"
              onClick={() => setScanning(false)}
            >
              Cancel Scan
            </button>
          </div>
        ) : (
          <div className="action-area">
            {showNoteInput ? (
              <div className="note-input-container">
                <h3>Please describe the issue:</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter details about the issue..."
                  rows={4}
                />
                <button 
                  className="submit-button"
                  onClick={() => saveScan('not_ok', note)}
                  disabled={!note.trim()}
                >
                  Submit Report
                </button>
              </div>
            ) : lastScan && !showNoteInput ? (
              <div className="status-selection">
                <h3>Checkpoint Status:</h3>
                <button 
                  className="status-button ok"
                  onClick={() => handleStatusSelect('ok')}
                >
                  ✓ OK
                </button>
                <button 
                  className="status-button not-ok"
                  onClick={() => handleStatusSelect('not_ok')}
                >
                  ✗ Not OK
                </button>
              </div>
            ) : (
              <button 
                className="scan-button"
                onClick={() => setScanning(true)}
              >
                Scan QR Code
              </button>
            )}
          </div>
        )}

        <div className="checkpoint-list">
          {checkpoints.map((cp, idx) => (
            <div 
              key={cp.id}
              className={`checkpoint-item ${
                scannedCheckpoints.includes(idx + 1) ? 'completed' :
                idx + 1 === currentCheckpoint ? 'current' : ''
              }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ScannerPage