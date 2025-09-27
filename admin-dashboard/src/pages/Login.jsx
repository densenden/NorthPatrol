import { SignInButton } from '@clerk/clerk-react'
import './Login.css'

function Login() {
  return (
    <div className="login-container">
      <div className="login-card">
        <img 
          src="/logo_north_20250115_2D_black_bildmarke.svg" 
          alt="NorthPatrol Admin" 
          className="logo"
        />
        <h1>NorthPatrol Admin</h1>
        <p className="subtitle">Verwaltungs-Dashboard</p>
        
        <div className="login-button-container">
          <SignInButton mode="modal">
            <button className="login-button">
              Admin Anmeldung
            </button>
          </SignInButton>
        </div>
        
        <p className="login-footer">
          Nur für Administratoren • Entwickelt von StudioSen
        </p>
      </div>
    </div>
  )
}

export default Login