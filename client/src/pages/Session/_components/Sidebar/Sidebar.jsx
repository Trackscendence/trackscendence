const SideBar = () => {
  return (
    <>
      <svg className="hidden" xmlns="http://www.w3.org/2000/svg">
        <symbol id="circle-fill" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="4" />
        </symbol>
      </svg>
      <div className="border-e border-[#e1e6de] p-4">
        <ul>
          <li className="mt-2 w-full rounded-md bg-[#58947C] px-4 py-2.5 text-sm font-semibold text-white">
            # General
          </li>
        </ul>
        <h2 className="mt-4 font-semibold">FRIENDS</h2>
        <hr className="border-[#e1e6de]" />
        <ul>
          <li className="mt-2 flex w-full gap-1 rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#B4CFC3]">
            <div className="place-self-center">
              <svg className="size-4 place-self-center fill-green-500">
                <use href="#circle-fill" />
              </svg>
            </div>
            <div className="place-self-center">eve123</div>
            <div className="place-self-center rounded-md bg-[#2f7d61] p-1 text-white">
              15
            </div>
          </li>
          <li className="mt-2 flex w-full gap-1 rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#B4CFC3]">
            <div className="place-self-center">
              <svg className="size-4 place-self-center fill-red-500">
                <use href="#circle-fill" />
              </svg>
            </div>
            <div className="place-self-center">eve123</div>
            <div className="place-self-center rounded-md bg-[#2f7d61] p-1 text-white">
              15
            </div>
          </li>
          <li className="mt-2 flex w-full gap-1 rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#B4CFC3]">
            <div className="place-self-center">
              <svg className="size-4 place-self-center fill-green-500">
                <use href="#circle-fill" />
              </svg>
            </div>
            <div className="place-self-center">eve123</div>
            <div className="place-self-center rounded-md bg-[#2f7d61] p-1 text-white">
              15
            </div>
          </li>
          <li className="mt-2 flex w-full gap-1 rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#B4CFC3]">
            <div className="place-self-center">
              <svg className="size-4 place-self-center fill-green-500">
                <use href="#circle-fill" />
              </svg>
            </div>
            <div className="place-self-center">eve123</div>
            <div className="place-self-center rounded-md bg-[#2f7d61] p-1 text-white">
              15
            </div>
          </li>
        </ul>
      </div>
    </>
  )
}

export default SideBar
