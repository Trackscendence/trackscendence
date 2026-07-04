import SideBar from '../Sidebar'
import Room from '../Room'

const BasicChat = () => {
  return (
    <div className="mt-6 rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
      <div className="grid grid-cols-[1fr_2fr] rounded-t-md border border-[#e1e6de] bg-[#fbfcfa]">
        <SideBar />
        <Room />
      </div>
    </div>
  )
}

export default BasicChat
