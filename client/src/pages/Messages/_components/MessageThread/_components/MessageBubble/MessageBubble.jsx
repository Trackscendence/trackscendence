import ReadReceiptCheck from '@/components/ReadReceiptCheck'
import { formatMessageTime } from '@/utils/formatMessageTime'

const MessageBubble = ({ isOwn, isRead, message }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[75%] rounded-lg px-4 py-2 ${
        isOwn
          ? 'bg-[#e86d2f] text-white'
          : 'border border-[#f0d9bd] bg-white text-[#3d1200]'
      }`}
    >
      <p className="text-sm leading-6 break-words">{message.message}</p>
      <div
        className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-semibold ${
          isOwn ? 'text-white/70' : 'text-[#9a7050]'
        }`}
      >
        <span>{formatMessageTime(message.createdAt)}</span>
        <ReadReceiptCheck
          isRead={isRead}
          sentColor={isOwn ? 'rgba(255, 255, 255, 0.75)' : '#9a7050'}
        />
      </div>
    </div>
  </div>
)

export default MessageBubble
