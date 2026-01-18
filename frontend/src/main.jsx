import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'

// Get Clerk publishable key from environment variable or use a default
// You'll need to set this in your .env file: VITE_CLERK_PUBLISHABLE_KEY=your_key_here
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

if (!PUBLISHABLE_KEY) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY is not set. Clerk authentication will not work.')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      routing="path"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
)












