import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import QRCodes from './pages/QRCodes'
import Settings from './pages/Settings'
import './App.css'

function App() {
  const { user } = useUser()

  return (
    <div className="app">
      <SignedOut>
        <Login />
      </SignedOut>

      <SignedIn>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/qr" element={<QRCodes />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SignedIn>
    </div>
  )
}

export default App