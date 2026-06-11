import { useEffect, useEffectEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/context/useAuth'
import BasicChat from '@/components/BasicChat'
import { socket } from '@/services/socket'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

const SessionPage = () => {
  const navigate = useNavigate()
  const { logout, user, token } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleSocketToken = useEffectEvent((callback) => {
    callback(token)
  })

  useEffect(() => {
    const onToken = (callback) => {
      handleSocketToken(callback)
    }

    socket.connect()
    socket.on('token', onToken)

    return () => {
      socket.off('token', onToken)
      socket.disconnect()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Session</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/change-password')}>
            Change password
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-gray-900">Signed in</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Username</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{user.username}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{user.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <BasicChat />
    </div>
  )
}

export default SessionPage
