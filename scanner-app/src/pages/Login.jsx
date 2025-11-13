import { SignInButton } from '@clerk/clerk-react'
import './Login.css'

function Login() {
  return (
    <div className="login-container">
      <div className="login-card">
        <img 
          src="/logo_north_20250115_2D_black_bildmarke.svg" 
          alt="NorthPatrol" 
          className="logo"
        />
        <h1>NorthPatrol</h1>
        <p className="subtitle">Sicherheits-Kontrollpunkt System</p>
        
        <div className="login-button-container">
          <SignInButton mode="modal">
            <button className="login-button">
              Mit E-Mail anmelden
            </button>
          </SignInButton>
        </div>
        
        <p className="login-footer">
          Entwickelt von StudioSen
        </p>
      </div>
    </div>
  )
}

export default Login