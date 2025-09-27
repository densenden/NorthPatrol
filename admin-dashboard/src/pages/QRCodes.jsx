import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import './QRCodes.css'

function QRCodes() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/')
    }
  }, [isLoaded, user, navigate])

  if (!isLoaded) {
    return <div className="loading">Laden...</div>
  }

  const checkpoints = Array.from({ length: 15 }, (_, i) => ({
    number: i + 1,
    code: `np-cp-${String(i + 1).padStart(2, '0')}`
  }))

  return (
    <div className="qr-container">
      <div className="qr-header">
        <h1>North Patrol QR-Codes</h1>
        <p className="qr-subtitle">Alle 15 Kontrollpunkt-QR-Codes</p>
        <button 
          className="back-button" 
          onClick={() => navigate('/dashboard')}
        >
          Zurück zum Dashboard
        </button>
      </div>
      
      <div className="print-info">
        <h2>🖨️ Druckanleitung</h2>
        <p>Verwenden Sie die Druckfunktion Ihres Browsers (Strg+P oder Cmd+P), um diese QR-Codes zu drucken. Sie sind für A4/Letter-Papier optimiert.</p>
      </div>
      
      <div className="qr-grid">
        {checkpoints.map(checkpoint => (
          <div key={checkpoint.code} className="qr-card">
            <div className="qr-number">Kontrollpunkt {checkpoint.number}</div>
            <div className="qr-code">{checkpoint.code}</div>
            <img 
              src={`/qr-codes/${checkpoint.code}.png`} 
              alt={`QR-Code für Kontrollpunkt ${checkpoint.number}`} 
              className="qr-image"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default QRCodes