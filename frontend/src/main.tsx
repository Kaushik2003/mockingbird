import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AnonAadhaarProvider } from '@anon-aadhaar/react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AnonAadhaarProvider _useTestAadhaar={true}>
      <App />
    </AnonAadhaarProvider>
  </StrictMode>,
)
