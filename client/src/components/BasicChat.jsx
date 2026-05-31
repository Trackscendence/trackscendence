import { useEffect, useState, useRef } from 'react'
import { socket } from '../services/socket'

function BasicChat() {

	const messageRef = useRef()
	const [messages, setMessages] = useState([])

	const handler = (data) => {
		setMessages(previous => {
			return [...previous, { id: previous.length, message: data.message, user: data.user }]
		})
	}

	useEffect(() => {
		socket.on('message', handler)

		return () => {
			socket.off('message', handler)
		}
	}, [])


	const sendMessage = () => {
		socket.emit(
			'message',
			{
				message: messageRef.current.value,
				room: 'channel:#general'
			}
		)
	}

  return (
	<div className='rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm'>
		<ul className="rounded-t-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
			{ messages.map(m => <li key={ m.id }>{m.user.username}: { m.message }</li>)}
		</ul>
		<div className='rounded-b-md border border-[#e1e6de] bg-[#fbfcfa] p-4'>
			<input className="mt-2 rounded-md border border-[#cbd5c5] px-3 py-2 text-base outline-none transition focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20" id='message' placeholder='message...' ref={ messageRef }	/>
			<button className='className="w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#91a69b]"' onClick={ sendMessage }>Send message</button>
		</div>
	</div>
  )
}

export default BasicChat