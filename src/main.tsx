import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installDeployRecovery } from '@/utils/deployRecovery'
import './index.css'
import './utils/dayjsFr'
import App from './App.tsx'

installDeployRecovery()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
