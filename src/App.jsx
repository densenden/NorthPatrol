import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import Login from './pages/Login'
import Scanner from './pages/Scanner'
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
          <Route path="/scan" element={<Scanner />} />
          <Route path="/" element={<Navigate to="/scan" replace />} />
        </Routes>
      </SignedIn>
    </div>
  )
}

export default App