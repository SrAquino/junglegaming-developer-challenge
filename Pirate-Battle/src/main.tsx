import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from './app/providers/AppProviders.tsx'
import './styles/global.css'
import App from './app/App.tsx'
import { getLocalPlayerIdentity } from './storage/player-identity.ts'

async function bootstrap(): Promise<void> {
  getLocalPlayerIdentity()
  const disableMocksForAssetFailureTest = import.meta.env.DEV && new URLSearchParams(window.location.search).has('disable-msw')
  if (!disableMocksForAssetFailureTest) {
    const { mockWorker } = await import('./mocks/browser.ts')
    await mockWorker.start({ onUnhandledRequest: 'bypass' })
  }
  createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
  )
}

void bootstrap()
