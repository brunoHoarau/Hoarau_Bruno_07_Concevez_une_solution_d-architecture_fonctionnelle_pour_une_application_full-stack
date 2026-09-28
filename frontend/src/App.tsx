import { useEffect, useState } from 'react'
import Chat from './Chat'
import './App.css'

type HealthResponse = {
  status: string
  service: string
  timestamp: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<HealthResponse>
      })
      .then(setHealth)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Your Car Your Way — POC Tchat</h1>
      <p>Squelette front (React + Vite) branché sur le backend (Spring Boot).</p>

      <h2>Statut backend</h2>
      {error && <p style={{ color: 'crimson' }}>Backend injoignable : {error}</p>}
      {!error && !health && <p>Appel de {API_BASE_URL}/api/health…</p>}
      {health && (
        <ul>
          <li>Statut : {health.status}</li>
          <li>Service : {health.service}</li>
          <li>Horodatage : {health.timestamp}</li>
        </ul>
      )}

      <Chat />
    </main>
  )
}

export default App
