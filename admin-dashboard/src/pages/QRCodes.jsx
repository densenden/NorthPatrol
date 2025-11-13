import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './QRCodes.css'

function QRCodes() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const pdfContentRef = useRef(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

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

  // Group checkpoints into pages of 8 (2 columns × 4 rows)
  const pages = []
  for (let i = 0; i < checkpoints.length; i += 8) {
    pages.push(checkpoints.slice(i, i + 8))
  }

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true)

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageElements = document.querySelectorAll('.pdf-page')

      for (let i = 0; i < pageElements.length; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        const canvas = await html2canvas(pageElements[i], {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = 210 // A4 width in mm
        const imgHeight = 297 // A4 height in mm

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      }

      pdf.save('NorthPatrol_QR_Codes_Aufkleber.pdf')
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Fehler beim Erstellen des PDFs. Bitte versuche es erneut.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="qr-container">
      <div className="qr-header">
        <h1>North Patrol QR-Codes</h1>
        <p className="qr-subtitle">Alle {checkpoints.length} Kontrollpunkt-QR-Codes</p>

        <div className="button-group">
          <button
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            Zurück zum Dashboard
          </button>
          <button
            className="export-pdf-button"
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? 'Erstelle PDF...' : 'PDF Export (Aufkleber)'}
          </button>
        </div>

        <div className="format-info">
          <h3>Format-Übersicht</h3>
          <div className="format-details">
            <div className="format-item">
              <strong>Papierformat:</strong> A4 (210 × 297 mm)
            </div>
            <div className="format-item">
              <strong>Aufkleber pro Seite:</strong> 8 Stück (2 Spalten × 4 Reihen)
            </div>
            <div className="format-item">
              <strong>Aufkleber-Format:</strong> A7 (105 × 74 mm)
            </div>
            <div className="format-item">
              <strong>QR-Code Größe:</strong> 25 × 25 mm
            </div>
            <div className="format-item">
              <strong>Rand:</strong> 0 mm (randlos)
            </div>
          </div>
        </div>

        <div className="instructions">
          <h3>Anleitung</h3>
          <ol>
            <li>Klicke auf "PDF Export (Aufkleber)" um die Datei herunterzuladen</li>
            <li>Öffne das PDF in deinem PDF-Viewer</li>
            <li>Drucke mit Einstellung "Tatsächliche Größe" (nicht "An Seite anpassen")</li>
            <li>Verwende Avery A4 Aufkleber oder schneide entlang der gestrichelten Linien</li>
          </ol>
        </div>
      </div>

      <div className="preview-section">
        <h2>Vorschau (Bildschirm)</h2>
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

      {/* PDF Export Content (Hidden from view, used for PDF generation) */}
      <div ref={pdfContentRef} className="pdf-content">
        {pages.map((pageCheckpoints, pageIndex) => (
          <div key={`page-${pageIndex}`} className="pdf-page">
            {pageCheckpoints.map((checkpoint, index) => (
              <div key={checkpoint.code} className="pdf-label-section">
                <div className="pdf-qr-wrapper">
                  <img
                    src={`/qr-codes/${checkpoint.code}.png`}
                    alt={`QR-Code ${checkpoint.number}`}
                    className="pdf-qr-image"
                    crossOrigin="anonymous"
                  />
                  <div className="pdf-label-text">Kontrollpunkt {checkpoint.number}</div>
                  <div className="pdf-label-code">{checkpoint.code}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default QRCodes