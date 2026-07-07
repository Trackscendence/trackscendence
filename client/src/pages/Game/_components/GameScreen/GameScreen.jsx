import { useEffect, useState } from 'react'
import useChatStore, { getGameRoomId } from '@/stores/useChatStore'
import ChatPanelButton from '../ChatPanelButton'
import ExitGameButton from '../ExitGameButton'
import GameChatPanel from '../GameChatPanel'

const GameScreen = ({ children, currentUserId, gameId }) => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const clearRoomMessages = useChatStore((state) => state.clearRoomMessages)
  const gameRoomId = gameId ? getGameRoomId(gameId) : null

  useEffect(() => {
    if (!gameRoomId) return undefined

    return () => {
      clearRoomMessages(gameRoomId)
    }
  }, [clearRoomMessages, gameRoomId])

  return (
    <main className="bg-surface-warm relative min-h-[100svh]">
      <ExitGameButton />
      <ChatPanelButton
        disabled={!gameId}
        isOpen={isChatOpen}
        onClick={() => setIsChatOpen((current) => !current)}
      />
      {gameId && isChatOpen ? (
        <GameChatPanel
          currentUserId={currentUserId}
          gameId={gameId}
          onClose={() => setIsChatOpen(false)}
        />
      ) : null}
      {children}
    </main>
  )
}

export default GameScreen
