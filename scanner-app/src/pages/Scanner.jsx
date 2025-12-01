import { useState, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { useUser, UserButton } from '@clerk/clerk-react'
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
  const [patrolComplete, setPatrolComplete] = useState(false)

  useEffect(() => {
    // Nur Checkpoints laden, KEINE Session erstellen
    // Session wird erst beim ersten Scan erstellt (lazy initialization)
    loadCheckpoints()
  }, [])

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
    if (!result) return
    
    const scannedQR = result[0].rawValue
    
    // Prevent duplicate processing of same QR
    if (lastScan === scannedQR) return

    // Find matching checkpoint
    const checkpoint = checkpoints.find(cp => cp.qrcode === scannedQR)
    
    if (!checkpoint) {
      // Invalid QR - keep scanning
      return
    }

    if (checkpoint.order !== currentCheckpoint) {
      // Wrong checkpoint - keep scanning, don't set lastScan
      // Could optionally show a toast/notification instead of alert
      return
    }

    // Correct checkpoint found
    setLastScan(scannedQR)
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

      // Get or create user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({
          email: user.primaryEmailAddress.emailAddress,
          role: 'scanner'
        }, { onConflict: 'email' })
        .select()
        .single()

      if (userError) throw userError

      // Lazy Session-Erstellung: Erst beim ersten Scan eine Session erstellen
      let currentSessionId = sessionId
      if (!currentSessionId) {
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
        currentSessionId = session.id
        setSessionId(session.id)
      }

      // Save scan
      const { error } = await supabase
        .from('scans')
        .insert({
          session_id: currentSessionId,
          user_id: userData.id,
          checkpoint_id: checkpoint.id,
          status,
          note: scanNote || null
        })

      if (error) throw error

      setScannedCheckpoints([...scannedCheckpoints, currentCheckpoint])
      
      // Reset scan state IMMEDIATELY after saving
      setLastScan(null)
      setShowNoteInput(false)
      setNote('')
      
      // Check if this was the last checkpoint
      if (currentCheckpoint === 15) {
        await completeSession()
      } else {
        setCurrentCheckpoint(currentCheckpoint + 1)
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

      // Send patrol completion email
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-patrol-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ sessionId })
          }
        )
        const result = await response.json()
        if (!response.ok) {
          console.error('Email sending failed:', result)
        } else {
          console.log('Email sent successfully:', result)
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError)
      }

      // Zeige "Fertig" Ansicht - KEINE automatische neue Session erstellen
      setPatrolComplete(true)
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  const startNewPatrol = () => {
    // Manueller Start eines neuen Kontrollgangs
    setCurrentCheckpoint(1)
    setScannedCheckpoints([])
    setLastScan(null)
    setSessionId(null)
    setPatrolComplete(false)
  }

  return (
    <div className="scanner-container">
      {/* Fixed Header */}
      <header className="scanner-header">
        <img src="/logo_north_20250115_2D_black_bildmarke.svg" alt="Logo" className="header-logo" />
        <h1>North Patrol</h1>
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Main Content Area */}
      <div className="scanner-main">
        {patrolComplete ? (
          <div className="action-area">
            <div className="patrol-complete">
              <h2>Patrouille abgeschlossen!</h2>
              <p>Alle 15 Kontrollpunkte wurden erfolgreich gescannt.</p>
              <button
                className="scan-button"
                onClick={startNewPatrol}
              >
                Neuen Kontrollgang starten
              </button>
            </div>
          </div>
        ) : scanning ? (
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
              Abbrechen
            </button>
          </div>
        ) : (
          <div className="action-area">
            {showNoteInput ? (
              <div className="note-input-container">
                <h3>Problem beschreiben</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Details eingeben..."
                  rows={4}
                />
                <div className="button-group">
                  <button 
                    className="submit-button"
                    onClick={() => saveScan('not_ok', note)}
                    disabled={!note.trim()}
                  >
                    Senden
                  </button>
                  <button 
                    className="cancel-button-secondary"
                    onClick={() => {
                      setShowNoteInput(false)
                      setNote('')
                      setLastScan(null)
                    }}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : lastScan && !showNoteInput ? (
              <div className="status-selection">
                <h3>Checkpoint {currentCheckpoint}</h3>
                {checkpoints.length > 0 && checkpoints[currentCheckpoint - 1] && (
                  <h4 className="checkpoint-name">{checkpoints[currentCheckpoint - 1].name}</h4>
                )}
                <div className="status-buttons">
                  <button 
                    className="status-button ok"
                    onClick={() => handleStatusSelect('ok')}
                  >
                    OK
                  </button>
                  <button 
                    className="status-button not-ok"
                    onClick={() => handleStatusSelect('not_ok')}
                  >
                    NICHT OK
                  </button>
                </div>
              </div>
            ) : (
              <div className="scan-prompt">
                <h2>Checkpoint {currentCheckpoint}</h2>
                {checkpoints.length > 0 && checkpoints[currentCheckpoint - 1] && (
                  <h3 className="checkpoint-name">{checkpoints[currentCheckpoint - 1].name}</h3>
                )}
                <button 
                  className="scan-button"
                  onClick={() => setScanning(true)}
                >
                  QR SCANNEN
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="bottom-bar">
        <div className="checkpoint-grid">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className={`checkpoint-dot ${
                scannedCheckpoints.includes(i + 1) ? 'completed' :
                i + 1 === currentCheckpoint ? 'current' : ''
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="status-summary">
          <span className="completed-count">{scannedCheckpoints.length}</span>
          <span className="separator">/</span>
          <span className="total-count">15</span>
        </div>
      </div>
    </div>
  )
}

export default ScannerPage