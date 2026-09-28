import { useEffect, useRef, useState } from 'react'
import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

type Sender = 'CLIENT' | 'AGENCE'

type ChatMessage = {
  sender: Sender
  content: string
  timestamp: string
}

export default function Chat() {
  const [role, setRole] = useState<Sender>('CLIENT')
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const clientRef = useRef<Client | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true)
        client.subscribe('/topic/chat', (frame: IMessage) => {
          const message = JSON.parse(frame.body) as ChatMessage
          setMessages((prev) => [...prev, message])
        })
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    })
    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage() {
    const content = draft.trim()
    if (!content || !clientRef.current?.connected) return
    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ sender: role, content, timestamp: '' }),
    })
    setDraft('')
  }

  return (
    <section style={{ marginTop: '2rem', maxWidth: 480 }}>
      <h2>Tchat — POC (Client ⇄ Agence)</h2>

      <label>
        Je parle en tant que :{' '}
        <select value={role} onChange={(e) => setRole(e.target.value as Sender)}>
          <option value="CLIENT">Client</option>
          <option value="AGENCE">Agence</option>
        </select>
      </label>
      <p style={{ fontSize: '0.85rem', color: connected ? 'seagreen' : 'crimson' }}>
        {connected ? 'Connecté au serveur de tchat' : 'Connexion au serveur de tchat…'}
      </p>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: 8,
          height: 260,
          overflowY: 'auto',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.sender === role ? 'flex-end' : 'flex-start',
              background: m.sender === role ? '#dbeafe' : '#f1f5f9',
              borderRadius: 8,
              padding: '0.4rem 0.6rem',
              maxWidth: '80%',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{m.sender}</div>
            <div>{m.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Votre message…"
          style={{ flex: 1 }}
        />
        <button type="button" onClick={sendMessage} disabled={!connected}>
          Envoyer
        </button>
      </div>
    </section>
  )
}
