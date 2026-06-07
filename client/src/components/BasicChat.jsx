import { useEffect, useState, useRef } from 'react'
import { socket } from '@/services/socket'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

function BasicChat() {
  const messageRef = useRef()
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(socket.connected)

  useEffect(() => {
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    const onMessage = (data) => {
      setMessages((prev) => [
        ...prev,
        { id: prev.length, message: data.message, user: data.user },
      ])
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('message', onMessage)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('message', onMessage)
    }
  }, [])

  const sendMessage = () => {
    if (!messageRef.current.value.trim()) return

    socket.emit('message', {
      message: messageRef.current.value,
      room: 'channel:#general',
    })
    messageRef.current.value = ''
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between border-b border-gray-900/10 px-4 py-4 sm:px-8">
        <h2 className="text-base font-semibold leading-7 text-gray-900">Live Chat</h2>
        <Badge variant={isConnected ? 'success' : 'error'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>
      
      <CardContent className="h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4">No messages yet. Say hello!</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m.id} className="text-sm">
                <span className="font-semibold text-blue-600">{m.user.username}: </span>
                <span className="text-gray-700">{m.message}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Input
          id="message"
          placeholder="Type a message..."
          ref={messageRef}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
        />
        <Button onClick={sendMessage}>Send</Button>
      </CardFooter>
    </Card>
  )
}

export default BasicChat
