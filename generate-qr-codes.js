import QRCode from 'qrcode'
import fs from 'fs/promises'
import path from 'path'

const checkpoints = [
  { name: 'Checkpoint 1', code: 'np-cp-01' },
  { name: 'Checkpoint 2', code: 'np-cp-02' },
  { name: 'Checkpoint 3', code: 'np-cp-03' },
  { name: 'Checkpoint 4', code: 'np-cp-04' },
  { name: 'Checkpoint 5', code: 'np-cp-05' },
  { name: 'Checkpoint 6', code: 'np-cp-06' },
  { name: 'Checkpoint 7', code: 'np-cp-07' },
  { name: 'Checkpoint 8', code: 'np-cp-08' },
  { name: 'Checkpoint 9', code: 'np-cp-09' },
  { name: 'Checkpoint 10', code: 'np-cp-10' },
  { name: 'Checkpoint 11', code: 'np-cp-11' },
  { name: 'Checkpoint 12', code: 'np-cp-12' },
  { name: 'Checkpoint 13', code: 'np-cp-13' },
  { name: 'Checkpoint 14', code: 'np-cp-14' },
  { name: 'Checkpoint 15', code: 'np-cp-15' },
  { name: 'Checkpoint 16', code: 'np-cp-16' },
  { name: 'Checkpoint 17', code: 'np-cp-17' },
  { name: 'Checkpoint 18', code: 'np-cp-18' },
  { name: 'Checkpoint 19', code: 'np-cp-19' },
  { name: 'Checkpoint 20', code: 'np-cp-20' }
]

async function generateQRCodes() {
  // Create directory for QR codes
  const qrDir = path.join(process.cwd(), 'qr-codes')
  await fs.mkdir(qrDir, { recursive: true })

  console.log('Generating QR codes...\n')

  for (const checkpoint of checkpoints) {
    try {
      // Generate QR code with high quality settings
      const qrCodeDataUrl = await QRCode.toDataURL(checkpoint.code, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      })

      // Convert data URL to buffer
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      // Save as PNG file
      const fileName = `${checkpoint.code}.png`
      const filePath = path.join(qrDir, fileName)
      await fs.writeFile(filePath, buffer)

      console.log(`✓ Generated: ${fileName} - ${checkpoint.name}`)
    } catch (error) {
      console.error(`✗ Error generating QR code for ${checkpoint.name}:`, error)
    }
  }

  // Also generate a single HTML file with all QR codes for printing
  let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>NorthPatrol QR Codes</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    .qr-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      page-break-after: auto;
    }
    .qr-item {
      border: 1px solid #ccc;
      padding: 15px;
      text-align: center;
      page-break-inside: avoid;
    }
    .qr-item img {
      width: 150px;
      height: 150px;
    }
    .qr-item h3 {
      margin: 10px 0 5px 0;
      font-size: 16px;
    }
    .qr-item p {
      margin: 5px 0;
      font-size: 12px;
      color: #666;
    }
    @media print {
      .qr-container {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  </style>
</head>
<body>
  <h1>NorthPatrol QR Checkpoints</h1>
  <div class="qr-container">`

  for (const checkpoint of checkpoints) {
    const qrCodeDataUrl = await QRCode.toDataURL(checkpoint.code, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'H'
    })
    
    htmlContent += `
    <div class="qr-item">
      <img src="${qrCodeDataUrl}" alt="${checkpoint.code}">
      <h3>${checkpoint.name}</h3>
      <p>Code: ${checkpoint.code}</p>
    </div>`
  }

  htmlContent += `
  </div>
</body>
</html>`

  await fs.writeFile(path.join(qrDir, 'all-qr-codes.html'), htmlContent)
  
  console.log('\n✓ All QR codes generated successfully!')
  console.log(`✓ Files saved in: ${qrDir}`)
  console.log('✓ Open all-qr-codes.html in browser to view/print all codes')
}

generateQRCodes().catch(console.error)