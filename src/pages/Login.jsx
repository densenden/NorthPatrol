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
        <p className="subtitle">Security Checkpoint System</p>
        
        <div className="login-button-container">
          <SignInButton mode="modal">
            <button className="login-button">
              Sign in with Email
            </button>
          </SignInButton>
        </div>
        
        <p className="login-footer">
          Powered by StudioSen
        </p>
      </div>
    </div>
  )
}

export default Login