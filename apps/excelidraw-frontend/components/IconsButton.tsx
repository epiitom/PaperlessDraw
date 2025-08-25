import {ReactNode} from "react"

export function IconButton({
    icon,onClick,activated
}:{
    icon:ReactNode,
    onClick: () => void,
    activated: boolean
}) {
    return (
<div className={`
  m-1 cursor-pointer rounded-full border-2 p-1
  relative overflow-hidden group
  transition-all duration-300 ease-out
  ${activated 
    ? "bg-[#232326]" 
    : "bg-gradient-to-br from-gray-900 to-black border-gray-600 text-gray-300 hover:border-gray-400"
  }
  hover:scale-105 hover:shadow-xl
  active:scale-95
  before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700
`} onClick={onClick}>
  <div className="relative z-9 transition-transform duration-200 group-hover:rotate-7">
    {icon}
  </div>
</div>
    )
}